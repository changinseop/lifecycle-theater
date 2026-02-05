/**
 * 고객 방문 패턴 클러스터 데이터
 * Dunnhumby Complete Journey 실제 데이터 분석 기반 (2,500명 고객)
 *
 * 매장 분류 기준 (보고서 기준):
 * - 대형: 고객 100명+ AND 제품 5,000개+ (61개)
 * - 중형: 고객 30-99명 AND 제품 200-5,000개 (49개)
 * - 소형: 고객 30명 미만 AND 제품 200개 미만 (472개)
 *
 * 코호트 분석 (신규 인사이트):
 * - 첫 1개월 방문 패턴 → 최종 등급 예측
 * - Chi2=106.02, p<0.001 (유의미한 예측력)
 * - 첫 1개월 다매장 탐험가 → VIP 27.8%, 이탈 0%
 */

import { CustomerGrade } from './store-experience';

// 클러스터 정의
export interface VisitCluster {
  id: string;
  name: string;
  description: string;
  condition: string;
  customerCount: number;
  icon: string;
  color: string;
  gradeDistribution: Record<CustomerGrade, number>;
  vipRate: number;
  churnRate: number;
  avgLtv: number;
  storePattern: { large: number; medium: number; small: number }; // 평균 방문 횟수
  peakHours: number[];
  weekdayRatio: number;
  topCategories: { name: string; percentage: number }[];
  avgVisitFrequency: number;
  avgBasket: number;
  // 실제 Dunnhumby 데이터 기반 구매 품목
  topProducts: { name: string; category: string; buyRate: number }[];
  purchaseInsight: string;
  // 코호트 분석: 첫 1개월 패턴 → 최종 등급 예측 (신규)
  cohortAnalysis: {
    firstMonthCount: number; // 첫 1개월에 이 패턴 보인 고객 수
    vipConversionRate: number; // VIP 전환율 (%)
    churnRate: number; // 이탈율 (%)
    predictivePower: string; // 예측력 설명
  };
}

