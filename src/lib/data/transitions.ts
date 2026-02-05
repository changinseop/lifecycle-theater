import { State, STATES, TIME_POINTS, TimePoint } from './constants';

// Transition probabilities derived from Sankey data
// Format: FROM -> TO -> probability

export type TransitionMatrix = Record<State, Record<State, number>>;

// Transition matrix at different time intervals
// These are computed from the actual flow data
export const TRANSITION_MATRICES: Record<string, TransitionMatrix> = {
  // 시작 → 1개월
  '0-1': {
    [STATES.NEW]: {
      [STATES.NEW]: 0.79, [STATES.LOYAL]: 0.21, [STATES.ACTIVE]: 0,
      [STATES.VIP]: 0, [STATES.RISK]: 0, [STATES.CHURN]: 0
    },
    [STATES.LOYAL]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 1, [STATES.ACTIVE]: 0,
      [STATES.VIP]: 0, [STATES.RISK]: 0, [STATES.CHURN]: 0
    },
    [STATES.ACTIVE]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0, [STATES.ACTIVE]: 1,
      [STATES.VIP]: 0, [STATES.RISK]: 0, [STATES.CHURN]: 0
    },
    [STATES.VIP]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0, [STATES.ACTIVE]: 0,
      [STATES.VIP]: 1, [STATES.RISK]: 0, [STATES.CHURN]: 0
    },
    [STATES.RISK]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0, [STATES.ACTIVE]: 0,
      [STATES.VIP]: 0, [STATES.RISK]: 1, [STATES.CHURN]: 0
    },
    [STATES.CHURN]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0, [STATES.ACTIVE]: 0,
      [STATES.VIP]: 0, [STATES.RISK]: 0, [STATES.CHURN]: 1
    },
  },

  // 1개월 → 3개월
  '1-3': {
    [STATES.NEW]: {
      [STATES.NEW]: 0.37, [STATES.LOYAL]: 0.58, [STATES.ACTIVE]: 0.03,
      [STATES.VIP]: 0, [STATES.RISK]: 0.02, [STATES.CHURN]: 0
    },
    [STATES.LOYAL]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0.68, [STATES.ACTIVE]: 0.16,
      [STATES.VIP]: 0.01, [STATES.RISK]: 0.10, [STATES.CHURN]: 0.05
    },
    [STATES.ACTIVE]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0, [STATES.ACTIVE]: 1,
      [STATES.VIP]: 0, [STATES.RISK]: 0, [STATES.CHURN]: 0
    },
    [STATES.VIP]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0, [STATES.ACTIVE]: 0,
      [STATES.VIP]: 1, [STATES.RISK]: 0, [STATES.CHURN]: 0
    },
    [STATES.RISK]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0, [STATES.ACTIVE]: 0,
      [STATES.VIP]: 0, [STATES.RISK]: 1, [STATES.CHURN]: 0
    },
    [STATES.CHURN]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0, [STATES.ACTIVE]: 0,
      [STATES.VIP]: 0, [STATES.RISK]: 0, [STATES.CHURN]: 1
    },
  },

  // 3개월 → 6개월
  '3-6': {
    [STATES.NEW]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0.72, [STATES.ACTIVE]: 0.14,
      [STATES.VIP]: 0, [STATES.RISK]: 0.10, [STATES.CHURN]: 0.04
    },
    [STATES.LOYAL]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0.58, [STATES.ACTIVE]: 0.19,
      [STATES.VIP]: 0.004, [STATES.RISK]: 0.13, [STATES.CHURN]: 0.10
    },
    [STATES.ACTIVE]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0, [STATES.ACTIVE]: 0.48,
      [STATES.VIP]: 0, [STATES.RISK]: 0.30, [STATES.CHURN]: 0.22
    },
    [STATES.VIP]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0, [STATES.ACTIVE]: 0,
      [STATES.VIP]: 1, [STATES.RISK]: 0, [STATES.CHURN]: 0
    },
    [STATES.RISK]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0, [STATES.ACTIVE]: 0.24,
      [STATES.VIP]: 0, [STATES.RISK]: 0.30, [STATES.CHURN]: 0.46
    },
    [STATES.CHURN]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0, [STATES.ACTIVE]: 0.40,
      [STATES.VIP]: 0, [STATES.RISK]: 0.28, [STATES.CHURN]: 0.32
    },
  },

  // 6개월 → 12개월
  '6-12': {
    [STATES.NEW]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0, [STATES.ACTIVE]: 0,
      [STATES.VIP]: 0, [STATES.RISK]: 0, [STATES.CHURN]: 0
    },
    [STATES.LOYAL]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0.56, [STATES.ACTIVE]: 0.21,
      [STATES.VIP]: 0.01, [STATES.RISK]: 0.12, [STATES.CHURN]: 0.10
    },
    [STATES.ACTIVE]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0, [STATES.ACTIVE]: 0.51,
      [STATES.VIP]: 0, [STATES.RISK]: 0.29, [STATES.CHURN]: 0.20
    },
    [STATES.VIP]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0, [STATES.ACTIVE]: 0,
      [STATES.VIP]: 0.75, [STATES.RISK]: 0.25, [STATES.CHURN]: 0
    },
    [STATES.RISK]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0, [STATES.ACTIVE]: 0.42,
      [STATES.VIP]: 0, [STATES.RISK]: 0.29, [STATES.CHURN]: 0.29
    },
    [STATES.CHURN]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0, [STATES.ACTIVE]: 0.32,
      [STATES.VIP]: 0, [STATES.RISK]: 0.23, [STATES.CHURN]: 0.45
    },
  },

  // 12개월 → 18개월
  '12-18': {
    [STATES.NEW]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0, [STATES.ACTIVE]: 0,
      [STATES.VIP]: 0, [STATES.RISK]: 0, [STATES.CHURN]: 0
    },
    [STATES.LOYAL]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0.72, [STATES.ACTIVE]: 0.15,
      [STATES.VIP]: 0.01, [STATES.RISK]: 0.06, [STATES.CHURN]: 0.06
    },
    [STATES.ACTIVE]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0, [STATES.ACTIVE]: 0.58,
      [STATES.VIP]: 0, [STATES.RISK]: 0.26, [STATES.CHURN]: 0.16
    },
    [STATES.VIP]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0, [STATES.ACTIVE]: 0,
      [STATES.VIP]: 0.82, [STATES.RISK]: 0.18, [STATES.CHURN]: 0
    },
    [STATES.RISK]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0, [STATES.ACTIVE]: 0.41,
      [STATES.VIP]: 0, [STATES.RISK]: 0.32, [STATES.CHURN]: 0.27
    },
    [STATES.CHURN]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0, [STATES.ACTIVE]: 0.26,
      [STATES.VIP]: 0, [STATES.RISK]: 0.30, [STATES.CHURN]: 0.44
    },
  },

  // 18개월 → 24개월
  '18-24': {
    [STATES.NEW]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0, [STATES.ACTIVE]: 0,
      [STATES.VIP]: 0, [STATES.RISK]: 0, [STATES.CHURN]: 0
    },
    [STATES.LOYAL]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0.81, [STATES.ACTIVE]: 0.10,
      [STATES.VIP]: 0.01, [STATES.RISK]: 0.06, [STATES.CHURN]: 0.02
    },
    [STATES.ACTIVE]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0, [STATES.ACTIVE]: 0.61,
      [STATES.VIP]: 0, [STATES.RISK]: 0.23, [STATES.CHURN]: 0.16
    },
    [STATES.VIP]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0, [STATES.ACTIVE]: 0,
      [STATES.VIP]: 0.88, [STATES.RISK]: 0.12, [STATES.CHURN]: 0
    },
    [STATES.RISK]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0, [STATES.ACTIVE]: 0.48,
      [STATES.VIP]: 0, [STATES.RISK]: 0.30, [STATES.CHURN]: 0.22
    },
    [STATES.CHURN]: {
      [STATES.NEW]: 0, [STATES.LOYAL]: 0, [STATES.ACTIVE]: 0.28,
      [STATES.VIP]: 0, [STATES.RISK]: 0.24, [STATES.CHURN]: 0.48
    },
  },
};

