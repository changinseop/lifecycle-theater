"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  VISIT_CLUSTERS,
  VisitCluster,
  COHORT_ANALYSIS_SUMMARY,
} from "@/lib/data/cluster-data";
import { CustomerGrade, GRADE_CONFIG } from "@/lib/data/store-experience";

// ==========================================
// Grade color map
// ==========================================
const GRADE_COLORS: Record<CustomerGrade, string> = {
  vip: "#fbbf24",
  loyal: "#22c55e",
  active: "#3b82f6",
  risk: "#f97316",
  churn: "#6b7280",
};

// ==========================================
// Store type data
// ==========================================
const STORE_TYPES = [
  {
    id: "large",
    label: "대형 매장",
    icon: "🏬",
    count: 95,
    percentage: 16.3,
    color: "#3b82f6",
    criteria: "100명+ 고객",
  },
  {
    id: "medium",
    label: "중형 매장",
    icon: "🏪",
    count: 16,
    percentage: 2.7,
    color: "#8b5cf6",
    criteria: "30~99명 고객",
  },
  {
    id: "small",
    label: "소형 매장",
    icon: "📍",
    count: 487,
    percentage: 83.7,
    color: "#6b7280",
    criteria: "30명 미만",
  },
];

// ==========================================
// Cluster type badge config
// ==========================================
function getClusterBadge(cluster: VisitCluster): {
  label: string;
  color: string;
} {
  if (cluster.id === "explorer")
    return { label: "다매장", color: "#fbbf24" };
  if (cluster.id === "large_focused")
    return { label: "대형 중심", color: "#22c55e" };
  if (cluster.id === "large_medium")
    return { label: "대형+중형", color: "#3b82f6" };
  if (cluster.id === "medium_focused")
    return { label: "중형 중심", color: "#8b5cf6" };
  if (cluster.id === "medium_small")
    return { label: "중소 혼합", color: "#f97316" };
  if (cluster.id === "small_only")
    return { label: "소형 전용", color: "#6b7280" };
  return { label: "기타", color: "#6b7280" };
}

