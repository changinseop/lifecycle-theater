"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

// 리텐션 데이터 (첫 1개월 매장 패턴별, 18개월 추적) - 7개 코호트
const RETENTION_DATA: Record<string, { name: string; pattern: string; customers: number; retention: { period: string; days: number; rate: number }[] }> = {
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

// 매장 이용 행태별 코호트 데이터 (첫 1개월 기준) - 7개 코호트, 리텐션 높은순 정렬
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
    gradeDistribution: { vip: 27.8, loyal: 44.4, active: 22.2, risk: 5.6, churn: 0.0 },
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
    gradeDistribution: { vip: 4.4, loyal: 23.3, active: 38.0, risk: 18.1, churn: 16.3 },
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
    gradeDistribution: { vip: 3.6, loyal: 21.8, active: 34.5, risk: 20.0, churn: 20.0 },
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
    gradeDistribution: { vip: 2.7, loyal: 16.9, active: 40.3, risk: 20.6, churn: 19.5 },
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
    gradeDistribution: { vip: 2.0, loyal: 10.9, active: 40.7, risk: 21.6, churn: 24.7 },
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
    gradeDistribution: { vip: 0.0, loyal: 9.6, active: 39.8, risk: 25.3, churn: 25.3 },
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
    gradeDistribution: { vip: 3.8, loyal: 11.5, active: 23.1, risk: 23.1, churn: 38.5 },
    retention18m: 61.5,
    highlight: "이탈 38.5% 최고",
    color: "#ef4444",
  },
];

// 통계적 검증 결과
const STATISTICAL_VALIDATION = {
  // Chi-Square 독립성 검정 결과
  chiSquare: 106.02,
  df: 24, // 자유도 (7코호트-1) × (5등급-1)
  pValue: "< 0.001",
  significanceLevel: 0.001, // 유의수준 0.1%
  // 효과 크기 (Cramér's V)
  cramersV: 0.146,
  effectSize: "중간", // 0.1~0.3 = 중간 효과
  // 분석 방법론
  method: "Chi-Square 독립성 검정",
  sample: 2500, // 분석 대상 고객 수
  period: "18개월", // 추적 기간
  // 결론
  conclusion: "첫 1개월 매장 방문 패턴이 최종 등급을 유의미하게 예측",
  interpretation: "귀무가설 기각: 코호트별 등급 분포는 독립적이지 않음 (패턴이 등급에 영향)",
};

// 매장 방문 흐름 데이터 (실제 분석 결과)
const STORE_FLOW_DATA: Record<string, {
  firstStore: { large: number; medium: number; small: number };
  transitions: Record<string, number>;
}> = {
  "001": {
    firstStore: { large: 0, medium: 0, small: 100 },
    transitions: { "small→small": 100 },
  },
  "010": {
    firstStore: { large: 0, medium: 100, small: 0 },
    transitions: { "medium→medium": 100 },
  },
  "011": {
    firstStore: { large: 0, medium: 46.2, small: 53.8 },
    transitions: { "medium→small": 30, "small→medium": 30, "medium→medium": 20, "small→small": 20 },
  },
  "100": {
    firstStore: { large: 100, medium: 0, small: 0 },
    transitions: { "large→large": 100 },
  },
  "101": {
    firstStore: { large: 63.6, medium: 0, small: 36.4 },
    transitions: { "large→small": 35, "small→large": 35, "large→large": 20, "small→small": 10 },
  },
  "110": {
    firstStore: { large: 52.7, medium: 47.3, small: 0 },
    transitions: { "large→large": 29.6, "medium→medium": 23.9, "medium→large": 23.4, "large→medium": 23.1 },
  },
  "111": {
    firstStore: { large: 27.8, medium: 44.4, small: 27.8 },
    transitions: {
      "medium→medium": 16.7, "large→large": 16.7, "small→small": 16.7,
      "medium→small": 16.7, "medium→large": 11.1, "small→large": 11.1,
      "large→medium": 5.6, "large→small": 5.6
    },
  },
};

// 등급 색상
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


