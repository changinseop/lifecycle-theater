/**
 * Overview 페이지 데이터 (보고서 기준)
 * FINAL_REPORT_WITH_VISUALS.md 기반 정확한 통계
 */

// ==========================================
// 핵심 상수 (통계적 근거 포함)
// ==========================================
export const CONSTANTS = {
  // 이탈 임계값: 25일
  CHURN_THRESHOLD: 25,
  CHURN_REASON: "방문 간격 95%ile = 22일 → 보수적으로 25일 설정",

  // 위험 임계값: 8일
  RISK_THRESHOLD: 8,
  RISK_REASON: "8일 이상 미방문 시 이탈 확률 5.6배 급증",

  // VIP 기준: 362회
  VIP_VISIT_COUNT: 362,
  VIP_REASON: "이탈 0회 고객 중 상위 15%",

  // 전체 고객
  TOTAL_CUSTOMERS: 2500,
  TOTAL_VISITS: 225033,
  TOTAL_TRANSACTIONS: 2595732,
  PERIOD_MONTHS: 24,
};

// ==========================================
// 방문 간격 분포 (히스토그램용)
// ==========================================
export const VISIT_INTERVAL_DISTRIBUTION = {
  // 백분위수
  percentiles: {
    p25: 2.0,
    p50: 3.0, // 중앙값
    p75: 7.0,
    p80: 8.0,
    p90: 14.0,
    p95: 22.0,
    p99: 61.0,
  },
  // 평균
  mean: 5.2,
  // 히스토그램 데이터 (0~50일 구간)
  histogram: [
    { range: "0-3일", count: 116145, percentage: 52.3 },
    { range: "3-5일", count: 34255, percentage: 15.4 },
    { range: "5-7일", count: 23359, percentage: 10.5 },
    { range: "7-8일", count: 7148, percentage: 3.2 },
    { range: "8-10일", count: 9338, percentage: 4.2 },
    { range: "10-14일", count: 11981, percentage: 5.4 },
    { range: "14-21일", count: 8976, percentage: 4.0 },
    { range: "21-25일", count: 2610, percentage: 1.2 },
    { range: "25일+", count: 8296, percentage: 3.7 },
  ],
};

// ==========================================
// 8일 기준 근거: 이탈 확률 급증
// ==========================================
export const RISK_THRESHOLD_EVIDENCE = {
  title: "왜 8일인가?",
  summary: "8일 전후로 이탈 확률이 5.6배 급증",
  data: [
    { interval: "0-3일", churnProb: 2.0, count: 116145 },
    { interval: "3-5일", churnProb: 3.2, count: 34255 },
    { interval: "5-7일", churnProb: 4.6, count: 23359 },
    { interval: "7-8일", churnProb: 6.4, count: 7148, highlight: true },
    { interval: "8-10일", churnProb: 6.9, count: 9338 },
    { interval: "10-14일", churnProb: 10.5, count: 11981 },
    { interval: "14-21일", churnProb: 14.4, count: 8976 },
    { interval: "21-25일", churnProb: 20.3, count: 2610 },
    { interval: "25일+", churnProb: 30.9, count: 8296 },
  ],
  comparison: {
    under8: { label: "8일 미만", churnProb: 2.6 },
    over8: { label: "8일 이상", churnProb: 14.7 },
    multiplier: 5.6,
  },
};

// ==========================================
// 5등급 분류 체계 (보고서 기준 정확한 수치)
// ==========================================
export interface GradeInfo {
  id: string;
  label: string;
  emoji: string;
  color: string;
  count: number;
  percentage: number;
  definition: string;
  criteria: string[];
  avgVisits: number;
  avgSales: number;
  avgInterval: number;
  churnCount: number;
}

