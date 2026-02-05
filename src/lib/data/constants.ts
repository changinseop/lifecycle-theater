// Customer States
export const STATES = {
  NEW: 'new',
  ACTIVE: 'active',
  LOYAL: 'loyal',
  VIP: 'vip',
  RISK: 'risk',
  CHURN: 'churn',
} as const;

export type State = typeof STATES[keyof typeof STATES];

// State Configuration
export const STATE_CONFIG: Record<State, {
  label: string;
  labelKo: string;
  emoji: string;
  color: string;
  colorHex: string;
}> = {
  [STATES.NEW]: {
    label: 'New',
    labelKo: '신규',
    emoji: '👶',
    color: 'state-new',
    colorHex: '#ec4899',
  },
  [STATES.ACTIVE]: {
    label: 'Active',
    labelKo: '활성',
    emoji: '🙂',
    color: 'state-active',
    colorHex: '#3b82f6',
  },
  [STATES.LOYAL]: {
    label: 'Loyal',
    labelKo: '충성',
    emoji: '🥰',
    color: 'state-loyal',
    colorHex: '#22c55e',
  },
  [STATES.VIP]: {
    label: 'VIP',
    labelKo: 'VIP',
    emoji: '👑',
    color: 'state-vip',
    colorHex: '#fbbf24',
  },
  [STATES.RISK]: {
    label: 'Risk',
    labelKo: '위험',
    emoji: '😰',
    color: 'state-risk',
    colorHex: '#f97316',
  },
  [STATES.CHURN]: {
    label: 'Churn',
    labelKo: '이탈',
    emoji: '👻',
    color: 'state-churn',
    colorHex: '#6b7280',
  },
};

// Time Points (months)
export const TIME_POINTS = [0, 1, 3, 6, 12, 18, 24] as const;
export type TimePoint = typeof TIME_POINTS[number];

export const TIME_LABELS: Record<TimePoint, string> = {
  0: '시작',
  1: '1개월',
  3: '3개월',
  6: '6개월',
  12: '12개월',
  18: '18개월',
  24: '24개월',
};

// Final State Distribution (from Sankey data)
export const FINAL_DISTRIBUTION = {
  [STATES.VIP]: { count: 70, pct: 2.8 },
  [STATES.LOYAL]: { count: 393, pct: 15.7 },
  [STATES.ACTIVE]: { count: 990, pct: 39.6 },
  [STATES.RISK]: { count: 513, pct: 20.5 },
  [STATES.CHURN]: { count: 534, pct: 21.4 },
};

// State Details (for cards)
export const STATE_DETAILS = {
  [STATES.VIP]: {
    ltv: '$10,688',
    avgVisitDays: '341일',
    criteria: '이탈 0회 + 방문일 362일+',
    insight: '거의 매일 방문. 2년 중 48% 방문.',
    cumPct: 1.4,
  },
  [STATES.LOYAL]: {
    ltv: '$6,712',
    avgVisitDays: '168일',
    criteria: '이탈 0회 + 방문일 362일 미만',
    insight: 'VIP 승급 가능성 높음.',
    cumPct: 10.7,
  },
  [STATES.ACTIVE]: {
    ltv: '$2,962',
    avgVisitDays: '89일',
    criteria: '이탈 경험 + 8일 내 재방문',
    insight: '가장 큰 그룹. 충성 전환 유도.',
    cumPct: 38.3,
  },
  [STATES.RISK]: {
    ltv: '$2,014',
    avgVisitDays: '62일',
    criteria: '최근 방문 8~24일 전',
    insight: '긴급 개입 필요.',
    cumPct: 68.4,
  },
  [STATES.CHURN]: {
    ltv: '$1,322',
    avgVisitDays: '38일',
    criteria: '최근 방문 25일+ 전',
    insight: '약 49% 윈백 가능.',
    cumPct: 89.3,
  },
};

// Total customers
export const TOTAL_CUSTOMERS = 2500;
