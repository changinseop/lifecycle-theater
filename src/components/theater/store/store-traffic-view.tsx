"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";

// Part 6 전체 데이터
const STORE_DATA = {
  // 매장 기본 통계
  totalStores: 569,
  totalCustomers: 2500,
  totalTransactions: 2595732,

  // 매장 유형별 상세 데이터
  storeTypes: {
    large: {
      count: 61,
      storeShare: 10.5,
      customers: 147.6,
      products: 9815,
      transactions: 1728815,
      transactionShare: 66.6,
      revenue: 4868069,
      revenueShare: 60.4,
      avgPrice: 34.95,
      avgCategories: 2.9,
      color: "#3b82f6",
      label: "대형",
      criteria: "100명+ 고객, 5,000개+ 제품"
    },
    medium: {
      count: 49,
      storeShare: 8.4,
      customers: 74.0,
      products: 6670,
      transactions: 809589,
      transactionShare: 31.2,
      revenue: 3018575,
      revenueShare: 37.5,
      avgPrice: 35.89,
      avgCategories: 2.9,
      color: "#8b5cf6",
      label: "중형",
      criteria: "30~99명 고객, 200개+ 제품"
    },
    small: {
      count: 472,
      storeShare: 81.1,
      customers: 2.4,
      products: 80,
      transactions: 57328,
      transactionShare: 2.2,
      revenue: 170819,
      revenueShare: 2.1,
      avgPrice: 27.82,
      avgCategories: 2.4,
      color: "#6b7280",
      label: "소형",
      criteria: "30명 미만, 200개 미만"
    },
  },

  // 고객수-제품수 상관관계
  correlation: {
    spearman: 0.757,
    pValue: "< 0.001",
    interpretation: "고객 많은 매장 = 제품 많은 매장"
  },

  // 통계 검증
  statisticalTests: {
    kruskalWallis: { transactions: 273.44, revenue: 266.47, pValue: "< 0.001" },
    mannWhitney: { largeVsMedium: 2638, mediumVsSmall: 25676, pValue: "< 0.001" }
  },

  // 등급별 매장 선호도
  gradePreference: {
    VIP: { large: 64.9, medium: 34.9, small: 0.2 },
    충성: { large: 62.7, medium: 35.0, small: 2.3 },
    활성: { large: 60.1, medium: 37.6, small: 2.2 },
    위험: { large: 60.0, medium: 36.1, small: 3.9 },
    이탈: { large: 55.6, medium: 40.1, small: 4.3 },
  },

  // VIP 고객 여정
  vipJourney: {
    early: { large: 60.3, medium: 37.7, small: 2.0 },
    late: { large: 63.7, medium: 36.0, small: 0.3 },
    change: { large: "+3.4%p", medium: "-1.7%p", small: "-1.7%p" }
  },

  // 이탈 고객 여정
  churnJourney: {
    early: { large: 54.1, medium: 39.9, small: 6.0 },
    late: { large: 53.2, medium: 42.0, small: 4.9 },
    change: { large: "-0.9%p", medium: "+2.1%p", small: "-1.1%p" }
  },

  // 전환 매트릭스 (핵심!)
  transitionMatrix: {
    vip: {
      "대형→대형": 94.1, "대형→중형": 5.8, "대형→소형": 0.1,
      "중형→대형": 10.8, "중형→중형": 88.9, "중형→소형": 0.3,
      "소형→대형": 37.3, "소형→중형": 47.1, "소형→소형": 15.7
    },
    churn: {
      "대형→대형": 89.5, "대형→중형": 9.5, "대형→소형": 1.0,
      "중형→대형": 13.1, "중형→중형": 85.7, "중형→소형": 1.2,
      "소형→대형": 13.5, "소형→중형": 11.9, "소형→소형": 74.6
    }
  },

  // VIP 첫 방문 매장
  vipFirstVisit: { large: 62.9, medium: 34.3, small: 2.9 },

  // 파레토 법칙
  pareto: {
    topStores: 110,
    topStoresShare: 19.3,
    topTransactions: 97.6,
    topRevenue: 97.9
  },

  // 핵심 인사이트
  insights: [
    { title: "19.3% 매장 → 97.6% 거래", desc: "파레토 법칙", color: "#3b82f6" },
    { title: "VIP 대형 이용률 64.9%", desc: "전 등급 중 최고", color: "#fbbf24" },
    { title: "이탈 소형→소형 74.6%", desc: "갇힘 현상", color: "#ef4444" },
    { title: "VIP 소형→대형 37.3%", desc: "업그레이드 성공", color: "#22c55e" }
  ]
};

const GRADE_COLORS: Record<string, string> = {
  VIP: "#fbbf24",
  충성: "#22c55e",
  활성: "#3b82f6",
  위험: "#f97316",
  이탈: "#6b7280",
};

