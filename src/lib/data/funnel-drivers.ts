/**
 * 퍼널 분석: 상관 요인 데이터
 * 최종 보고서 Part 2~5 기반 통계 데이터
 *
 * Part 2: 고객 등급 분류 체계 및 전환 구조
 * Part 3: 양방향 전환 상관 효과 분석
 * Part 4: 복귀 패턴 및 이탈 횟수별 분석
 * Part 5: 매장 폐쇄 영향 분석
 */

// ============================================
// Part 2: 경로 분포 및 등급별 LTV
// ============================================

export const PATH_DISTRIBUTION = {
  noChurn: {
    label: '이탈 0회 경로',
    description: '한 번도 25일 이상 공백 없이 꾸준히 방문',
    count: 463,
    percentage: 18.5,
    color: '#22c55e',
    grades: [
      { grade: 'VIP', count: 70, percentage: 15.1, criteria: '362회 이상 방문' },
      { grade: '충성', count: 393, percentage: 84.9, criteria: '362회 미만' },
    ],
    keyInsight: '한 번 이탈하면 이 경로로 돌아올 수 없음',
  },
  hasChurn: {
    label: '이탈 1회+ 경로',
    description: '25일 이상 공백 경험 있음, 양방향 전환 가능',
    count: 2037,
    percentage: 81.5,
    color: '#f97316',
    grades: [
      { grade: '활성', count: 990, percentage: 48.6, criteria: '최근 8일 미만' },
      { grade: '위험', count: 513, percentage: 25.2, criteria: '최근 8-24일' },
      { grade: '이탈', count: 534, percentage: 26.2, criteria: '최근 25일 이상' },
    ],
    keyInsight: '49%가 이탈 후에도 복귀함',
  },
};

export const GRADE_LTV = {
  vip: { label: 'VIP', ltv: 10688, count: 70, color: '#fbbf24', emoji: '' },
  loyal: { label: '충성', ltv: 6712, count: 393, color: '#22c55e', emoji: '' },
  active: { label: '활성', ltv: 2962, count: 990, color: '#3b82f6', emoji: '' },
  risk: { label: '위험', ltv: 2014, count: 513, color: '#f97316', emoji: '' },
  churn: { label: '이탈', ltv: 1322, count: 534, color: '#6b7280', emoji: '' },
};

// ============================================
// Part 3: 양방향 전환 상관 요인 (보고서 bidirectional_drivers.json 기반)
// ============================================

// 전환 유형 설정 (양방향)
export const TRANSITION_CONFIG = {
  no_churn_maintain: {
    label: '이탈 0회 유지',
    from: '전체',
    to: '이탈0회',
    description: '전체 2,500명 중 한 번도 이탈(25일+ 공백)하지 않은 고객의 특성',
    target: '전체 2,500명 (이탈0회 463명 vs 이탈경험 2,037명)',
    color: '#64748b',
  },
  vip_achieve: {
    label: 'VIP 도달',
    from: '충성',
    to: 'VIP',
    description: '이탈 0회 고객 463명 중 VIP(70명) 여부와 경험 변수의 상관',
    target: '이탈 0회 고객 463명 (VIP 70명, 충성 393명)',
    color: '#64748b',
  },
  recovery: {
    label: '복귀',
    from: '이탈',
    to: '활성',
    description: '이탈 경험자 2,037명 중 현재 활성 상태(990명)인 고객의 특성',
    target: '이탈 경험자 2,037명 (활성 990명 vs 위험/이탈 1,047명)',
    color: '#64748b',
  },
  churn_prevention: {
    label: '이탈 방지',
    from: '이탈경험',
    to: '비이탈',
    description: '이탈 경험자 2,037명 중 현재 이탈 상태가 아닌(1,503명) 고객의 특성',
    target: '이탈 경험자 2,037명 (활성/위험 1,503명 vs 이탈 534명)',
    color: '#64748b',
  },
  risk_maintain: {
    label: '위험에서 유지',
    from: '위험/이탈',
    to: '위험유지',
    description: '위험+이탈 고객 1,047명 중 이탈로 넘어가지 않고 위험에 머무른(513명) 고객의 특성',
    target: '위험/이탈 고객 1,047명 (위험 513명 vs 이탈 534명)',
    color: '#64748b',
  },
};

