/**
 * Overview 대시보드 데이터
 * 전체 고객 여정 요약 및 핵심 인사이트
 */

import { CustomerGrade, StoreSize } from "./store-experience";

// 등급별 고객 분포
export interface GradeDistribution {
  grade: CustomerGrade;
  count: number;
  percentage: number;
  avgLtv: number;
  survivalRate: number;
  color: string;
  emoji: string;
  label: string;
}

export const GRADE_DISTRIBUTION: GradeDistribution[] = [
  { grade: "vip", count: 107, percentage: 4.3, avgLtv: 8920, survivalRate: 98, color: "#fbbf24", emoji: "👑", label: "VIP" },
  { grade: "loyal", count: 448, percentage: 17.9, avgLtv: 4560, survivalRate: 92, color: "#22c55e", emoji: "💚", label: "충성" },
  { grade: "active", count: 875, percentage: 35.0, avgLtv: 2180, survivalRate: 78, color: "#3b82f6", emoji: "🙂", label: "활성" },
  { grade: "risk", count: 625, percentage: 25.0, avgLtv: 890, survivalRate: 45, color: "#f97316", emoji: "😰", label: "위험" },
  { grade: "churn", count: 445, percentage: 17.8, avgLtv: 320, survivalRate: 0, color: "#6b7280", emoji: "👻", label: "이탈" },
];

// 등급 간 전환 매트릭스
export interface TransitionFlow {
  from: CustomerGrade;
  to: CustomerGrade;
  count: number;
  probability: number;
}

export const TRANSITION_FLOWS: TransitionFlow[] = [
  // VIP 유지/이동
  { from: "vip", to: "vip", count: 98, probability: 91.6 },
  { from: "vip", to: "loyal", count: 7, probability: 6.5 },
  { from: "vip", to: "active", count: 2, probability: 1.9 },

  // 충성 →
  { from: "loyal", to: "vip", count: 45, probability: 10.0 },
  { from: "loyal", to: "loyal", count: 358, probability: 80.0 },
  { from: "loyal", to: "active", count: 36, probability: 8.0 },
  { from: "loyal", to: "risk", count: 9, probability: 2.0 },

  // 활성 →
  { from: "active", to: "vip", count: 18, probability: 2.1 },
  { from: "active", to: "loyal", count: 105, probability: 12.0 },
  { from: "active", to: "active", count: 525, probability: 60.0 },
  { from: "active", to: "risk", count: 175, probability: 20.0 },
  { from: "active", to: "churn", count: 52, probability: 5.9 },

  // 위험 →
  { from: "risk", to: "loyal", count: 25, probability: 4.0 },
  { from: "risk", to: "active", count: 94, probability: 15.0 },
  { from: "risk", to: "risk", count: 250, probability: 40.0 },
  { from: "risk", to: "churn", count: 256, probability: 41.0 },

  // 이탈 →
  { from: "churn", to: "active", count: 22, probability: 4.9 },
  { from: "churn", to: "churn", count: 423, probability: 95.1 },
];

// 핵심 분기점 (Bifurcation Points)
export interface BifurcationPoint {
  id: string;
  title: string;
  emoji: string;
  description: string;
  impact: string;
  impactValue: number;
  condition: string;
  yesOutcome: { grade: CustomerGrade; probability: number };
  noOutcome: { grade: CustomerGrade; probability: number };
}

export const BIFURCATION_POINTS: BifurcationPoint[] = [
  {
    id: "large_store",
    title: "대형매장 경험",
    emoji: "🛒",
    description: "첫 3개월 내 대형매장 방문 여부",
    impact: "생존율 +30%p",
    impactValue: 30,
    condition: "3개월 내 대형매장 1회 이상",
    yesOutcome: { grade: "loyal", probability: 72 },
    noOutcome: { grade: "churn", probability: 58 },
  },
  {
    id: "multi_store",
    title: "다매장 경험",
    emoji: "🔄",
    description: "2개 이상 매장 방문 여부",
    impact: "VIP 확률 10x",
    impactValue: 10,
    condition: "6개월 내 2개+ 매장 방문",
    yesOutcome: { grade: "vip", probability: 12 },
    noOutcome: { grade: "risk", probability: 45 },
  },
  {
    id: "early_frequency",
    title: "초기 방문 빈도",
    emoji: "📅",
    description: "첫 달 방문 횟수",
    impact: "충성 전환 3x",
    impactValue: 3,
    condition: "첫 달 3회 이상 방문",
    yesOutcome: { grade: "loyal", probability: 45 },
    noOutcome: { grade: "active", probability: 60 },
  },
  {
    id: "category_diversity",
    title: "카테고리 다양성",
    emoji: "🏷️",
    description: "구매 카테고리 수",
    impact: "LTV +2.4x",
    impactValue: 2.4,
    condition: "5개+ 카테고리 구매",
    yesOutcome: { grade: "vip", probability: 8 },
    noOutcome: { grade: "active", probability: 55 },
  },
];

