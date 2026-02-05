"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as d3 from "d3";
import { X } from "lucide-react";
import {
  VISIT_CLUSTERS,
  VisitCluster,
} from "@/lib/data/cluster-data";
import { CustomerGrade, GRADE_CONFIG } from "@/lib/data/store-experience";

// 등급 색상
const GRADE_COLORS: Record<CustomerGrade, string> = {
  vip: "#fbbf24",
  loyal: "#22c55e",
  active: "#3b82f6",
  risk: "#f97316",
  churn: "#71717a",
};

// 매장 크기별 설정
const STORE_CONFIG = {
  large: { size: 28, color: "#ffffff", label: "대형", glow: "#fbbf24" },
  medium: { size: 20, color: "#e4e4e7", label: "중형", glow: "#3b82f6" },
  small: { size: 14, color: "#a1a1aa", label: "소형", glow: "#71717a" },
};

// 노드 타입
interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  type: "store" | "customer";
  storeSize?: "large" | "medium" | "small";
  grade?: CustomerGrade;
  targetStore?: SimNode; // 이동 대상 매장
  isMoving?: boolean;
  progress?: number; // 0~1 이동 진행률
}

// 인사이트 생성 함수
function getClusterInsight(cluster: VisitCluster): string[] {
  const insights: string[] = [];

  if (cluster.vipRate > 10) {
    insights.push(`👑 VIP 전환율 ${cluster.vipRate}%`);
  }
  if (cluster.churnRate > 20) {
    insights.push(`⚠️ 이탈 위험 ${cluster.churnRate}%`);
  }

  const peakTime = cluster.peakHours[0];
  const timeLabel = peakTime < 12 ? "오전" : peakTime < 18 ? "오후" : "저녁";
  insights.push(`⏰ ${timeLabel} ${peakTime}시 피크`);

  if (cluster.weekdayRatio > 60) {
    insights.push(`📅 평일 중심 (${cluster.weekdayRatio}%)`);
  } else if (cluster.weekdayRatio < 40) {
    insights.push(`🎉 주말 중심 (${100 - cluster.weekdayRatio}%)`);
  }

  const topCat = cluster.topCategories[0];
  insights.push(`🛒 ${topCat.name} ${topCat.percentage}%`);

  return insights;
}