// 상관 요인별 양방향 효과 (상관계수 r 기반)
export const BIDIRECTIONAL_DRIVERS = {
  coupon: {
    label: '쿠폰 사용',
    description: '전체 방문 중 쿠폰을 사용한 비율',
    emoji: '',
    color: '#8b5cf6',
    effects: {
      no_churn_maintain: { r: 0.150, p: 0.001, sig: '***' },
      vip_achieve: { r: -0.042, p: 0.363, sig: '' },
      recovery: { r: 0.061, p: 0.006, sig: '**' },
      churn_prevention: { r: 0.061, p: 0.006, sig: '**' },
      risk_maintain: { r: 0.047, p: 0.130, sig: '' },
    },
  },
  multi_store: {
    label: '다매장 방문',
    description: '2개 이상 매장을 방문한 비율',
    emoji: '',
    color: '#06b6d4',
    effects: {
      no_churn_maintain: { r: 0.129, p: 0.001, sig: '***' },
      vip_achieve: { r: -0.012, p: 0.794, sig: '' },
      recovery: { r: 0.134, p: 0.001, sig: '***' },
      churn_prevention: { r: 0.165, p: 0.001, sig: '***' },
      risk_maintain: { r: 0.140, p: 0.001, sig: '***' },
    },
  },
  discount: {
    label: '할인 경험',
    description: '할인 상품을 구매한 비율',
    emoji: '',
    color: '#f59e0b',
    effects: {
      no_churn_maintain: { r: 0.118, p: 0.001, sig: '***' },
      vip_achieve: { r: -0.136, p: 0.003, sig: '**' },  // 마이너스!
      recovery: { r: 0.044, p: 0.047, sig: '*' },
      churn_prevention: { r: 0.049, p: 0.026, sig: '*' },
      risk_maintain: { r: 0.037, p: 0.230, sig: '' },
    },
  },
  category_diversity: {
    label: '카테고리 다양성',
    description: '구매한 상품 카테고리 수',
    emoji: '',
    color: '#ec4899',
    effects: {
      no_churn_maintain: { r: 0.102, p: 0.001, sig: '***' },
      vip_achieve: { r: -0.156, p: 0.001, sig: '***' },  // 마이너스!
      recovery: { r: 0.050, p: 0.025, sig: '*' },
      churn_prevention: { r: 0.068, p: 0.002, sig: '**' },
      risk_maintain: { r: 0.064, p: 0.038, sig: '*' },
    },
  },
  large_store: {
    label: '대형매장 방문',
    description: '대형매장을 방문한 비율',
    emoji: '',
    color: '#10b981',
    effects: {
      no_churn_maintain: { r: 0.101, p: 0.001, sig: '***' },
      vip_achieve: { r: 0.049, p: 0.297, sig: '' },
      recovery: { r: 0.028, p: 0.210, sig: '' },
      churn_prevention: { r: 0.012, p: 0.582, sig: '' },
      risk_maintain: { r: -0.006, p: 0.835, sig: '' },
    },
  },
  weekend: {
    label: '주말 방문',
    description: '주말에 방문한 비율',
    emoji: '',
    color: '#6366f1',
    effects: {
      no_churn_maintain: { r: 0.005, p: 0.792, sig: '' },
      vip_achieve: { r: -0.013, p: 0.780, sig: '' },
      recovery: { r: -0.018, p: 0.410, sig: '' },
      churn_prevention: { r: -0.046, p: 0.038, sig: '*' },  // 마이너스!
      risk_maintain: { r: -0.054, p: 0.082, sig: '' },
    },
  },
};

