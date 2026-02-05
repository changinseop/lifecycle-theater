/**
 * 매장경험 퍼널 분석 데이터
 * 매장 크기별 고객 분포 및 트래픽 데이터
 */

// 매장 크기 타입
export type StoreSize = 'small' | 'medium' | 'large';

// 고객 등급 타입
export type CustomerGrade = 'vip' | 'loyal' | 'active' | 'risk' | 'churn';

// 매장 설정
export const STORE_CONFIG: Record<StoreSize, {
  label: string;
  emoji: string;
  color: string;
  avgSize: number; // 평균 면적 (평)
  avgProducts: number; // 평균 상품 수
  avgTraffic: number; // 일평균 방문자 수
}> = {
  small: {
    label: '소형매장',
    emoji: '🏪',
    color: '#f97316',
    avgSize: 50,
    avgProducts: 2500,
    avgTraffic: 180,
  },
  medium: {
    label: '중형매장',
    emoji: '🏬',
    color: '#3b82f6',
    avgSize: 150,
    avgProducts: 8000,
    avgTraffic: 450,
  },
  large: {
    label: '대형매장',
    emoji: '🛒',
    color: '#22c55e',
    avgSize: 400,
    avgProducts: 25000,
    avgTraffic: 1200,
  },
};

// 등급별 설정
export const GRADE_CONFIG: Record<CustomerGrade, {
  label: string;
  emoji: string;
  color: string;
}> = {
  vip: { label: 'VIP', emoji: '👑', color: '#fbbf24' },
  loyal: { label: '충성', emoji: '💚', color: '#22c55e' },
  active: { label: '활성', emoji: '🙂', color: '#3b82f6' },
  risk: { label: '위험', emoji: '😰', color: '#f97316' },
  churn: { label: '이탈', emoji: '👻', color: '#6b7280' },
};

// 매장 크기별 분포
export const STORE_DISTRIBUTION = {
  small: { count: 127, percentage: 42.3, customers: 892 },
  medium: { count: 98, percentage: 32.7, customers: 1087 },
  large: { count: 75, percentage: 25.0, customers: 1608 },
};

// 등급별 매장 경험 분포
export interface GradeStoreExperience {
  grade: CustomerGrade;
  smallOnly: number; // 소형매장만 방문
  mediumPlus: number; // 중형+ 경험
  largePlus: number; // 대형 경험
  multiStore: number; // 다매장 방문
  avgStoreCount: number; // 평균 방문 매장 수
}

export const GRADE_STORE_EXPERIENCE: GradeStoreExperience[] = [
  { grade: 'vip', smallOnly: 5.7, mediumPlus: 94.3, largePlus: 91.4, multiStore: 97.1, avgStoreCount: 4.8 },
  { grade: 'loyal', smallOnly: 12.2, mediumPlus: 87.8, largePlus: 82.4, multiStore: 85.5, avgStoreCount: 3.6 },
  { grade: 'active', smallOnly: 28.4, mediumPlus: 71.6, largePlus: 58.2, multiStore: 62.1, avgStoreCount: 2.4 },
  { grade: 'risk', smallOnly: 42.3, mediumPlus: 57.7, largePlus: 38.6, multiStore: 41.2, avgStoreCount: 1.8 },
  { grade: 'churn', smallOnly: 58.2, mediumPlus: 41.8, largePlus: 24.3, multiStore: 28.5, avgStoreCount: 1.3 },
];

// 매장 크기별 고객 등급 분포
export interface StoreGradeDistribution {
  storeSize: StoreSize;
  vip: number;
  loyal: number;
  active: number;
  risk: number;
  churn: number;
  survivalRate: number; // 생존율 (이탈하지 않은 비율)
  avgLtv: number;
}

export const STORE_GRADE_DISTRIBUTION: StoreGradeDistribution[] = [
  { storeSize: 'small', vip: 0.8, loyal: 8.2, active: 32.5, risk: 28.4, churn: 30.1, survivalRate: 41.5, avgLtv: 1842 },
  { storeSize: 'medium', vip: 2.4, loyal: 14.8, active: 42.1, risk: 22.3, churn: 18.4, survivalRate: 59.3, avgLtv: 3256 },
  { storeSize: 'large', vip: 4.6, loyal: 22.5, active: 44.8, risk: 15.2, churn: 12.9, survivalRate: 71.9, avgLtv: 4892 },
];