// 6개 대표 클러스터 (실제 데이터 분석 결과)
export const VISIT_CLUSTERS: VisitCluster[] = [
  {
    id: 'explorer',
    name: '다매장 탐험가',
    description: '대형+중형+소형 모두 방문',
    condition: '대형1+ & 중형1+ & 소형1+',
    customerCount: 380,
    icon: '🧭',
    color: '#fbbf24',
    gradeDistribution: { vip: 17, loyal: 91, active: 160, risk: 61, churn: 51 },
    vipRate: 4.5,
    churnRate: 13.4,
    avgLtv: 4386,
    storePattern: { large: 89.4, medium: 55.2, small: 6.0 },
    peakHours: [10, 14, 18],
    weekdayRatio: 62,
    topCategories: [
      { name: 'GROCERY', percentage: 48 },
      { name: 'DRUG GM', percentage: 12 },
      { name: 'KIOSK-GAS', percentage: 10 },
      { name: 'PRODUCE', percentage: 7 },
    ],
    avgVisitFrequency: 150.6,
    avgBasket: 29,
    topProducts: [
      { name: 'FLUID MILK PRODUCTS', category: 'GROCERY', buyRate: 98 },
      { name: 'BAKED BREAD/BUNS/ROLLS', category: 'GROCERY', buyRate: 97 },
      { name: 'SOFT DRINKS', category: 'GROCERY', buyRate: 97 },
      { name: 'BAG SNACKS', category: 'GROCERY', buyRate: 96 },
      { name: 'CHEESE', category: 'GROCERY', buyRate: 96 },
    ],
    purchaseInsight: '가장 다양한 쇼핑 경험, 높은 VIP 전환율, 주중 대형매장 + 주말 탐색',
    cohortAnalysis: {
      firstMonthCount: 18,
      vipConversionRate: 27.8,
      churnRate: 0.0,
      predictivePower: '첫 1개월 다매장 방문 → VIP 전환 최고, 이탈 0%',
    },
  },
  {
    id: 'large_focused',
    name: '대형 집중형',
    description: '대형+중형 위주, 소형 미이용',
    condition: '대형1+ & 중형1+ & 소형0',
    customerCount: 1653,
    icon: '🛒',
    color: '#22c55e',
    gradeDistribution: { vip: 49, loyal: 266, active: 660, risk: 351, churn: 327 },
    vipRate: 3.0,
    churnRate: 19.8,
    avgLtv: 3193,
    storePattern: { large: 82.5, medium: 26.7, small: 0.0 },
    peakHours: [10, 15, 18],
    weekdayRatio: 58,
    topCategories: [
      { name: 'GROCERY', percentage: 51 },
      { name: 'DRUG GM', percentage: 13 },
      { name: 'MEAT', percentage: 7 },
      { name: 'PRODUCE', percentage: 6 },
    ],
    avgVisitFrequency: 109.1,
    avgBasket: 29,
    topProducts: [
      { name: 'FLUID MILK PRODUCTS', category: 'GROCERY', buyRate: 96 },
      { name: 'SOFT DRINKS', category: 'GROCERY', buyRate: 96 },
      { name: 'BAKED BREAD/BUNS/ROLLS', category: 'GROCERY', buyRate: 96 },
      { name: 'CHEESE', category: 'GROCERY', buyRate: 95 },
      { name: 'BAG SNACKS', category: 'GROCERY', buyRate: 94 },
    ],
    purchaseInsight: '전체 고객의 66%, 대형매장 원스톱 쇼핑, 안정적 패턴',
    cohortAnalysis: {
      firstMonthCount: 698,
      vipConversionRate: 4.4,
      churnRate: 17.2,
      predictivePower: '첫 1개월 대형+중형 방문 → 안정적 VIP 전환, 낮은 이탈',
    },
  },
  {
    id: 'large_medium',
    name: '대형+중형 복합',
    description: '중형 위주, 대형 가끔',
    condition: '대형1 & 중형2+ & 소형0',
    customerCount: 43,
    icon: '🏬',
    color: '#3b82f6',
    gradeDistribution: { vip: 0, loyal: 4, active: 17, risk: 3, churn: 19 },
    vipRate: 0.0,
    churnRate: 44.2,
    avgLtv: 1946,
    storePattern: { large: 1.0, medium: 61.2, small: 0.0 },
    peakHours: [11, 16, 20],
    weekdayRatio: 65,
    topCategories: [
      { name: 'GROCERY', percentage: 51 },
      { name: 'DRUG GM', percentage: 10 },
      { name: 'MEAT', percentage: 9 },
      { name: 'PRODUCE', percentage: 6 },
    ],
    avgVisitFrequency: 62.2,
    avgBasket: 31,
    topProducts: [
      { name: 'BAG SNACKS', category: 'GROCERY', buyRate: 95 },
      { name: 'SOFT DRINKS', category: 'GROCERY', buyRate: 93 },
      { name: 'BAKED BREAD/BUNS/ROLLS', category: 'GROCERY', buyRate: 90 },
      { name: 'CHEESE', category: 'GROCERY', buyRate: 88 },
      { name: 'BEEF', category: 'MEAT', buyRate: 88 },
    ],
    purchaseInsight: '중형매장 의존, 대형매장 경험 부족 → 이탈 위험 높음',
    cohortAnalysis: {
      firstMonthCount: 31,
      vipConversionRate: 0.0,
      churnRate: 35.5,
      predictivePower: '첫 1개월 대형 1회만 → 대형 경험 부족, 이탈 위험',
    },
  },
  {
    id: 'medium_focused',
    name: '중형 중심',
    description: '중형매장 위주 방문',
    condition: '대형0 & 중형2+',
    customerCount: 243,
    icon: '🏪',
    color: '#8b5cf6',
    gradeDistribution: { vip: 5, loyal: 17, active: 83, risk: 62, churn: 76 },
    vipRate: 2.1,
    churnRate: 31.3,
    avgLtv: 2024,
    storePattern: { large: 0.0, medium: 76.5, small: 3.0 },
    peakHours: [12, 17, 20],
    weekdayRatio: 68,
    topCategories: [
      { name: 'GROCERY', percentage: 49 },
      { name: 'DRUG GM', percentage: 14 },
      { name: 'KIOSK-GAS', percentage: 8 },
      { name: 'MEAT', percentage: 7 },
    ],
    avgVisitFrequency: 79.5,
    avgBasket: 25,
    topProducts: [
      { name: 'SOFT DRINKS', category: 'GROCERY', buyRate: 95 },
      { name: 'FLUID MILK PRODUCTS', category: 'GROCERY', buyRate: 95 },
      { name: 'BAKED BREAD/BUNS/ROLLS', category: 'GROCERY', buyRate: 94 },
      { name: 'BEEF', category: 'MEAT', buyRate: 88 },
      { name: 'BAG SNACKS', category: 'GROCERY', buyRate: 86 },
    ],
    purchaseInsight: '대형매장 미경험, 제품 다양성 부족 → 대형매장 유도 필요',
    cohortAnalysis: {
      firstMonthCount: 369,
      vipConversionRate: 0.5,
      churnRate: 27.9,
      predictivePower: '첫 1개월 중형만 → VIP 전환 극히 낮음, 대형 유도 필요',
    },
  },
  {
    id: 'medium_small',
    name: '중소 혼합',
    description: '소형 위주, 중형 가끔',
    condition: '대형0 & 중형1 & 소형1+',
    customerCount: 5,
    icon: '🔄',
    color: '#f97316',
    gradeDistribution: { vip: 0, loyal: 1, active: 1, risk: 1, churn: 2 },
    vipRate: 0.0,
    churnRate: 40.0,
    avgLtv: 883,
    storePattern: { large: 0.0, medium: 1.0, small: 26.8 },
    peakHours: [8, 12, 18],
    weekdayRatio: 75,
    topCategories: [
      { name: 'GROCERY', percentage: 56 },
      { name: 'DRUG GM', percentage: 14 },
      { name: 'PRODUCE', percentage: 7 },
      { name: 'MEAT-PCKGD', percentage: 5 },
    ],
    avgVisitFrequency: 27.8,
    avgBasket: 32,
    topProducts: [
      { name: 'FLUID MILK PRODUCTS', category: 'GROCERY', buyRate: 100 },
      { name: 'BAKED SWEET GOODS', category: 'GROCERY', buyRate: 100 },
      { name: 'SUGARS/SWEETNERS', category: 'GROCERY', buyRate: 80 },
      { name: 'EGGS', category: 'GROCERY', buyRate: 80 },
      { name: 'PNT BTR/JELLY/JAMS', category: 'GROCERY', buyRate: 80 },
    ],
    purchaseInsight: '소형매장 의존, 제한된 쇼핑 경험 → 이탈 위험 매우 높음',
    cohortAnalysis: {
      firstMonthCount: 5,
      vipConversionRate: 0.0,
      churnRate: 40.0,
      predictivePower: '첫 1개월 중소형만 → VIP 불가능, 이탈 위험 최고',
    },
  },
  {
    id: 'small_only',
    name: '소형 전용',
    description: '소형매장만 이용',
    condition: '대형0 & 중형0 & 소형1+',
    customerCount: 29,
    icon: '📍',
    color: '#6b7280',
    gradeDistribution: { vip: 0, loyal: 6, active: 6, risk: 7, churn: 10 },
    vipRate: 0.0,
    churnRate: 34.5,
    avgLtv: 1905,
    storePattern: { large: 0.0, medium: 0.0, small: 68.5 },
    peakHours: [8, 12, 21],
    weekdayRatio: 78,
    topCategories: [
      { name: 'GROCERY', percentage: 59 },
      { name: 'MEAT', percentage: 8 },
      { name: 'DRUG GM', percentage: 8 },
      { name: 'MEAT-PCKGD', percentage: 7 },
    ],
    avgVisitFrequency: 68.5,
    avgBasket: 28,
    topProducts: [
      { name: 'SOFT DRINKS', category: 'GROCERY', buyRate: 93 },
      { name: 'SOUP', category: 'GROCERY', buyRate: 93 },
      { name: 'FLUID MILK PRODUCTS', category: 'GROCERY', buyRate: 93 },
      { name: 'BEEF', category: 'MEAT', buyRate: 93 },
      { name: 'CRACKERS/MISC BKD FD', category: 'GROCERY', buyRate: 93 },
    ],
    purchaseInsight: 'VIP 전환 불가능, 대형매장 경험 필요 → 최우선 개입 대상',
    cohortAnalysis: {
      firstMonthCount: 83,
      vipConversionRate: 0.0,
      churnRate: 25.3,
      predictivePower: '첫 1개월 소형만 → VIP 전환 0%, 조기 개입 필요',
    },
  },
];