export const GRADES: GradeInfo[] = [
  {
    id: "vip",
    label: "VIP",
    emoji: "👑",
    color: "#fbbf24",
    count: 70,
    percentage: 2.8,
    definition: "이탈 0회 + 방문 362회 이상",
    criteria: ["25일 이상 공백 0회", "방문 상위 15%"],
    avgVisits: 548.2,
    avgSales: 10688,
    avgInterval: 2.0,
    churnCount: 0,
  },
  {
    id: "loyal",
    label: "충성",
    emoji: "💚",
    color: "#22c55e",
    count: 393,
    percentage: 15.7,
    definition: "이탈 0회 + 방문 362회 미만",
    criteria: ["25일 이상 공백 0회", "방문 하위 85%"],
    avgVisits: 199.6,
    avgSales: 6712,
    avgInterval: 4.2,
    churnCount: 0,
  },
  {
    id: "active",
    label: "활성",
    emoji: "🙂",
    color: "#3b82f6",
    count: 990,
    percentage: 39.6,
    definition: "이탈 1회+ + 마지막 방문 8일 미만",
    criteria: ["25일 이상 공백 경험 있음", "최근 8일 내 방문"],
    avgVisits: 101.6,
    avgSales: 2962,
    avgInterval: 13.4,
    churnCount: 4.2,
  },
  {
    id: "risk",
    label: "위험",
    emoji: "😰",
    color: "#f97316",
    count: 513,
    percentage: 20.5,
    definition: "이탈 1회+ + 마지막 방문 8-24일",
    criteria: ["25일 이상 공백 경험 있음", "8-24일 미방문 중"],
    avgVisits: 66.1,
    avgSales: 2014,
    avgInterval: 19.6,
    churnCount: 5.5,
  },
  {
    id: "churn",
    label: "이탈",
    emoji: "👻",
    color: "#6b7280",
    count: 534,
    percentage: 21.4,
    definition: "이탈 1회+ + 마지막 방문 25일 이상",
    criteria: ["25일 이상 공백 경험 있음", "25일 이상 미방문 중"],
    avgVisits: 47.1,
    avgSales: 1322,
    avgInterval: 32.8,
    churnCount: 6.2,
  },
];

// ==========================================
// 이탈 경험 분포
// ==========================================
export const CHURN_EXPERIENCE = {
  noChurn: {
    count: 463,
    percentage: 18.5,
    description: "이탈 0회 → VIP 또는 충성 후보",
  },
  hasChurn: {
    count: 2037,
    percentage: 81.5,
    description: "이탈 1회+ → 활성/위험/이탈 분류",
  },
};

// ==========================================
// 전체 방문 통계 (VIP 기준 설명용)
// ==========================================
export const VISIT_STATISTICS = {
  total: {
    mean: 125.3,
    median: 89,
    p15: 42, // 하위 15%
    p85: 362, // 상위 15% (VIP 기준)
  },
  noChurnOnly: {
    count: 463,
    mean: 247.8,
    median: 198,
    p85: 362, // VIP 기준선
    vipCount: 70,
    loyalCount: 393,
  },
};

// ==========================================
// 통계적 검증 결과
// ==========================================
export const STATISTICAL_VALIDATION = {
  kruskalWallis: {
    visitCount: { h: 186642, pValue: "< 0.001" },
    totalSales: { h: 967.72, pValue: "< 0.001" },
  },
  mannWhitneyU: [
    { comparison: "VIP vs 충성", pValue: "< 0.001", visitDiff: "548 vs 200" },
    { comparison: "충성 vs 활성", pValue: "< 0.001", visitDiff: "200 vs 102" },
    { comparison: "활성 vs 위험", pValue: "< 0.001", visitDiff: "102 vs 66" },
    { comparison: "위험 vs 이탈", pValue: "< 0.001", visitDiff: "66 vs 47" },
  ],
  conclusion: "모든 인접 등급이 통계적으로 유의미하게 다름 (p < 0.001)",
};

