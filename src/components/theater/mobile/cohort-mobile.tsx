"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

// ── 데이터 정의 (cohort-view.tsx와 동일) ──────────────────────────

const RETENTION_DATA: Record<
  string,
  {
    name: string;
    pattern: string;
    customers: number;
    retention: { period: string; days: number; rate: number }[];
  }
> = {
  "111": {
    name: "다매장 탐험가",
    pattern: "대형+중형+소형",
    customers: 18,
    retention: [
      { period: "시작", days: 0, rate: 100.0 },
      { period: "+1개월", days: 30, rate: 100.0 },
      { period: "+2개월", days: 60, rate: 100.0 },
      { period: "+3개월", days: 90, rate: 100.0 },
      { period: "+6개월", days: 180, rate: 100.0 },
      { period: "+12개월", days: 365, rate: 100.0 },
      { period: "+18개월", days: 548, rate: 100.0 },
    ],
  },
  "110": {
    name: "복합 쇼퍼",
    pattern: "대형+중형",
    customers: 387,
    retention: [
      { period: "시작", days: 0, rate: 100.0 },
      { period: "+1개월", days: 30, rate: 96.9 },
      { period: "+2개월", days: 60, rate: 88.4 },
      { period: "+3개월", days: 90, rate: 87.9 },
      { period: "+6개월", days: 180, rate: 87.9 },
      { period: "+12개월", days: 365, rate: 85.8 },
      { period: "+18개월", days: 548, rate: 82.4 },
    ],
  },
  "101": {
    name: "양극단 쇼퍼",
    pattern: "대형+소형",
    customers: 55,
    retention: [
      { period: "시작", days: 0, rate: 100.0 },
      { period: "+1개월", days: 30, rate: 78.2 },
      { period: "+2개월", days: 60, rate: 76.4 },
      { period: "+3개월", days: 90, rate: 76.4 },
      { period: "+6개월", days: 180, rate: 76.4 },
      { period: "+12개월", days: 365, rate: 78.2 },
      { period: "+18개월", days: 548, rate: 80.0 },
    ],
  },
  "100": {
    name: "대형 충성파",
    pattern: "대형 Only",
    customers: 1344,
    retention: [
      { period: "시작", days: 0, rate: 100.0 },
      { period: "+1개월", days: 30, rate: 76.7 },
      { period: "+2개월", days: 60, rate: 77.7 },
      { period: "+3개월", days: 90, rate: 77.9 },
      { period: "+6개월", days: 180, rate: 78.4 },
      { period: "+12개월", days: 365, rate: 78.8 },
      { period: "+18개월", days: 548, rate: 80.0 },
    ],
  },
  "010": {
    name: "중형 충성파",
    pattern: "중형 Only",
    customers: 587,
    retention: [
      { period: "시작", days: 0, rate: 100.0 },
      { period: "+1개월", days: 30, rate: 70.0 },
      { period: "+2개월", days: 60, rate: 71.2 },
      { period: "+3개월", days: 90, rate: 72.7 },
      { period: "+6개월", days: 180, rate: 74.6 },
      { period: "+12개월", days: 365, rate: 75.5 },
      { period: "+18개월", days: 548, rate: 76.1 },
    ],
  },
  "001": {
    name: "소형 의존군",
    pattern: "소형 Only",
    customers: 83,
    retention: [
      { period: "시작", days: 0, rate: 100.0 },
      { period: "+1개월", days: 30, rate: 66.3 },
      { period: "+2개월", days: 60, rate: 71.1 },
      { period: "+3개월", days: 90, rate: 65.1 },
      { period: "+6개월", days: 180, rate: 62.7 },
      { period: "+12개월", days: 365, rate: 62.2 },
      { period: "+18개월", days: 548, rate: 74.4 },
    ],
  },
  "011": {
    name: "중소형 의존군",
    pattern: "중형+소형",
    customers: 26,
    retention: [
      { period: "시작", days: 0, rate: 100.0 },
      { period: "+1개월", days: 30, rate: 61.5 },
      { period: "+2개월", days: 60, rate: 57.7 },
      { period: "+3개월", days: 90, rate: 57.7 },
      { period: "+6개월", days: 180, rate: 57.7 },
      { period: "+12개월", days: 365, rate: 57.7 },
      { period: "+18개월", days: 548, rate: 61.5 },
    ],
  },
};

