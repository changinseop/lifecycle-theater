// Auto-generated racing data types

export interface RacingCustomer {
  id: number;
  finalStage: 'vip' | 'loyal' | 'active' | 'risk' | 'churn';
  totalVisits: number;
  totalSales: number;
  churnCount: number;
  recoveryCount: number;
  visitDays: number[];
}

export interface RepresentativeCustomer extends RacingCustomer {
  stage: string;
  events: {
    day: number;
    state: string;
    visited: boolean;
    cumVisits: number;
  }[];
}

export interface DailyStat {
  day: number;
  active: number;
  risk: number;
  churn: number;
  recovered: number;
}

export interface RacingData {
  metadata: {
    totalCustomers: number;
    sampleSize: number;
    maxDay: number;
    churnThreshold: number;
    riskThreshold: number;
    vipThreshold: number;
    stageCounts: Record<string, number>;
  };
  customers: RacingCustomer[];
  representatives: RepresentativeCustomer[];
  dailyStats: DailyStat[];
}