// 등급 설정
export const GRADE_CONFIG_EXTENDED = {
  vip: { label: 'VIP', emoji: '👑', color: '#fbbf24', count: 73 },
  loyal: { label: '충성', emoji: '💚', color: '#22c55e', count: 412 },
  active: { label: '활성', emoji: '🙂', color: '#3b82f6', count: 990 },
  risk: { label: '위험', emoji: '😰', color: '#f97316', count: 513 },
  churn: { label: '이탈', emoji: '👻', color: '#6b7280', count: 512 },
};

// 요일별 방문 패턴
export const WEEKDAY_PATTERN = [
  { day: '월', value: 12 },
  { day: '화', value: 11 },
  { day: '수', value: 14 },
  { day: '목', value: 13 },
  { day: '금', value: 16 },
  { day: '토', value: 20 },
  { day: '일', value: 14 },
];

// 시간대별 방문 패턴
export const HOURLY_PATTERN = [
  { hour: '08', value: 5 },
  { hour: '10', value: 12 },
  { hour: '12', value: 18 },
  { hour: '14', value: 15 },
  { hour: '16', value: 14 },
  { hour: '18', value: 20 },
  { hour: '20', value: 12 },
  { hour: '22', value: 4 },
];

/**
 * 코호트 분석 요약 (첫 1개월 → 최종 등급 예측)
 * Chi2=106.02, p<0.001 (유의미한 예측력)
 */