// 고객수 vs 제품수 산점도 Canvas
function CorrelationScatter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setCanvasSize({ width, height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.width === 0) return;

    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvasSize;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // 가상의 매장 데이터 포인트 생성 (569개)
    const points: { x: number; y: number; type: "large" | "medium" | "small" }[] = [];

    // 대형: 고객 100-270명, 제품 5000-19000개
    for (let i = 0; i < 61; i++) {
      points.push({
        x: 100 + Math.random() * 170,
        y: 5000 + Math.random() * 14000,
        type: "large"
      });
    }
    // 중형: 고객 30-99명, 제품 200-5000개
    for (let i = 0; i < 49; i++) {
      points.push({
        x: 30 + Math.random() * 69,
        y: 200 + Math.random() * 4800,
        type: "medium"
      });
    }
    // 소형: 고객 1-29명, 제품 1-200개
    for (let i = 0; i < 459; i++) {
      points.push({
        x: 1 + Math.random() * 28,
        y: 1 + Math.random() * 199,
        type: "small"
      });
    }

    const padding = { left: 45, right: 15, top: 20, bottom: 35 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.016;

      // 축
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, padding.top);
      ctx.lineTo(padding.left, height - padding.bottom);
      ctx.lineTo(width - padding.right, height - padding.bottom);
      ctx.stroke();

      // 축 라벨
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "9px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("고객 수 (명)", width / 2, height - 5);
      ctx.save();
      ctx.translate(12, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("제품 수 (개)", 0, 0);
      ctx.restore();

      // 눈금
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "8px system-ui";
      ctx.textAlign = "right";
      [0, 5000, 10000, 15000, 19000].forEach((v) => {
        const y = padding.top + chartH - (v / 19000) * chartH;
        ctx.fillText(v >= 1000 ? `${v/1000}k` : String(v), padding.left - 5, y + 3);
      });
      ctx.textAlign = "center";
      [0, 50, 100, 150, 200, 270].forEach((v) => {
        const x = padding.left + (v / 270) * chartW;
        ctx.fillText(String(v), x, height - padding.bottom + 12);
      });

      // 추세선 (상관관계)
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(padding.left, height - padding.bottom);
      ctx.lineTo(width - padding.right, padding.top);
      ctx.stroke();
      ctx.setLineDash([]);

      // 포인트
      points.forEach((p, i) => {
        const x = padding.left + (p.x / 270) * chartW;
        const y = padding.top + chartH - (p.y / 19000) * chartH;
        const pulse = 1 + Math.sin(time * 2 + i * 0.1) * 0.1;

        ctx.beginPath();
        ctx.arc(x, y, (p.type === "large" ? 5 : p.type === "medium" ? 4 : 2.5) * pulse, 0, Math.PI * 2);
        ctx.fillStyle = STORE_DATA.storeTypes[p.type].color + (p.type === "small" ? "60" : "aa");
        ctx.fill();
      });

      // 상관계수 표시
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px system-ui";
      ctx.textAlign = "right";
      ctx.fillText(`r = ${STORE_DATA.correlation.spearman}`, width - padding.right - 5, padding.top + 15);
      ctx.font = "9px system-ui";
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText("Spearman 상관계수", width - padding.right - 5, padding.top + 28);

      animationRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationRef.current);
  }, [canvasSize]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}

// 매장 버블 클러스터 Canvas (개선)
function StoreBubbleCluster() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setCanvasSize({ width, height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.width === 0) return;

    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvasSize;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const { storeTypes } = STORE_DATA;

    interface Bubble {
      type: "large" | "medium" | "small";
      x: number;
      y: number;
      baseRadius: number;
      customers: { x: number; y: number; angle: number; speed: number; grade: string }[];
    }

    const bubbles: Bubble[] = [
      { type: "large", x: width * 0.28, y: height * 0.45, baseRadius: 55, customers: [] },
      { type: "medium", x: width * 0.62, y: height * 0.45, baseRadius: 40, customers: [] },
      { type: "small", x: width * 0.85, y: height * 0.55, baseRadius: 20, customers: [] },
    ];

    const grades = Object.keys(STORE_DATA.gradePreference);
    bubbles.forEach((bubble) => {
      const count = bubble.type === "large" ? 30 : bubble.type === "medium" ? 18 : 6;
      for (let i = 0; i < count; i++) {
        const gradeIdx = Math.floor(Math.random() * grades.length);
        bubble.customers.push({
          x: 0, y: 0,
          angle: Math.random() * Math.PI * 2,
          speed: 0.3 + Math.random() * 0.4,
          grade: grades[gradeIdx],
        });
      }
    });

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.016;

      // 버블 간 연결선
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      bubbles.forEach((b1, i) => {
        bubbles.slice(i + 1).forEach((b2) => {
          ctx.beginPath();
          ctx.moveTo(b1.x, b1.y);
          ctx.lineTo(b2.x, b2.y);
          ctx.stroke();
        });
      });
      ctx.setLineDash([]);

      // 고객 점
      bubbles.forEach((bubble) => {
        bubble.customers.forEach((cust, i) => {
          cust.angle += cust.speed * 0.015;
          const orbitRadius = bubble.baseRadius + 12 + (i % 3) * 10;
          cust.x = bubble.x + Math.cos(cust.angle) * orbitRadius;
          cust.y = bubble.y + Math.sin(cust.angle) * orbitRadius;

          ctx.beginPath();
          ctx.arc(cust.x, cust.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = GRADE_COLORS[cust.grade] + "bb";
          ctx.fill();
        });
      });

      // 버블
      bubbles.forEach((bubble) => {
        const data = storeTypes[bubble.type];
        const pulse = 1 + Math.sin(time * 2) * 0.015;
        const r = bubble.baseRadius * pulse;

        // 글로우
        const gradient = ctx.createRadialGradient(bubble.x, bubble.y, 0, bubble.x, bubble.y, r * 1.4);
        gradient.addColorStop(0, data.color + "50");
        gradient.addColorStop(0.7, data.color + "15");
        gradient.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, r * 1.4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // 메인
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, r, 0, Math.PI * 2);
        ctx.fillStyle = data.color;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // 라벨
        ctx.fillStyle = "#fff";
        ctx.font = "bold 13px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(data.label, bubble.x, bubble.y - 10);
        ctx.font = "bold 11px system-ui";
        ctx.fillText(`${data.transactionShare}%`, bubble.x, bubble.y + 6);

        // 아래 정보
        ctx.font = "9px system-ui";
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fillText(`${data.count}개 매장`, bubble.x, bubble.y + r + 14);
        ctx.fillText(`${data.products.toLocaleString()}개 제품`, bubble.x, bubble.y + r + 26);
      });

      animationRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationRef.current);
  }, [canvasSize]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}