const STORE_PATTERN_COHORTS = [
  {
    id: "111",
    name: "다매장 탐험가",
    pattern: "대형+중형+소형",
    type: "탐색형",
    traits: "소량 다빈도 · 다카테고리 · 정가구매 · 꽃/가스",
    description: "3종류 매장 모두 경험",
    customerCount: 18,
    customerRatio: 0.7,
    firstMonthVisits: 16.2,
    firstMonthSales: 339,
    storeVisits: { large: 4.6, medium: 8.6, small: 3.0 },
    storeRatio: { large: 29, medium: 53, small: 19 },
    categoryCount: 7.6,
    discountRate: 50.3,
    basketSize: 6.1,
    basketValue: 21,
    gradeDistribution: {
      vip: 27.8,
      loyal: 44.4,
      active: 22.2,
      risk: 5.6,
      churn: 0.0,
    },
    retention18m: 100.0,
    highlight: "VIP 27.8% | 이탈 0%",
    color: "#fbbf24",
  },
  {
    id: "110",
    name: "복합 쇼퍼",
    pattern: "대형+중형",
    type: "안정형",
    traits: "중간 빈도 · 대형 위주 · 신선식품 집중",
    description: "주요 매장 병행 이용",
    customerCount: 387,
    customerRatio: 15.5,
    firstMonthVisits: 8.9,
    firstMonthSales: 233,
    storeVisits: { large: 4.8, medium: 4.1, small: 0 },
    storeRatio: { large: 54, medium: 46, small: 0 },
    categoryCount: 6.7,
    discountRate: 53.3,
    basketSize: 8.8,
    basketValue: 26,
    gradeDistribution: {
      vip: 4.4,
      loyal: 23.3,
      active: 38.0,
      risk: 18.1,
      churn: 16.3,
    },
    retention18m: 82.4,
    highlight: "안정적 전환",
    color: "#22c55e",
  },
  {
    id: "101",
    name: "양극단 쇼퍼",
    pattern: "대형+소형",
    type: "기회형",
    traits: "중형 회피 · 가격 민감 · 대량+편의 병행",
    description: "중형 미경험 (희귀)",
    customerCount: 55,
    customerRatio: 2.2,
    firstMonthVisits: 8.5,
    firstMonthSales: 208,
    storeVisits: { large: 5.8, medium: 0, small: 2.7 },
    storeRatio: { large: 69, medium: 0, small: 31 },
    categoryCount: 5.8,
    discountRate: 52.0,
    basketSize: 8.5,
    basketValue: 24,
    gradeDistribution: {
      vip: 3.6,
      loyal: 21.8,
      active: 34.5,
      risk: 20.0,
      churn: 20.0,
    },
    retention18m: 80.0,
    highlight: "대형 경험 있음",
    color: "#06b6d4",
  },
  {
    id: "100",
    name: "대형 충성파",
    pattern: "대형 Only",
    type: "루틴형",
    traits: "저빈도 원스톱 · 필수품 위주 · 대량 구매",
    description: "최다 고객군 (53.8%)",
    customerCount: 1344,
    customerRatio: 53.8,
    firstMonthVisits: 5.8,
    firstMonthSales: 168,
    storeVisits: { large: 5.8, medium: 0, small: 0 },
    storeRatio: { large: 100, medium: 0, small: 0 },
    categoryCount: 5.6,
    discountRate: 51.7,
    basketSize: 9.9,
    basketValue: 29,
    gradeDistribution: {
      vip: 2.7,
      loyal: 16.9,
      active: 40.3,
      risk: 20.6,
      churn: 19.5,
    },
    retention18m: 80.0,
    highlight: "다매장 유도 필요",
    color: "#3b82f6",
  },
  {
    id: "010",
    name: "중형 충성파",
    pattern: "중형 Only",
    type: "루틴형",
    traits: "저빈도 원스톱 · 필수품 위주 · 근거리 선호",
    description: "대형 미경험",
    customerCount: 587,
    customerRatio: 23.5,
    firstMonthVisits: 5.4,
    firstMonthSales: 144,
    storeVisits: { large: 0, medium: 5.4, small: 0 },
    storeRatio: { large: 0, medium: 100, small: 0 },
    categoryCount: 5.3,
    discountRate: 54.6,
    basketSize: 8.9,
    basketValue: 26,
    gradeDistribution: {
      vip: 2.0,
      loyal: 10.9,
      active: 40.7,
      risk: 21.6,
      churn: 24.7,
    },
    retention18m: 76.1,
    highlight: "대형 유도 필요",
    color: "#8b5cf6",
  },
  {
    id: "001",
    name: "소형 의존군",
    pattern: "소형 Only",
    type: "필수품형",
    traits: "저빈도 대량 · 할인 의존 · GROCERY 집중",
    description: "VIP 전환 0%",
    customerCount: 83,
    customerRatio: 3.3,
    firstMonthVisits: 4.0,
    firstMonthSales: 131,
    storeVisits: { large: 0, medium: 0, small: 4.0 },
    storeRatio: { large: 0, medium: 0, small: 100 },
    categoryCount: 4.8,
    discountRate: 57.6,
    basketSize: 11.1,
    basketValue: 33,
    gradeDistribution: {
      vip: 0.0,
      loyal: 9.6,
      active: 39.8,
      risk: 25.3,
      churn: 25.3,
    },
    retention18m: 74.4,
    highlight: "VIP 0%",
    color: "#6b7280",
  },
  {
    id: "011",
    name: "중소형 의존군",
    pattern: "중형+소형",
    type: "편의형",
    traits: "대형 회피 · 근거리 쇼핑 · 편의 추구 · 이탈 최고",
    description: "대형 미경험 → 이탈 최고",
    customerCount: 26,
    customerRatio: 1.0,
    firstMonthVisits: 6.5,
    firstMonthSales: 172,
    storeVisits: { large: 0, medium: 4.1, small: 2.4 },
    storeRatio: { large: 0, medium: 63, small: 37 },
    categoryCount: 5.2,
    discountRate: 55.8,
    basketSize: 9.2,
    basketValue: 26,
    gradeDistribution: {
      vip: 3.8,
      loyal: 11.5,
      active: 23.1,
      risk: 23.1,
      churn: 38.5,
    },
    retention18m: 61.5,
    highlight: "이탈 38.5% 최고",
    color: "#ef4444",
  },
];