// ==========================================
// Horizontal store pattern bar
// ==========================================
function StorePatternBar({
  pattern,
}: {
  pattern: { large: number; medium: number; small: number };
}) {
  const total = pattern.large + pattern.medium + pattern.small;
  if (total === 0) return null;

  const largePct = (pattern.large / total) * 100;
  const mediumPct = (pattern.medium / total) * 100;
  const smallPct = (pattern.small / total) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/40">매장 방문 비율</span>
      </div>
      <div className="h-3 bg-white/5 rounded-full overflow-hidden flex">
        {largePct > 0 && (
          <motion.div
            className="h-full"
            style={{ backgroundColor: "#3b82f6" }}
            initial={{ width: 0 }}
            animate={{ width: `${largePct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        )}
        {mediumPct > 0 && (
          <motion.div
            className="h-full"
            style={{ backgroundColor: "#8b5cf6" }}
            initial={{ width: 0 }}
            animate={{ width: `${mediumPct}%` }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          />
        )}
        {smallPct > 0 && (
          <motion.div
            className="h-full"
            style={{ backgroundColor: "#6b7280" }}
            initial={{ width: 0 }}
            animate={{ width: `${smallPct}%` }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          />
        )}
      </div>
      <div className="flex gap-3 text-[9px] text-white/40">
        {largePct > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>대형 {largePct.toFixed(0)}%</span>
          </div>
        )}
        {mediumPct > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
            <span>중형 {mediumPct.toFixed(0)}%</span>
          </div>
        )}
        {smallPct > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            <span>소형 {smallPct.toFixed(0)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// Grade distribution mini bar
// ==========================================
function GradeDistributionBar({
  distribution,
  customerCount,
}: {
  distribution: Record<CustomerGrade, number>;
  customerCount: number;
}) {
  const grades: CustomerGrade[] = ["vip", "loyal", "active", "risk", "churn"];

  return (
    <div className="space-y-1">
      {grades.map((grade) => {
        const count = distribution[grade];
        if (count === 0) return null;
        const pct = (count / customerCount) * 100;
        return (
          <div key={grade} className="flex items-center gap-2">
            <span className="w-4 text-center text-xs">
              {GRADE_CONFIG[grade].emoji}
            </span>
            <span className="text-[10px] text-white/50 w-6">
              {GRADE_CONFIG[grade].label}
            </span>
            <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: GRADE_COLORS[grade] }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-[10px] text-white/40 w-10 text-right">
              {count}명
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// Expandable Cluster Card
// ==========================================
function ClusterCard({
  cluster,
  index,
}: {
  cluster: VisitCluster;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const badge = getClusterBadge(cluster);
  const totalCustomers = 2500;
  const percentage = ((cluster.customerCount / totalCustomers) * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 + index * 0.08, duration: 0.4 }}
      className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
    >
      {/* Card header - tap target */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left min-h-[44px] active:bg-white/5 transition-colors"
      >
        {/* Top row: name + badge + count */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{cluster.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">
                  {cluster.name}
                </span>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: `${badge.color}20`,
                    color: badge.color,
                  }}
                >
                  {badge.label}
                </span>
              </div>
              <div className="text-[10px] text-white/40 mt-0.5">
                {cluster.description}
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-lg font-bold text-white">
              {cluster.customerCount}
              <span className="text-xs font-normal text-white/40 ml-0.5">
                명
              </span>
            </div>
            <div className="text-[10px] text-white/40">{percentage}%</div>
          </div>
        </div>

        {/* Key metrics row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-white/[0.03] rounded-lg px-2.5 py-2 text-center">
            <div
              className="text-sm font-bold"
              style={{ color: cluster.vipRate > 2 ? "#fbbf24" : "#fbbf24aa" }}
            >
              {cluster.vipRate}%
            </div>
            <div className="text-[9px] text-white/30">VIP율</div>
          </div>
          <div className="bg-white/[0.03] rounded-lg px-2.5 py-2 text-center">
            <div
              className="text-sm font-bold"
              style={{
                color: cluster.churnRate > 30 ? "#ef4444" : "#f97316",
              }}
            >
              {cluster.churnRate}%
            </div>
            <div className="text-[9px] text-white/30">이탈율</div>
          </div>
          <div className="bg-white/[0.03] rounded-lg px-2.5 py-2 text-center">
            <div className="text-sm font-bold text-white">
              ${cluster.avgLtv.toLocaleString()}
            </div>
            <div className="text-[9px] text-white/30">LTV</div>
          </div>
        </div>

        {/* Store pattern bar */}
        <StorePatternBar pattern={cluster.storePattern} />

        {/* Expand indicator */}
        <div className="flex items-center justify-center mt-3">
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-white/30 text-xs"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </motion.div>
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
              {/* Grade distribution */}
              <div>
                <h4 className="text-[11px] text-white/50 uppercase tracking-wider mb-2">
                  등급 분포
                </h4>
                <GradeDistributionBar
                  distribution={cluster.gradeDistribution}
                  customerCount={cluster.customerCount}
                />
              </div>

              {/* Visit pattern details */}
              <div>
                <h4 className="text-[11px] text-white/50 uppercase tracking-wider mb-2">
                  방문 패턴
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/[0.03] rounded-lg p-2.5">
                    <div className="text-xs text-white/70">
                      {cluster.avgVisitFrequency}회
                    </div>
                    <div className="text-[9px] text-white/30">월평균 방문</div>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg p-2.5">
                    <div className="text-xs text-white/70">
                      ${cluster.avgBasket}
                    </div>
                    <div className="text-[9px] text-white/30">평균 객단가</div>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg p-2.5">
                    <div className="text-xs text-white/70">
                      {cluster.weekdayRatio}%
                    </div>
                    <div className="text-[9px] text-white/30">평일 비중</div>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg p-2.5">
                    <div className="text-xs text-white/70">
                      {cluster.peakHours[0]}시
                    </div>
                    <div className="text-[9px] text-white/30">피크 시간</div>
                  </div>
                </div>
              </div>

              {/* Top categories */}
              <div>
                <h4 className="text-[11px] text-white/50 uppercase tracking-wider mb-2">
                  주요 카테고리
                </h4>
                <div className="space-y-1.5">
                  {cluster.topCategories.map((cat, i) => (
                    <div key={cat.name} className="flex items-center gap-2">
                      <span className="text-[11px] text-white/60 flex-1 truncate">
                        {cat.name}
                      </span>
                      <div className="w-20 h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: badge.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${cat.percentage}%` }}
                          transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
                        />
                      </div>
                      <span className="text-[10px] text-white/40 w-8 text-right">
                        {cat.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cohort analysis */}
              <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
                <h4 className="text-[11px] text-white/50 uppercase tracking-wider mb-2">
                  코호트 분석 (첫 1개월)
                </h4>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <div className="text-[10px] text-white/40">대상 인원</div>
                    <div className="text-xs text-white/70 font-medium">
                      {cluster.cohortAnalysis.firstMonthCount}명
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40">VIP 전환율</div>
                    <div
                      className="text-xs font-bold"
                      style={{
                        color:
                          cluster.cohortAnalysis.vipConversionRate > 5
                            ? "#fbbf24"
                            : "#fbbf24aa",
                      }}
                    >
                      {cluster.cohortAnalysis.vipConversionRate}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40">이탈율</div>
                    <div
                      className="text-xs font-medium"
                      style={{
                        color:
                          cluster.cohortAnalysis.churnRate > 25
                            ? "#ef4444"
                            : "#f97316",
                      }}
                    >
                      {cluster.cohortAnalysis.churnRate}%
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-white/40 leading-relaxed">
                  {cluster.cohortAnalysis.predictivePower}
                </p>
              </div>

              {/* Purchase insight */}
              <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                <p className="text-[11px] text-white/50 leading-relaxed">
                  {cluster.purchaseInsight}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ==========================================
// Store data for Canvas visualizations
// ==========================================
const NETWORK_STORE_DATA = {
  totalStores: 569,
  totalCustomers: 2500,
  storeTypes: {
    large: { count: 61, color: "#3b82f6", label: "대형" },
    medium: { count: 49, color: "#8b5cf6", label: "중형" },
    small: { count: 472, color: "#6b7280", label: "소형" },
  },
  gradePreference: {
    VIP: { large: 64.9, medium: 34.9, small: 0.2 },
    충성: { large: 62.7, medium: 35.0, small: 2.3 },
    활성: { large: 60.1, medium: 37.6, small: 2.2 },
    위험: { large: 60.0, medium: 36.1, small: 3.9 },
    이탈: { large: 55.6, medium: 40.1, small: 4.3 },
  },
};

const NET_GRADE_COLORS: Record<string, string> = {
  VIP: "#fbbf24",
  충성: "#22c55e",
  활성: "#3b82f6",
  위험: "#f97316",
  이탈: "#6b7280",
};

// ==========================================
// Mobile Network Map (Arc-based, scaled)
// ==========================================
function NetworkMapMobile() {
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
    const scale = width / 600; // 데스크탑 기준 600px 대비 스케일

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
      const angle = Math.PI + (i / 60) * Math.PI;
      const radius = 160 * scale;
      stores.push({
        id: i,
        type: "large",
        x: centerX + Math.cos(angle) * radius,
        y: 70 * scale + 30 + Math.sin(angle) * 50 * scale,
      });
    }

    // 중형 매장 (49개) - 중간 아크
    for (let i = 0; i < 49; i++) {
      const angle = Math.PI + (i / 48) * Math.PI;
      const radius = 200 * scale;
      stores.push({
        id: 61 + i,
        type: "medium",
        x: centerX + Math.cos(angle) * radius,
        y: height * 0.42 + Math.sin(angle) * 35 * scale,
      });
    }

    // 소형 매장 (472개) - 하단 그리드
    const gridCols = Math.floor(width / 14);
    const gridStartX = centerX - (gridCols * 10) / 2;
    const gridStartY = height * 0.65;
    for (let i = 0; i < 472; i++) {
      const col = i % gridCols;
      const row = Math.floor(i / gridCols);
      stores.push({
        id: 110 + i,
        type: "small",
        x: gridStartX + col * 10 + Math.random() * 3,
        y: gridStartY + row * 8 + Math.random() * 2,
      });
    }

    // 고객 배치 (모바일: 600명으로 경량화)
    const gradeDistribution = { VIP: 17, 충성: 94, 활성: 238, 위험: 123, 이탈: 128 };
    Object.entries(gradeDistribution).forEach(([grade, count]) => {
      const pref = NETWORK_STORE_DATA.gradePreference[grade as keyof typeof NETWORK_STORE_DATA.gradePreference];
      for (let i = 0; i < count; i++) {
        const rand = Math.random() * 100;
        let storeType: "large" | "medium" | "small";
        if (rand < pref.large) storeType = "large";
        else if (rand < pref.large + pref.medium) storeType = "medium";
        else storeType = "small";

        const typeStores = stores.filter((s) => s.type === storeType);
        const homeStore = typeStores[Math.floor(Math.random() * typeStores.length)];
        const angle = Math.random() * Math.PI * 2;

        customers.push({
          x: homeStore.x + Math.cos(angle) * 4,
          y: homeStore.y + Math.sin(angle) * 4,
          grade,
          homeStore: homeStore.id,
          orbitAngle: angle,
          orbitSpeed: 0.01 + Math.random() * 0.02,
          isTransitioning: false,
          targetStore: homeStore.id,
          transitionProgress: 0,
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
      ctx.setLineDash([4, 4]);
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
      ctx.font = "9px system-ui";
      ctx.textAlign = "left";
      ctx.fillText("대형 (61개)", 8, 18);
      ctx.fillText("중형 (49개)", 8, height * 0.38);
      ctx.fillText("소형 (472개)", 8, height * 0.62);

      // 고객 업데이트 및 렌더링
      customers.forEach((cust, i) => {
        const home = stores.find((s) => s.id === cust.homeStore)!;

        if (cust.isTransitioning) {
          cust.transitionProgress += 0.02;
          const target = stores.find((s) => s.id === cust.targetStore)!;
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
          const orbitRadius = 4 + (i % 3) * 1.5;
          cust.x = home.x + Math.cos(cust.orbitAngle) * orbitRadius;
          cust.y = home.y + Math.sin(cust.orbitAngle) * orbitRadius;

          if (Math.random() < 0.0003) {
            cust.isTransitioning = true;
            cust.transitionProgress = 0;
            const pref = NETWORK_STORE_DATA.gradePreference[cust.grade as keyof typeof NETWORK_STORE_DATA.gradePreference];
            const rand = Math.random() * 100;
            let targetType: "large" | "medium" | "small";
            if (rand < pref.large) targetType = "large";
            else if (rand < pref.large + pref.medium) targetType = "medium";
            else targetType = "small";
            const typeStores = stores.filter((s) => s.type === targetType);
            cust.targetStore = typeStores[Math.floor(Math.random() * typeStores.length)].id;
          }
        }

        ctx.beginPath();
        ctx.arc(cust.x, cust.y, cust.isTransitioning ? 1.5 : 1, 0, Math.PI * 2);
        ctx.fillStyle = NET_GRADE_COLORS[cust.grade] + "aa";
        ctx.fill();
      });

      // 매장 렌더링
      stores.forEach((store) => {
        const config = NETWORK_STORE_DATA.storeTypes[store.type];
        const pulse = 1 + Math.sin(time * 3 + store.id * 0.1) * 0.1;
        const baseRadius = store.type === "large" ? 4 : store.type === "medium" ? 3 : 1.5;
        const r = baseRadius * pulse;

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
      ctx.fillRect(width - 90, 6, 84, 78);
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.strokeRect(width - 90, 6, 84, 78);

      ctx.fillStyle = "#fff";
      ctx.font = "bold 9px system-ui";
      ctx.textAlign = "left";
      ctx.fillText("고객 등급", width - 82, 19);

      ctx.font = "8px system-ui";
      let ly = 32;
      Object.entries(NET_GRADE_COLORS).forEach(([grade, color]) => {
        ctx.beginPath();
        ctx.arc(width - 78, ly, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillText(grade, width - 70, ly + 3);
        ly += 11;
      });

      // 하단 통계
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "9px system-ui";
      ctx.fillText(`${NETWORK_STORE_DATA.totalStores}개 매장 · ${NETWORK_STORE_DATA.totalCustomers.toLocaleString()}명 고객`, centerX, height - 8);

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

// ==========================================
// Mobile Galaxy Map (Force-Directed, scaled)
// ==========================================
function GalaxyMapMobile() {
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
    const baseScale = Math.min(width, height) / 600;

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
    }
    interface CustomerNode {
      x: number;
      y: number;
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

    // 대형 매장 (61개) - 중심부
    for (let i = 0; i < 61; i++) {
      const angle = (i / 61) * Math.PI * 2 + Math.random() * 0.3;
      const radius = (60 + Math.random() * 80) * baseScale;
      stores.push({
        id: i,
        type: "large",
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: 0, vy: 0,
        targetX: centerX + Math.cos(angle) * radius,
        targetY: centerY + Math.sin(angle) * radius,
        radius: 6 * baseScale,
        mass: 10,
      });
    }

    // 중형 매장 (49개) - 중간 궤도
    for (let i = 0; i < 49; i++) {
      const angle = (i / 49) * Math.PI * 2 + Math.random() * 0.2;
      const radius = (160 + Math.random() * 60) * baseScale;
      stores.push({
        id: 61 + i,
        type: "medium",
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: 0, vy: 0,
        targetX: centerX + Math.cos(angle) * radius,
        targetY: centerY + Math.sin(angle) * radius,
        radius: 4 * baseScale,
        mass: 5,
      });
    }

    // 소형 매장 (472개) - 외곽
    for (let i = 0; i < 472; i++) {
      const angle = (i / 472) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
      const radius = (240 + Math.random() * 40) * baseScale;
      stores.push({
        id: 110 + i,
        type: "small",
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: 0, vy: 0,
        targetX: centerX + Math.cos(angle) * radius,
        targetY: centerY + Math.sin(angle) * radius,
        radius: 1.5 * baseScale,
        mass: 1,
      });
    }

    // 고객 배치 (모바일: 600명으로 경량화)
    const gradeDistribution = { VIP: 17, 충성: 94, 활성: 238, 위험: 123, 이탈: 128 };
    Object.entries(gradeDistribution).forEach(([grade, count]) => {
      const pref = NETWORK_STORE_DATA.gradePreference[grade as keyof typeof NETWORK_STORE_DATA.gradePreference];
      for (let i = 0; i < count; i++) {
        const rand = Math.random() * 100;
        let storeType: "large" | "medium" | "small";
        if (rand < pref.large) storeType = "large";
        else if (rand < pref.large + pref.medium) storeType = "medium";
        else storeType = "small";

        const typeStores = stores.filter((s) => s.type === storeType);
        const homeStore = typeStores[Math.floor(Math.random() * typeStores.length)];
        const angle = Math.random() * Math.PI * 2;
        const dist = (5 + Math.random() * 12) * baseScale;

        customers.push({
          x: homeStore.x + Math.cos(angle) * dist,
          y: homeStore.y + Math.sin(angle) * dist,
          grade,
          homeStore: homeStore.id,
          trail: [],
          orbitAngle: angle,
          orbitSpeed: 0.005 + Math.random() * 0.01,
          isTransitioning: false,
          targetStore: homeStore.id,
          transitionProgress: 0,
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

      const breathScale = 1 + Math.sin(breathPhase) * 0.03;

      // Force-Directed (간소화)
      stores.forEach((s1, i) => {
        stores.slice(i + 1).forEach((s2) => {
          const dx = s2.x - s1.x;
          const dy = s2.y - s1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const repulsion = s1.type === "large" ? 600 : s1.type === "medium" ? 300 : 30;
          const force = repulsion / (dist * dist);

          if (dist < 80 * baseScale) {
            s1.vx -= (dx / dist) * force * 0.08;
            s1.vy -= (dy / dist) * force * 0.08;
            s2.vx += (dx / dist) * force * 0.08;
            s2.vy += (dy / dist) * force * 0.08;
          }
        });

        s1.vx += (s1.targetX - s1.x) * 0.01;
        s1.vy += (s1.targetY - s1.y) * 0.01;
        s1.vx *= 0.95;
        s1.vy *= 0.95;
        s1.x += s1.vx;
        s1.y += s1.vy;

        const bx = (s1.x - centerX) * (breathScale - 1);
        const by = (s1.y - centerY) * (breathScale - 1);
        s1.x += bx * 0.1;
        s1.y += by * 0.1;
      });

      // 중력 웰 (대형 매장)
      stores.filter((s) => s.type === "large").forEach((store) => {
        const gradient = ctx.createRadialGradient(store.x, store.y, 0, store.x, store.y, 40 * baseScale);
        gradient.addColorStop(0, NETWORK_STORE_DATA.storeTypes.large.color + "25");
        gradient.addColorStop(0.5, NETWORK_STORE_DATA.storeTypes.large.color + "08");
        gradient.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(store.x, store.y, 40 * baseScale, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      // 고객 업데이트
      customers.forEach((cust, i) => {
        const home = stores.find((s) => s.id === cust.homeStore)!;

        cust.trail.unshift({ x: cust.x, y: cust.y, alpha: 1 });
        if (cust.trail.length > 8) cust.trail.pop();
        cust.trail.forEach((t) => (t.alpha *= 0.85));

        if (cust.isTransitioning) {
          cust.transitionProgress += 0.015;
          const target = stores.find((s) => s.id === cust.targetStore)!;
          const t = cust.transitionProgress;
          const midX = (home.x + target.x) / 2;
          const midY = (home.y + target.y) / 2 - 40 * baseScale;
          const o = 1 - t;
          cust.x = o * o * home.x + 2 * o * t * midX + t * t * target.x;
          cust.y = o * o * home.y + 2 * o * t * midY + t * t * target.y;

          if (cust.transitionProgress >= 1) {
            cust.isTransitioning = false;
            cust.homeStore = cust.targetStore;
            cust.transitionProgress = 0;
            cust.orbitAngle = Math.random() * Math.PI * 2;
          }
        } else {
          cust.orbitAngle += cust.orbitSpeed;
          const orbitRadius = (6 + (i % 5) * 2) * baseScale;
          cust.x = home.x + Math.cos(cust.orbitAngle) * orbitRadius;
          cust.y = home.y + Math.sin(cust.orbitAngle) * orbitRadius;

          if (Math.random() < 0.0005) {
            cust.isTransitioning = true;
            cust.transitionProgress = 0;
            const pref = NETWORK_STORE_DATA.gradePreference[cust.grade as keyof typeof NETWORK_STORE_DATA.gradePreference];
            const rand = Math.random() * 100;
            let targetType: "large" | "medium" | "small";
            if (rand < pref.large) targetType = "large";
            else if (rand < pref.large + pref.medium) targetType = "medium";
            else targetType = "small";
            const typeStores = stores.filter((s) => s.type === targetType);
            cust.targetStore = typeStores[Math.floor(Math.random() * typeStores.length)].id;
          }
        }

        // Trail (이동 중일 때)
        if (cust.isTransitioning && cust.trail.length > 2) {
          ctx.beginPath();
          ctx.moveTo(cust.trail[0].x, cust.trail[0].y);
          cust.trail.forEach((t, idx) => {
            if (idx > 0) ctx.lineTo(t.x, t.y);
          });
          ctx.strokeStyle = NET_GRADE_COLORS[cust.grade] + "60";
          ctx.lineWidth = cust.grade === "VIP" ? 1.5 : 0.8;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(cust.x, cust.y, cust.isTransitioning ? 2 : 1.2, 0, Math.PI * 2);
        ctx.fillStyle = NET_GRADE_COLORS[cust.grade] + (cust.isTransitioning ? "ff" : "aa");
        ctx.fill();

        if (cust.grade === "VIP") {
          ctx.beginPath();
          ctx.arc(cust.x, cust.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = NET_GRADE_COLORS[cust.grade] + "20";
          ctx.fill();
        }
      });

      // 매장 렌더링
      stores.forEach((store) => {
        const config = NETWORK_STORE_DATA.storeTypes[store.type];
        const pulse = 1 + Math.sin(time * 3 + store.id * 0.1) * 0.15;
        const r = store.radius * pulse;

        if (store.type === "large") {
          const glow = ctx.createRadialGradient(store.x, store.y, 0, store.x, store.y, r * 2.5);
          glow.addColorStop(0, config.color + "70");
          glow.addColorStop(0.5, config.color + "25");
          glow.addColorStop(1, "transparent");
          ctx.beginPath();
          ctx.arc(store.x, store.y, r * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(store.x, store.y, r, 0, Math.PI * 2);
        ctx.fillStyle = config.color;
        ctx.fill();

        if (store.type === "large") {
          ctx.strokeStyle = "rgba(255,255,255,0.4)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      // 궤도 링
      ctx.setLineDash([2, 4]);
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      [120, 190, 260].forEach((r) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r * baseScale, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // 범례 (좌상단)
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(6, 6, 105, 78);
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.strokeRect(6, 6, 105, 78);

      ctx.fillStyle = "#fff";
      ctx.font = "bold 9px system-ui";
      ctx.textAlign = "left";
      ctx.fillText("Galaxy Map", 14, 20);

      ctx.font = "8px system-ui";
      let ly = 34;
      (["large", "medium", "small"] as const).forEach((t) => {
        const d = NETWORK_STORE_DATA.storeTypes[t];
        ctx.beginPath();
        ctx.arc(18, ly, 3, 0, Math.PI * 2);
        ctx.fillStyle = d.color;
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillText(`${d.label} (${d.count}개)`, 26, ly + 3);
        ly += 13;
      });

      // 고객 범례 (우상단)
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(width - 82, 6, 76, 78);
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.strokeRect(width - 82, 6, 76, 78);

      ctx.fillStyle = "#fff";
      ctx.font = "bold 8px system-ui";
      ctx.textAlign = "left";
      ctx.fillText("고객 2,500명", width - 76, 19);

      ctx.font = "8px system-ui";
      ly = 32;
      Object.entries(NET_GRADE_COLORS).forEach(([grade, color]) => {
        ctx.beginPath();
        ctx.arc(width - 70, ly, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillText(grade, width - 62, ly + 3);
        ly += 11;
      });

      // 하단 통계
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "9px system-ui";
      ctx.fillText("19.3% 매장 → 97.6% 거래", centerX, height - 8);

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

// ==========================================
// View mode tabs for Store Mobile
// ==========================================
const VIEW_MODES = [
  { id: "dashboard" as const, label: "대시보드", icon: "📊" },
  { id: "network" as const, label: "네트워크", icon: "🔗" },
  { id: "galaxy" as const, label: "Galaxy", icon: "🌌" },
];

// ==========================================
// Main Component
// ==========================================
export function StoreMobile() {
  const [viewMode, setViewMode] = useState<"dashboard" | "network" | "galaxy">("dashboard");

  return (
    <div className="w-full min-h-full pb-20">
      {/* ─────────── Header ─────────── */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative px-5 pt-10 pb-4 overflow-hidden"
      >
        {/* Gradient background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(139,92,246,0.08) 0%, rgba(0,0,0,0) 100%)",
          }}
        />

        <div className="relative">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-xs text-white/40 tracking-widest uppercase mb-2"
          >
            Store Experience Analysis
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-2xl font-bold text-white leading-tight mb-1"
          >
            매장 경험 분석
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-sm text-white/50"
          >
            569개 매장 · 2,500명 고객
          </motion.p>
        </div>
      </motion.section>

      {/* ─────────── View Mode Tabs ─────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="px-5 mb-4"
      >
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                viewMode === mode.id
                  ? "bg-white/15 text-white border border-white/20 shadow-lg"
                  : "text-white/40 active:text-white/70"
              }`}
            >
              <span>{mode.icon}</span>
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* ─────────── Network Map View ─────────── */}
      {viewMode === "network" && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="px-4 mb-6"
        >
          <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 overflow-hidden" style={{ height: "60vh", minHeight: 360 }}>
            <NetworkMapMobile />
          </div>
          <p className="text-[10px] text-white/30 text-center mt-2">
            대형·중형·소형 매장 간 고객 이동 패턴 (Arc 기반 배치)
          </p>
        </motion.section>
      )}

      {/* ─────────── Galaxy Map View ─────────── */}
      {viewMode === "galaxy" && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="px-4 mb-6"
        >
          <div className="rounded-xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-white/10 overflow-hidden" style={{ height: "60vh", minHeight: 360 }}>
            <GalaxyMapMobile />
          </div>
          <p className="text-[10px] text-white/30 text-center mt-2">
            대형(중심)→중형(궤도)→소형(외곽) · Force-Directed 배치
          </p>
        </motion.section>
      )}

      {/* ─────────── Dashboard View (기존 콘텐츠) ─────────── */}
      {viewMode === "dashboard" && (
      <>

      {/* ─────────── Store Overview Cards (horizontal scroll) ─────────── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="px-5 mb-6"
      >
        <h2 className="text-sm font-semibold text-white mb-3">매장 유형</h2>

        <div className="flex gap-3 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-hide">
          {STORE_TYPES.map((store, i) => (
            <motion.div
              key={store.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
              className="flex-shrink-0 w-[140px] bg-white/5 rounded-xl border border-white/10 p-4 text-center"
            >
              <div className="text-2xl mb-2">{store.icon}</div>
              <div className="text-sm font-semibold text-white mb-0.5">
                {store.count}
                <span className="text-xs font-normal text-white/40 ml-0.5">
                  개
                </span>
              </div>
              <div className="text-[10px] text-white/40 mb-2">
                {store.label}
              </div>
              <div
                className="text-xs font-bold px-2 py-0.5 rounded-full inline-block"
                style={{
                  backgroundColor: `${store.color}20`,
                  color: store.color,
                }}
              >
                {store.percentage}%
              </div>
              <div className="text-[9px] text-white/30 mt-1.5">
                {store.criteria}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ─────────── Cluster Cards (vertical list) ─────────── */}
      <section className="px-5 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          className="flex items-center justify-between mb-3"
        >
          <h2 className="text-sm font-semibold text-white">
            방문 패턴 클러스터
          </h2>
          <span className="text-[10px] text-white/30">6개 클러스터</span>
        </motion.div>

        <div className="space-y-3">
          {VISIT_CLUSTERS.map((cluster, idx) => (
            <ClusterCard key={cluster.id} cluster={cluster} index={idx} />
          ))}
        </div>
      </section>

      {/* ─────────── Key Insight Card ─────────── */}
      <section className="px-5 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 rounded-xl border border-yellow-500/20 p-5"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-yellow-400 mb-1">
                핵심 발견
              </h3>
              <p className="text-[12px] text-white/70 leading-relaxed">
                다매장 방문자의 VIP 전환율이 단일매장 대비{" "}
                <span className="text-yellow-400 font-bold">5배</span> 높음
              </p>
            </div>
          </div>

          {/* Statistical validation summary */}
          <div className="space-y-2">
            <div className="bg-black/20 rounded-lg p-3">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xs font-bold text-white">
                  Chi2 = {COHORT_ANALYSIS_SUMMARY.statisticalSignificance.chi2}
                </span>
                <span className="text-[10px] text-emerald-400">
                  p {"<"} {COHORT_ANALYSIS_SUMMARY.statisticalSignificance.pValue}
                </span>
              </div>
              <p className="text-[10px] text-white/40">
                {COHORT_ANALYSIS_SUMMARY.statisticalSignificance.conclusion}
              </p>
            </div>

            {/* Action plan */}
            <div className="space-y-1.5">
              {COHORT_ANALYSIS_SUMMARY.actionPlan.map((action, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-[11px] text-white/50"
                >
                  <span className="text-yellow-500/60 mt-0.5 flex-shrink-0">
                    {i + 1}.
                  </span>
                  <span className="leading-relaxed">{action}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─────────── Cohort Insights Summary ─────────── */}
      <section className="px-5 mb-8">
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.4 }}
          className="text-sm font-semibold text-white mb-3"
        >
          첫 1개월 패턴별 결과
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.4 }}
          className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3"
        >
          {COHORT_ANALYSIS_SUMMARY.keyInsights.map((insight, i) => (
            <div
              key={insight.pattern}
              className="flex items-center gap-3 py-1.5"
              style={{
                borderBottom:
                  i < COHORT_ANALYSIS_SUMMARY.keyInsights.length - 1
                    ? "1px solid rgba(255,255,255,0.05)"
                    : "none",
              }}
            >
              <div className="flex-shrink-0 w-16">
                <div className="text-[10px] text-white/50 font-mono">
                  {insight.pattern.split(" ")[1] || insight.pattern}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="text-xs font-bold"
                    style={{
                      color:
                        insight.vipRate > 5
                          ? "#fbbf24"
                          : insight.vipRate > 0
                            ? "#fbbf24aa"
                            : "#6b7280",
                    }}
                  >
                    VIP {insight.vipRate}%
                  </span>
                  <span
                    className="text-xs font-medium"
                    style={{
                      color:
                        insight.churnRate > 25
                          ? "#ef4444"
                          : insight.churnRate > 15
                            ? "#f97316"
                            : "#22c55e",
                    }}
                  >
                    이탈 {insight.churnRate}%
                  </span>
                </div>
                <p className="text-[10px] text-white/40 truncate">
                  {insight.insight}
                </p>
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      </>
      )}
    </div>
  );
}