// 트래픽 흐름 데이터 (시간대별)
export interface TrafficFlow {
  hour: number;
  small: number;
  medium: number;
  large: number;
}

export const TRAFFIC_FLOW: TrafficFlow[] = [
  { hour: 8, small: 12, medium: 25, large: 45 },
  { hour: 9, small: 28, medium: 52, large: 85 },
  { hour: 10, small: 45, medium: 78, large: 125 },
  { hour: 11, small: 58, medium: 95, large: 165 },
  { hour: 12, small: 72, medium: 115, large: 195 },
  { hour: 13, small: 68, medium: 105, large: 175 },
  { hour: 14, small: 55, medium: 88, large: 145 },
  { hour: 15, small: 62, medium: 98, large: 168 },
  { hour: 16, small: 75, medium: 120, large: 205 },
  { hour: 17, small: 85, medium: 135, large: 225 },
  { hour: 18, small: 95, medium: 155, large: 265 },
  { hour: 19, small: 88, medium: 142, large: 235 },
  { hour: 20, small: 65, medium: 105, large: 175 },
  { hour: 21, small: 42, medium: 68, large: 112 },
];

// 매장 경험 퍼널 데이터
export interface ExperienceFunnel {
  stage: string;
  label: string;
  smallCustomers: number;
  mediumCustomers: number;
  largeCustomers: number;
  conversionRate: { small: number; medium: number; large: number };
}

export const EXPERIENCE_FUNNEL: ExperienceFunnel[] = [
  {
    stage: 'first_visit',
    label: '첫 방문',
    smallCustomers: 892,
    mediumCustomers: 1087,
    largeCustomers: 1608,
    conversionRate: { small: 100, medium: 100, large: 100 },
  },
  {
    stage: 'second_visit',
    label: '재방문 (30일 내)',
    smallCustomers: 534,
    mediumCustomers: 782,
    largeCustomers: 1287,
    conversionRate: { small: 59.9, medium: 71.9, large: 80.0 },
  },
  {
    stage: 'active',
    label: '활성화 (3회+ 방문)',
    smallCustomers: 312,
    mediumCustomers: 548,
    largeCustomers: 1045,
    conversionRate: { small: 35.0, medium: 50.4, large: 65.0 },
  },
  {
    stage: 'loyal',
    label: '충성 고객화',
    smallCustomers: 73,
    mediumCustomers: 161,
    largeCustomers: 362,
    conversionRate: { small: 8.2, medium: 14.8, large: 22.5 },
  },
  {
    stage: 'vip',
    label: 'VIP 달성',
    smallCustomers: 7,
    mediumCustomers: 26,
    largeCustomers: 74,
    conversionRate: { small: 0.8, medium: 2.4, large: 4.6 },
  },
];

// 매장 위치 데이터 (시각화용)
export interface StoreLocation {
  id: number;
  size: StoreSize;
  x: number;
  y: number;
  z: number;
  traffic: number;
  survivalRate: number;
  vipCount: number;
}