// 상관 요인 요약 (보고서 3.2 기준)
export const DRIVER_SUMMARY = {
  no_churn_maintain: {
    title: '이탈 0회 유지 상관 요인',
    description: '한 번도 25일+ 공백 없이 유지되는 고객의 특성 (n=2,500)',
    ranking: [
      { rank: 1, driver: '쿠폰 사용', r: 0.150, sig: '***', insight: '작은 효과 크기' },
      { rank: 2, driver: '다매장 방문', r: 0.129, sig: '***', insight: '작은 효과 크기' },
      { rank: 3, driver: '할인 경험', r: 0.118, sig: '***', insight: '작은 효과 크기' },
      { rank: 4, driver: '카테고리 다양성', r: 0.102, sig: '***', insight: '작은 효과 크기' },
      { rank: 5, driver: '대형매장 방문', r: 0.101, sig: '***', insight: '작은 효과 크기' },
    ],
  },
  recovery: {
    title: '복귀 상관 요인',
    description: '이탈 경험 후 현재 활성인 고객의 특성 (n=2,037)',
    ranking: [
      { rank: 1, driver: '다매장 방문', r: 0.134, sig: '***', insight: '작은 효과 크기' },
      { rank: 2, driver: '쿠폰 사용', r: 0.061, sig: '**', insight: '무시할 수준' },
      { rank: 3, driver: '카테고리 다양성', r: 0.050, sig: '*', insight: '무시할 수준' },
      { rank: 4, driver: '할인 경험', r: 0.044, sig: '*', insight: '무시할 수준' },
    ],
  },
  vip_achieve: {
    title: 'VIP 도달 상관 요인',
    description: '이탈 0회 고객 중 VIP 여부와의 상관 (n=463, VIP 70명)',
    keyInsight: 'VIP 기준이 방문 362회 이상이므로 경험 변수의 영향은 제한적. 음의 상관은 방문 횟수 통제 시 사라짐',
    warning: [
      { driver: '카테고리 다양성', r: -0.156, sig: '***', insight: '방문 횟수 통제 시 n.s.' },
      { driver: '할인 경험', r: -0.136, sig: '**', insight: '방문 횟수 통제 시 n.s.' },
    ],
  },
  churn_prevention: {
    title: '이탈 방지 상관 요인',
    description: '이탈 경험자 중 현재 이탈 아닌 고객의 특성 (n=2,037)',
    ranking: [
      { rank: 1, driver: '다매장 방문', r: 0.165, sig: '***', insight: '작은 효과 크기' },
      { rank: 2, driver: '카테고리 다양성', r: 0.068, sig: '**', insight: '무시할 수준' },
      { rank: 3, driver: '쿠폰 사용', r: 0.061, sig: '**', insight: '무시할 수준' },
      { rank: 4, driver: '할인 경험', r: 0.049, sig: '*', insight: '무시할 수준' },
    ],
    warning: [
      { driver: '주말 방문', r: -0.046, sig: '*', insight: '약한 음의 상관' },
    ],
  },
};

// ============================================
// Part 4: 복귀 패턴 및 이탈 횟수별 분석
// ============================================

export const CHURN_COUNT_RECOVERY = [
  { churnCount: 0, label: '이탈 0회', count: 463, recoveryRate: null, path: 'VIP/충성만 가능', note: '별도 경로' },
  { churnCount: 1, label: '이탈 1회', count: 268, recoveryRate: 73.5, path: '이탈 1회+', note: '대부분 돌아옴' },
  { churnCount: 2, label: '이탈 2회', count: 244, recoveryRate: 65.6, path: '이탈 1회+', note: '' },
  { churnCount: 3, label: '이탈 3회', count: 211, recoveryRate: 57.3, path: '이탈 1회+', note: '' },
  { churnCount: 4, label: '이탈 4회', count: 233, recoveryRate: 48.1, path: '이탈 1회+', note: '50% 미만 시작!' },
  { churnCount: 5, label: '이탈 5회', count: 211, recoveryRate: 43.6, path: '이탈 1회+', note: '' },
  { churnCount: 6, label: '이탈 6회', count: 201, recoveryRate: 39.3, path: '이탈 1회+', note: '' },
  { churnCount: 7, label: '이탈 7회+', count: 201, recoveryRate: 40.8, path: '이탈 1회+', note: '그래도 40%는 돌아옴' },
];

export const RECOVERY_VS_NONRECOVERY = {
  total: 2037,
  recovered: { count: 990, percentage: 49, label: '복귀 (현재 활성)' },
  notRecovered: { count: 1047, percentage: 51, label: '미복귀 (현재 위험/이탈)' },
  experienceDiff: [
    { factor: '다매장 방문율', recovered: 68, notRecovered: 52, diff: '+16%p' },
    { factor: '쿠폰 사용율', recovered: 44, notRecovered: 38, diff: '+6%p' },
    { factor: '카테고리 다양성', recovered: 3.8, notRecovered: 3.4, diff: '+0.4개' },
    { factor: '주말 방문율', recovered: 52, notRecovered: 48, diff: '+4%p' },
  ],
};