// 미니 클러스터 뷰 (Canvas) - 오밀조밀하게
function ClusterMiniCanvas({
  cluster,
  onClick,
}: {
  cluster: VisitCluster;
  onClick: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const { width, height } = container.getBoundingClientRect();
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const centerX = width / 2;
    const centerY = height / 2 + 10;

    // 노드 생성 - 매장 중심으로
    const nodes: SimNode[] = [];
    const { large, medium, small } = cluster.storePattern;

    // 매장 노드 (중앙에 배치)
    const storeCount = Math.round(large) + Math.round(medium) + Math.round(small);
    let storeIdx = 0;

    for (let i = 0; i < Math.round(large); i++) {
      const angle = (storeIdx / storeCount) * Math.PI * 2;
      nodes.push({
        id: `store_l_${i}`,
        type: "store",
        storeSize: "large",
        x: centerX + Math.cos(angle) * 25,
        y: centerY + Math.sin(angle) * 20,
      });
      storeIdx++;
    }
    for (let i = 0; i < Math.round(medium); i++) {
      const angle = (storeIdx / storeCount) * Math.PI * 2;
      nodes.push({
        id: `store_m_${i}`,
        type: "store",
        storeSize: "medium",
        x: centerX + Math.cos(angle) * 25,
        y: centerY + Math.sin(angle) * 20,
      });
      storeIdx++;
    }
    for (let i = 0; i < Math.round(small); i++) {
      const angle = (storeIdx / storeCount) * Math.PI * 2;
      nodes.push({
        id: `store_s_${i}`,
        type: "store",
        storeSize: "small",
        x: centerX + Math.cos(angle) * 25,
        y: centerY + Math.sin(angle) * 20,
      });
      storeIdx++;
    }

    const stores = nodes.filter(n => n.type === "store");

    // 고객 노드 - 매장 주변에 밀집
    const grades = Object.entries(cluster.gradeDistribution) as [CustomerGrade, number][];
    grades.forEach(([grade, count]) => {
      const sample = Math.min(Math.ceil(count / 8), 15);
      for (let i = 0; i < sample; i++) {
        const targetStore = stores[Math.floor(Math.random() * stores.length)];
        const angle = Math.random() * Math.PI * 2;
        const dist = 15 + Math.random() * 30;
        nodes.push({
          id: `cust_${grade}_${i}`,
          type: "customer",
          grade,
          x: (targetStore.x || centerX) + Math.cos(angle) * dist,
          y: (targetStore.y || centerY) + Math.sin(angle) * dist,
          targetStore,
        });
      }
    });

    // Force simulation - 오밀조밀하게
    const simulation = d3
      .forceSimulation<SimNode>(nodes)
      .force("center", d3.forceCenter(centerX, centerY).strength(0.1))
      .force(
        "charge",
        d3.forceManyBody<SimNode>().strength((d) => (d.type === "store" ? -30 : -3))
      )
      .force(
        "collision",
        d3.forceCollide<SimNode>().radius((d) =>
          d.type === "store" ? STORE_CONFIG[d.storeSize!].size / 2 + 2 : 4
        )
      )
      .force(
        "radial",
        d3.forceRadial<SimNode>(
          (d) => (d.type === "store" ? 0 : 35),
          centerX,
          centerY
        ).strength((d) => (d.type === "store" ? 0.3 : 0.05))
      )
      .alphaDecay(0.02)
      .velocityDecay(0.4);

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.02;

      // 고객 점 (매장 주변에서 미세하게 움직임)
      nodes.filter((n) => n.type === "customer").forEach((node, i) => {
        if (node.x === undefined || node.y === undefined) return;

        // 미세한 진동
        const wobbleX = Math.sin(time * 2 + i * 0.5) * 1.5;
        const wobbleY = Math.cos(time * 2.5 + i * 0.7) * 1.5;

        ctx.beginPath();
        ctx.arc(node.x + wobbleX, node.y + wobbleY, 3, 0, Math.PI * 2);
        ctx.fillStyle = GRADE_COLORS[node.grade!];
        ctx.fill();
      });

      // 매장 (둥근 사각형)
      nodes.filter((n) => n.type === "store").forEach((node) => {
        if (node.x === undefined || node.y === undefined) return;
        const config = STORE_CONFIG[node.storeSize!];
        const s = config.size;
        const r = 4;

        // 글로우
        ctx.shadowColor = config.glow;
        ctx.shadowBlur = 8;

        ctx.beginPath();
        ctx.roundRect(node.x - s / 2, node.y - s / 2, s, s, r);
        ctx.fillStyle = config.color;
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      animationRef.current = requestAnimationFrame(render);
    };

    simulation.on("tick", () => {});
    render();

    return () => {
      simulation.stop();
      cancelAnimationFrame(animationRef.current);
    };
  }, [cluster]);

  const insights = getClusterInsight(cluster);

  return (
    <motion.div
      ref={containerRef}
      className="relative w-full h-full rounded-xl overflow-hidden cursor-pointer border border-white/10"
      style={{ backgroundColor: cluster.color + "12" }}
      whileHover={{ scale: 1.02, borderColor: cluster.color }}
      onClick={onClick}
      layoutId={`cluster-${cluster.id}`}
    >
      {/* 제목 */}
      <div className="absolute top-2 left-2 right-2 z-10 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">{cluster.icon}</span>
          <span className="text-white font-bold text-sm">{cluster.name}</span>
          <span className="text-white/40 text-xs ml-auto">{cluster.customerCount}명</span>
        </div>
      </div>

      <canvas ref={canvasRef} className="w-full h-full" />

      {/* 인사이트 오버레이 */}
      <div className="absolute bottom-2 left-2 right-2 pointer-events-none">
        <div className="flex flex-wrap gap-1">
          {insights.slice(0, 3).map((insight, i) => (
            <span
              key={i}
              className="text-[9px] px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white/80"
            >
              {insight}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// 확대 클러스터 뷰 - 트래픽 애니메이션
function ClusterExpandedView({
  cluster,
  onClose,
}: {
  cluster: VisitCluster;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<SimNode[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const { width, height } = container.getBoundingClientRect();
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const centerX = width / 2;
    const centerY = height / 2;

    // 노드 생성
    const nodes: SimNode[] = [];
    const { large, medium, small } = cluster.storePattern;

    // 매장 노드 (중앙 배열)
    const storePositions: { size: "large" | "medium" | "small"; x: number; y: number }[] = [];

    // 대형 매장 중앙
    for (let i = 0; i < Math.round(large); i++) {
      const x = centerX + (i - Math.round(large) / 2 + 0.5) * 100;
      storePositions.push({ size: "large", x, y: centerY - 30 });
      nodes.push({
        id: `store_l_${i}`,
        type: "store",
        storeSize: "large",
        x,
        y: centerY - 30,
        fx: x,
        fy: centerY - 30,
      });
    }

    // 중형 매장
    for (let i = 0; i < Math.round(medium); i++) {
      const x = centerX + (i - Math.round(medium) / 2 + 0.5) * 80;
      storePositions.push({ size: "medium", x, y: centerY + 50 });
      nodes.push({
        id: `store_m_${i}`,
        type: "store",
        storeSize: "medium",
        x,
        y: centerY + 50,
        fx: x,
        fy: centerY + 50,
      });
    }

    // 소형 매장
    for (let i = 0; i < Math.round(small); i++) {
      const x = centerX + (i - Math.round(small) / 2 + 0.5) * 60;
      storePositions.push({ size: "small", x, y: centerY + 120 });
      nodes.push({
        id: `store_s_${i}`,
        type: "store",
        storeSize: "small",
        x,
        y: centerY + 120,
        fx: x,
        fy: centerY + 120,
      });
    }

    const stores = nodes.filter(n => n.type === "store");

    // 고객 노드 - 실제 인원수 (성능 위해 제한)
    const grades = Object.entries(cluster.gradeDistribution) as [CustomerGrade, number][];
    grades.forEach(([grade, count]) => {
      const displayCount = Math.min(count, 60);
      for (let i = 0; i < displayCount; i++) {
        const targetStore = stores[Math.floor(Math.random() * stores.length)];
        const angle = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * 80;

        nodes.push({
          id: `cust_${grade}_${i}`,
          type: "customer",
          grade,
          x: (targetStore.x || centerX) + Math.cos(angle) * dist,
          y: (targetStore.y || centerY) + Math.sin(angle) * dist,
          targetStore,
          isMoving: Math.random() < 0.3, // 30%가 이동 중
          progress: Math.random(),
        });
      }
    });

    nodesRef.current = nodes;

    // Force simulation
    const simulation = d3
      .forceSimulation<SimNode>(nodes)
      .force(
        "charge",
        d3.forceManyBody<SimNode>().strength((d) => (d.type === "store" ? 0 : -2))
      )
      .force(
        "collision",
        d3.forceCollide<SimNode>().radius((d) =>
          d.type === "store" ? STORE_CONFIG[d.storeSize!].size + 5 : 5
        )
      )
      .alphaDecay(0.01)
      .velocityDecay(0.3);

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.016;

      const customers = nodes.filter(n => n.type === "customer");

      // 트래픽 애니메이션 업데이트
      customers.forEach((cust) => {
        if (cust.isMoving && cust.targetStore) {
          cust.progress = ((cust.progress || 0) + 0.008) % 1;

          // 매장 방향으로 이동 후 돌아옴
          const progress = cust.progress;
          const toStore = progress < 0.5;
          const t = toStore ? progress * 2 : (1 - progress) * 2;

          const startX = cust.targetStore.x! + (Math.sin(parseFloat(cust.id) * 100) * 70);
          const startY = cust.targetStore.y! + (Math.cos(parseFloat(cust.id) * 100) * 70);

          cust.x = startX + (cust.targetStore.x! - startX) * t * 0.7;
          cust.y = startY + (cust.targetStore.y! - startY) * t * 0.7;
        }

        // 랜덤하게 이동 상태 변경
        if (Math.random() < 0.002) {
          cust.isMoving = !cust.isMoving;
          if (cust.isMoving) {
            cust.targetStore = stores[Math.floor(Math.random() * stores.length)];
            cust.progress = 0;
          }
        }
      });

      // 연결선 (이동 중인 고객만)
      customers.filter(c => c.isMoving).forEach((cust) => {
        if (!cust.targetStore || !cust.x || !cust.y) return;

        ctx.beginPath();
        ctx.moveTo(cust.x, cust.y);
        ctx.lineTo(cust.targetStore.x!, cust.targetStore.y!);
        ctx.strokeStyle = GRADE_COLORS[cust.grade!] + "30";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // 고객 점
      customers.forEach((node, i) => {
        if (node.x === undefined || node.y === undefined) return;

        // 미세한 진동 (이동 중 아닌 경우)
        let drawX = node.x;
        let drawY = node.y;
        if (!node.isMoving) {
          drawX += Math.sin(time * 1.5 + i * 0.3) * 2;
          drawY += Math.cos(time * 2 + i * 0.5) * 2;
        }

        ctx.beginPath();
        ctx.arc(drawX, drawY, node.isMoving ? 4 : 3, 0, Math.PI * 2);
        ctx.fillStyle = GRADE_COLORS[node.grade!] + (node.isMoving ? "ff" : "cc");
        ctx.fill();

        // 이동 중인 고객은 글로우
        if (node.isMoving) {
          ctx.shadowColor = GRADE_COLORS[node.grade!];
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // 매장 (둥근 사각형)
      stores.forEach((node) => {
        if (node.x === undefined || node.y === undefined) return;
        const config = STORE_CONFIG[node.storeSize!];
        const s = config.size * 1.5;
        const r = 6;

        // 글로우
        ctx.shadowColor = config.glow;
        ctx.shadowBlur = 20;

        ctx.beginPath();
        ctx.roundRect(node.x - s / 2, node.y - s / 2, s, s, r);
        ctx.fillStyle = config.color;
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // 라벨
        ctx.fillStyle = "#000";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(config.label, node.x, node.y + 4);
      });

      animationRef.current = requestAnimationFrame(render);
    };

    simulation.on("tick", () => {});
    render();

    return () => {
      simulation.stop();
      cancelAnimationFrame(animationRef.current);
    };
  }, [cluster]);

  const insights = getClusterInsight(cluster);
  const topCategories = cluster.topCategories.slice(0, 3).map(c => c.name).join(", ");

  return (
    <motion.div
      className="w-full h-full flex gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* 왼쪽: 네트워크 Canvas */}
      <motion.div
        ref={containerRef}
        className="flex-1 relative rounded-2xl overflow-hidden border-2"
        style={{ borderColor: cluster.color + "50", backgroundColor: "#0a0a0a" }}
        layoutId={`cluster-${cluster.id}`}
      >
        {/* 닫기 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* 제목 */}
        <div className="absolute top-4 left-4 z-10">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{cluster.icon}</span>
            <div>
              <div className="text-white font-bold text-2xl">{cluster.name}</div>
              <div className="text-white/50 text-sm">{cluster.description}</div>
            </div>
          </div>
        </div>

        {/* 인사이트 오버레이 (좌측) */}
        <div className="absolute top-24 left-4 z-10 space-y-2 max-w-[200px]">
          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 border border-white/10">
            <div className="text-yellow-400 font-bold text-lg mb-1">
              VIP 전환율 {cluster.vipRate}%
            </div>
            <div className="text-white/60 text-xs">
              {cluster.vipRate > 10 ? "높은 VIP 잠재력" : "VIP 육성 필요"}
            </div>
          </div>

          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 border border-white/10">
            <div className="text-white font-semibold text-sm mb-1">
              ⏰ {cluster.weekdayRatio > 50 ? "평일" : "주말"} {cluster.peakHours[0]}시 피크
            </div>
            <div className="text-white/60 text-xs">
              평일 비중 {cluster.weekdayRatio}%
            </div>
          </div>

          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 border border-white/10">
            <div className="text-white font-semibold text-sm mb-1">
              🛒 주요 카테고리
            </div>
            <div className="text-white/70 text-xs">
              {topCategories}
            </div>
          </div>

          {cluster.churnRate > 10 && (
            <div className="bg-red-900/50 backdrop-blur-sm rounded-lg p-3 border border-red-500/30">
              <div className="text-red-400 font-bold text-sm">
                ⚠️ 이탈 위험 {cluster.churnRate}%
              </div>
              <div className="text-red-300/60 text-xs">
                리텐션 전략 필요
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="w-full h-full" />

        {/* 범례 */}
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-xl p-3 text-xs">
          <div className="flex gap-4 mb-2">
            {(["large", "medium", "small"] as const).map((size) => (
              <div key={size} className="flex items-center gap-1.5">
                <div
                  className="rounded"
                  style={{
                    width: STORE_CONFIG[size].size * 0.5,
                    height: STORE_CONFIG[size].size * 0.5,
                    backgroundColor: STORE_CONFIG[size].color,
                  }}
                />
                <span className="text-white/70">{STORE_CONFIG[size].label}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            {(["vip", "loyal", "active", "risk", "churn"] as const).map((grade) => (
              <div key={grade} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GRADE_COLORS[grade] }} />
                <span className="text-white/60">{GRADE_CONFIG[grade].emoji}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 트래픽 통계 */}
        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-white/50 text-xs">월평균 방문 </span>
              <span className="text-white font-bold">{cluster.avgVisitFrequency}회</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div>
              <span className="text-white/50 text-xs">객단가 </span>
              <span className="text-white font-bold">₩{(cluster.avgBasket / 1000).toFixed(0)}k</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 오른쪽: 대시보드 */}
      <motion.div
        className="w-72 flex flex-col gap-3 overflow-y-auto"
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 50, opacity: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* 핵심 지표 */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h3 className="text-white/50 text-xs mb-3 uppercase tracking-wider">Key Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-white/40 text-[10px]">고객 수</div>
              <div className="text-white font-bold text-2xl">{cluster.customerCount}</div>
            </div>
            <div>
              <div className="text-white/40 text-[10px]">평균 LTV</div>
              <div className="text-white font-bold text-2xl">₩{(cluster.avgLtv / 1000).toFixed(1)}k</div>
            </div>
            <div>
              <div className="text-white/40 text-[10px]">VIP 전환</div>
              <div className="text-yellow-400 font-bold text-2xl">{cluster.vipRate}%</div>
            </div>
            <div>
              <div className="text-white/40 text-[10px]">이탈율</div>
              <div className={`font-bold text-2xl ${cluster.churnRate > 10 ? "text-red-400" : "text-white/70"}`}>
                {cluster.churnRate}%
              </div>
            </div>
          </div>
        </div>

        {/* 등급 분포 */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h3 className="text-white/50 text-xs mb-3 uppercase tracking-wider">Grade Distribution</h3>
          <div className="space-y-2">
            {(Object.entries(cluster.gradeDistribution) as [CustomerGrade, number][]).map(([grade, count]) => {
              const pct = (count / cluster.customerCount) * 100;
              if (count === 0) return null;
              return (
                <div key={grade} className="flex items-center gap-2">
                  <span className="w-5 text-center">{GRADE_CONFIG[grade].emoji}</span>
                  <div className="flex-1 h-5 bg-white/5 rounded overflow-hidden">
                    <motion.div
                      className="h-full rounded"
                      style={{ backgroundColor: GRADE_COLORS[grade] }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    />
                  </div>
                  <span className="text-white/50 text-xs w-10 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 방문 패턴 */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h3 className="text-white/50 text-xs mb-3 uppercase tracking-wider">Visit Pattern</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-white/40 text-[10px]">월평균 방문</div>
              <div className="text-white font-semibold">{cluster.avgVisitFrequency}회</div>
            </div>
            <div>
              <div className="text-white/40 text-[10px]">평균 객단가</div>
              <div className="text-white font-semibold">₩{(cluster.avgBasket / 1000).toFixed(0)}k</div>
            </div>
            <div>
              <div className="text-white/40 text-[10px]">평일 비중</div>
              <div className="text-white font-semibold">{cluster.weekdayRatio}%</div>
            </div>
            <div>
              <div className="text-white/40 text-[10px]">피크 시간</div>
              <div className="text-white font-semibold">{cluster.peakHours[0]}시</div>
            </div>
          </div>
        </div>

        {/* 선호 카테고리 */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h3 className="text-white/50 text-xs mb-3 uppercase tracking-wider">Top Categories</h3>
          <div className="space-y-2">
            {cluster.topCategories.map((cat, i) => (
              <div key={cat.name} className="flex items-center gap-2 text-sm">
                <span className="text-white/70 flex-1 truncate">{cat.name}</span>
                <div className="w-16 h-2 bg-white/5 rounded overflow-hidden">
                  <motion.div
                    className="h-full rounded"
                    style={{ backgroundColor: cluster.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.percentage}%` }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                  />
                </div>
                <span className="text-white/40 text-xs w-8 text-right">{cat.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* 매장 구성 */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h3 className="text-white/50 text-xs mb-3 uppercase tracking-wider">Store Mix</h3>
          <div className="flex justify-center gap-6">
            {(["large", "medium", "small"] as const).map((size) => {
              const count = cluster.storePattern[size];
              if (count === 0) return null;
              return (
                <div key={size} className="text-center">
                  <div
                    className="mx-auto rounded-lg flex items-center justify-center mb-1"
                    style={{
                      width: STORE_CONFIG[size].size * 1.8,
                      height: STORE_CONFIG[size].size * 1.8,
                      backgroundColor: STORE_CONFIG[size].color,
                    }}
                  >
                    <span className="text-black font-bold text-lg">{count.toFixed(1)}</span>
                  </div>
                  <div className="text-white/40 text-[10px]">{STORE_CONFIG[size].label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// 메인 컴포넌트
export function ClusterNetworkMap() {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  const selectedData = useMemo(
    () => VISIT_CLUSTERS.find((c) => c.id === selectedCluster),
    [selectedCluster]
  );

  return (
    <div className="w-full h-full p-2">
      <AnimatePresence mode="wait">
        {selectedCluster && selectedData ? (
          <ClusterExpandedView
            key="expanded"
            cluster={selectedData}
            onClose={() => setSelectedCluster(null)}
          />
        ) : (
          <motion.div
            key="grid"
            className="w-full h-full grid grid-cols-3 grid-rows-2 gap-3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            {VISIT_CLUSTERS.map((cluster) => (
              <ClusterMiniCanvas
                key={cluster.id}
                cluster={cluster}
                onClick={() => setSelectedCluster(cluster.id)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