export const STORE_LOCATIONS: StoreLocation[] = [
  // 소형매장들
  { id: 1, size: 'small', x: 15, y: 20, z: 10, traffic: 180, survivalRate: 42, vipCount: 2 },
  { id: 2, size: 'small', x: 25, y: 35, z: 8, traffic: 165, survivalRate: 38, vipCount: 1 },
  { id: 3, size: 'small', x: 35, y: 15, z: 12, traffic: 195, survivalRate: 45, vipCount: 3 },
  { id: 4, size: 'small', x: 45, y: 45, z: 9, traffic: 172, survivalRate: 40, vipCount: 1 },
  { id: 5, size: 'small', x: 55, y: 25, z: 11, traffic: 188, survivalRate: 43, vipCount: 2 },
  { id: 6, size: 'small', x: 65, y: 55, z: 10, traffic: 176, survivalRate: 41, vipCount: 2 },
  { id: 7, size: 'small', x: 75, y: 30, z: 8, traffic: 162, survivalRate: 39, vipCount: 1 },
  { id: 8, size: 'small', x: 85, y: 50, z: 12, traffic: 198, survivalRate: 46, vipCount: 3 },
  // 중형매장들
  { id: 9, size: 'medium', x: 20, y: 60, z: 25, traffic: 450, survivalRate: 58, vipCount: 8 },
  { id: 10, size: 'medium', x: 40, y: 70, z: 28, traffic: 485, survivalRate: 62, vipCount: 10 },
  { id: 11, size: 'medium', x: 60, y: 65, z: 24, traffic: 438, survivalRate: 56, vipCount: 7 },
  { id: 12, size: 'medium', x: 80, y: 75, z: 30, traffic: 512, survivalRate: 64, vipCount: 12 },
  { id: 13, size: 'medium', x: 30, y: 80, z: 26, traffic: 465, survivalRate: 59, vipCount: 9 },
  // 대형매장들
  { id: 14, size: 'large', x: 25, y: 85, z: 50, traffic: 1180, survivalRate: 70, vipCount: 22 },
  { id: 15, size: 'large', x: 50, y: 90, z: 55, traffic: 1320, survivalRate: 75, vipCount: 28 },
  { id: 16, size: 'large', x: 75, y: 88, z: 48, traffic: 1150, survivalRate: 68, vipCount: 20 },
];

// 핵심 인사이트
export const STORE_INSIGHTS = [
  {
    title: '대형매장 경험이 생존율을 높인다',
    emoji: '🛒',
    metric: '+30.4%p',
    detail: '대형매장 경험자의 생존율(71.9%)은 소형매장만 방문 고객(41.5%) 대비 30.4%p 높음',
    color: '#22c55e',
  },
  {
    title: 'VIP의 97%가 다매장 경험자',
    emoji: '👑',
    metric: '97.1%',
    detail: 'VIP 고객 중 97.1%가 3개 이상 매장 방문 경험. 단일매장만 방문 시 VIP 확률 거의 0%',
    color: '#fbbf24',
  },
  {
    title: '소형매장만 방문 시 이탈율 2배',
    emoji: '⚠️',
    metric: '58.5%',
    detail: '소형매장만 방문 고객의 이탈율(58.5%)은 대형매장 경험자(28.1%)의 2배',
    color: '#ef4444',
  },
  {
    title: '매장 크기별 LTV 격차',
    emoji: '💰',
    metric: '2.7배',
    detail: '대형매장 주 이용 고객의 평균 LTV($4,892)는 소형매장 고객($1,842)의 2.7배',
    color: '#8b5cf6',
  },
];

// 생존율 곡선 데이터 (매장 크기별)
export interface SurvivalData {
  month: number;
  small: number;
  medium: number;
  large: number;
  all: number;
}

export const SURVIVAL_BY_STORE: SurvivalData[] = [
  { month: 0, small: 100, medium: 100, large: 100, all: 100 },
  { month: 1, small: 82, medium: 89, large: 94, all: 88 },
  { month: 3, small: 68, medium: 78, large: 87, all: 77 },
  { month: 6, small: 55, medium: 68, large: 80, all: 67 },
  { month: 9, small: 48, medium: 62, large: 76, all: 62 },
  { month: 12, small: 44, medium: 58, large: 73, all: 58 },
  { month: 18, small: 42, medium: 56, large: 72, all: 57 },
  { month: 24, small: 41.5, medium: 55, large: 71.9, all: 56 },
];

// ============================================
// Galaxy Orbit View 데이터
// ============================================

// 등급별 궤도 데이터 (매장 방문 패턴)
export interface OrbitPattern {
  grade: CustomerGrade;
  orbitRadius: number; // 궤도 반경 (중심과의 거리)
  orbitSpeed: number; // 궤도 속도
  storeVisits: { size: StoreSize; frequency: number }[]; // 매장별 방문 빈도
  avgVisitsPerMonth: number;
  journeyStability: number; // 0-100 (높을수록 안정적)
}