export const COHORT_ANALYSIS_SUMMARY = {
  statisticalSignificance: {
    chi2: 106.02,
    pValue: 0.001,
    conclusion: '첫 1개월 패턴이 최종 등급을 유의미하게 예측',
  },
  keyInsights: [
    {
      pattern: '다매장 탐험가 (111)',
      vipRate: 27.8,
      churnRate: 0.0,
      insight: '첫 1개월 내 대+중+소 모두 방문 → VIP 전환 최고',
    },
    {
      pattern: '대형+중형 (110)',
      vipRate: 4.4,
      churnRate: 17.2,
      insight: '안정적 패턴, 소형 방문 유도 시 VIP 잠재력',
    },
    {
      pattern: '대형 Only (100)',
      vipRate: 3.0,
      churnRate: 19.4,
      insight: '대형매장 경험 있으나 다양성 부족',
    },
    {
      pattern: '중형 Only (010)',
      vipRate: 0.5,
      churnRate: 27.9,
      insight: '대형매장 유도 필요, VIP 전환 어려움',
    },
    {
      pattern: '소형 Only (001)',
      vipRate: 0.0,
      churnRate: 25.3,
      insight: 'VIP 불가, 첫 1개월 내 대형매장 경험 필수',
    },
  ],
  actionPlan: [
    '신규 고객 첫 1개월 내 대형매장 방문 유도',
    '첫 1개월 다매장 탐험가 패턴 형성 시 VIP 전환율 6배 증가',
    '첫 1개월 소형 Only → 이탈 위험, 즉시 대형매장 쿠폰 발송',
  ],
};