// Aggregated transition matrix (overall average)
export const OVERALL_TRANSITION: TransitionMatrix = {
  [STATES.NEW]: {
    [STATES.NEW]: 0.30, [STATES.LOYAL]: 0.55, [STATES.ACTIVE]: 0.08,
    [STATES.VIP]: 0, [STATES.RISK]: 0.05, [STATES.CHURN]: 0.02
  },
  [STATES.LOYAL]: {
    [STATES.NEW]: 0, [STATES.LOYAL]: 0.65, [STATES.ACTIVE]: 0.16,
    [STATES.VIP]: 0.02, [STATES.RISK]: 0.10, [STATES.CHURN]: 0.07
  },
  [STATES.ACTIVE]: {
    [STATES.NEW]: 0, [STATES.LOYAL]: 0.15, [STATES.ACTIVE]: 0.50,
    [STATES.VIP]: 0, [STATES.RISK]: 0.22, [STATES.CHURN]: 0.13
  },
  [STATES.VIP]: {
    [STATES.NEW]: 0, [STATES.LOYAL]: 0.05, [STATES.ACTIVE]: 0,
    [STATES.VIP]: 0.83, [STATES.RISK]: 0.12, [STATES.CHURN]: 0
  },
  [STATES.RISK]: {
    [STATES.NEW]: 0, [STATES.LOYAL]: 0, [STATES.ACTIVE]: 0.35,
    [STATES.VIP]: 0, [STATES.RISK]: 0.30, [STATES.CHURN]: 0.35
  },
  [STATES.CHURN]: {
    [STATES.NEW]: 0, [STATES.LOYAL]: 0, [STATES.ACTIVE]: 0.30,
    [STATES.VIP]: 0, [STATES.RISK]: 0.25, [STATES.CHURN]: 0.45
  },
};

// Key insights from transitions
export const TRANSITION_INSIGHTS = [
  {
    id: 1,
    title: '위험→이탈 전환율 35%',
    description: '위험 상태 고객 3명 중 1명 이상이 이탈',
    severity: 'high' as const,
  },
  {
    id: 2,
    title: 'VIP 유지율 83%',
    description: 'VIP가 되면 대부분 유지됨',
    severity: 'positive' as const,
  },
  {
    id: 3,
    title: '충성→VIP 전환율 2%',
    description: '충성 고객 50명 중 1명만 VIP로 승급',
    severity: 'medium' as const,
  },
  {
    id: 4,
    title: '이탈→활성 복귀율 49%',
    description: '이탈 경험자의 절반이 결국 활성으로 복귀',
    severity: 'positive' as const,
  },
];

// Get time period key
export function getTimePeriodKey(from: TimePoint, to: TimePoint): string {
  return `${from}-${to}`;
}

// Get transition probability
export function getTransitionProbability(
  from: State,
  to: State,
  period?: string
): number {
  if (period && TRANSITION_MATRICES[period]) {
    return TRANSITION_MATRICES[period][from]?.[to] ?? 0;
  }
  return OVERALL_TRANSITION[from]?.[to] ?? 0;
}