export const ORBIT_PATTERNS: OrbitPattern[] = [
  {
    grade: 'vip',
    orbitRadius: 85,
    orbitSpeed: 1.2,
    storeVisits: [
      { size: 'large', frequency: 45 },
      { size: 'medium', frequency: 35 },
      { size: 'small', frequency: 20 },
    ],
    avgVisitsPerMonth: 8.2,
    journeyStability: 95,
  },
  {
    grade: 'loyal',
    orbitRadius: 70,
    orbitSpeed: 1.0,
    storeVisits: [
      { size: 'large', frequency: 38 },
      { size: 'medium', frequency: 42 },
      { size: 'small', frequency: 20 },
    ],
    avgVisitsPerMonth: 5.4,
    journeyStability: 82,
  },
  {
    grade: 'active',
    orbitRadius: 55,
    orbitSpeed: 0.8,
    storeVisits: [
      { size: 'large', frequency: 25 },
      { size: 'medium', frequency: 40 },
      { size: 'small', frequency: 35 },
    ],
    avgVisitsPerMonth: 3.1,
    journeyStability: 65,
  },
  {
    grade: 'risk',
    orbitRadius: 35,
    orbitSpeed: 0.5,
    storeVisits: [
      { size: 'large', frequency: 15 },
      { size: 'medium', frequency: 30 },
      { size: 'small', frequency: 55 },
    ],
    avgVisitsPerMonth: 1.4,
    journeyStability: 38,
  },
  {
    grade: 'churn',
    orbitRadius: 15,
    orbitSpeed: 0.2,
    storeVisits: [
      { size: 'large', frequency: 8 },
      { size: 'medium', frequency: 18 },
      { size: 'small', frequency: 74 },
    ],
    avgVisitsPerMonth: 0.3,
    journeyStability: 12,
  },
];

// 개별 고객 궤도 데이터 (시각화용)
export interface CustomerOrbit {
  id: number;
  grade: CustomerGrade;
  angle: number; // 현재 위치 (0-360)
  radius: number;
  speed: number;
  visitedStores: StoreSize[];
  monthsSinceJoin: number;
  isEscaping?: boolean; // 이탈 중
}

export const generateCustomerOrbits = (count: number = 100): CustomerOrbit[] => {
  const customers: CustomerOrbit[] = [];
  const gradeDistribution = { vip: 4, loyal: 18, active: 35, risk: 25, churn: 18 };

  let id = 0;
  Object.entries(gradeDistribution).forEach(([grade, percentage]) => {
    const numCustomers = Math.floor(count * percentage / 100);
    const pattern = ORBIT_PATTERNS.find(p => p.grade === grade as CustomerGrade)!;

    for (let i = 0; i < numCustomers; i++) {
      const radiusVariation = (Math.random() - 0.5) * 20;
      customers.push({
        id: id++,
        grade: grade as CustomerGrade,
        angle: Math.random() * 360,
        radius: pattern.orbitRadius + radiusVariation,
        speed: pattern.orbitSpeed * (0.8 + Math.random() * 0.4),
        visitedStores: pattern.storeVisits
          .filter(v => Math.random() < v.frequency / 100)
          .map(v => v.size),
        monthsSinceJoin: Math.floor(Math.random() * 24),
        isEscaping: grade === 'churn' && Math.random() > 0.5,
      });
    }
  });

  return customers;
};

// ============================================
// Cell Division Flow 데이터
// ============================================

// 분열 단계 정의
export interface DivisionStage {
  id: string;
  label: string;
  month: number;
  population: number;
  children: {
    id: string;
    label: string;
    population: number;
    color: string;
    condition: string; // 분기 조건
  }[];
}