// ==========================================
// VIP 특성: "좀비 프리퀀시"
// ==========================================
export const VIP_PROFILE = {
  title: "좀비 프리퀀시 (Zombie Frequency)",
  subtitle: 'VIP ≠ "많이 사는 고객", VIP = "자주 오는 고객"',
  comparison: {
    vip: {
      totalSales: 10952,
      totalVisits: 699,
      avgItems: 6,
      avgAmount: 15.7,
      smallPurchaseRate: 64, // 1~3개 구매 비율
    },
    loyal: {
      totalSales: 6860,
      totalVisits: 217,
      avgItems: 11,
      avgAmount: 31.6,
      smallPurchaseRate: 42,
    },
  },
  insight: "VIP는 1회 방문당 절반만 구매하지만, 3.2배 자주 방문하여 1.6배 더 많은 매출",
};

// ==========================================
// 복귀율 (이탈 횟수별)
// ==========================================
export const RECOVERY_RATES = [
  { churnCount: 1, recoveryRate: 73.5, count: 268 },
  { churnCount: 2, recoveryRate: 65.6, count: 244 },
  { churnCount: 3, recoveryRate: 57.3, count: 211 },
  { churnCount: 4, recoveryRate: 48.1, count: 233 },
  { churnCount: 5, recoveryRate: 43.6, count: 178 },
  { churnCount: 6, recoveryRate: 39.3, count: 142 },
  { churnCount: "7+", recoveryRate: 40.8, count: 298 },
];

// ==========================================
// 타임라인 섹션 정의
// ==========================================
export interface TimelineSection {
  id: string;
  step: number;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  keyQuestion: string;
  keyAnswer: string;
}

export const TIMELINE_SECTIONS: TimelineSection[] = [
  {
    id: "intro",
    step: 1,
    title: "어떻게 변하는가?",
    subtitle: "분석의 출발점",
    emoji: "🎯",
    color: "#8b5cf6",
    keyQuestion: "RFM? 객단가?",
    keyAnswer: "방문 행위 자체에 집중",
  },
  {
    id: "overview",
    step: 2,
    title: "분석개요",
    subtitle: "데이터셋 소개",
    emoji: "📋",
    color: "#64748b",
    keyQuestion: "무엇을 분석했나?",
    keyAnswer: "Dunnhumby 고객 여정 데이터",
  },
  {
    id: "churn-definition",
    step: 3,
    title: "이탈이란?",
    subtitle: "25일의 근거",
    emoji: "📊",
    color: "#ef4444",
    keyQuestion: "언제 이탈인가?",
    keyAnswer: "25일 이상 미방문 = 이탈",
  },
  {
    id: "vip-definition",
    step: 4,
    title: "VIP는 누구?",
    subtitle: "상위 15%의 의미",
    emoji: "👑",
    color: "#fbbf24",
    keyQuestion: "자주 오면 VIP?",
    keyAnswer: "이탈 0회 + 상위 15%",
  },
  {
    id: "risk-threshold",
    step: 5,
    title: "언제 개입해야 하는가?",
    subtitle: "위험 신호의 근거",
    emoji: "⚠️",
    color: "#f97316",
    keyQuestion: "언제 위험?",
    keyAnswer: "8일+ → 이탈 확률 5.6배",
  },
  {
    id: "classification",
    step: 6,
    title: "변화의 기준은?",
    subtitle: "5등급 분류 체계",
    emoji: "🌳",
    color: "#22c55e",
    keyQuestion: "어떻게 분류?",
    keyAnswer: "이탈 경험 → 경과일 기준",
  },
  {
    id: "validation",
    step: 7,
    title: "분류가 유의미한가?",
    subtitle: "통계적 검증",
    emoji: "✅",
    color: "#3b82f6",
    keyQuestion: "진짜 다른 그룹?",
    keyAnswer: "모든 등급 p < 0.001",
  },
  {
    id: "next",
    step: 8,
    title: "왜 변하는가?",
    subtitle: "상관 효과",
    emoji: "🔮",
    color: "#ec4899",
    keyQuestion: "이제 뭘 볼까?",
    keyAnswer: "상관 효과 분석 →",
  },
];