// 매장경험 영향 요약
export interface StoreImpactSummary {
  storeType: StoreSize;
  emoji: string;
  label: string;
  color: string;
  customerCount: number;
  vipRate: number;
  churnRate: number;
  avgLtv: number;
  survivalRate: number;
}

export const STORE_IMPACT_SUMMARY: StoreImpactSummary[] = [
  {
    storeType: "small",
    emoji: "🏪",
    label: "소형매장",
    color: "#f97316",
    customerCount: 892,
    vipRate: 0.8,
    churnRate: 58.5,
    avgLtv: 1842,
    survivalRate: 41.5,
  },
  {
    storeType: "medium",
    emoji: "🏬",
    label: "중형매장",
    color: "#3b82f6",
    customerCount: 1087,
    vipRate: 2.4,
    churnRate: 40.7,
    avgLtv: 3256,
    survivalRate: 59.3,
  },
  {
    storeType: "large",
    emoji: "🛒",
    label: "대형매장",
    color: "#22c55e",
    customerCount: 1608,
    vipRate: 4.6,
    churnRate: 28.1,
    avgLtv: 4892,
    survivalRate: 71.9,
  },
];

// 상관관계 매트릭스
export interface CorrelationItem {
  factor: string;
  vip: number;
  loyal: number;
  active: number;
  risk: number;
  churn: number;
}

export const CORRELATION_MATRIX: CorrelationItem[] = [
  { factor: "대형매장 경험", vip: 0.91, loyal: 0.82, active: 0.58, risk: 0.39, churn: 0.24 },
  { factor: "다매장 방문", vip: 0.97, loyal: 0.86, active: 0.62, risk: 0.41, churn: 0.29 },
  { factor: "초기 방문 빈도", vip: 0.85, loyal: 0.78, active: 0.55, risk: 0.32, churn: 0.18 },
  { factor: "카테고리 다양성", vip: 0.88, loyal: 0.72, active: 0.48, risk: 0.28, churn: 0.15 },
  { factor: "주말 방문", vip: 0.72, loyal: 0.65, active: 0.52, risk: 0.45, churn: 0.38 },
];

// 스토리 단계 정의
export interface StoryStep {
  id: number;
  title: string;
  subtitle: string;
  emoji: string;
  keyMessage: string;
  color: string;
}

export const STORY_STEPS: StoryStep[] = [
  {
    id: 1,
    title: "고객은 어디로 갔나?",
    subtitle: "2,500명의 24개월 여정",
    emoji: "🌊",
    keyMessage: "2,500명 중 107명(4.3%)만 VIP가 됩니다",
    color: "#8b5cf6",
  },
  {
    id: 2,
    title: "무엇이 갈랐나?",
    subtitle: "VIP와 이탈의 분기점",
    emoji: "🔀",
    keyMessage: "대형매장 경험이 생존율을 30%p 높입니다",
    color: "#ec4899",
  },
  {
    id: 3,
    title: "매장이 답이다",
    subtitle: "매장경험 → 등급 상관관계",
    emoji: "🏪",
    keyMessage: "대형매장 VIP 전환율은 소형의 5.8배",
    color: "#06b6d4",
  },
];

// 핵심 KPI
export interface KeyMetric {
  label: string;
  value: string;
  subValue: string;
  emoji: string;
  color: string;
  trend: "up" | "down" | "neutral";
}

export const KEY_METRICS: KeyMetric[] = [
  { label: "총 고객", value: "2,500", subValue: "24개월 추적", emoji: "👥", color: "#8b5cf6", trend: "neutral" },
  { label: "생존율", value: "56%", subValue: "1,400명 잔존", emoji: "💚", color: "#22c55e", trend: "up" },
  { label: "VIP 전환", value: "4.3%", subValue: "107명", emoji: "👑", color: "#fbbf24", trend: "up" },
  { label: "이탈율", value: "17.8%", subValue: "445명", emoji: "👻", color: "#6b7280", trend: "down" },
];