export const DIVISION_STAGES: DivisionStage[] = [
  {
    id: 'entry',
    label: '신규 고객',
    month: 0,
    population: 2500,
    children: [
      { id: 'small_first', label: '소형매장 첫 경험', population: 892, color: '#f97316', condition: '첫 방문: 소형' },
      { id: 'medium_first', label: '중형매장 첫 경험', population: 687, color: '#3b82f6', condition: '첫 방문: 중형' },
      { id: 'large_first', label: '대형매장 첫 경험', population: 921, color: '#22c55e', condition: '첫 방문: 대형' },
    ],
  },
  {
    id: 'month3',
    label: '3개월 후',
    month: 3,
    population: 1925,
    children: [
      { id: 'small_only', label: '소형만 지속', population: 445, color: '#f97316', condition: '소형만 3회+' },
      { id: 'expand_medium', label: '중형으로 확장', population: 382, color: '#3b82f6', condition: '중형 경험 추가' },
      { id: 'expand_large', label: '대형으로 확장', population: 623, color: '#22c55e', condition: '대형 경험 추가' },
      { id: 'early_churn', label: '조기 이탈', population: 475, color: '#6b7280', condition: '방문 중단' },
    ],
  },
  {
    id: 'month6',
    label: '6개월 후',
    month: 6,
    population: 1675,
    children: [
      { id: 'single_store', label: '단일 매장 고정', population: 312, color: '#f97316', condition: '1개 매장만' },
      { id: 'multi_store', label: '다매장 순환', population: 648, color: '#8b5cf6', condition: '2-3개 매장' },
      { id: 'active_explorer', label: '적극적 탐색', population: 465, color: '#22c55e', condition: '4개+ 매장' },
      { id: 'mid_churn', label: '중기 이탈', population: 250, color: '#6b7280', condition: '방문 감소' },
    ],
  },
  {
    id: 'month12',
    label: '12개월 후',
    month: 12,
    population: 1450,
    children: [
      { id: 'churn_final', label: '이탈', population: 450, color: '#6b7280', condition: '생존율 69.6%' },
      { id: 'risk_tier', label: '위험군', population: 362, color: '#f97316', condition: '방문 빈도 ↓' },
      { id: 'active_tier', label: '활성군', population: 413, color: '#3b82f6', condition: '정상 유지' },
      { id: 'loyal_tier', label: '충성군', population: 175, color: '#22c55e', condition: '빈도 ↑' },
      { id: 'vip_tier', label: 'VIP', population: 50, color: '#fbbf24', condition: '상위 2%' },
    ],
  },
  {
    id: 'month24',
    label: '24개월 후',
    month: 24,
    population: 1400,
    children: [
      { id: 'final_churn', label: '이탈', population: 1100, color: '#6b7280', condition: '생존율 56%' },
      { id: 'final_risk', label: '위험', population: 175, color: '#f97316', condition: '7%' },
      { id: 'final_active', label: '활성', population: 118, color: '#3b82f6', condition: '4.7%' },
      { id: 'final_loyal', label: '충성', population: 80, color: '#22c55e', condition: '3.2%' },
      { id: 'final_vip', label: 'VIP', population: 27, color: '#fbbf24', condition: '1.1%' },
    ],
  },
];

// 분열 경로 (노드 간 연결)
export interface DivisionPath {
  from: string;
  to: string;
  flow: number; // 이동 고객 수
  probability: number; // 전환 확률
}

export const DIVISION_PATHS: DivisionPath[] = [
  // Entry → Month 3
  { from: 'small_first', to: 'small_only', flow: 312, probability: 35 },
  { from: 'small_first', to: 'early_churn', flow: 268, probability: 30 },
  { from: 'small_first', to: 'expand_medium', flow: 178, probability: 20 },
  { from: 'small_first', to: 'expand_large', flow: 134, probability: 15 },
  { from: 'medium_first', to: 'expand_large', flow: 275, probability: 40 },
  { from: 'medium_first', to: 'expand_medium', flow: 204, probability: 30 },
  { from: 'medium_first', to: 'early_churn', flow: 137, probability: 20 },
  { from: 'medium_first', to: 'small_only', flow: 71, probability: 10 },
  { from: 'large_first', to: 'expand_large', flow: 644, probability: 70 },
  { from: 'large_first', to: 'expand_medium', flow: 138, probability: 15 },
  { from: 'large_first', to: 'early_churn', flow: 92, probability: 10 },
  { from: 'large_first', to: 'small_only', flow: 46, probability: 5 },

  // Month 3 → Month 6
  { from: 'small_only', to: 'single_store', flow: 222, probability: 50 },
  { from: 'small_only', to: 'mid_churn', flow: 156, probability: 35 },
  { from: 'small_only', to: 'multi_store', flow: 67, probability: 15 },
  { from: 'expand_medium', to: 'multi_store', flow: 268, probability: 70 },
  { from: 'expand_medium', to: 'active_explorer', flow: 76, probability: 20 },
  { from: 'expand_medium', to: 'mid_churn', flow: 38, probability: 10 },
  { from: 'expand_large', to: 'active_explorer', flow: 374, probability: 60 },
  { from: 'expand_large', to: 'multi_store', flow: 187, probability: 30 },
  { from: 'expand_large', to: 'mid_churn', flow: 62, probability: 10 },

  // Month 6 → Month 12
  { from: 'single_store', to: 'churn_final', flow: 187, probability: 60 },
  { from: 'single_store', to: 'risk_tier', flow: 94, probability: 30 },
  { from: 'single_store', to: 'active_tier', flow: 31, probability: 10 },
  { from: 'multi_store', to: 'active_tier', flow: 259, probability: 40 },
  { from: 'multi_store', to: 'loyal_tier', flow: 130, probability: 20 },
  { from: 'multi_store', to: 'risk_tier', flow: 194, probability: 30 },
  { from: 'multi_store', to: 'churn_final', flow: 65, probability: 10 },
  { from: 'active_explorer', to: 'loyal_tier', flow: 186, probability: 40 },
  { from: 'active_explorer', to: 'vip_tier', flow: 93, probability: 20 },
  { from: 'active_explorer', to: 'active_tier', flow: 140, probability: 30 },
  { from: 'active_explorer', to: 'risk_tier', flow: 47, probability: 10 },
];

