"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as d3 from "d3";
import { X, Sun, Moon, Clock, ShoppingCart, TrendingUp, Users, Flower2, Fuel } from "lucide-react";
import {
  COHORT_DETAIL_DATA,
  CohortDetailData,
  COHORT_COMPARISON,
  STATISTICAL_VALIDATION
} from "@/lib/data/cohort-detail-data";

// 등급 색상
const GRADE_COLORS: Record<string, string> = {
  vip: "#fbbf24",
  loyal: "#22c55e",
  active: "#3b82f6",
  risk: "#f97316",
  churn: "#71717a",
};

const GRADE_LABELS: Record<string, string> = {
  vip: "VIP",
  loyal: "충성",
  active: "활성",
  risk: "위험",
  churn: "이탈",
};

// 매장 크기별 설정
const STORE_CONFIG = {
  large: { width: 80, height: 60, color: "#60a5fa", label: "대형", count: 54 },
  medium: { width: 60, height: 45, color: "#a78bfa", label: "중형", count: 56 },
  small: { width: 40, height: 30, color: "#9ca3af", label: "소형", count: 459 },
};

// 시뮬레이션 노드 타입
interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  type: "store" | "customer";
  storeSize?: "large" | "medium" | "small";
  grade?: string;
  targetStore?: SimNode;
  homeStore?: SimNode;
  isMoving?: boolean;
  progress?: number;
  visitFrequency?: number;
}

