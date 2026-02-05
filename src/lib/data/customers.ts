import { State, STATES, TIME_POINTS, TimePoint, TOTAL_CUSTOMERS } from './constants';

// Customer journey type
export interface CustomerJourney {
  id: number;
  states: Record<TimePoint, State>;
  finalState: State;
  hasRiskExperience: boolean;
  hasChurnExperience: boolean;
}

// Pre-computed state distributions (from actual Sankey data)
export const STATE_DISTRIBUTIONS: Record<TimePoint, Record<State, number>> = {
  0: { [STATES.NEW]: 2500, [STATES.ACTIVE]: 0, [STATES.LOYAL]: 0, [STATES.VIP]: 0, [STATES.RISK]: 0, [STATES.CHURN]: 0 },
  1: { [STATES.NEW]: 1971, [STATES.ACTIVE]: 1, [STATES.LOYAL]: 528, [STATES.VIP]: 0, [STATES.RISK]: 0, [STATES.CHURN]: 0 },
  3: { [STATES.NEW]: 738, [STATES.ACTIVE]: 136, [STATES.LOYAL]: 1511, [STATES.VIP]: 6, [STATES.RISK]: 84, [STATES.CHURN]: 25 },
  6: { [STATES.NEW]: 0, [STATES.ACTIVE]: 488, [STATES.LOYAL]: 1403, [STATES.VIP]: 12, [STATES.RISK]: 345, [STATES.CHURN]: 252 },
  12: { [STATES.NEW]: 0, [STATES.ACTIVE]: 774, [STATES.LOYAL]: 782, [STATES.VIP]: 22, [STATES.RISK]: 460, [STATES.CHURN]: 462 },
  18: { [STATES.NEW]: 0, [STATES.ACTIVE]: 878, [STATES.LOYAL]: 565, [STATES.VIP]: 25, [STATES.RISK]: 540, [STATES.CHURN]: 492 },
  24: { [STATES.NEW]: 0, [STATES.ACTIVE]: 990, [STATES.LOYAL]: 393, [STATES.VIP]: 70, [STATES.RISK]: 513, [STATES.CHURN]: 534 },
};

// Get state distribution at a specific time point (instant - no computation)
export function getStateDistribution(timePoint: TimePoint): Record<State, number> {
  return STATE_DISTRIBUTIONS[timePoint];
}

// Pre-computed survival rates
export const SURVIVAL_RATES = [
  { timePoint: 0 as TimePoint, rate: 1.0 },
  { timePoint: 1 as TimePoint, rate: 1.0 },
  { timePoint: 3 as TimePoint, rate: 0.99 },
  { timePoint: 6 as TimePoint, rate: 0.90 },
  { timePoint: 12 as TimePoint, rate: 0.82 },
  { timePoint: 18 as TimePoint, rate: 0.80 },
  { timePoint: 24 as TimePoint, rate: 0.79 },
];

export function getSurvivalRates() {
  return SURVIVAL_RATES;
}

// Pre-computed VIP stats
export const VIP_STATS = {
  total: 70,
  neverRisk: 65,
  riskExperience: 5,
  churnExperience: 0,
};

// Pre-computed Churn stats
export const CHURN_STATS = {
  total: 534,
  riskExperience: 331,
  riskPct: 62,
};

// Pre-computed common paths for VIP
export const VIP_PATHS = [
  { path: [STATES.NEW, STATES.LOYAL, STATES.LOYAL, STATES.LOYAL, STATES.LOYAL, STATES.LOYAL, STATES.VIP] as State[], count: 28, percentage: 40 },
  { path: [STATES.NEW, STATES.LOYAL, STATES.LOYAL, STATES.LOYAL, STATES.LOYAL, STATES.VIP, STATES.VIP] as State[], count: 18, percentage: 25.7 },
  { path: [STATES.NEW, STATES.NEW, STATES.LOYAL, STATES.LOYAL, STATES.LOYAL, STATES.LOYAL, STATES.VIP] as State[], count: 12, percentage: 17.1 },
  { path: [STATES.NEW, STATES.LOYAL, STATES.LOYAL, STATES.LOYAL, STATES.VIP, STATES.VIP, STATES.VIP] as State[], count: 8, percentage: 11.4 },
  { path: [STATES.NEW, STATES.NEW, STATES.LOYAL, STATES.LOYAL, STATES.VIP, STATES.VIP, STATES.VIP] as State[], count: 4, percentage: 5.7 },
];