// ============================================
// Constellation Map 데이터
// ============================================

// 별자리 패턴 (대표 고객 여정)
export interface ConstellationPattern {
  id: string;
  name: string;
  emoji: string;
  description: string;
  outcome: CustomerGrade;
  prevalence: number; // 해당 패턴 비율 (%)
  storeSequence: StoreSize[]; // 방문 순서
  timePattern: { weekday: number; weekend: number }; // 요일 분포
  peakHours: number[]; // 주요 방문 시간대
  categoryPreference: { category: string; percentage: number }[]; // 카테고리 선호
  avgBasket: number; // 평균 장바구니 금액
  journeyDuration: number; // 여정 기간 (개월)
}

export const CONSTELLATION_PATTERNS: ConstellationPattern[] = [
  {
    id: 'orbit_king',
    name: '궤도의 왕',
    emoji: '👑',
    description: '대형매장 중심 + 다매장 순환, 최고 LTV',
    outcome: 'vip',
    prevalence: 4.2,
    storeSequence: ['large', 'medium', 'large', 'small', 'large'],
    timePattern: { weekday: 35, weekend: 65 },
    peakHours: [10, 14, 19],
    categoryPreference: [
      { category: '프리미엄 식품', percentage: 32 },
      { category: '와인/주류', percentage: 24 },
      { category: '신선식품', percentage: 22 },
      { category: '생활용품', percentage: 12 },
      { category: '기타', percentage: 10 },
    ],
    avgBasket: 89500,
    journeyDuration: 24,
  },
  {
    id: 'steady_cruiser',
    name: '꾸준한 순항자',
    emoji: '💚',
    description: '중형매장 고정 + 주기적 방문',
    outcome: 'loyal',
    prevalence: 18.4,
    storeSequence: ['medium', 'medium', 'large', 'medium'],
    timePattern: { weekday: 55, weekend: 45 },
    peakHours: [11, 17, 20],
    categoryPreference: [
      { category: '신선식품', percentage: 35 },
      { category: '유제품', percentage: 22 },
      { category: '간편식', percentage: 18 },
      { category: '생활용품', percentage: 15 },
      { category: '기타', percentage: 10 },
    ],
    avgBasket: 52300,
    journeyDuration: 24,
  },
  {
    id: 'explorer',
    name: '탐험가',
    emoji: '🧭',
    description: '다양한 매장 탐색, 카테고리 확장형',
    outcome: 'active',
    prevalence: 28.5,
    storeSequence: ['small', 'medium', 'large', 'medium', 'small'],
    timePattern: { weekday: 45, weekend: 55 },
    peakHours: [12, 16, 19],
    categoryPreference: [
      { category: '신선식품', percentage: 28 },
      { category: '간편식', percentage: 25 },
      { category: '음료', percentage: 18 },
      { category: '스낵', percentage: 16 },
      { category: '기타', percentage: 13 },
    ],
    avgBasket: 38200,
    journeyDuration: 18,
  },
  {
    id: 'convenience_seeker',
    name: '편의 추구자',
    emoji: '⚡',
    description: '소형매장 주 이용, 빠른 쇼핑 선호',
    outcome: 'risk',
    prevalence: 24.3,
    storeSequence: ['small', 'small', 'small', 'medium'],
    timePattern: { weekday: 72, weekend: 28 },
    peakHours: [8, 13, 21],
    categoryPreference: [
      { category: '음료', percentage: 28 },
      { category: '스낵', percentage: 25 },
      { category: '간편식', percentage: 22 },
      { category: '담배/기호품', percentage: 15 },
      { category: '기타', percentage: 10 },
    ],
    avgBasket: 18500,
    journeyDuration: 12,
  },
  {
    id: 'fading_star',
    name: '사라지는 별',
    emoji: '💫',
    description: '방문 빈도 감소, 이탈 경로',
    outcome: 'churn',
    prevalence: 24.6,
    storeSequence: ['small', 'small'],
    timePattern: { weekday: 80, weekend: 20 },
    peakHours: [12, 18],
    categoryPreference: [
      { category: '음료', percentage: 35 },
      { category: '스낵', percentage: 30 },
      { category: '담배/기호품', percentage: 20 },
      { category: '기타', percentage: 15 },
    ],
    avgBasket: 8900,
    journeyDuration: 6,
  },
];