// 전환 매트릭스 히트맵
function TransitionHeatmap({ type }: { type: "vip" | "churn" }) {
  const matrix = STORE_DATA.transitionMatrix[type];
  const sizes = ["대형", "중형", "소형"];
  const label = type === "vip" ? "VIP" : "이탈";
  const accentColor = type === "vip" ? "#fbbf24" : "#6b7280";

  const getValue = (from: string, to: string) => {
    const key = `${from}→${to}` as keyof typeof matrix;
    return matrix[key] || 0;
  };

  const getColor = (value: number, type: "vip" | "churn") => {
    if (value >= 90) return type === "vip" ? "bg-yellow-500" : "bg-gray-400";
    if (value >= 70) return type === "vip" ? "bg-yellow-500/70" : "bg-gray-400/70";
    if (value >= 50) return type === "vip" ? "bg-yellow-500/50" : "bg-gray-400/50";
    if (value >= 30) return type === "vip" ? "bg-yellow-500/30" : "bg-gray-400/30";
    return "bg-white/10";
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-bold" style={{ color: accentColor }}>{label}</span>
        <span className="text-[9px] text-white/40">현재 → 다음 방문</span>
      </div>
      {/* 헤더 */}
      <div className="flex">
        <div className="w-10" />
        {sizes.map((s) => (
          <div key={s} className="flex-1 text-center text-[9px] text-white/50">{s}</div>
        ))}
      </div>
      {/* 행 */}
      {sizes.map((from, i) => (
        <motion.div
          key={from}
          className="flex items-center"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <div className="w-10 text-[9px] text-white/50">{from}</div>
          {sizes.map((to) => {
            const value = getValue(from, to);
            const isHighlight = (type === "vip" && from === "소형" && to === "대형") ||
                               (type === "churn" && from === "소형" && to === "소형");
            return (
              <motion.div
                key={to}
                className={`flex-1 h-8 mx-0.5 rounded flex items-center justify-center text-[10px] font-bold ${getColor(value, type)} ${isHighlight ? "ring-2 ring-white/50" : ""}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 + 0.2 }}
              >
                {value.toFixed(1)}%
              </motion.div>
            );
          })}
        </motion.div>
      ))}
    </div>
  );
}

// 등급별 대형매장 이용률 바 차트
function GradeLargeStoreChart() {
  const grades = Object.entries(STORE_DATA.gradePreference);

  return (
    <div className="space-y-1.5">
      {grades.map(([grade, pref], i) => (
        <motion.div
          key={grade}
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <div className="w-8 flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GRADE_COLORS[grade] }} />
            <span className="text-[9px] text-white/60">{grade}</span>
          </div>
          <div className="flex-1 h-5 bg-white/5 rounded overflow-hidden flex">
            <motion.div
              className="h-full flex items-center justify-end px-1"
              style={{ backgroundColor: STORE_DATA.storeTypes.large.color }}
              initial={{ width: 0 }}
              animate={{ width: `${pref.large}%` }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <span className="text-[8px] font-bold text-white">{pref.large}%</span>
            </motion.div>
            <motion.div
              className="h-full"
              style={{ backgroundColor: STORE_DATA.storeTypes.medium.color }}
              initial={{ width: 0 }}
              animate={{ width: `${pref.medium}%` }}
              transition={{ duration: 0.5, delay: i * 0.08 + 0.1 }}
            />
            <motion.div
              className="h-full"
              style={{ backgroundColor: STORE_DATA.storeTypes.small.color }}
              initial={{ width: 0 }}
              animate={{ width: `${pref.small}%` }}
              transition={{ duration: 0.5, delay: i * 0.08 + 0.2 }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// VIP vs 이탈 여정 비교
function JourneyComparison() {
  const { vipJourney, churnJourney } = STORE_DATA;
  const types = ["large", "medium", "small"] as const;

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* VIP */}
      <div className="bg-yellow-500/10 rounded-lg p-2.5 border border-yellow-500/20">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-sm">👑</span>
          <span className="text-xs font-bold text-yellow-400">VIP 여정</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] text-white/40 w-6">초기</span>
            <div className="flex-1 h-3.5 rounded overflow-hidden flex">
              {types.map((t) => (
                <motion.div
                  key={t}
                  className="h-full"
                  style={{ backgroundColor: STORE_DATA.storeTypes[t].color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${vipJourney.early[t]}%` }}
                  transition={{ duration: 0.5 }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-center text-yellow-400 text-xs">↓</div>
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] text-white/40 w-6">후기</span>
            <div className="flex-1 h-3.5 rounded overflow-hidden flex">
              {types.map((t) => (
                <motion.div
                  key={t}
                  className="h-full"
                  style={{ backgroundColor: STORE_DATA.storeTypes[t].color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${vipJourney.late[t]}%` }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-1.5 text-[8px] text-yellow-400/70 text-center">
          대형 {vipJourney.change.large} 집중
        </div>
      </div>

      {/* 이탈 */}
      <div className="bg-gray-500/10 rounded-lg p-2.5 border border-gray-500/20">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-sm">💨</span>
          <span className="text-xs font-bold text-gray-400">이탈 여정</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] text-white/40 w-6">초기</span>
            <div className="flex-1 h-3.5 rounded overflow-hidden flex">
              {types.map((t) => (
                <motion.div
                  key={t}
                  className="h-full"
                  style={{ backgroundColor: STORE_DATA.storeTypes[t].color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${churnJourney.early[t]}%` }}
                  transition={{ duration: 0.5 }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-center text-gray-400 text-xs">↓</div>
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] text-white/40 w-6">후기</span>
            <div className="flex-1 h-3.5 rounded overflow-hidden flex">
              {types.map((t) => (
                <motion.div
                  key={t}
                  className="h-full"
                  style={{ backgroundColor: STORE_DATA.storeTypes[t].color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${churnJourney.late[t]}%` }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-1.5 text-[8px] text-gray-400/70 text-center">
          중형 {churnJourney.change.medium} 분산
        </div>
      </div>
    </div>
  );
}

// 전체 매장-고객 네트워크 Canvas (Arc 기반 - 원본)
function StoreCustomerNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setCanvasSize({ width, height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.width === 0) return;

    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvasSize;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const centerX = width / 2;

    // Arc 기반 배치: 대형=상단 아크, 중형=중간, 소형=하단 그리드
    interface StoreNode {
      id: number;
      type: "large" | "medium" | "small";
      x: number;
      y: number;
    }

    interface CustomerNode {
      x: number;
      y: number;
      grade: string;
      homeStore: number;
      orbitAngle: number;
      orbitSpeed: number;
      isTransitioning: boolean;
      targetStore: number;
      transitionProgress: number;
    }

    const stores: StoreNode[] = [];
    const customers: CustomerNode[] = [];

    // 대형 매장 (61개) - 상단 아크
    for (let i = 0; i < 61; i++) {
      const angle = Math.PI + (i / 60) * Math.PI; // 180° 아크
      const radius = 160;
      stores.push({
        id: i,
        type: "large",
        x: centerX + Math.cos(angle) * radius,
        y: 100 + Math.sin(angle) * 60
      });
    }

    // 중형 매장 (49개) - 중간 아크
    for (let i = 0; i < 49; i++) {
      const angle = Math.PI + (i / 48) * Math.PI;
      const radius = 200;
      stores.push({
        id: 61 + i,
        type: "medium",
        x: centerX + Math.cos(angle) * radius,
        y: height * 0.42 + Math.sin(angle) * 40
      });
    }

    // 소형 매장 (472개) - 하단 그리드
    const gridCols = 24;
    const gridRows = Math.ceil(472 / gridCols);
    const gridStartX = centerX - (gridCols * 12) / 2;
    const gridStartY = height * 0.65;
    for (let i = 0; i < 472; i++) {
      const col = i % gridCols;
      const row = Math.floor(i / gridCols);
      stores.push({
        id: 110 + i,
        type: "small",
        x: gridStartX + col * 12 + Math.random() * 4,
        y: gridStartY + row * 10 + Math.random() * 3
      });
    }

    // 고객 배치 (2500명)
    const gradeDistribution = { VIP: 70, 충성: 393, 활성: 990, 위험: 513, 이탈: 534 };
    Object.entries(gradeDistribution).forEach(([grade, count]) => {
      const pref = STORE_DATA.gradePreference[grade as keyof typeof STORE_DATA.gradePreference];
      for (let i = 0; i < count; i++) {
        const rand = Math.random() * 100;
        let storeType: "large" | "medium" | "small";
        if (rand < pref.large) storeType = "large";
        else if (rand < pref.large + pref.medium) storeType = "medium";
        else storeType = "small";

        const typeStores = stores.filter(s => s.type === storeType);
        const homeStore = typeStores[Math.floor(Math.random() * typeStores.length)];
        const angle = Math.random() * Math.PI * 2;

        customers.push({
          x: homeStore.x + Math.cos(angle) * 5,
          y: homeStore.y + Math.sin(angle) * 5,
          grade,
          homeStore: homeStore.id,
          orbitAngle: angle,
          orbitSpeed: 0.01 + Math.random() * 0.02,
          isTransitioning: false,
          targetStore: homeStore.id,
          transitionProgress: 0
        });
      }
    });

    let time = 0;

    const render = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, width, height);
      time += 0.016;

      // 영역 구분선
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, height * 0.35);
      ctx.lineTo(width, height * 0.35);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, height * 0.58);
      ctx.lineTo(width, height * 0.58);
      ctx.stroke();
      ctx.setLineDash([]);

      // 영역 라벨
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.font = "10px system-ui";
      ctx.textAlign = "left";
      ctx.fillText("대형 매장 (61개)", 15, 25);
      ctx.fillText("중형 매장 (49개)", 15, height * 0.38);
      ctx.fillText("소형 매장 (472개)", 15, height * 0.62);

      // 고객 업데이트 및 렌더링
      customers.forEach((cust, i) => {
        const home = stores.find(s => s.id === cust.homeStore)!;

        if (cust.isTransitioning) {
          cust.transitionProgress += 0.02;
          const target = stores.find(s => s.id === cust.targetStore)!;
          const t = cust.transitionProgress;
          cust.x = home.x + (target.x - home.x) * t;
          cust.y = home.y + (target.y - home.y) * t;

          if (cust.transitionProgress >= 1) {
            cust.isTransitioning = false;
            cust.homeStore = cust.targetStore;
            cust.transitionProgress = 0;
            cust.orbitAngle = Math.random() * Math.PI * 2;
          }
        } else {
          cust.orbitAngle += cust.orbitSpeed;
          const orbitRadius = 5 + (i % 3) * 2;
          cust.x = home.x + Math.cos(cust.orbitAngle) * orbitRadius;
          cust.y = home.y + Math.sin(cust.orbitAngle) * orbitRadius;

          // 랜덤 이동
          if (Math.random() < 0.0003) {
            cust.isTransitioning = true;
            cust.transitionProgress = 0;
            const pref = STORE_DATA.gradePreference[cust.grade as keyof typeof STORE_DATA.gradePreference];
            const rand = Math.random() * 100;
            let targetType: "large" | "medium" | "small";
            if (rand < pref.large) targetType = "large";
            else if (rand < pref.large + pref.medium) targetType = "medium";
            else targetType = "small";
            const typeStores = stores.filter(s => s.type === targetType);
            cust.targetStore = typeStores[Math.floor(Math.random() * typeStores.length)].id;
          }
        }

        // 고객 점
        ctx.beginPath();
        ctx.arc(cust.x, cust.y, cust.isTransitioning ? 2 : 1.5, 0, Math.PI * 2);
        ctx.fillStyle = GRADE_COLORS[cust.grade] + "aa";
        ctx.fill();
      });

      // 매장 렌더링
      stores.forEach((store) => {
        const config = STORE_DATA.storeTypes[store.type];
        const pulse = 1 + Math.sin(time * 3 + store.id * 0.1) * 0.1;
        const baseRadius = store.type === "large" ? 6 : store.type === "medium" ? 4 : 2;
        const r = baseRadius * pulse;

        // 대형 매장 글로우
        if (store.type === "large") {
          const glow = ctx.createRadialGradient(store.x, store.y, 0, store.x, store.y, r * 2);
          glow.addColorStop(0, config.color + "50");
          glow.addColorStop(1, "transparent");
          ctx.beginPath();
          ctx.arc(store.x, store.y, r * 2, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(store.x, store.y, r, 0, Math.PI * 2);
        ctx.fillStyle = config.color;
        ctx.fill();
      });

      // 범례
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(width - 120, 10, 110, 90);
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.strokeRect(width - 120, 10, 110, 90);

      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px system-ui";
      ctx.textAlign = "left";
      ctx.fillText("고객 등급", width - 110, 26);

      ctx.font = "9px system-ui";
      let y = 42;
      Object.entries(GRADE_COLORS).forEach(([grade, color]) => {
        ctx.beginPath();
        ctx.arc(width - 105, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillText(grade, width - 95, y + 3);
        y += 13;
      });

      // 하단 통계
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "10px system-ui";
      ctx.fillText(`${STORE_DATA.totalStores}개 매장 · ${STORE_DATA.totalCustomers.toLocaleString()}명 고객`, centerX, height - 12);

      animationRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationRef.current);
  }, [canvasSize]);

  return (
    <div ref={containerRef} className="w-full h-full bg-black/50">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}

// Galaxy Map - Force-Directed + Gravity Well 버전
function StoreGalaxyMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setCanvasSize({ width, height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.width === 0) return;

    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvasSize;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const centerX = width / 2;
    const centerY = height / 2;

    // 매장 노드 (Force-Directed 시뮬레이션용)
    interface StoreNode {
      id: number;
      type: "large" | "medium" | "small";
      x: number;
      y: number;
      vx: number;
      vy: number;
      targetX: number;
      targetY: number;
      radius: number;
      mass: number;
      glow: number;
    }

    interface CustomerNode {
      x: number;
      y: number;
      vx: number;
      vy: number;
      grade: string;
      homeStore: number;
      trail: { x: number; y: number; alpha: number }[];
      orbitAngle: number;
      orbitSpeed: number;
      isTransitioning: boolean;
      targetStore: number;
      transitionProgress: number;
    }

    const stores: StoreNode[] = [];
    const customers: CustomerNode[] = [];

    // Galaxy Map 배치: 대형=중심, 중형=중간 궤도, 소형=외곽(촘촘)
    // 대형 매장 (61개) - 중심부에 넓게 배치, 간격 크게
    for (let i = 0; i < 61; i++) {
      const angle = (i / 61) * Math.PI * 2 + Math.random() * 0.3;
      const radius = 60 + Math.random() * 80; // 중심 근처, 넓은 간격
      stores.push({
        id: i,
        type: "large",
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        targetX: centerX + Math.cos(angle) * radius,
        targetY: centerY + Math.sin(angle) * radius,
        radius: 8, // 큰 원
        mass: 10,
        glow: 0
      });
    }

    // 중형 매장 (49개) - 중간 궤도, 적당한 간격
    for (let i = 0; i < 49; i++) {
      const angle = (i / 49) * Math.PI * 2 + Math.random() * 0.2;
      const radius = 160 + Math.random() * 60;
      stores.push({
        id: 61 + i,
        type: "medium",
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        targetX: centerX + Math.cos(angle) * radius,
        targetY: centerY + Math.sin(angle) * radius,
        radius: 5,
        mass: 5,
        glow: 0
      });
    }

    // 소형 매장 (472개) - 외곽에 촘촘하게 뭉침
    for (let i = 0; i < 472; i++) {
      const angle = (i / 472) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
      const radius = 240 + Math.random() * 40; // 외곽, 좁은 범위에 촘촘
      stores.push({
        id: 110 + i,
        type: "small",
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        targetX: centerX + Math.cos(angle) * radius,
        targetY: centerY + Math.sin(angle) * radius,
        radius: 2, // 작은 점
        mass: 1,
        glow: 0
      });
    }

    // 고객 배치 (2500명)
    const gradeDistribution = { VIP: 70, 충성: 393, 활성: 990, 위험: 513, 이탈: 534 };
    Object.entries(gradeDistribution).forEach(([grade, count]) => {
      const pref = STORE_DATA.gradePreference[grade as keyof typeof STORE_DATA.gradePreference];
      for (let i = 0; i < count; i++) {
        const rand = Math.random() * 100;
        let storeType: "large" | "medium" | "small";
        if (rand < pref.large) storeType = "large";
        else if (rand < pref.large + pref.medium) storeType = "medium";
        else storeType = "small";

        const typeStores = stores.filter(s => s.type === storeType);
        const homeStore = typeStores[Math.floor(Math.random() * typeStores.length)];
        const angle = Math.random() * Math.PI * 2;
        const dist = 5 + Math.random() * 15;

        customers.push({
          x: homeStore.x + Math.cos(angle) * dist,
          y: homeStore.y + Math.sin(angle) * dist,
          vx: 0,
          vy: 0,
          grade,
          homeStore: homeStore.id,
          trail: [],
          orbitAngle: angle,
          orbitSpeed: 0.005 + Math.random() * 0.01,
          isTransitioning: false,
          targetStore: homeStore.id,
          transitionProgress: 0
        });
      }
    });

    let time = 0;
    let breathPhase = 0;

    const render = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx.fillRect(0, 0, width, height);
      time += 0.016;
      breathPhase += 0.02;

      // Breathing effect (클러스터가 숨쉬듯 확장/수축)
      const breathScale = 1 + Math.sin(breathPhase) * 0.03;

      // Force-Directed 시뮬레이션 (간단한 반발력)
      stores.forEach((s1, i) => {
        stores.slice(i + 1).forEach((s2) => {
          const dx = s2.x - s1.x;
          const dy = s2.y - s1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          // 반발력: 대형은 강하게, 소형은 약하게
          const repulsion = s1.type === "large" ? 800 : s1.type === "medium" ? 400 : 50;
          const force = repulsion / (dist * dist);

          if (dist < 100) {
            s1.vx -= (dx / dist) * force * 0.1;
            s1.vy -= (dy / dist) * force * 0.1;
            s2.vx += (dx / dist) * force * 0.1;
            s2.vy += (dy / dist) * force * 0.1;
          }
        });

        // 타겟 위치로 복원
        s1.vx += (s1.targetX - s1.x) * 0.01;
        s1.vy += (s1.targetY - s1.y) * 0.01;

        // 감쇠
        s1.vx *= 0.95;
        s1.vy *= 0.95;

        // 위치 업데이트
        s1.x += s1.vx;
        s1.y += s1.vy;

        // Breathing effect 적용
        const breathOffsetX = (s1.x - centerX) * (breathScale - 1);
        const breathOffsetY = (s1.y - centerY) * (breathScale - 1);
        s1.x += breathOffsetX * 0.1;
        s1.y += breathOffsetY * 0.1;
      });

      // 중력 웰 시각화 (대형 매장 주변)
      stores.filter(s => s.type === "large").forEach((store) => {
        const gradient = ctx.createRadialGradient(store.x, store.y, 0, store.x, store.y, 50);
        gradient.addColorStop(0, STORE_DATA.storeTypes.large.color + "30");
        gradient.addColorStop(0.5, STORE_DATA.storeTypes.large.color + "10");
        gradient.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(store.x, store.y, 50, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      // 고객 업데이트
      customers.forEach((cust, i) => {
        const home = stores.find(s => s.id === cust.homeStore)!;

        // Trail 업데이트
        cust.trail.unshift({ x: cust.x, y: cust.y, alpha: 1 });
        if (cust.trail.length > 10) cust.trail.pop();
        cust.trail.forEach(t => t.alpha *= 0.85);

        if (cust.isTransitioning) {
          // 이동 중 - 곡선 경로
          cust.transitionProgress += 0.015;
          const target = stores.find(s => s.id === cust.targetStore)!;
          const t = cust.transitionProgress;

          // 베지어 곡선 이동 (아치형)
          const midX = (home.x + target.x) / 2;
          const midY = (home.y + target.y) / 2 - 50;
          const oneMinusT = 1 - t;
          cust.x = oneMinusT * oneMinusT * home.x + 2 * oneMinusT * t * midX + t * t * target.x;
          cust.y = oneMinusT * oneMinusT * home.y + 2 * oneMinusT * t * midY + t * t * target.y;

          if (cust.transitionProgress >= 1) {
            cust.isTransitioning = false;
            cust.homeStore = cust.targetStore;
            cust.transitionProgress = 0;
            cust.orbitAngle = Math.random() * Math.PI * 2;
          }
        } else {
          // 궤도 운동
          cust.orbitAngle += cust.orbitSpeed;
          const orbitRadius = 8 + (i % 5) * 3;
          cust.x = home.x + Math.cos(cust.orbitAngle) * orbitRadius;
          cust.y = home.y + Math.sin(cust.orbitAngle) * orbitRadius;

          // 랜덤 이동 시작 (전환 매트릭스 기반)
          if (Math.random() < 0.0005) {
            cust.isTransitioning = true;
            cust.transitionProgress = 0;
            const pref = STORE_DATA.gradePreference[cust.grade as keyof typeof STORE_DATA.gradePreference];
            const rand = Math.random() * 100;
            let targetType: "large" | "medium" | "small";
            if (rand < pref.large) targetType = "large";
            else if (rand < pref.large + pref.medium) targetType = "medium";
            else targetType = "small";
            const typeStores = stores.filter(s => s.type === targetType);
            cust.targetStore = typeStores[Math.floor(Math.random() * typeStores.length)].id;
          }
        }

        // Trail 렌더링 (VIP는 금색 트레일)
        if (cust.isTransitioning && cust.trail.length > 2) {
          ctx.beginPath();
          ctx.moveTo(cust.trail[0].x, cust.trail[0].y);
          cust.trail.forEach((t, idx) => {
            if (idx > 0) ctx.lineTo(t.x, t.y);
          });
          ctx.strokeStyle = GRADE_COLORS[cust.grade] + "60";
          ctx.lineWidth = cust.grade === "VIP" ? 2 : 1;
          ctx.stroke();
        }

        // 고객 점 렌더링
        ctx.beginPath();
        ctx.arc(cust.x, cust.y, cust.isTransitioning ? 2.5 : 1.5, 0, Math.PI * 2);
        ctx.fillStyle = GRADE_COLORS[cust.grade] + (cust.isTransitioning ? "ff" : "aa");
        ctx.fill();

        // VIP 글로우
        if (cust.grade === "VIP") {
          ctx.beginPath();
          ctx.arc(cust.x, cust.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = GRADE_COLORS[cust.grade] + "20";
          ctx.fill();
        }
      });

      // 매장 렌더링
      stores.forEach((store) => {
        const config = STORE_DATA.storeTypes[store.type];
        const pulse = 1 + Math.sin(time * 3 + store.id * 0.1) * 0.15;
        const r = store.radius * pulse;

        // 대형 매장 글로우
        if (store.type === "large") {
          const glow = ctx.createRadialGradient(store.x, store.y, 0, store.x, store.y, r * 3);
          glow.addColorStop(0, config.color + "80");
          glow.addColorStop(0.5, config.color + "30");
          glow.addColorStop(1, "transparent");
          ctx.beginPath();
          ctx.arc(store.x, store.y, r * 3, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        // 메인 원
        ctx.beginPath();
        ctx.arc(store.x, store.y, r, 0, Math.PI * 2);
        ctx.fillStyle = config.color;
        ctx.fill();

        // 대형 매장 테두리
        if (store.type === "large") {
          ctx.strokeStyle = "rgba(255,255,255,0.5)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      // 궤도 링 시각화
      ctx.setLineDash([2, 4]);
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;

      // 대형 궤도
      ctx.beginPath();
      ctx.arc(centerX, centerY, 120, 0, Math.PI * 2);
      ctx.stroke();

      // 중형 궤도
      ctx.beginPath();
      ctx.arc(centerX, centerY, 190, 0, Math.PI * 2);
      ctx.stroke();

      // 소형 궤도
      ctx.beginPath();
      ctx.arc(centerX, centerY, 260, 0, Math.PI * 2);
      ctx.stroke();

      ctx.setLineDash([]);

      // 범례 (반투명 박스)
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(10, 10, 130, 95);
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.strokeRect(10, 10, 130, 95);

      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px system-ui";
      ctx.textAlign = "left";
      ctx.fillText("Galaxy Map", 20, 28);

      ctx.font = "9px system-ui";
      let y = 46;
      [
        { label: `대형 (${STORE_DATA.storeTypes.large.count}개) - 중심`, color: STORE_DATA.storeTypes.large.color },
        { label: `중형 (${STORE_DATA.storeTypes.medium.count}개) - 궤도`, color: STORE_DATA.storeTypes.medium.color },
        { label: `소형 (${STORE_DATA.storeTypes.small.count}개) - 외곽`, color: STORE_DATA.storeTypes.small.color },
      ].forEach((item) => {
        ctx.beginPath();
        ctx.arc(25, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = item.color;
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillText(item.label, 35, y + 3);
        y += 16;
      });

      // 고객 범례 (우측)
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(width - 100, 10, 90, 90);
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.strokeRect(width - 100, 10, 90, 90);

      ctx.textAlign = "left";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px system-ui";
      ctx.fillText("고객 2,500명", width - 92, 26);

      ctx.font = "9px system-ui";
      y = 42;
      Object.entries(GRADE_COLORS).forEach(([grade, color]) => {
        ctx.beginPath();
        ctx.arc(width - 85, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillText(grade, width - 75, y + 3);
        y += 13;
      });

      // 중앙 통계
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "10px system-ui";
      ctx.fillText("19.3% 매장 → 97.6% 거래", centerX, height - 15);

      animationRef.current = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationRef.current);
  }, [canvasSize]);

  return (
    <div ref={containerRef} className="w-full h-full bg-black">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}

// 메인 컴포넌트
/* ────────────────────────────────────────────────── MethodInfo */

function MethodInfo({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white/[0.02] rounded-xl border border-white/10 overflow-hidden mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-white/40"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="text-xs font-medium text-white/50">{title}</span>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-white/30 text-xs"
        >
          ▼
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 text-xs text-white/50 leading-relaxed space-y-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function StoreTrafficView() {
  const [viewMode, setViewMode] = useState<"dashboard" | "network" | "galaxy">("dashboard");

  return (
    <div className="w-full h-full flex flex-col overflow-auto">
      {/* Header */}
      <div className="flex-shrink-0 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              📊 매장 트래픽 및 고객 이동 패턴
            </h3>
            <p className="text-xs text-white/50">
              {STORE_DATA.totalStores}개 매장 · {STORE_DATA.totalCustomers.toLocaleString()}명 고객 · {STORE_DATA.totalTransactions.toLocaleString()}건 거래
            </p>
          </div>
          {/* 뷰 모드 토글 - 3개 탭 */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            <motion.button
              className={`px-3 py-1.5 rounded-md text-xs transition-all ${
                viewMode === "dashboard" ? "bg-white/15 text-white" : "text-white/50 hover:text-white/70"
              }`}
              onClick={() => setViewMode("dashboard")}
              whileTap={{ scale: 0.97 }}
            >
              📈 대시보드
            </motion.button>
            <motion.button
              className={`px-3 py-1.5 rounded-md text-xs transition-all ${
                viewMode === "network" ? "bg-white/15 text-white" : "text-white/50 hover:text-white/70"
              }`}
              onClick={() => setViewMode("network")}
              whileTap={{ scale: 0.97 }}
            >
              🔗 네트워크 맵
            </motion.button>
            <motion.button
              className={`px-3 py-1.5 rounded-md text-xs transition-all ${
                viewMode === "galaxy" ? "bg-white/15 text-white" : "text-white/50 hover:text-white/70"
              }`}
              onClick={() => setViewMode("galaxy")}
              whileTap={{ scale: 0.97 }}
            >
              🌌 Galaxy Map
            </motion.button>
          </div>
        </div>
      </div>

      <MethodInfo title="매장 분석 — 분석 기법 설명">
        <p className="text-white/70 font-medium">분석 기법: K-Means 클러스터링 + 비모수 검정 + 전환 매트릭스</p>
        <p>
          <span className="text-white/60">K-Means Clustering (k=3)</span> — 411개 매장을 &quot;평균 제품 수 × 고객 방문 빈도&quot; 2차원
          공간에서 3개 군집(대형/중형/소형)으로 분류합니다. 각 클러스터 중심과의 거리를 최소화하는 비지도학습 알고리즘입니다.
        </p>
        <p>
          <span className="text-white/60">Spearman 순위상관 (ρ=0.757)</span> — 고객 수와 제품 수 사이의 단조 관계를 측정합니다.
          정규분포를 가정하지 않는 비모수 방법으로, 이상치에 강건합니다. ρ=0.757은 강한 양의 상관을 의미합니다.
        </p>
        <p>
          <span className="text-white/60">Kruskal-Wallis H 검정</span> — 3개 매장 유형 간 거래량/매출의 차이를 검정합니다.
          H=273.44 (거래), H=266.47 (매출), 모두 p&lt;0.001로 유형 간 차이가 통계적으로 유의합니다.
        </p>
        <p>
          <span className="text-white/60">전환 매트릭스</span> — VIP/이탈 고객의 매장 이동 패턴을 조건부 확률로 정리합니다.
          &quot;대형→대형 94.1%&quot;는 VIP 고객이 대형매장을 계속 이용할 확률이 94.1%라는 의미입니다.
        </p>
        <p className="text-white/40 italic">
          읽는 법: 대시보드에서 매장 유형별 비교, 네트워크 맵에서 고객 이동 경로, Galaxy Map에서 전체 매장 분포를 확인합니다.
        </p>
      </MethodInfo>

      {/* 네트워크 뷰 (Arc 기반) */}
      {viewMode === "network" && (
        <div className="flex-1 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 overflow-hidden">
          <StoreCustomerNetwork />
        </div>
      )}

      {/* Galaxy Map 뷰 (Force-Directed) */}
      {viewMode === "galaxy" && (
        <div className="flex-1 rounded-xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-white/10 overflow-hidden">
          <StoreGalaxyMap />
        </div>
      )}

      {/* 대시보드 뷰 */}
      {viewMode === "dashboard" && (
      <>
      {/* 메인 그리드 */}
      <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-3 min-h-0">

        {/* 1. 고객수 vs 제품수 산점도 */}
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-white/70">🔗 고객수 vs 제품수</h4>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
              r = {STORE_DATA.correlation.spearman}
            </span>
          </div>
          <div className="h-[calc(100%-28px)]">
            <CorrelationScatter />
          </div>
        </div>

        {/* 2. 매장 버블 클러스터 */}
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-white/70">🏪 매장 규모 분포</h4>
            <span className="text-[9px] text-white/40">{STORE_DATA.pareto.topStoresShare}% → {STORE_DATA.pareto.topTransactions}%</span>
          </div>
          <div className="h-[calc(100%-28px)]">
            <StoreBubbleCluster />
          </div>
        </div>

        {/* 3. 등급별 매장 선호도 */}
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-white/70">📈 등급별 매장 선호도</h4>
          </div>
          <GradeLargeStoreChart />
          {/* 범례 */}
          <div className="flex justify-center gap-3 mt-2 pt-2 border-t border-white/10">
            {(["large", "medium", "small"] as const).map((t) => (
              <div key={t} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: STORE_DATA.storeTypes[t].color }} />
                <span className="text-[8px] text-white/40">{STORE_DATA.storeTypes[t].label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. VIP 전환 매트릭스 */}
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <h4 className="text-xs font-semibold text-white/70 mb-2">🔄 VIP 전환 매트릭스</h4>
          <TransitionHeatmap type="vip" />
          <div className="mt-2 text-[8px] text-yellow-400/60 text-center">
            소형→대형 <span className="font-bold text-yellow-400">37.3%</span> 업그레이드!
          </div>
        </div>

        {/* 5. 이탈 전환 매트릭스 */}
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <h4 className="text-xs font-semibold text-white/70 mb-2">🔄 이탈 전환 매트릭스</h4>
          <TransitionHeatmap type="churn" />
          <div className="mt-2 text-[8px] text-red-400/60 text-center">
            소형→소형 <span className="font-bold text-red-400">74.6%</span> 갇힘!
          </div>
        </div>

        {/* 6. 여정 비교 + 통계 검증 */}
        <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col">
          <h4 className="text-xs font-semibold text-white/70 mb-2">🛤️ 고객 여정 비교</h4>
          <JourneyComparison />
          {/* 통계 검증 */}
          <div className="mt-auto pt-2 border-t border-white/10">
            <div className="grid grid-cols-2 gap-2 text-[8px]">
              <div className="bg-white/5 rounded p-1.5 text-center">
                <div className="text-white/40">Kruskal-Wallis</div>
                <div className="text-cyan-400 font-bold">H = 273.44</div>
                <div className="text-white/30">p &lt; 0.001</div>
              </div>
              <div className="bg-white/5 rounded p-1.5 text-center">
                <div className="text-white/40">Mann-Whitney</div>
                <div className="text-cyan-400 font-bold">대중 ≠ 소</div>
                <div className="text-white/30">p &lt; 0.001</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 하단: 핵심 인사이트 */}
      <div className="flex-shrink-0 mt-3 flex gap-2">
        {STORE_DATA.insights.map((insight, i) => (
          <motion.div
            key={i}
            className="flex-1 bg-white/5 rounded-lg p-2 border border-white/10 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
          >
            <div className="text-xs font-bold" style={{ color: insight.color }}>
              {insight.title}
            </div>
            <div className="text-[9px] text-white/40">{insight.desc}</div>
          </motion.div>
        ))}
      </div>
      </>
      )}
    </div>
  );
}