// ── 등급 색상 & 라벨 ───────────────────────────────────────────

const GRADE_COLORS: Record<string, string> = {
  vip: "#fbbf24",
  loyal: "#22c55e",
  active: "#3b82f6",
  risk: "#f97316",
  churn: "#6b7280",
};

const GRADE_LABELS: Record<string, string> = {
  vip: "VIP",
  loyal: "충성",
  active: "활성",
  risk: "위험",
  churn: "이탈",
};

// 매장 유형 색상
const STORE_COLORS: Record<string, string> = {
  large: "#3b82f6",
  medium: "#8b5cf6",
  small: "#64748b",
};

const STORE_LABELS: Record<string, string> = {
  large: "대형",
  medium: "중형",
  small: "소형",
};

// ── 리텐션 바 색상 ──────────────────────────────────────────────

function getRetentionColor(rate: number): string {
  if (rate >= 90) return "rgba(34, 197, 94, 0.8)";
  if (rate >= 80) return "rgba(132, 204, 22, 0.7)";
  if (rate >= 70) return "rgba(234, 179, 8, 0.6)";
  if (rate >= 60) return "rgba(249, 115, 22, 0.5)";
  return "rgba(239, 68, 68, 0.6)";
}

function getRetentionTextColor(rate: number): string {
  if (rate >= 90) return "#22c55e";
  if (rate >= 80) return "#84cc16";
  if (rate >= 70) return "#eab308";
  if (rate >= 60) return "#f97316";
  return "#ef4444";
}

// ── 매장 패턴 시각화 (dots) ─────────────────────────────────────