// 별 (매장) 위치 데이터
export interface StarPosition {
  id: number;
  size: StoreSize;
  name: string;
  x: number; // 0-100
  y: number; // 0-100
  brightness: number; // 0-100 (트래픽 기반)
  connections: number[]; // 연결된 다른 별 ID
}

export const STAR_POSITIONS: StarPosition[] = [
  // 대형매장 (밝은 별)
  { id: 1, size: 'large', name: '대형마트A', x: 50, y: 25, brightness: 95, connections: [4, 5, 6, 10] },
  { id: 2, size: 'large', name: '대형마트B', x: 75, y: 40, brightness: 88, connections: [5, 6, 11] },
  { id: 3, size: 'large', name: '대형마트C', x: 25, y: 45, brightness: 82, connections: [4, 7, 9] },
  // 중형매장 (중간 별)
  { id: 4, size: 'medium', name: '슈퍼A', x: 35, y: 35, brightness: 65, connections: [1, 3, 7, 8] },
  { id: 5, size: 'medium', name: '슈퍼B', x: 60, y: 35, brightness: 62, connections: [1, 2, 8] },
  { id: 6, size: 'medium', name: '슈퍼C', x: 70, y: 55, brightness: 58, connections: [1, 2, 11, 12] },
  { id: 7, size: 'medium', name: '슈퍼D', x: 20, y: 60, brightness: 55, connections: [3, 4, 9] },
  // 소형매장 (어두운 별)
  { id: 8, size: 'small', name: '편의점A', x: 45, y: 50, brightness: 35, connections: [4, 5] },
  { id: 9, size: 'small', name: '편의점B', x: 15, y: 75, brightness: 32, connections: [3, 7] },
  { id: 10, size: 'small', name: '편의점C', x: 55, y: 15, brightness: 30, connections: [1] },
  { id: 11, size: 'small', name: '편의점D', x: 85, y: 60, brightness: 28, connections: [2, 6] },
  { id: 12, size: 'small', name: '편의점E', x: 80, y: 75, brightness: 25, connections: [6] },
  { id: 13, size: 'small', name: '편의점F', x: 30, y: 80, brightness: 22, connections: [7] },
];

// 요일별 방문 패턴
export interface DayPattern {
  day: string;
  small: number;
  medium: number;
  large: number;
}

export const DAY_PATTERNS: DayPattern[] = [
  { day: '월', small: 15, medium: 12, large: 10 },
  { day: '화', small: 14, medium: 11, large: 9 },
  { day: '수', small: 16, medium: 14, large: 12 },
  { day: '목', small: 15, medium: 13, large: 11 },
  { day: '금', small: 18, medium: 16, large: 15 },
  { day: '토', small: 12, medium: 18, large: 24 },
  { day: '일', small: 10, medium: 16, large: 19 },
];