// 매장 흐름 시각화 컴포넌트 (실제 분석 데이터 기반)
function CohortNetworkCanvas({
  cohort,
}: {
  cohort: typeof STORE_PATTERN_COHORTS[0];
  timeMode?: "weekday" | "weekend";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const [canvasSize, setCanvasSize] = useState({ width: 320, height: 140 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const timer = setTimeout(() => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    }, 50);

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setCanvasSize({ width, height });
      }
    });

    observer.observe(container);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { width, height } = canvasSize;
    if (width === 0 || height === 0) return;

    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // 실제 분석 데이터 가져오기
    const flowData = STORE_FLOW_DATA[cohort.id];
    if (!flowData) return;

    const { firstStore, transitions } = flowData;

    // 매장 색상
    const storeColors: Record<string, string> = {
      large: "#3b82f6",
      medium: "#8b5cf6",
      small: "#64748b",
    };

    // 존재하는 매장 목록 (첫 방문 비율 > 0)
    type StoreType = "large" | "medium" | "small";
    const storeTypes: StoreType[] = [];
    if (firstStore.large > 0 || cohort.storeRatio.large > 0) storeTypes.push("large");
    if (firstStore.medium > 0 || cohort.storeRatio.medium > 0) storeTypes.push("medium");
    if (firstStore.small > 0 || cohort.storeRatio.small > 0) storeTypes.push("small");

    // 레이아웃: 왼쪽 시작점 → 오른쪽 매장들
    const startX = 45;
    const startY = height / 2;
    const storeX = width - 50;
    const storeSpacing = storeTypes.length > 1 ? (height - 40) / (storeTypes.length - 1) : 0;
    const storeStartY = storeTypes.length > 1 ? 20 : height / 2;

    // 매장 위치 계산
    const storePositions: Record<string, { x: number; y: number; ratio: number }> = {};
    storeTypes.forEach((type, i) => {
      storePositions[type] = {
        x: storeX,
        y: storeTypes.length > 1 ? storeStartY + storeSpacing * i : storeStartY,
        ratio: firstStore[type],
      };
    });

    // 파티클 정의
    interface Particle {
      type: "entry" | "transition"; // 진입 or 매장간 전환
      fromStore?: StoreType;
      toStore: StoreType;
      progress: number;
      speed: number;
      opacity: number;
    }

    const particles: Particle[] = [];

    // 진입 파티클 생성 (시작 → 매장, 비율에 비례)
    storeTypes.forEach((type) => {
      const ratio = firstStore[type];
      const count = Math.max(1, Math.round(ratio / 15)); // 비율에 비례
      for (let i = 0; i < count; i++) {
        particles.push({
          type: "entry",
          toStore: type,
          progress: Math.random(),
          speed: 0.004 + Math.random() * 0.003,
          opacity: 0.6 + Math.random() * 0.4,
        });
      }
    });

    // 전환 파티클 생성 (매장 → 매장)
    Object.entries(transitions).forEach(([key, ratio]) => {
      const [from, to] = key.split("→") as [StoreType, StoreType];
      if (!storePositions[from] || !storePositions[to]) return;
      if (from === to) return; // 동일 매장 전환은 제외 (시각적 혼란)

      const count = Math.max(1, Math.round(ratio / 20));
      for (let i = 0; i < count; i++) {
        particles.push({
          type: "transition",
          fromStore: from,
          toStore: to,
          progress: Math.random(),
          speed: 0.005 + Math.random() * 0.004,
          opacity: 0.5 + Math.random() * 0.5,
        });
      }
    });

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.016;

      // 1. 진입 경로 그리기 (시작 → 매장)
      storeTypes.forEach((type) => {
        const ratio = firstStore[type];
        if (ratio === 0) return;

        const pos = storePositions[type];
        const lineWidth = Math.max(1, ratio / 20);

        // 곡선 경로
        const cpX = (startX + pos.x) / 2;
        const cpY = (startY + pos.y) / 2 - 20;

        // 글로우
        ctx.shadowColor = storeColors[type];
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(cpX, cpY, pos.x - 18, pos.y);
        ctx.strokeStyle = `${storeColors[type]}30`;
        ctx.lineWidth = lineWidth + 3;
        ctx.stroke();

        // 메인 라인
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(cpX, cpY, pos.x - 18, pos.y);
        ctx.strokeStyle = `${storeColors[type]}60`;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      });

      // 2. 전환 경로 그리기 (매장 ↔ 매장)
      Object.entries(transitions).forEach(([key, ratio]) => {
        const [from, to] = key.split("→") as [StoreType, StoreType];
        if (!storePositions[from] || !storePositions[to]) return;
        if (from === to) return;

        const fromPos = storePositions[from];
        const toPos = storePositions[to];
        const lineWidth = Math.max(0.5, ratio / 25);

        // 아크 (왼쪽으로 휘어지는 곡선)
        const midY = (fromPos.y + toPos.y) / 2;
        const cpX = storeX - 40 - Math.abs(fromPos.y - toPos.y) * 0.3;

        ctx.beginPath();
        ctx.moveTo(fromPos.x - 15, fromPos.y);
        ctx.quadraticCurveTo(cpX, midY, toPos.x - 15, toPos.y);
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      });

      // 3. 파티클 업데이트 및 렌더링
      particles.forEach((p) => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;

        let px: number, py: number;
        let color: string;

        if (p.type === "entry") {
          // 시작점 → 매장
          const pos = storePositions[p.toStore];
          const cpX = (startX + pos.x) / 2;
          const cpY = (startY + pos.y) / 2 - 20;

          const t = p.progress;
          const mt = 1 - t;
          px = mt * mt * startX + 2 * mt * t * cpX + t * t * (pos.x - 18);
          py = mt * mt * startY + 2 * mt * t * cpY + t * t * pos.y;
          color = storeColors[p.toStore];
        } else {
          // 매장 → 매장
          const fromPos = storePositions[p.fromStore!];
          const toPos = storePositions[p.toStore];
          const midY = (fromPos.y + toPos.y) / 2;
          const cpX = storeX - 40 - Math.abs(fromPos.y - toPos.y) * 0.3;

          const t = p.progress;
          const mt = 1 - t;
          px = mt * mt * (fromPos.x - 15) + 2 * mt * t * cpX + t * t * (toPos.x - 15);
          py = mt * mt * fromPos.y + 2 * mt * t * midY + t * t * toPos.y;
          color = "rgba(255,255,255,0.9)";
        }

        // 파티클 글로우
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(px, py, p.type === "entry" ? 2.5 : 2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      });

      // 4. 시작점 노드
      const pulse = 1 + Math.sin(time * 3) * 0.08;
      ctx.shadowColor = "rgba(255,255,255,0.5)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(startX, startY, 12 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#000";
      ctx.font = "bold 8px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("시작", startX, startY);

      // 5. 매장 노드
      storeTypes.forEach((type) => {
        const pos = storePositions[type];
        const ratio = firstStore[type];
        const nodeRadius = 14 + ratio * 0.08;
        const storePulse = 1 + Math.sin(time * 2 + storeTypes.indexOf(type)) * 0.05;

        // 글로우
        ctx.shadowColor = storeColors[type];
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, nodeRadius * storePulse, 0, Math.PI * 2);
        ctx.fillStyle = storeColors[type];
        ctx.fill();
        ctx.shadowBlur = 0;

        // 테두리
        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 비율 텍스트
        ctx.fillStyle = "#fff";
        ctx.font = "bold 10px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${ratio.toFixed(0)}%`, pos.x, pos.y);

        // 라벨
        const labels: Record<string, string> = { large: "대형", medium: "중형", small: "소형" };
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.font = "9px system-ui";
        ctx.textAlign = "left";
        ctx.fillText(labels[type], pos.x + nodeRadius + 4, pos.y);
      });

      // 6. 범례 (좌상단)
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "8px system-ui";
      ctx.textAlign = "left";
      ctx.fillText("첫 방문 비율", 5, 10);

      animationRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animationRef.current);
      ctx.clearRect(0, 0, width * 2, height * 2);
    };
  }, [cohort, canvasSize]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}