// 코호트 네트워크 캔버스
function CohortNetworkCanvas({
  cohort,
  timeMode,
}: {
  cohort: CohortDetailData;
  timeMode: "weekday" | "weekend";
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
    const centerY = height / 2;

    // 노드 생성
    const nodes: SimNode[] = [];
    const { large, medium, small } = cohort.storePattern;

    // 매장 배치 (가로로 배열)
    const storeGap = 140;
    const stores: SimNode[] = [];

    // 대형 매장 (상단)
    if (large.ratio > 0) {
      const x = centerX - storeGap;
      const y = centerY - 80;
      const store: SimNode = {
        id: "store_large",
        type: "store",
        storeSize: "large",
        x, y, fx: x, fy: y,
      };
      nodes.push(store);
      stores.push(store);
    }

    // 중형 매장 (중앙)
    if (medium.ratio > 0) {
      const x = centerX;
      const y = centerY + 20;
      const store: SimNode = {
        id: "store_medium",
        type: "store",
        storeSize: "medium",
        x, y, fx: x, fy: y,
      };
      nodes.push(store);
      stores.push(store);
    }

    // 소형 매장 (오른쪽 하단)
    if (small.ratio > 0) {
      const x = centerX + storeGap;
      const y = centerY - 20;
      const store: SimNode = {
        id: "store_small",
        type: "store",
        storeSize: "small",
        x, y, fx: x, fy: y,
      };
      nodes.push(store);
      stores.push(store);
    }

    // 고객 노드 생성 (등급 분포 기반)
    const { gradeConversion } = cohort;
    const grades = [
      { grade: "vip", pct: gradeConversion.vip },
      { grade: "loyal", pct: gradeConversion.loyal },
      { grade: "active", pct: gradeConversion.active },
      { grade: "risk", pct: gradeConversion.risk },
      { grade: "churn", pct: gradeConversion.churn },
    ];

    // 총 고객 수 제한 (성능)
    const maxCustomers = 80;
    const customerScale = maxCustomers / 100;

    grades.forEach(({ grade, pct }) => {
      const count = Math.max(1, Math.round(pct * customerScale));

      for (let i = 0; i < count; i++) {
        // 매장 방문 비율에 따라 홈 매장 결정
        const rand = Math.random() * 100;
        let homeStore: SimNode;

        if (rand < large.ratio && stores.find(s => s.storeSize === "large")) {
          homeStore = stores.find(s => s.storeSize === "large")!;
        } else if (rand < large.ratio + medium.ratio && stores.find(s => s.storeSize === "medium")) {
          homeStore = stores.find(s => s.storeSize === "medium")!;
        } else if (stores.find(s => s.storeSize === "small")) {
          homeStore = stores.find(s => s.storeSize === "small")!;
        } else {
          homeStore = stores[0];
        }

        const angle = Math.random() * Math.PI * 2;
        const dist = 60 + Math.random() * 80;

        nodes.push({
          id: `cust_${grade}_${i}`,
          type: "customer",
          grade,
          x: (homeStore.x || centerX) + Math.cos(angle) * dist,
          y: (homeStore.y || centerY) + Math.sin(angle) * dist,
          homeStore,
          targetStore: homeStore,
          isMoving: Math.random() < 0.2,
          progress: Math.random(),
          visitFrequency: cohort.firstMonth.visits,
        });
      }
    });

    // 평일/주말에 따른 이동 빈도 조정
    const movementMultiplier = timeMode === "weekday"
      ? cohort.timePattern.weekdayRatio / 50
      : cohort.timePattern.weekendRatio / 50;

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.016;

      const customers = nodes.filter(n => n.type === "customer");

      // 고객 이동 애니메이션 업데이트
      customers.forEach((cust) => {
        if (cust.isMoving && cust.targetStore) {
          cust.progress = ((cust.progress || 0) + 0.005 * movementMultiplier) % 1;

          const progress = cust.progress;
          const toStore = progress < 0.5;
          const t = toStore ? progress * 2 : (1 - progress) * 2;

          const startX = (cust.homeStore?.x || centerX) + Math.sin(parseFloat(cust.id.slice(-3)) * 123) * 70;
          const startY = (cust.homeStore?.y || centerY) + Math.cos(parseFloat(cust.id.slice(-3)) * 456) * 70;

          cust.x = startX + ((cust.targetStore.x || centerX) - startX) * t * 0.8;
          cust.y = startY + ((cust.targetStore.y || centerY) - startY) * t * 0.8;
        }

        // 랜덤 이동 상태 변경
        if (Math.random() < 0.003 * movementMultiplier) {
          cust.isMoving = !cust.isMoving;
          if (cust.isMoving && stores.length > 1) {
            // 다른 매장으로 이동
            const otherStores = stores.filter(s => s !== cust.homeStore);
            if (otherStores.length > 0) {
              cust.targetStore = otherStores[Math.floor(Math.random() * otherStores.length)];
            }
            cust.progress = 0;
          } else {
            cust.targetStore = cust.homeStore;
          }
        }
      });

      // 연결선 (이동 중인 고객)
      customers.filter(c => c.isMoving).forEach((cust) => {
        if (!cust.targetStore || cust.x === undefined || cust.y === undefined) return;

        ctx.beginPath();
        ctx.moveTo(cust.x, cust.y);
        ctx.lineTo(cust.targetStore.x!, cust.targetStore.y!);
        ctx.strokeStyle = GRADE_COLORS[cust.grade!] + "40";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // 고객 점
      customers.forEach((node, i) => {
        if (node.x === undefined || node.y === undefined) return;

        let drawX = node.x;
        let drawY = node.y;

        if (!node.isMoving) {
          drawX += Math.sin(time * 1.2 + i * 0.3) * 2;
          drawY += Math.cos(time * 1.5 + i * 0.4) * 2;
        }

        const radius = node.isMoving ? 5 : 4;

        // 글로우 효과
        if (node.isMoving) {
          ctx.shadowColor = GRADE_COLORS[node.grade!];
          ctx.shadowBlur = 10;
        }

        ctx.beginPath();
        ctx.arc(drawX, drawY, radius, 0, Math.PI * 2);
        ctx.fillStyle = GRADE_COLORS[node.grade!];
        ctx.fill();

        ctx.shadowBlur = 0;
      });

      // 매장 (둥근 사각형)
      stores.forEach((store) => {
        if (store.x === undefined || store.y === undefined) return;
        const config = STORE_CONFIG[store.storeSize!];
        const w = config.width;
        const h = config.height;
        const r = 8;

        // 글로우
        ctx.shadowColor = config.color;
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.roundRect(store.x - w / 2, store.y - h / 2, w, h, r);
        ctx.fillStyle = config.color;
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // 라벨
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(config.label, store.x, store.y - 8);

        // 방문 비율
        const ratio = cohort.storePattern[store.storeSize!].ratio;
        ctx.font = "12px system-ui";
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillText(`${ratio}%`, store.x, store.y + 10);
      });

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [cohort, timeMode]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}

// 하이라이트 부문 카드 (FLORAL, KIOSK-GAS)
function HighlightCard({
  icon: Icon,
  title,
  value,
  comparison,
  color,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  comparison: string;
  color: string;
}) {
  return (
    <motion.div
      className="bg-black/50 backdrop-blur-sm rounded-xl p-3 border"
      style={{ borderColor: color + "50" }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-sm font-semibold text-white">{title}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs text-white/60">{comparison}</div>
    </motion.div>
  );
}

// 리텐션 미니 차트
function RetentionMiniChart({ retention }: { retention: { period: string; rate: number }[] }) {
  return (
    <div className="flex items-end gap-1 h-12">
      {retention.map((r, i) => (
        <div
          key={i}
          className="flex-1 rounded-t"
          style={{
            height: `${r.rate}%`,
            backgroundColor: r.rate === 100 ? "#22c55e" : r.rate >= 80 ? "#84cc16" : r.rate >= 70 ? "#eab308" : "#f97316",
          }}
          title={`${r.period}: ${r.rate}%`}
        />
      ))}
    </div>
  );
}

// 쇼핑 스타일 태그
function ShoppingStyleTag({ style }: { style: CohortDetailData["shoppingStyle"] }) {
  const styleColors: Record<string, string> = {
    "탐색형": "#fbbf24",
    "안정형": "#22c55e",
    "루틴형": "#3b82f6",
    "필수품형": "#6b7280",
  };

  return (
    <div className="space-y-2">
      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
        style={{ backgroundColor: styleColors[style.type] + "30" }}
      >
        <ShoppingCart className="w-4 h-4" style={{ color: styleColors[style.type] }} />
        <span className="font-semibold" style={{ color: styleColors[style.type] }}>{style.type}</span>
      </div>
      <p className="text-xs text-white/60">{style.description}</p>
      <div className="flex flex-wrap gap-1 mt-2">
        {style.characteristics.map((char, i) => (
          <span key={i} className="text-[10px] px-2 py-1 bg-white/5 rounded-full text-white/70">
            {char}
          </span>
        ))}
      </div>
    </div>
  );
}

// 메인 컴포넌트
export function CohortDetailNetwork({
  cohortId,
  onClose,
}: {
  cohortId: string;
  onClose: () => void;
}) {
  const [timeMode, setTimeMode] = useState<"weekday" | "weekend">("weekday");

  const cohort = useMemo(() => {
    return COHORT_DETAIL_DATA.find(c => c.id === cohortId);
  }, [cohortId]);

  if (!cohort) return null;

  // FLORAL, KIOSK-GAS 하이라이트 찾기
  const floralData = cohort.departmentSales.find(d => d.name === "FLORAL");
  const kioskData = cohort.departmentSales.find(d => d.name === "KIOSK-GAS");

  return (
    <motion.div
      className="w-full h-full flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: cohort.color }}
          />
          <div>
            <h2 className="text-xl font-bold text-white">{cohort.name}</h2>
            <p className="text-sm text-white/50">
              {cohort.code} | {cohort.description} | {cohort.customerCount}명 ({cohort.customerRatio}%)
            </p>
          </div>
        </div>

        {/* 평일/주말 토글 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTimeMode("weekday")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              timeMode === "weekday"
                ? "bg-blue-500/30 text-blue-400 border border-blue-500/50"
                : "bg-white/5 text-white/50 hover:bg-white/10"
            }`}
          >
            <Sun className="w-4 h-4" />
            <span className="text-sm font-medium">평일</span>
            <span className="text-xs opacity-70">{cohort.timePattern.weekdayRatio}%</span>
          </button>
          <button
            onClick={() => setTimeMode("weekend")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              timeMode === "weekend"
                ? "bg-purple-500/30 text-purple-400 border border-purple-500/50"
                : "bg-white/5 text-white/50 hover:bg-white/10"
            }`}
          >
            <Moon className="w-4 h-4" />
            <span className="text-sm font-medium">주말</span>
            <span className="text-xs opacity-70">{cohort.timePattern.weekendRatio}%</span>
          </button>

          <button
            onClick={onClose}
            className="ml-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* 왼쪽: 네트워크 시각화 */}
        <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/10 bg-black/30">
          <CohortNetworkCanvas cohort={cohort} timeMode={timeMode} />

          {/* 피크 시간 오버레이 */}
          <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
            <div className="flex items-center gap-2 text-white/80">
              <Clock className="w-4 h-4" />
              <span className="text-sm">피크: {cohort.timePattern.peakHours.join("-")}시</span>
              {cohort.timePattern.peakDay && (
                <span className="text-xs text-white/50">({cohort.timePattern.peakDay})</span>
              )}
            </div>
          </div>

          {/* FLORAL / KIOSK-GAS 하이라이트 */}
          {(floralData?.highlight || kioskData?.highlight) && (
            <div className="absolute bottom-4 left-4 right-4 flex gap-3">
              {floralData?.highlight && (
                <HighlightCard
                  icon={Flower2}
                  title="FLORAL"
                  value={`${floralData.percentage}%`}
                  comparison={floralData.comparison || ""}
                  color="#ec4899"
                />
              )}
              {kioskData?.highlight && (
                <HighlightCard
                  icon={Fuel}
                  title="KIOSK-GAS"
                  value={`${kioskData.percentage}%`}
                  comparison={kioskData.comparison || ""}
                  color="#f97316"
                />
              )}
            </div>
          )}

          {/* 범례 */}
          <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 border border-white/10">
            <div className="text-[10px] text-white/50 mb-2">등급</div>
            <div className="flex flex-col gap-1">
              {Object.entries(GRADE_LABELS).map(([grade, label]) => (
                <div key={grade} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: GRADE_COLORS[grade] }}
                  />
                  <span className="text-xs text-white/70">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 오른쪽: 상세 정보 패널 */}
        <div className="w-80 flex flex-col gap-3 overflow-y-auto">
          {/* 핵심 인사이트 */}
          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl p-4 border border-yellow-500/20">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-yellow-400" />
              <h3 className="text-sm font-semibold text-yellow-400">핵심 인사이트</h3>
            </div>
            <ul className="space-y-1.5">
              {cohort.keyInsights.map((insight, i) => (
                <li key={i} className="text-xs text-white/80 flex items-start gap-2">
                  <span className="text-yellow-400">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 등급 전환율 */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-white/60" />
              <h3 className="text-sm font-semibold text-white/80">최종 등급 전환</h3>
            </div>
            <div className="space-y-2">
              {Object.entries(cohort.gradeConversion).map(([grade, pct]) => (
                <div key={grade} className="flex items-center gap-2">
                  <span className="w-8 text-xs text-white/60">{GRADE_LABELS[grade]}</span>
                  <div className="flex-1 h-4 bg-white/5 rounded overflow-hidden">
                    <motion.div
                      className="h-full rounded"
                      style={{ backgroundColor: GRADE_COLORS[grade] }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(pct, 100)}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span
                    className="w-12 text-right text-xs font-semibold"
                    style={{ color: GRADE_COLORS[grade] }}
                  >
                    {pct.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 리텐션 */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold text-white/80 mb-3">18개월 리텐션</h3>
            <RetentionMiniChart retention={cohort.retention} />
            <div className="flex justify-between text-[10px] text-white/40 mt-1">
              <span>시작</span>
              <span>+6개월</span>
              <span>+18개월</span>
            </div>
            <div className="mt-2 text-center">
              <span className="text-2xl font-bold" style={{ color: cohort.retention[cohort.retention.length-1].rate === 100 ? "#22c55e" : "#eab308" }}>
                {cohort.retention[cohort.retention.length-1].rate}%
              </span>
              <span className="text-xs text-white/40 ml-1">최종 리텐션</span>
            </div>
          </div>

          {/* 쇼핑 스타일 */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold text-white/80 mb-3">쇼핑 스타일</h3>
            <ShoppingStyleTag style={cohort.shoppingStyle} />
          </div>

          {/* 첫 1개월 행동 */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold text-white/80 mb-3">첫 1개월 행동</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-white/40">방문</div>
                <div className="text-lg font-bold text-white">{cohort.firstMonth.visits}회</div>
              </div>
              <div>
                <div className="text-[10px] text-white/40">매출</div>
                <div className="text-lg font-bold text-white">${cohort.firstMonth.sales}</div>
              </div>
              <div>
                <div className="text-[10px] text-white/40">장바구니</div>
                <div className="text-lg font-bold text-white">{cohort.firstMonth.basketSize}개</div>
              </div>
              <div>
                <div className="text-[10px] text-white/40">객단가</div>
                <div className="text-lg font-bold text-white">${cohort.firstMonth.basketValue}</div>
              </div>
            </div>
          </div>

          {/* 부문별 매출 비중 */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold text-white/80 mb-3">부문별 매출 비중</h3>
            <div className="space-y-2">
              {cohort.departmentSales.slice(0, 6).map((dept) => (
                <div key={dept.name} className="flex items-center gap-2">
                  <span className={`w-20 text-xs truncate ${dept.highlight ? "text-yellow-400 font-semibold" : "text-white/60"}`}>
                    {dept.name}
                  </span>
                  <div className="flex-1 h-3 bg-white/5 rounded overflow-hidden">
                    <motion.div
                      className={`h-full rounded ${dept.highlight ? "bg-yellow-400" : "bg-blue-500/60"}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(dept.percentage * 1.5, 100)}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className={`w-12 text-right text-xs ${dept.highlight ? "text-yellow-400 font-bold" : "text-white/50"}`}>
                    {dept.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 품목별 구매율 */}
          {cohort.itemPurchaseRates.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-semibold text-white/80 mb-3">주요 품목 구매율</h3>
              <div className="space-y-2">
                {cohort.itemPurchaseRates.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="text-xs text-white/70 truncate flex-1">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{item.rate}%</span>
                      {item.difference && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          item.difference.startsWith("+")
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}>
                          {item.difference}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 통계적 유의성 */}
          {cohort.statisticalNote && (
            <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
              <div className="text-xs text-blue-400 font-mono">
                {cohort.statisticalNote}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