export const CHURN_THRESHOLD = {
  critical: 4,
  description: '이탈 4회 이상부터 복귀율이 50% 미만으로 떨어짐',
  strategy: {
    under4: { label: '이탈 1~3회', recoveryRate: '>50%', action: '아직 살릴 수 있는 고객' },
    over4: { label: '이탈 4회+', recoveryRate: '<50%', action: '이미 이탈 패턴이 고착화' },
  },
};

// ============================================
// Part 5: 매장 폐쇄 영향 분석
// ============================================

export const STORE_CLOSURE_ANALYSIS = {
  summary: '매장 폐쇄로 인한 "강제 이탈"은 발생하지 않음',
  distribution: [
    { type: 'normal', label: '정상 매장만 이용', count: 2253, percentage: 90.1 },
    { type: 'mixed', label: '폐쇄+정상 매장 혼용', count: 247, percentage: 9.9 },
    { type: 'closedOnly', label: '폐쇄 매장만 이용', count: 0, percentage: 0 },
  ],
  gradeDistribution: {
    mixed: { VIP: 6, loyal: 15, active: 43, risk: 18, churn: 18 },
    normal: { VIP: 3, loyal: 15, active: 39, risk: 21, churn: 22 },
  },
  keyFinding: '폐쇄+정상 혼용 고객의 VIP 비율(6%)이 정상만 이용 고객(3%)보다 높음',
  conclusion: '본 분석 결과는 매장 폐쇄 영향 없이 신뢰할 수 있음',
};

// ============================================
// 분석 결과 요약 (Part 2~5 통합)
// ============================================

export interface KeyInsight {
  part: string;
  title: string;
  emoji: string;
  summary: string;
  metric: string;
  detail: string;
  supportingData: { label: string; value: string }[];
  action: string;
  type: 'warning' | 'success' | 'positive' | 'negative' | 'info';
}