export function CohortView() {
  const [selectedCohort, setSelectedCohort] = useState<string | null>("111");

  const selectedData = useMemo(() => {
    return STORE_PATTERN_COHORTS.find((c) => c.id === selectedCohort);
  }, [selectedCohort]);

  const totalCustomers = STORE_PATTERN_COHORTS.reduce((sum, c) => sum + c.customerCount, 0);

  const [methodTab, setMethodTab] = useState<"overview" | "data" | "method">("overview");

  return (
    <div className="w-full h-full min-h-[550px] flex flex-col overflow-auto">
      {/* 분석 방법론 패널 - 아카데믹 스타일 */}
      <div className="mb-4 bg-slate-900/60 rounded-lg border border-white/10">
        {/* 탭 헤더 */}
        <div className="flex border-b border-white/10">
          {[
            { id: "overview", label: "Analysis Overview" },
            { id: "data", label: "Data & Clustering" },
            { id: "method", label: "Methodology" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMethodTab(tab.id as typeof methodTab)}
              className={`px-4 py-2 text-sm font-medium transition-all ${
                methodTab === tab.id
                  ? "text-white border-b-2 border-white bg-white/5"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 탭 컨텐츠 */}
        <div className="p-4">
          <AnimatePresence mode="wait">
            {/* Overview 탭 */}
            {methodTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h4 className="text-base font-semibold text-white mb-3">Research Question</h4>
                <p className="text-sm text-white/70 leading-relaxed mb-4">
                  고객의 <span className="text-white font-medium">초기 1개월 매장 방문 패턴</span>이
                  장기적인 <span className="text-white font-medium">고객 등급(VIP~이탈)</span>을 예측할 수 있는가?
                </p>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/5 rounded p-3">
                    <div className="text-xs text-white/40 mb-1">Sample Size</div>
                    <div className="text-lg font-bold text-white">2,500명</div>
                    <div className="text-xs text-white/50">신규 가입 고객</div>
                  </div>
                  <div className="bg-white/5 rounded p-3">
                    <div className="text-xs text-white/40 mb-1">Tracking Period</div>
                    <div className="text-lg font-bold text-white">18개월</div>
                    <div className="text-xs text-white/50">종단 추적 관찰</div>
                  </div>
                  <div className="bg-white/5 rounded p-3">
                    <div className="text-xs text-white/40 mb-1">Key Finding</div>
                    <div className="text-lg font-bold text-white">p &lt; 0.001</div>
                    <div className="text-xs text-white/50">통계적 유의성 확인</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Data & Clustering 탭 */}
            {methodTab === "data" && (
              <motion.div
                key="data"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h4 className="text-base font-semibold text-white mb-3">Store Clustering</h4>

                <div className="flex gap-6">
                  {/* 왼쪽: 클러스터링 설명 */}
                  <div className="flex-1">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-2 text-white/50 font-medium">단계</th>
                          <th className="text-left py-2 text-white/50 font-medium">내용</th>
                        </tr>
                      </thead>
                      <tbody className="text-white/70">
                        <tr className="border-b border-white/5">
                          <td className="py-2 text-white/40">1. 원본 데이터</td>
                          <td className="py-2">411개 매장 (Store Code)</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-2 text-white/40">2. 클러스터 변수</td>
                          <td className="py-2">평균 제품 수 × 고객 방문 빈도</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-2 text-white/40">3. 알고리즘</td>
                          <td className="py-2">K-means Clustering (k=3)</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-white/40">4. 결과</td>
                          <td className="py-2">대형 / 중형 / 소형 매장 분류</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 오른쪽: 매장 유형 */}
                  <div className="w-48">
                    <div className="text-xs text-white/40 mb-2">Store Types</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                        <span className="text-sm text-white/70">대형 (Large)</span>
                        <span className="text-sm font-mono text-white/50">High Vol.</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                        <span className="text-sm text-white/70">중형 (Medium)</span>
                        <span className="text-sm font-mono text-white/50">Mid Vol.</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                        <span className="text-sm text-white/70">소형 (Small)</span>
                        <span className="text-sm font-mono text-white/50">Low Vol.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Methodology 탭 */}
            {methodTab === "method" && (
              <motion.div
                key="method"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h4 className="text-base font-semibold text-white mb-3">Cohort Definition & Analysis</h4>

                <div className="flex gap-6">
                  {/* 코호트 정의 */}
                  <div className="flex-1">
                    <div className="text-xs text-white/40 mb-2">7 Cohorts by First-Month Store Pattern</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 p-2 bg-white/5 rounded">
                        <span className="font-mono text-white/50 w-10">111</span>
                        <span className="text-white/70">대형 + 중형 + 소형</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white/5 rounded">
                        <span className="font-mono text-white/50 w-10">110</span>
                        <span className="text-white/70">대형 + 중형</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white/5 rounded">
                        <span className="font-mono text-white/50 w-10">101</span>
                        <span className="text-white/70">대형 + 소형</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white/5 rounded">
                        <span className="font-mono text-white/50 w-10">100</span>
                        <span className="text-white/70">대형 Only</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white/5 rounded">
                        <span className="font-mono text-white/50 w-10">010</span>
                        <span className="text-white/70">중형 Only</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white/5 rounded">
                        <span className="font-mono text-white/50 w-10">001</span>
                        <span className="text-white/70">소형 Only</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white/5 rounded">
                        <span className="font-mono text-white/50 w-10">011</span>
                        <span className="text-white/70">중형 + 소형</span>
                      </div>
                    </div>
                  </div>

                  {/* 분석 방법 - 호버 툴팁 */}
                  <div className="w-80">
                    <div className="text-xs text-white/40 mb-2">Statistical Test <span className="text-white/30">(hover for details)</span></div>
                    <div className="space-y-2 text-sm">
                      {/* Method + Chi-Square 값 */}
                      <div className="group relative">
                        <div className="relative p-2 bg-white/5 rounded cursor-help hover:bg-white/10 transition-colors overflow-hidden">
                          {/* 하단 글로우 효과 - 일렁이는 애니메이션 */}
                          <motion.div
                            className="absolute inset-x-0 bottom-0 h-0 group-hover:h-full bg-gradient-to-t from-cyan-500/30 via-cyan-500/10 to-transparent pointer-events-none"
                            animate={{
                              opacity: [0.5, 1, 0.5],
                              y: [0, -4, 0],
                            }}
                            transition={{
                              duration: 2.5,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          />
                          <div className="relative flex justify-between items-start">
                            <div>
                              <div className="text-white/50 text-xs">Method</div>
                              <div className="text-white/80">Chi-Square Independence Test</div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-white">χ² = 106.02</div>
                              <div className="text-xs text-white/40">df = 24</div>
                            </div>
                          </div>
                        </div>
                        <div className="absolute right-full top-0 mr-2 w-80 p-3 bg-slate-800 border border-white/20 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                          <div className="text-sm font-medium text-white mb-2">카이제곱 독립성 검정이란?</div>
                          <p className="text-xs text-white/70 leading-relaxed mb-2">
                            두 변수(코호트 유형 vs 고객 등급) 사이에 <span className="text-white">연관성이 있는지</span> 확인하는 통계 방법입니다.
                          </p>
                          <div className="text-xs border-t border-white/10 pt-2 mt-2 mb-2">
                            <div className="text-white/50 mb-1">자유도 df = 24 <span className="text-white/30">(Degrees of Freedom)</span></div>
                            <div className="text-white/80 bg-white/5 p-2 rounded text-[11px]">
                              <div className="text-white/60 mb-1">왜 &quot;자유&quot;도 인가?</div>
                              <div>예: 합이 10인 숫자 3개를 고르면</div>
                              <div>→ 2개는 <span className="text-cyan-400">자유롭게</span> 정할 수 있지만</div>
                              <div>→ 마지막 1개는 자동 결정 (10-나머지)</div>
                              <div className="mt-1 pt-1 border-t border-white/10">자유도 = <span className="text-cyan-400">자유롭게 정할 수 있는 값의 개수</span></div>
                            </div>
                            <div className="text-white/60 bg-white/5 p-2 rounded text-[11px] mt-2">
                              <div>이 분석에서는:</div>
                              <div>7개 코호트 × 5개 등급 표에서</div>
                              <div>자유롭게 채울 수 있는 칸 = <span className="text-cyan-400 font-medium">(7-1)×(5-1) = 24</span></div>
                            </div>
                          </div>
                          <div className="text-xs text-white/50 border-t border-white/10 pt-2">
                            <div>• χ² = 106.02 (임계값 51.2의 2배 초과)</div>
                            <div>• 자유도 24 기준 임계값을 크게 넘음</div>
                            <div className="text-emerald-400 mt-1 font-medium">→ 귀무가설 강력 기각!</div>
                          </div>
                        </div>
                      </div>

                      {/* p-value */}
                      <div className="group relative">
                        <div className="relative p-2 bg-white/5 rounded cursor-help hover:bg-white/10 transition-colors overflow-hidden">
                          {/* 하단 글로우 효과 - 일렁이는 애니메이션 */}
                          <motion.div
                            className="absolute inset-x-0 bottom-0 h-0 group-hover:h-full bg-gradient-to-t from-emerald-500/30 via-emerald-500/10 to-transparent pointer-events-none"
                            animate={{
                              opacity: [0.5, 1, 0.5],
                              y: [0, -4, 0],
                            }}
                            transition={{
                              duration: 2.8,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: 0.3,
                            }}
                          />
                          <div className="relative flex justify-between items-center">
                            <div>
                              <div className="text-white/50 text-xs">Significance Level</div>
                              <div className="text-white/80">p-value &lt; 0.001</div>
                            </div>
                            <div className="px-2 py-1 bg-emerald-500/20 rounded text-emerald-400 text-xs font-medium">
                              99.9% 신뢰
                            </div>
                          </div>
                        </div>
                        <div className="absolute right-full top-0 mr-2 w-80 p-3 bg-slate-800 border border-white/20 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                          <div className="text-sm font-medium text-white mb-2">p-value란?</div>
                          <p className="text-xs text-white/70 leading-relaxed mb-2">
                            귀무가설이 참일 때, 현재 결과가 우연히 나올 확률입니다.
                          </p>
                          <div className="text-xs border-t border-white/10 pt-2 mt-2 mb-2">
                            <div className="text-white/50 mb-1">귀무가설 (Null Hypothesis)</div>
                            <div className="text-white/80 bg-white/5 p-2 rounded">
                              &quot;초기 매장 방문 패턴과 최종 등급은 <span className="text-white font-medium">관계가 없다</span>&quot;
                            </div>
                            <div className="text-white/40 mt-1 text-[10px]">= 어떤 매장을 가든 VIP가 될 확률은 동일하다</div>
                          </div>
                          <div className="text-xs text-white/50 border-t border-white/10 pt-2">
                            <div>• p &lt; 0.001 = 우연일 확률 0.1% 미만</div>
                            <div>• 1000번 실험해도 999번 이상 같은 결과</div>
                            <div className="text-emerald-400 mt-1 font-medium">→ 귀무가설 기각: 패턴과 등급은 관계가 있다!</div>
                          </div>
                        </div>
                      </div>

                      {/* Dependent Variable */}
                      <div className="group relative">
                        <div className="relative p-2 bg-white/5 rounded cursor-help hover:bg-white/10 transition-colors overflow-hidden">
                          {/* 하단 글로우 효과 - 일렁이는 애니메이션 */}
                          <motion.div
                            className="absolute inset-x-0 bottom-0 h-0 group-hover:h-full bg-gradient-to-t from-blue-500/30 via-blue-500/10 to-transparent pointer-events-none"
                            animate={{
                              opacity: [0.5, 1, 0.5],
                              y: [0, -4, 0],
                            }}
                            transition={{
                              duration: 2.6,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: 0.5,
                            }}
                          />
                          <div className="relative">
                            <div className="text-white/50 text-xs">Dependent Variable</div>
                            <div className="text-white/80">5-Grade Classification</div>
                            <div className="text-xs text-white/40 mt-1">VIP / 충성 / 활성 / 위험 / 이탈</div>
                          </div>
                        </div>
                        <div className="absolute right-full top-0 mr-2 w-72 p-3 bg-slate-800 border border-white/20 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                          <div className="text-sm font-medium text-white mb-2">종속변수: 고객 등급</div>
                          <p className="text-xs text-white/70 leading-relaxed mb-2">
                            18개월 후 고객이 어떤 등급으로 분류되었는지를 나타내는 <span className="text-white">결과 변수</span>입니다.
                          </p>
                          <div className="text-xs space-y-1 border-t border-white/10 pt-2 mt-2">
                            <div className="flex justify-between"><span className="text-yellow-400">VIP</span><span className="text-white/50">상위 2.8%</span></div>
                            <div className="flex justify-between"><span className="text-green-400">충성</span><span className="text-white/50">15.7%</span></div>
                            <div className="flex justify-between"><span className="text-blue-400">활성</span><span className="text-white/50">39.6%</span></div>
                            <div className="flex justify-between"><span className="text-orange-400">위험</span><span className="text-white/50">20.5%</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">이탈</span><span className="text-white/50">21.4%</span></div>
                          </div>
                        </div>
                      </div>

                      {/* Effect Size */}
                      <div className="group relative">
                        <div className="relative p-2 bg-white/5 rounded cursor-help hover:bg-white/10 transition-colors overflow-hidden">
                          {/* 하단 글로우 효과 - 일렁이는 애니메이션 */}
                          <motion.div
                            className="absolute inset-x-0 bottom-0 h-0 group-hover:h-full bg-gradient-to-t from-yellow-500/30 via-yellow-500/10 to-transparent pointer-events-none"
                            animate={{
                              opacity: [0.5, 1, 0.5],
                              y: [0, -4, 0],
                            }}
                            transition={{
                              duration: 2.4,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: 0.7,
                            }}
                          />
                          <div className="relative flex justify-between items-center">
                            <div>
                              <div className="text-white/50 text-xs">Effect Size</div>
                              <div className="text-white/80">Cramér&apos;s V = 0.146</div>
                            </div>
                            <div className="text-xs text-white/40">중간 효과</div>
                          </div>
                        </div>
                        <div className="absolute right-full top-0 mr-2 w-80 p-3 bg-slate-800 border border-white/20 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                          <div className="text-sm font-medium text-white mb-2">χ² vs 효과 크기, 뭐가 다른가?</div>

                          <div className="text-xs bg-white/5 p-2 rounded mb-2">
                            <div className="flex gap-3">
                              <div className="flex-1">
                                <div className="text-cyan-400 font-medium">χ² = 106</div>
                                <div className="text-white/50 text-[10px]">&quot;확실한가?&quot;</div>
                                <div className="text-white/70 mt-1">관계가 우연이 아님을<br/>99.9% 확신</div>
                              </div>
                              <div className="w-px bg-white/10" />
                              <div className="flex-1">
                                <div className="text-yellow-400 font-medium">V = 0.15</div>
                                <div className="text-white/50 text-[10px]">&quot;얼마나 강한가?&quot;</div>
                                <div className="text-white/70 mt-1">관계의 강도는<br/>중간 수준 (15%)</div>
                              </div>
                            </div>
                          </div>

                          <div className="text-xs text-white/60 bg-white/5 p-2 rounded mb-2">
                            <div className="text-white/80 mb-1">비유: 신약 임상시험</div>
                            <div>• χ² → &quot;이 약이 효과 있다는 게 확실해?&quot; → <span className="text-cyan-400">네, 확실해요</span></div>
                            <div>• V → &quot;얼마나 효과 있어?&quot; → <span className="text-yellow-400">15% 정도요</span></div>
                          </div>

                          <div className="text-xs border-t border-white/10 pt-2">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex-1 h-2 bg-white/10 rounded overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500" />
                              </div>
                            </div>
                            <div className="flex justify-between text-white/40 text-[10px]">
                              <span>0.1 작음</span>
                              <span className="text-yellow-400">0.15 ●</span>
                              <span>0.3 중간</span>
                              <span>0.5 큼</span>
                            </div>
                            <div className="text-white/60 mt-2">
                              → 작지 않음! 마케팅에서 15% 설명력은 <span className="text-yellow-400 font-medium">실용적 가치</span> 있음
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>


      {/* Cohort Cards - 높이 고정, 인라인 확장 */}
      <div className="h-[300px] mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 items-stretch h-full">
          {STORE_PATTERN_COHORTS.map((cohort) => {
            const isSelected = selectedCohort === cohort.id;
            const customerPct = ((cohort.customerCount / totalCustomers) * 100).toFixed(1);

            return (
              <motion.div
                key={cohort.id}
                layout
                onClick={() => setSelectedCohort(isSelected ? null : cohort.id)}
                className={`flex-shrink-0 rounded-lg border cursor-pointer transition-all h-full ${
                  isSelected
                    ? "border-white/40 bg-white/15"
                    : "border-white/10 bg-white/5 hover:bg-white/8"
                }`}
                style={{ minWidth: isSelected ? "min(780px, 65vw)" : "120px" }}
                animate={{ width: isSelected ? 780 : 120 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="p-3 h-full flex flex-col">
                  {/* 코드 + 유형 */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-3 h-3 rounded-full ring-2 ring-white/20"
                        style={{ backgroundColor: cohort.color }}
                      />
                      <span className="text-[10px] font-mono text-white/50">코드{cohort.id}</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/60">{cohort.type}</span>
                  </div>
                  {/* 코호트 이름 + 특성 (확장 시) */}
                  <div className="text-sm font-bold text-white mb-0.5">
                    {cohort.name}
                    {isSelected && <span className="font-normal text-white/50"> : {cohort.traits}</span>}
                  </div>
                  {/* 패턴 */}
                  {!isSelected && <div className="text-[10px] text-white/40 mb-1.5">{cohort.pattern}</div>}

                  {/* 접힌 상태: 추가 정보 세로로 표시 */}
                  {!isSelected && (
                    <div className="flex-1 flex flex-col justify-end">
                      <div className="space-y-1.5 mt-auto">
                        {/* 고객수 */}
                        <div className="text-center py-1.5 bg-white/5 rounded">
                          <div className="text-sm font-bold text-white">{cohort.customerCount}명</div>
                          <div className="text-[9px] text-white/40">{customerPct}%</div>
                        </div>
                        {/* VIP 전환율 */}
                        <div className="text-center py-1.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded">
                          <div className="text-sm font-bold" style={{ color: GRADE_COLORS.vip }}>{cohort.gradeDistribution.vip.toFixed(1)}%</div>
                          <div className="text-[9px] text-white/40">VIP 전환</div>
                        </div>
                        {/* 18개월 리텐션 */}
                        <div className="text-center py-1.5 bg-green-500/10 rounded">
                          <div className="text-sm font-bold text-green-400">{cohort.retention18m}%</div>
                          <div className="text-[9px] text-white/40">18개월 유지</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 확대 시: 구매행동 + 네트워크 (컴팩트) */}
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-2 pt-2 border-t border-white/20 flex-1 overflow-hidden"
                    >
                      {/* 상단: 고객수 및 비율 */}
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-white">{cohort.customerCount.toLocaleString()}명</span>
                          <span className="text-sm text-white/50">/ 2,500명</span>
                        </div>
                        <div className="px-2 py-0.5 bg-white/10 rounded-full">
                          <span className="text-sm font-medium text-white/70">{customerPct}%</span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        {/* 왼쪽: 구매행동 (컴팩트) */}
                        <div className="flex-1">
                          <div className="text-xs text-white/50 mb-1">첫 1개월 구매행동</div>
                          <div className="grid grid-cols-5 gap-1.5 text-center">
                            <div className="bg-white/5 rounded p-1.5">
                              <div className="text-base font-bold text-blue-400">{cohort.firstMonthVisits.toFixed(1)}</div>
                              <div className="text-[10px] text-white/50">방문</div>
                            </div>
                            <div className="bg-white/5 rounded p-1.5">
                              <div className="text-base font-bold text-green-400">${cohort.firstMonthSales}</div>
                              <div className="text-[10px] text-white/50">매출</div>
                            </div>
                            <div className="bg-white/5 rounded p-1.5">
                              <div className="text-base font-bold text-purple-400">{cohort.categoryCount.toFixed(1)}</div>
                              <div className="text-[10px] text-white/50">카테고리</div>
                            </div>
                            <div className="bg-white/5 rounded p-1.5">
                              <div className="text-base font-bold text-yellow-400">{cohort.discountRate.toFixed(0)}%</div>
                              <div className="text-[10px] text-white/50">할인</div>
                            </div>
                            <div className="bg-white/5 rounded p-1.5">
                              <div className="text-base font-bold text-white">{cohort.basketSize.toFixed(1)}</div>
                              <div className="text-[10px] text-white/50">장바구니</div>
                            </div>
                          </div>
                          {/* 등급 전환율 바 */}
                          <div className="mt-2">
                            <div className="text-[10px] text-white/40 mb-1">18개월 후 등급 전환</div>
                            <div className="h-5 rounded overflow-hidden flex relative">
                              {Object.entries(cohort.gradeDistribution).map(([grade, pct]) => (
                                <div
                                  key={grade}
                                  className="h-full flex items-center justify-center text-[9px] font-medium relative group/bar"
                                  style={{
                                    width: `${Math.max(pct, pct > 0 ? 3 : 0)}%`,
                                    backgroundColor: GRADE_COLORS[grade],
                                    color: pct >= 8 ? "white" : "transparent",
                                  }}
                                >
                                  {pct >= 8 ? `${pct.toFixed(0)}%` : ""}
                                  {/* 작은 비율 툴팁 */}
                                  {pct > 0 && pct < 8 && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none z-10">
                                      <div className="bg-black/90 border border-white/20 rounded px-1.5 py-0.5 text-[9px] text-white whitespace-nowrap">
                                        {GRADE_LABELS[grade]} {pct.toFixed(1)}%
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2 mt-1">
                              {Object.entries(GRADE_LABELS).map(([grade, label]) => (
                                <div key={grade} className="flex items-center gap-1">
                                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: GRADE_COLORS[grade] }} />
                                  <span className="text-[9px] text-white/40">{label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* 오른쪽: 매장 흐름 시각화 */}
                        <div className="w-[320px] flex flex-col">
                          <div className="text-xs text-white/50 mb-1">매장 방문 흐름</div>
                          <div className="h-[140px] rounded bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10 overflow-hidden">
                            <CohortNetworkCanvas key={`${cohort.id}-canvas`} cohort={cohort} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 데이터 뷰 */}
      <div className="space-y-3 flex-1">

        {/* 1. 리텐션 (맨 위) */}
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <h4 className="text-sm font-semibold text-white/60 mb-2">📈 18개월 리텐션</h4>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-24" />
              {RETENTION_DATA["111"].retention.map((r) => (
                <div key={r.period} className="flex-1 text-center text-[9px] text-white/40">
                  {r.period}
                </div>
              ))}
            </div>
            {STORE_PATTERN_COHORTS.map((cohort) => {
              const retentionInfo = RETENTION_DATA[cohort.id];
              const isSelected = selectedCohort === cohort.id;
              return (
                <motion.div
                  key={cohort.id}
                  className={`flex items-center gap-1.5 p-1 rounded transition-all ${
                    isSelected ? "bg-white/10 ring-2 ring-white/30" : "opacity-40"
                  }`}
                  animate={{ scale: isSelected ? 1.02 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-24 text-[10px] text-white/70 truncate flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cohort.color }} />
                    {cohort.name}
                  </div>
                  {retentionInfo?.retention.map((r, i) => {
                    const rate = r.rate;
                    let bgColor = "rgba(239, 68, 68, 0.6)";
                    if (rate >= 90) bgColor = "rgba(34, 197, 94, 0.8)";
                    else if (rate >= 80) bgColor = "rgba(132, 204, 22, 0.7)";
                    else if (rate >= 70) bgColor = "rgba(234, 179, 8, 0.6)";
                    else if (rate >= 60) bgColor = "rgba(249, 115, 22, 0.5)";
                    return (
                      <motion.div
                        key={i}
                        className="flex-1 h-7 rounded flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: bgColor }}
                        initial={false}
                        animate={{
                          opacity: isSelected ? 1 : 0.6,
                          scale: isSelected ? 1 : 0.95,
                        }}
                        transition={{
                          duration: 0.3,
                          delay: isSelected ? i * 0.05 : 0,
                          ease: "easeOut"
                        }}
                      >
                        {rate.toFixed(0)}%
                      </motion.div>
                    );
                  })}
                </motion.div>
              );
            })}
          </div>
        </div>


      </div>
    </div>
  );
}