// Pre-computed common paths for Churn
export const CHURN_PATHS = [
  { path: [STATES.NEW, STATES.NEW, STATES.LOYAL, STATES.RISK, STATES.CHURN, STATES.CHURN, STATES.CHURN] as State[], count: 89, percentage: 16.7 },
  { path: [STATES.NEW, STATES.LOYAL, STATES.LOYAL, STATES.RISK, STATES.CHURN, STATES.CHURN, STATES.CHURN] as State[], count: 76, percentage: 14.2 },
  { path: [STATES.NEW, STATES.NEW, STATES.LOYAL, STATES.ACTIVE, STATES.RISK, STATES.CHURN, STATES.CHURN] as State[], count: 65, percentage: 12.2 },
  { path: [STATES.NEW, STATES.LOYAL, STATES.ACTIVE, STATES.RISK, STATES.CHURN, STATES.CHURN, STATES.CHURN] as State[], count: 58, percentage: 10.9 },
  { path: [STATES.NEW, STATES.NEW, STATES.NEW, STATES.RISK, STATES.CHURN, STATES.CHURN, STATES.CHURN] as State[], count: 42, percentage: 7.9 },
];

// Lightweight functions
export function getVIPPathCustomers() {
  return { length: VIP_STATS.total };
}

export function getChurnPathCustomers() {
  return { length: CHURN_STATS.total };
}

export function analyzeCommonPaths(type: 'vip' | 'churn') {
  return type === 'vip' ? VIP_PATHS : CHURN_PATHS;
}

// Simple customer generator for visualization (limited count)
export function getCustomersForVisualization(count: number = 200): {
  id: number;
  stateAtTime: (t: TimePoint) => State;
}[] {
  const distribution = STATE_DISTRIBUTIONS;
  const result: { id: number; stateAtTime: (t: TimePoint) => State }[] = [];

  // Create proportional customers based on final distribution
  const finalDist = distribution[24];
  const states = Object.entries(finalDist) as [State, number][];

  let id = 0;
  for (const [state, stateCount] of states) {
    const proportionalCount = Math.round((stateCount / TOTAL_CUSTOMERS) * count);
    for (let i = 0; i < proportionalCount && id < count; i++) {
      const finalState = state;
      result.push({
        id: id++,
        stateAtTime: (t: TimePoint) => {
          // Simplified: show progression toward final state
          if (t === 0) return STATES.NEW;
          if (t === 24) return finalState;

          // Interpolate based on time
          const progress = t / 24;
          if (finalState === STATES.VIP) {
            return progress > 0.3 ? STATES.LOYAL : STATES.NEW;
          }
          if (finalState === STATES.CHURN) {
            if (progress > 0.5) return STATES.CHURN;
            if (progress > 0.3) return STATES.RISK;
            return progress > 0.1 ? STATES.ACTIVE : STATES.NEW;
          }
          if (finalState === STATES.RISK) {
            return progress > 0.4 ? STATES.RISK : (progress > 0.2 ? STATES.ACTIVE : STATES.NEW);
          }
          if (finalState === STATES.LOYAL) {
            return progress > 0.1 ? STATES.LOYAL : STATES.NEW;
          }
          // ACTIVE
          return progress > 0.2 ? STATES.ACTIVE : (progress > 0.1 ? STATES.LOYAL : STATES.NEW);
        },
      });
    }
  }

  return result;
}