export const KEY_INSIGHTS: KeyInsight[] = [
  {
    part: 'Part 2',
    title: '두 경로 구조',
    emoji: '',
    summary: '이탈 경험 유무에 따라 도달 가능 등급이 나뉜다',
    metric: '18.5% vs 81.5%',
    detail: '이탈 0회 경로(463명, 18.5%)만 VIP/충성 등급 해당. 이탈 1회+ 경로(2,037명, 81.5%)는 활성/위험/이탈 등급으로 분류된다.',
    supportingData: [
      { label: '이탈 0회 등급', value: 'VIP / 충성' },
      { label: '이탈 1회+ 등급', value: '활성 / 위험 / 이탈' },
      { label: '이탈 기준', value: '25일+ 공백' },
      { label: '이탈 경험자 중 활성', value: '49% (990명)' },
    ],
    action: '첫 이탈 발생 전 재방문 유도가 등급 유지에 유리',
    type: 'warning',
  },
  {
    part: 'Part 3',
    title: '쿠폰 사용과 이탈 0회 유지',
    emoji: '',
    summary: '쿠폰 사용이 이탈 0회 유지와 가장 높은 양의 상관을 보인다',
    metric: 'r=0.150***',
    detail: '이탈 0회 유지에서 쿠폰 사용(r=0.150***)이 6개 변수 중 가장 높은 상관계수. 복귀(r=0.061**)와 이탈 방지(r=0.061**)에서도 유의하다. 모두 작은 효과 크기(Cohen 기준).',
    supportingData: [
      { label: '이탈 0회 유지', value: 'r=0.150***' },
      { label: '복귀', value: 'r=0.061**' },
      { label: '이탈 방지', value: 'r=0.061**' },
      { label: '효과 크기', value: '작음 (|r|<0.30)' },
    ],
    action: '활성 고객 대상 쿠폰 발송이 이탈 방지와 양의 상관',
    type: 'success',
  },
  {
    part: 'Part 3',
    title: '다매장 방문과 복귀/이탈 방지',
    emoji: '',
    summary: '다매장 방문이 복귀, 이탈 방지, 위험 유지에서 가장 높은 상관을 보인다',
    metric: 'r=0.134~0.165***',
    detail: '다매장 방문은 이탈 방지(r=0.165***), 위험 유지(r=0.140***), 복귀(r=0.134***), 이탈 0회 유지(r=0.129***)에서 일관되게 유의한 양의 상관을 보인다.',
    supportingData: [
      { label: '이탈 방지', value: 'r=0.165***' },
      { label: '위험 유지', value: 'r=0.140***' },
      { label: '복귀', value: 'r=0.134***' },
      { label: '이탈 0회 유지', value: 'r=0.129***' },
    ],
    action: '이탈 위험 고객 대상 다른 지점 방문 유도와 양의 상관',
    type: 'positive',
  },
  {
    part: 'Part 3',
    title: 'VIP 도달과 경험 변수',
    emoji: '',
    summary: 'VIP 기준이 방문 362회 이상이므로, 경험 변수와의 음의 상관은 등급 기준에서 비롯된 결과',
    metric: 'n=463, VIP 70명',
    detail: '카테고리 다양성(r=-0.156)과 할인 경험(r=-0.136)이 약한 음의 상관을 보이지만, 방문 횟수를 통제하면 모두 비유의적이 된다. 자주 방문하는 고객이 한 번에 적게 사는 경향이 반영된 것.',
    supportingData: [
      { label: 'VIP 기준', value: '방문 362회+' },
      { label: '카테고리 다양성', value: 'r=-0.156 (통제 시 n.s.)' },
      { label: '할인 경험', value: 'r=-0.136 (통제 시 n.s.)' },
      { label: '대상', value: '이탈 0회 463명' },
    ],
    action: 'VIP 등급은 방문 빈도 기준이므로 경험 변수의 직접 효과는 제한적',
    type: 'info',
  },
  {
    part: 'Part 4',
    title: '이탈 횟수별 복귀율',
    emoji: '',
    summary: '이탈 횟수가 증가할수록 복귀율이 감소하며, 4회부터 50% 미만이 된다',
    metric: '73.5% → 48.1%',
    detail: '이탈 1회 복귀율 73.5%, 2회 65.6%, 3회 57.3%, 4회 48.1%. 이탈 7회 이상에서도 40.8%는 복귀한다.',
    supportingData: [
      { label: '이탈 1회 복귀율', value: '73.5%' },
      { label: '이탈 3회 복귀율', value: '57.3%' },
      { label: '이탈 4회 복귀율', value: '48.1%' },
      { label: '이탈 7회+ 복귀율', value: '40.8%' },
    ],
    action: '이탈 횟수가 적을수록 복귀율이 높으므로 조기 개입이 유리',
    type: 'negative',
  },
  {
    part: 'Part 5',
    title: '매장 폐쇄 영향 확인',
    emoji: '',
    summary: '폐쇄 매장만 이용한 고객이 0명으로, 매장 폐쇄에 의한 강제 이탈은 없다',
    metric: '0명 (0%)',
    detail: '정상 매장만 이용 90.1%(2,253명), 폐쇄+정상 혼용 9.9%(247명), 폐쇄 매장만 0명. 혼용 고객의 VIP 비율(6%)이 정상 고객(3%)보다 높다.',
    supportingData: [
      { label: '정상 매장만 이용', value: '2,253명 (90.1%)' },
      { label: '폐쇄+정상 혼용', value: '247명 (9.9%)' },
      { label: '폐쇄 매장만 이용', value: '0명 (0%)' },
      { label: '혼용 고객 VIP 비율', value: '6% (정상 3%)' },
    ],
    action: '매장 폐쇄가 분석 결과에 영향을 미치지 않음을 확인',
    type: 'info',
  },
];

// ============================================
// 유틸리티 함수
// ============================================

export function getCorrelationColor(value: number): string {
  if (value >= 0.15) return '#22c55e';  // 강한 양의 상관
  if (value >= 0.10) return '#3b82f6';  // 중간 양의 상관
  if (value >= 0.05) return '#06b6d4';  // 약한 양의 상관
  if (value > -0.05) return '#6b7280';  // 무의미
  if (value > -0.10) return '#f97316';  // 약한 음의 상관
  if (value > -0.15) return '#ef4444';  // 중간 음의 상관
  return '#dc2626';  // 강한 음의 상관
}

export function getSignificanceLabel(sig: string): string {
  switch (sig) {
    case '***': return 'p<0.001';
    case '**': return 'p<0.01';
    case '*': return 'p<0.05';
    default: return 'n.s.';
  }
}

export function formatCorrelation(r: number, sig: string): string {
  const sign = r >= 0 ? '+' : '';
  return `r=${sign}${r.toFixed(3)}${sig}`;
}