function StorePatternDots({
  storeRatio,
}: {
  storeRatio: { large: number; medium: number; small: number };
}) {
  const stores = [
    { key: "large", label: "대형", ratio: storeRatio.large },
    { key: "medium", label: "중형", ratio: storeRatio.medium },
    { key: "small", label: "소형", ratio: storeRatio.small },
  ];

  return (
    <div className="flex items-center gap-3">
      {stores.map((store) => (
        <div key={store.key} className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full transition-all"
            style={{
              backgroundColor:
                store.ratio > 0
                  ? STORE_COLORS[store.key]
                  : "rgba(255,255,255,0.1)",
              boxShadow:
                store.ratio > 0
                  ? `0 0 6px ${STORE_COLORS[store.key]}60`
                  : "none",
            }}
          />
          <span
            className="text-xs"
            style={{
              color:
                store.ratio > 0
                  ? "rgba(255,255,255,0.7)"
                  : "rgba(255,255,255,0.25)",
            }}
          >
            {store.label}
          </span>
          {store.ratio > 0 && (
            <span className="text-[10px] text-white/40">{store.ratio}%</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── 등급 분포 수평 스택바 ────────────────────────────────────────

function GradeDistributionBar({
  distribution,
}: {
  distribution: { vip: number; loyal: number; active: number; risk: number; churn: number };
}) {
  const grades = [
    { key: "vip", value: distribution.vip },
    { key: "loyal", value: distribution.loyal },
    { key: "active", value: distribution.active },
    { key: "risk", value: distribution.risk },
    { key: "churn", value: distribution.churn },
  ];

  return (
    <div>
      <div className="h-7 rounded-lg overflow-hidden flex">
        {grades.map((grade) => {
          if (grade.value === 0) return null;
          return (
            <motion.div
              key={grade.key}
              className="h-full flex items-center justify-center text-[10px] font-semibold"
              style={{
                width: `${Math.max(grade.value, 3)}%`,
                backgroundColor: GRADE_COLORS[grade.key],
                color: grade.value >= 10 ? "white" : "transparent",
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {grade.value >= 10 ? `${grade.value.toFixed(0)}%` : ""}
            </motion.div>
          );
        })}
      </div>
      {/* 범례 */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {grades.map((grade) => (
          <div key={grade.key} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-sm"
              style={{ backgroundColor: GRADE_COLORS[grade.key] }}
            />
            <span className="text-[10px] text-white/50">
              {GRADE_LABELS[grade.key]} {grade.value.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 매장 방문 흐름 데이터 ────────────────────────────────────────
const STORE_FLOW_DATA: Record<string, {
  firstStore: { large: number; medium: number; small: number };
  transitions: Record<string, number>;
}> = {
  "001": { firstStore: { large: 0, medium: 0, small: 100 }, transitions: { "small→small": 100 } },
  "010": { firstStore: { large: 0, medium: 100, small: 0 }, transitions: { "medium→medium": 100 } },
  "011": { firstStore: { large: 0, medium: 46.2, small: 53.8 }, transitions: { "medium→small": 30, "small→medium": 30, "medium→medium": 20, "small→small": 20 } },
  "100": { firstStore: { large: 100, medium: 0, small: 0 }, transitions: { "large→large": 100 } },
  "101": { firstStore: { large: 63.6, medium: 0, small: 36.4 }, transitions: { "large→small": 35, "small→large": 35, "large→large": 20, "small→small": 10 } },
  "110": { firstStore: { large: 52.7, medium: 47.3, small: 0 }, transitions: { "large→large": 29.6, "medium→medium": 23.9, "medium→large": 23.4, "large→medium": 23.1 } },
  "111": { firstStore: { large: 27.8, medium: 44.4, small: 27.8 }, transitions: { "medium→medium": 16.7, "large→large": 16.7, "small→small": 16.7, "medium→small": 16.7, "medium→large": 11.1, "small→large": 11.1, "large→medium": 5.6, "large→small": 5.6 } },
};

const FLOW_STORE_COLORS: Record<string, string> = { large: "#3b82f6", medium: "#8b5cf6", small: "#64748b" };
const FLOW_STORE_LABELS: Record<string, string> = { large: "대형", medium: "중형", small: "소형" };

// ── 매장 흐름 Canvas 애니메이션 ──────────────────────────────────
function StoreFlowCanvas({ cohortId }: { cohortId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [size, setSize] = useState({ width: 300, height: 140 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      if (width > 0) setSize({ width, height: 140 });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width, height } = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const flowData = STORE_FLOW_DATA[cohortId];
    if (!flowData) return;

    const { firstStore, transitions } = flowData;
    type ST = "large" | "medium" | "small";
    const storeTypes: ST[] = [];
    if (firstStore.large > 0) storeTypes.push("large");
    if (firstStore.medium > 0) storeTypes.push("medium");
    if (firstStore.small > 0) storeTypes.push("small");

    const startX = 35;
    const startY = height / 2;
    const storeX = width - 40;
    const spacing = storeTypes.length > 1 ? (height - 36) / (storeTypes.length - 1) : 0;
    const startYStore = storeTypes.length > 1 ? 18 : height / 2;

    const storePos: Record<string, { x: number; y: number }> = {};
    storeTypes.forEach((t, i) => { storePos[t] = { x: storeX, y: startYStore + spacing * i }; });

    interface P { type: "entry" | "trans"; from?: ST; to: ST; progress: number; speed: number; opacity: number; }
    const particles: P[] = [];

    storeTypes.forEach((t) => {
      const r = firstStore[t];
      const cnt = Math.max(1, Math.round(r / 18));
      for (let i = 0; i < cnt; i++) particles.push({ type: "entry", to: t, progress: Math.random(), speed: 0.005 + Math.random() * 0.004, opacity: 0.6 + Math.random() * 0.4 });
    });
    Object.entries(transitions).forEach(([key, ratio]) => {
      const [from, to] = key.split("→") as [ST, ST];
      if (!storePos[from] || !storePos[to] || from === to) return;
      const cnt = Math.max(1, Math.round(ratio / 25));
      for (let i = 0; i < cnt; i++) particles.push({ type: "trans", from, to, progress: Math.random(), speed: 0.006 + Math.random() * 0.004, opacity: 0.5 + Math.random() * 0.5 });
    });

    let time = 0;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.016;

      // 경로선
      storeTypes.forEach((t) => {
        const r = firstStore[t]; if (r === 0) return;
        const pos = storePos[t];
        const cpX = (startX + pos.x) / 2; const cpY = (startY + pos.y) / 2 - 15;
        ctx.beginPath(); ctx.moveTo(startX, startY); ctx.quadraticCurveTo(cpX, cpY, pos.x - 14, pos.y);
        ctx.strokeStyle = `${FLOW_STORE_COLORS[t]}30`; ctx.lineWidth = Math.max(1, r / 25) + 2; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(startX, startY); ctx.quadraticCurveTo(cpX, cpY, pos.x - 14, pos.y);
        ctx.strokeStyle = `${FLOW_STORE_COLORS[t]}60`; ctx.lineWidth = Math.max(1, r / 25); ctx.stroke();
      });

      // 전환 경로선
      Object.entries(transitions).forEach(([key, ratio]) => {
        const [from, to] = key.split("→") as [ST, ST];
        if (!storePos[from] || !storePos[to] || from === to) return;
        const fP = storePos[from]; const tP = storePos[to];
        const midY = (fP.y + tP.y) / 2; const cpX = storeX - 30 - Math.abs(fP.y - tP.y) * 0.25;
        ctx.beginPath(); ctx.moveTo(fP.x - 12, fP.y); ctx.quadraticCurveTo(cpX, midY, tP.x - 12, tP.y);
        ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = Math.max(0.5, ratio / 30); ctx.stroke();
      });

      // 파티클
      particles.forEach((p) => {
        p.progress += p.speed; if (p.progress > 1) p.progress = 0;
        let px: number, py: number, color: string;
        const t = p.progress; const mt = 1 - t;
        if (p.type === "entry") {
          const pos = storePos[p.to]; const cpX = (startX + pos.x) / 2; const cpY = (startY + pos.y) / 2 - 15;
          px = mt * mt * startX + 2 * mt * t * cpX + t * t * (pos.x - 14);
          py = mt * mt * startY + 2 * mt * t * cpY + t * t * pos.y;
          color = FLOW_STORE_COLORS[p.to];
        } else {
          const fP = storePos[p.from!]; const tP = storePos[p.to];
          const midY = (fP.y + tP.y) / 2; const cpX = storeX - 30 - Math.abs(fP.y - tP.y) * 0.25;
          px = mt * mt * (fP.x - 12) + 2 * mt * t * cpX + t * t * (tP.x - 12);
          py = mt * mt * fP.y + 2 * mt * t * midY + t * t * tP.y;
          color = "rgba(255,255,255,0.9)";
        }
        ctx.shadowColor = color; ctx.shadowBlur = 5;
        ctx.beginPath(); ctx.arc(px, py, p.type === "entry" ? 2 : 1.5, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.globalAlpha = p.opacity * Math.sin(t * Math.PI); ctx.fill();
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      });

      // 시작 노드
      const pulse = 1 + Math.sin(time * 3) * 0.06;
      ctx.shadowColor = "rgba(255,255,255,0.4)"; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(startX, startY, 10 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = "#000"; ctx.font = "bold 7px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("시작", startX, startY);

      // 매장 노드
      storeTypes.forEach((t) => {
        const pos = storePos[t]; const r = firstStore[t]; const nr = 11 + r * 0.06;
        const sp = 1 + Math.sin(time * 2 + storeTypes.indexOf(t)) * 0.04;
        ctx.shadowColor = FLOW_STORE_COLORS[t]; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(pos.x, pos.y, nr * sp, 0, Math.PI * 2);
        ctx.fillStyle = FLOW_STORE_COLORS[t]; ctx.fill(); ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = "#fff"; ctx.font = "bold 8px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(`${r.toFixed(0)}%`, pos.x, pos.y);
        ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "8px system-ui"; ctx.textAlign = "left";
        ctx.fillText(FLOW_STORE_LABELS[t], pos.x + nr + 3, pos.y);
      });

      ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.font = "7px system-ui"; ctx.textAlign = "left";
      ctx.fillText("첫 방문 비율", 4, 9);

      animRef.current = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animRef.current);
  }, [cohortId, size]);

  return (
    <div ref={containerRef} className="w-full h-[140px]">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}

// ── 18개월 리텐션 히트맵 (전체 코호트) ──────────────────────────
function RetentionHeatmap({ selectedId }: { selectedId: string }) {
  const periods = RETENTION_DATA["111"].retention;

  function getColor(rate: number) {
    if (rate >= 90) return "rgba(34, 197, 94, 0.8)";
    if (rate >= 80) return "rgba(132, 204, 22, 0.7)";
    if (rate >= 70) return "rgba(234, 179, 8, 0.6)";
    if (rate >= 60) return "rgba(249, 115, 22, 0.5)";
    return "rgba(239, 68, 68, 0.6)";
  }

  return (
    <div className="overflow-x-auto">
      {/* 헤더 */}
      <div className="flex items-center gap-1 mb-1.5 min-w-[360px]">
        <div className="w-[72px] flex-shrink-0" />
        {periods.map((p) => (
          <div key={p.period} className="flex-1 text-center text-[8px] text-white/35">{p.period}</div>
        ))}
      </div>
      {/* 행 */}
      {STORE_PATTERN_COHORTS.map((cohort) => {
        const ret = RETENTION_DATA[cohort.id];
        const isSelected = selectedId === cohort.id;
        return (
          <motion.div
            key={cohort.id}
            className={`flex items-center gap-1 p-0.5 rounded min-w-[360px] ${isSelected ? "bg-white/10 ring-1 ring-white/25" : "opacity-40"}`}
            animate={{ scale: isSelected ? 1.01 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-[72px] flex-shrink-0 text-[9px] text-white/60 truncate flex items-center gap-1">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cohort.color }} />
              {cohort.name}
            </div>
            {ret?.retention.map((r, i) => (
              <motion.div
                key={i}
                className="flex-1 h-6 rounded flex items-center justify-center text-[9px] font-bold text-white"
                style={{ backgroundColor: getColor(r.rate) }}
                animate={{ opacity: isSelected ? 1 : 0.6, scale: isSelected ? 1 : 0.95 }}
                transition={{ duration: 0.3, delay: isSelected ? i * 0.04 : 0 }}
              >
                {r.rate.toFixed(0)}%
              </motion.div>
            ))}
          </motion.div>
        );
      })}
    </div>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────

export function CohortMobile() {
  const [selectedCohortId, setSelectedCohortId] = useState("111");

  const selectedCohort = useMemo(
    () => STORE_PATTERN_COHORTS.find((c) => c.id === selectedCohortId)!,
    [selectedCohortId]
  );

  const selectedRetention = useMemo(
    () => RETENTION_DATA[selectedCohortId],
    [selectedCohortId]
  );

  // 시작 시점(days=0)을 제외한 리텐션 데이터
  const retentionTimeline = useMemo(
    () => selectedRetention.retention.filter((r) => r.days > 0),
    [selectedRetention]
  );

  return (
    <div className="w-full pb-8 space-y-4">
      {/* ── 1. Header ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="px-4 pt-4"
      >
        <h2 className="text-lg font-bold text-white">
          매장패턴 코호트 분석
        </h2>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-white/50">
            2,500명 / 18개월 추적
          </span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-medium">
            Chi2 = 106.02, p &lt; 0.001
          </span>
        </div>
      </motion.div>

      {/* ── 2. Cohort Selector (수평 스크롤 카드 스트립) ───── */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 px-4" style={{ minWidth: "max-content" }}>
          {STORE_PATTERN_COHORTS.map((cohort, index) => {
            const isSelected = selectedCohortId === cohort.id;
            return (
              <motion.button
                key={cohort.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                onClick={() => setSelectedCohortId(cohort.id)}
                className={`flex-shrink-0 rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? "border-white/30 bg-white/10"
                    : "border-white/10 bg-white/5 active:bg-white/8"
                }`}
                style={{ width: 120, minHeight: 44 }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: cohort.color,
                      boxShadow: isSelected
                        ? `0 0 8px ${cohort.color}80`
                        : "none",
                    }}
                  />
                  <span className="text-[11px] font-mono text-white/50">
                    {cohort.id}
                  </span>
                </div>
                <div className="text-xs font-bold text-white truncate">
                  {cohort.name}
                </div>
                <div className="text-[10px] text-white/40 mt-0.5">
                  {cohort.customerCount}명
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Selected Cohort Detail Card ───────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedCohortId}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          className="mx-4 rounded-xl bg-white/5 border border-white/10 overflow-hidden"
        >
          {/* 상단: 코호트명 + 유형 태그 */}
          <div className="p-4 pb-3 border-b border-white/5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{
                    backgroundColor: selectedCohort.color,
                    boxShadow: `0 0 10px ${selectedCohort.color}60`,
                  }}
                />
                <h3 className="text-base font-bold text-white">
                  {selectedCohort.name}
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] text-white/60 font-medium">
                {selectedCohort.type}
              </span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              {selectedCohort.traits}
            </p>
          </div>

          {/* 매장 패턴 시각화 */}
          <div className="px-4 py-3 border-b border-white/5">
            <div className="text-[10px] text-white/40 mb-2 uppercase tracking-wider">
              매장 이용 패턴
            </div>
            <StorePatternDots storeRatio={selectedCohort.storeRatio} />
          </div>

          {/* 등급 분포 바 */}
          <div className="px-4 py-3 border-b border-white/5">
            <div className="text-[10px] text-white/40 mb-2 uppercase tracking-wider">
              18개월 후 등급 분포
            </div>
            <GradeDistributionBar
              distribution={selectedCohort.gradeDistribution}
            />
          </div>

          {/* Key Stats 2x2 그리드 */}
          <div className="px-4 py-3 border-b border-white/5">
            <div className="grid grid-cols-2 gap-2">
              {/* VIP 전환율 */}
              <div className="rounded-lg bg-white/5 p-3">
                <div className="text-[10px] text-white/40 mb-1">
                  VIP 전환율
                </div>
                <div
                  className="text-lg font-bold"
                  style={{ color: GRADE_COLORS.vip }}
                >
                  {selectedCohort.gradeDistribution.vip.toFixed(1)}%
                </div>
              </div>
              {/* 이탈율 */}
              <div className="rounded-lg bg-white/5 p-3">
                <div className="text-[10px] text-white/40 mb-1">이탈율</div>
                <div
                  className="text-lg font-bold"
                  style={{ color: GRADE_COLORS.churn }}
                >
                  {selectedCohort.gradeDistribution.churn.toFixed(1)}%
                </div>
              </div>
              {/* 18개월 리텐션 */}
              <div className="rounded-lg bg-white/5 p-3">
                <div className="text-[10px] text-white/40 mb-1">
                  18개월 리텐션
                </div>
                <div
                  className="text-lg font-bold"
                  style={{
                    color: getRetentionTextColor(selectedCohort.retention18m),
                  }}
                >
                  {selectedCohort.retention18m}%
                </div>
              </div>
              {/* 카테고리 수 */}
              <div className="rounded-lg bg-white/5 p-3">
                <div className="text-[10px] text-white/40 mb-1">
                  카테고리 수
                </div>
                <div className="text-lg font-bold text-white">
                  {selectedCohort.categoryCount}개
                </div>
              </div>
            </div>
          </div>

          {/* Traits 리스트 */}
          <div className="px-4 py-3">
            <div className="text-[10px] text-white/40 mb-2 uppercase tracking-wider">
              행동 특성
            </div>
            <div className="space-y-1.5">
              {[
                `월 ${selectedCohort.firstMonthVisits}회 방문`,
                `장바구니 ${selectedCohort.basketSize}개, $${selectedCohort.basketValue}`,
                `할인 의존도 ${selectedCohort.discountRate}%`,
                selectedCohort.highlight,
              ].map((trait, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
                  className="flex items-start gap-2"
                >
                  <div
                    className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: selectedCohort.color }}
                  />
                  <span className="text-xs text-white/60">{trait}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── 3.5. 매장 방문 흐름 애니메이션 ─────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`storeflow-${selectedCohortId}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="mx-4 rounded-xl bg-white/5 border border-white/10 overflow-hidden"
        >
          <div className="px-4 pt-3 pb-1">
            <div className="text-[10px] text-white/40 uppercase tracking-wider">
              매장 방문 흐름
            </div>
          </div>
          <div className="px-2 pb-3">
            <StoreFlowCanvas cohortId={selectedCohortId} />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── 3.6. 전체 코호트 리텐션 히트맵 ─────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="mx-4 rounded-xl bg-white/5 border border-white/10 p-4"
      >
        <div className="text-[10px] text-white/40 mb-3 uppercase tracking-wider">
          18개월 리텐션 히트맵 (전체 코호트)
        </div>
        <RetentionHeatmap selectedId={selectedCohortId} />
        <div className="flex items-center gap-2 mt-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: "rgba(34, 197, 94, 0.8)" }} />
            <span className="text-[8px] text-white/30">90%+</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: "rgba(132, 204, 22, 0.7)" }} />
            <span className="text-[8px] text-white/30">80%+</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: "rgba(234, 179, 8, 0.6)" }} />
            <span className="text-[8px] text-white/30">70%+</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: "rgba(249, 115, 22, 0.5)" }} />
            <span className="text-[8px] text-white/30">60%+</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: "rgba(239, 68, 68, 0.6)" }} />
            <span className="text-[8px] text-white/30">&lt;60%</span>
          </div>
        </div>
      </motion.div>

      {/* ── 4. Retention Timeline ────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`retention-${selectedCohortId}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="mx-4 rounded-xl bg-white/5 border border-white/10 p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] text-white/40 uppercase tracking-wider">
              리텐션 타임라인
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: selectedCohort.color }}
              />
              <span className="text-[10px] text-white/50">
                {selectedCohort.name}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {retentionTimeline.map((r, i) => (
              <motion.div
                key={r.period}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="flex items-center gap-3"
              >
                {/* 기간 라벨 */}
                <div className="w-16 flex-shrink-0 text-right">
                  <div className="text-xs text-white/60 font-medium">
                    {r.period}
                  </div>
                  <div className="text-[9px] text-white/30">
                    {r.days}일
                  </div>
                </div>

                {/* 프로그레스 바 */}
                <div className="flex-1 h-6 bg-white/5 rounded-md overflow-hidden relative">
                  <motion.div
                    className="h-full rounded-md flex items-center justify-end pr-2"
                    style={{
                      backgroundColor: getRetentionColor(r.rate),
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${r.rate}%` }}
                    transition={{
                      duration: 0.6,
                      delay: 0.15 + i * 0.08,
                      ease: "easeOut",
                    }}
                  >
                    <span className="text-[10px] font-bold text-white">
                      {r.rate.toFixed(1)}%
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── 5. 첫 1개월 구매행동 요약 ────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`behavior-${selectedCohortId}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="mx-4 rounded-xl bg-white/5 border border-white/10 p-4"
        >
          <div className="text-[10px] text-white/40 mb-3 uppercase tracking-wider">
            첫 1개월 구매행동
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-white/5">
              <div className="text-sm font-bold text-blue-400">
                {selectedCohort.firstMonthVisits}
              </div>
              <div className="text-[10px] text-white/40 mt-0.5">방문/월</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-white/5">
              <div className="text-sm font-bold text-green-400">
                ${selectedCohort.firstMonthSales}
              </div>
              <div className="text-[10px] text-white/40 mt-0.5">매출</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-white/5">
              <div className="text-sm font-bold text-purple-400">
                {selectedCohort.categoryCount}
              </div>
              <div className="text-[10px] text-white/40 mt-0.5">카테고리</div>
            </div>
          </div>

          {/* 매장 비중 바 (해당 매장만) */}
          <div className="mt-3 space-y-1.5">
            {(
              [
                { key: "large", label: "대형", ratio: selectedCohort.storeRatio.large },
                { key: "medium", label: "중형", ratio: selectedCohort.storeRatio.medium },
                { key: "small", label: "소형", ratio: selectedCohort.storeRatio.small },
              ] as const
            )
              .filter((s) => s.ratio > 0)
              .map((store) => (
                <div key={store.key} className="flex items-center gap-2">
                  <span className="text-[10px] text-white/50 w-8">
                    {store.label}
                  </span>
                  <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: STORE_COLORS[store.key],
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${store.ratio}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-[10px] text-white/40 w-8 text-right">
                    {store.ratio}%
                  </span>
                </div>
              ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── 6. Key Insight Card ──────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="mx-4 rounded-xl border border-white/10 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(251,191,36,0.08), rgba(34,197,94,0.06), rgba(59,130,246,0.04))",
        }}
      >
        <div className="p-4">
          <div className="text-[10px] text-white/40 mb-2 uppercase tracking-wider">
            Key Insight
          </div>
          <p className="text-sm text-white/90 font-medium leading-relaxed">
            다매장 탐험가(111) VIP 전환율 27.8%, 이탈 0%
          </p>
          <p className="text-xs text-white/50 mt-2 leading-relaxed">
            첫 1개월 행동이 최종 등급을 예측합니다. 다양한 매장 유형을 경험한
            고객일수록 충성도가 높고, 단일 소형매장 고객은 이탈 위험이
            현저히 높습니다.
          </p>

          {/* 비교 하이라이트 */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="rounded-lg bg-white/5 p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: "#fbbf24" }}
                />
                <span className="text-[10px] text-white/50">111 탐험가</span>
              </div>
              <div className="text-sm font-bold text-yellow-400">
                VIP 27.8%
              </div>
              <div className="text-[10px] text-white/30">이탈 0%</div>
            </div>
            <div className="rounded-lg bg-white/5 p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: "#6b7280" }}
                />
                <span className="text-[10px] text-white/50">001 소형</span>
              </div>
              <div className="text-sm font-bold text-gray-400">VIP 0%</div>
              <div className="text-[10px] text-white/30">이탈 25.3%</div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-medium">
                p &lt; 0.001
              </span>
              <span className="text-[10px] text-white/40">
                99.9% 신뢰수준으로 유의미
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