// 상관 요인 호버 시 행동 기반 쉬운 설명
export function getDriverExplanation(
  driverKey: string,
  transitionKey: string,
): string {
  // 유의하지 않은 경우
  const driver = BIDIRECTIONAL_DRIVERS[driverKey as keyof typeof BIDIRECTIONAL_DRIVERS];
  const sig = driver?.effects[transitionKey as keyof typeof driver.effects]?.sig;
  if (!sig) {
    return '유의한 차이 없음';
  }

  // 각 조합별 행동 기반 설명
  const explanations: Record<string, Record<string, string>> = {
    coupon: {
      no_churn_maintain: '쿠폰에 반응하는 고객은 매장과 접점이 많아 꾸준히 방문하는 편',
      recovery: '쿠폰이 재방문 계기가 되어 돌아오는 편',
      churn_prevention: '쿠폰이 재방문 동기가 되어 완전 이탈에서 벗어나는 편',
    },
    multi_store: {
      no_churn_maintain: '여러 매장을 다니면 한 곳이 불편해도 다른 곳으로 가서 이탈 없이 유지',
      recovery: '여러 매장을 알면 한 곳을 안 가도 다른 곳으로 돌아올 수 있음',
      churn_prevention: '여러 매장을 다니면 완전히 떠나기 어려움',
      risk_maintain: '여러 매장을 알면 완전 이탈 대신 가끔이라도 방문하는 편',
    },
    discount: {
      no_churn_maintain: '할인을 챙기는 고객은 정기적으로 방문하는 편',
      vip_achieve: 'VIP는 습관적으로 자주 오는 고객. 할인을 찾는 고객은 계획적이라 방문 빈도가 낮은 편',
      recovery: '할인 기회가 재방문 계기가 되는 편',
      churn_prevention: '할인이 재방문 계기가 되는 편',
    },
    category_diversity: {
      no_churn_maintain: '여러 카테고리를 사면 매장 의존도가 높아져 꾸준히 방문',
      vip_achieve: 'VIP는 자주 와서 늘 사던 것만 사는 습관형. 다양하게 사는 고객은 계획적이라 방문 빈도가 낮은 편',
      recovery: '여러 카테고리 필요가 있으면 다시 돌아올 이유가 많음',
      churn_prevention: '다양한 구매 필요가 있으면 완전 이탈이 어려움',
      risk_maintain: '다양한 구매 필요가 남아있으면 완전 이탈까지 가지 않는 편',
    },
    large_store: {
      no_churn_maintain: '대형매장은 선택지가 넓어 만족도가 높은 편',
    },
    weekend: {
      churn_prevention: '주말에만 오는 고객은 방문 빈도가 낮아 이탈하기 쉬운 편',
    },
  };

  return explanations[driverKey]?.[transitionKey] || '';
}

// ============================================
// 레거시 호환용 (기존 컴포넌트 지원)
// ============================================

// 기존 DRIVER_CONFIG 형식 유지 (하위 호환)
export const DRIVER_CONFIG = {
  coupon: {
    label: '쿠폰 사용',
    emoji: '',
    color: '#8b5cf6',
    description: '쿠폰을 사용하여 구매',
    effects: {
      no_churn_maintain: 15.0,
      vip_achieve: -4.2,
      recovery: 6.1,
      churn_prevention: 6.1,
      risk_maintain: 4.7,
    },
  },
  multi_store: {
    label: '다매장 방문',
    emoji: '',
    color: '#06b6d4',
    description: '2개 이상 매장 방문 경험',
    effects: {
      no_churn_maintain: 12.9,
      vip_achieve: -1.2,
      recovery: 13.4,
      churn_prevention: 16.5,
      risk_maintain: 14.0,
    },
  },
  discount: {
    label: '할인 경험',
    emoji: '',
    color: '#f59e0b',
    description: '할인 상품 구매 경험',
    effects: {
      no_churn_maintain: 11.8,
      vip_achieve: -13.6,
      recovery: 4.4,
      churn_prevention: 4.9,
      risk_maintain: 3.7,
    },
  },
  category_diversity: {
    label: '카테고리 다양성',
    emoji: '',
    color: '#ec4899',
    description: '3개 이상 다른 종류 상품 구매',
    effects: {
      no_churn_maintain: 10.2,
      vip_achieve: -15.6,
      recovery: 5.0,
      churn_prevention: 6.8,
      risk_maintain: 6.4,
    },
  },
  large_store: {
    label: '대형매장 방문',
    emoji: '',
    color: '#10b981',
    description: '대형매장 방문 경험',
    effects: {
      no_churn_maintain: 10.1,
      vip_achieve: 4.9,
      recovery: 2.8,
      churn_prevention: 1.2,
      risk_maintain: -0.6,
    },
  },
  weekend: {
    label: '주말 방문',
    emoji: '',
    color: '#6366f1',
    description: '주말 방문 경험',
    effects: {
      no_churn_maintain: 0.5,
      vip_achieve: -1.3,
      recovery: -1.8,
      churn_prevention: -4.6,
      risk_maintain: -5.4,
    },
  },
};

// 기존 CHURN_CORRELATIONS 형식 유지 (하위 호환)
export interface ChurnCorrelation {
  factor: string;
  label: string;
  emoji: string;
  correlation: number;
  pValue: number;
  significance: '***' | '**' | '*' | '';
  direction: 'increase' | 'decrease';
  churnRateWith: number;
  churnRateWithout: number;
}

export const CHURN_CORRELATIONS: ChurnCorrelation[] = [
  {
    factor: 'multi_store',
    label: '다매장 방문',
    emoji: '',
    correlation: -0.165,
    pValue: 0.001,
    significance: '***',
    direction: 'decrease',
    churnRateWith: 15.8,
    churnRateWithout: 29.8,
  },
  {
    factor: 'coupon_user',
    label: '쿠폰 사용',
    emoji: '',
    correlation: -0.150,
    pValue: 0.001,
    significance: '***',
    direction: 'decrease',
    churnRateWith: 14.2,
    churnRateWithout: 28.5,
  },
  {
    factor: 'discount',
    label: '할인 경험',
    emoji: '',
    correlation: -0.118,
    pValue: 0.001,
    significance: '***',
    direction: 'decrease',
    churnRateWith: 18.7,
    churnRateWithout: 26.5,
  },
  {
    factor: 'category_diversity',
    label: '카테고리 다양성',
    emoji: '',
    correlation: -0.102,
    pValue: 0.001,
    significance: '***',
    direction: 'decrease',
    churnRateWith: 19.2,
    churnRateWithout: 25.8,
  },
  {
    factor: 'large_store_visit',
    label: '대형매장 경험',
    emoji: '',
    correlation: -0.101,
    pValue: 0.001,
    significance: '***',
    direction: 'decrease',
    churnRateWith: 18.7,
    churnRateWithout: 34.2,
  },
];

// 기존 COMBINATION_EFFECTS 형식 유지
export interface CombinationEffect {
  name: string;
  factors: string[];
  churnRate: number;
  count: number;
  vsAverage: number;
  significance: string;
  insight: string;
  type: 'worst' | 'best';
}

export const COMBINATION_EFFECTS: CombinationEffect[] = [
  {
    name: '쿠폰+다매장+대형매장',
    factors: ['쿠폰 사용', '다매장 방문', '대형매장 경험'],
    churnRate: 8.3,
    count: 463,
    vsAverage: -13.1,
    significance: '***',
    insight: '3개 요인 결합 시 이탈율 8.3%, 평균(21.4%)의 약 1/3.',
    type: 'best',
  },
  {
    name: '쿠폰+다매장',
    factors: ['쿠폰 사용', '다매장 방문'],
    churnRate: 11.5,
    count: 687,
    vsAverage: -9.9,
    significance: '***',
    insight: '쿠폰 + 다매장 조합 시 이탈율 11.5%.',
    type: 'best',
  },
  {
    name: '대형매장+할인경험',
    factors: ['대형매장 경험', '할인 경험'],
    churnRate: 14.2,
    count: 542,
    vsAverage: -7.2,
    significance: '**',
    insight: '대형매장 + 할인 조합 시 이탈율 14.2%.',
    type: 'best',
  },
  {
    name: '단일매장+쿠폰없음',
    factors: ['단일매장만', '쿠폰 미사용'],
    churnRate: 38.5,
    count: 234,
    vsAverage: 17.1,
    significance: '***',
    insight: '단일매장 + 쿠폰 미사용 조합 시 이탈율 38.5%.',
    type: 'worst',
  },
  {
    name: '소형매장만+평일만',
    factors: ['소형매장만', '평일만 방문'],
    churnRate: 32.1,
    count: 312,
    vsAverage: 10.7,
    significance: '**',
    insight: '소형매장 + 평일만 조합 시 이탈율 32.1%.',
    type: 'worst',
  },
];
