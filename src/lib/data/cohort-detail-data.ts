// Part 7: 매장이용행태별 코호트 분석 - 전체 데이터

export interface DepartmentSales {
  name: string;
  percentage: number;
  highlight?: boolean; // 특이점 강조
  comparison?: string; // 다른 코호트 대비 비교
}

export interface ItemPurchaseRate {
  name: string;
  rate: number; // 구매율 %
  comparisonRate?: number; // 비교 대상 구매율
  difference?: string; // 차이
}

export interface TimePattern {
  weekdayRatio: number; // 평일 비중 %
  weekendRatio: number; // 주말 비중 %
  peakHours: number[]; // 피크 시간대
  peakDay?: string; // 피크 요일
}

export interface ShoppingStyle {
  type: "탐색형" | "안정형" | "루틴형" | "필수품형";
  description: string;
  characteristics: string[];
}

export interface RetentionData {
  period: string;
  days: number;
  rate: number;
}

export interface GradeConversion {
  vip: number;
  loyal: number;
  active: number;
  risk: number;
  churn: number;
}

export interface StoreVisitPattern {
  large: { visits: number; ratio: number };
  medium: { visits: number; ratio: number };
  small: { visits: number; ratio: number };
}

export interface CohortDetailData {
  id: string;
  name: string;
  code: string; // 111, 110, 100, 010, 001
  description: string;

  // 기본 현황
  customerCount: number;
  customerRatio: number; // 전체 대비 %

  // 첫 1개월 행동
  firstMonth: {
    visits: number;
    sales: number;
    basketSize: number;
    basketValue: number;
  };

  // 매장 방문 패턴
  storePattern: StoreVisitPattern;

  // 카테고리 다양성
  categoryCount: number;
  itemCount: number;

  // 할인 의존도
  discountDependency: number;

  // 부문별 매출 비중
  departmentSales: DepartmentSales[];

  // 품목별 구매율
  itemPurchaseRates: ItemPurchaseRate[];

  // 등급 전환
  gradeConversion: GradeConversion;

  // 리텐션
  retention: RetentionData[];

  // 시간 패턴
  timePattern: TimePattern;

  // 쇼핑 스타일
  shoppingStyle: ShoppingStyle;

  // 핵심 인사이트
  keyInsights: string[];

  // 시각화 색상
  color: string;

  // 통계적 유의성
  statisticalNote?: string;
}

export const COHORT_DETAIL_DATA: CohortDetailData[] = [
  {
    id: "111",
    name: "다매장 탐험가",
    code: "111",
    description: "대형 + 중형 + 소형 모두 방문",

    customerCount: 18,
    customerRatio: 0.7,

    firstMonth: {
      visits: 16.2,
      sales: 339,
      basketSize: 6.1,
      basketValue: 21,
    },

    storePattern: {
      large: { visits: 4.6, ratio: 29 },
      medium: { visits: 8.6, ratio: 53 },
      small: { visits: 3.0, ratio: 19 },
    },

    categoryCount: 7.6,
    itemCount: 43.7,
    discountDependency: 50.3,

    departmentSales: [
      { name: "GROCERY", percentage: 43.3 },
      { name: "DRUG GM", percentage: 15.1 },
      { name: "FLORAL", percentage: 5.6, highlight: true, comparison: "19배 (타 코호트 0.3%)" },
      { name: "KIOSK-GAS", percentage: 7.1, highlight: true, comparison: "3.5배 (타 코호트 2.0%)" },
      { name: "PRODUCE", percentage: 7.4 },
      { name: "MEAT", percentage: 5.9 },
    ],

    itemPurchaseRates: [
      { name: "COUPON/MISC ITEMS", rate: 61, comparisonRate: 12, difference: "+49%p" },
      { name: "MILK BY-PRODUCTS", rate: 61, comparisonRate: 29, difference: "+32%p" },
      { name: "SOFT DRINKS", rate: 94, comparisonRate: 59, difference: "+35%p" },
      { name: "CHEESE", rate: 78 },
    ],

    gradeConversion: {
      vip: 27.8,
      loyal: 44.4,
      active: 22.2,
      risk: 5.6,
      churn: 0.0,
    },

    retention: [
      { period: "시작", days: 0, rate: 100.0 },
      { period: "+1개월", days: 30, rate: 100.0 },
      { period: "+2개월", days: 60, rate: 100.0 },
      { period: "+3개월", days: 90, rate: 100.0 },
      { period: "+6개월", days: 180, rate: 100.0 },
      { period: "+12개월", days: 365, rate: 100.0 },
      { period: "+18개월", days: 548, rate: 100.0 },
    ],

    timePattern: {
      weekdayRatio: 52,
      weekendRatio: 48,
      peakHours: [17, 18, 19],
      peakDay: "토요일",
    },

    shoppingStyle: {
      type: "탐색형",
      description: "소량 다빈도, 다양한 경험 추구",
      characteristics: [
        "월 16.2회 방문 (최다)",
        "장바구니 6.1개, $21 (소량)",
        "카테고리 7.6개 (최다)",
        "할인 의존도 50.3% (최저 = 정가 구매)",
        "FLORAL, KIOSK-GAS 특화",
      ],
    },

    keyInsights: [
      "VIP 전환율 27.8% (전체 평균의 10배)",
      "이탈율 0% (완전 방지)",
      "18개월 리텐션 100%",
      "FLORAL 구매 19배, KIOSK-GAS 3.5배",
      "쿠폰 품목 구매율 61% (소형 Only 12%)",
      "충성 이상(VIP+충성) 72.2%",
    ],

    color: "#fbbf24",
    statisticalNote: "Chi²=106.02, p<0.001",
  },

  {
    id: "110",
    name: "대형+중형",
    code: "110",
    description: "대형과 중형만 방문",

    customerCount: 387,
    customerRatio: 15.5,

    firstMonth: {
      visits: 8.9,
      sales: 233,
      basketSize: 8.8,
      basketValue: 26,
    },

    storePattern: {
      large: { visits: 4.8, ratio: 54 },
      medium: { visits: 4.1, ratio: 46 },
      small: { visits: 0, ratio: 0 },
    },

    categoryCount: 6.7,
    itemCount: 37.1,
    discountDependency: 53.3,

    departmentSales: [
      { name: "GROCERY", percentage: 52.0 },
      { name: "DRUG GM", percentage: 13.5 },
      { name: "FLORAL", percentage: 0.5 },
      { name: "KIOSK-GAS", percentage: 4.0 },
      { name: "PRODUCE", percentage: 6.9 },
      { name: "MEAT", percentage: 7.5 },
    ],

    itemPurchaseRates: [
      { name: "COUPON/MISC ITEMS", rate: 38 },
      { name: "MILK BY-PRODUCTS", rate: 45 },
      { name: "SOFT DRINKS", rate: 78 },
    ],

    gradeConversion: {
      vip: 4.4,
      loyal: 23.3,
      active: 38.0,
      risk: 18.1,
      churn: 16.3,
    },

    retention: [
      { period: "시작", days: 0, rate: 100.0 },
      { period: "+1개월", days: 30, rate: 96.9 },
      { period: "+2개월", days: 60, rate: 88.4 },
      { period: "+3개월", days: 90, rate: 87.9 },
      { period: "+6개월", days: 180, rate: 87.9 },
      { period: "+12개월", days: 365, rate: 85.8 },
      { period: "+18개월", days: 548, rate: 82.4 },
    ],

    timePattern: {
      weekdayRatio: 58,
      weekendRatio: 42,
      peakHours: [18, 19],
      peakDay: "금요일",
    },

    shoppingStyle: {
      type: "안정형",
      description: "중간 빈도, 대형 위주, 신선식품 집중",
      characteristics: [
        "월 8.9회 방문",
        "대형 54% + 중형 46%",
        "카테고리 6.7개",
        "신선식품 비중 높음",
      ],
    },

    keyInsights: [
      "VIP 전환율 4.4%",
      "이탈율 16.3%",
      "2개월 시점 이탈 집중 (96.9%→88.4%)",
      "안정적 감소 패턴",
    ],

    color: "#22c55e",
  },

  {
    id: "100",
    name: "대형 Only",
    code: "100",
    description: "대형매장만 방문",

    customerCount: 1344,
    customerRatio: 53.8,

    firstMonth: {
      visits: 5.8,
      sales: 168,
      basketSize: 9.9,
      basketValue: 29,
    },

    storePattern: {
      large: { visits: 5.8, ratio: 100 },
      medium: { visits: 0, ratio: 0 },
      small: { visits: 0, ratio: 0 },
    },

    categoryCount: 5.6,
    itemCount: 28.8,
    discountDependency: 51.7,

    departmentSales: [
      { name: "GROCERY", percentage: 53.2 },
      { name: "DRUG GM", percentage: 13.3 },
      { name: "FLORAL", percentage: 0.6 },
      { name: "KIOSK-GAS", percentage: 2.6 },
      { name: "PRODUCE", percentage: 8.0 },
      { name: "MEAT", percentage: 7.0 },
    ],

    itemPurchaseRates: [
      { name: "COUPON/MISC ITEMS", rate: 28 },
      { name: "MILK BY-PRODUCTS", rate: 42 },
      { name: "SOFT DRINKS", rate: 72 },
    ],

    gradeConversion: {
      vip: 2.7,
      loyal: 16.9,
      active: 40.3,
      risk: 20.6,
      churn: 19.5,
    },

    retention: [
      { period: "시작", days: 0, rate: 100.0 },
      { period: "+1개월", days: 30, rate: 76.7 },
      { period: "+2개월", days: 60, rate: 77.7 },
      { period: "+3개월", days: 90, rate: 77.9 },
      { period: "+6개월", days: 180, rate: 78.4 },
      { period: "+12개월", days: 365, rate: 78.8 },
      { period: "+18개월", days: 548, rate: 80.0 },
    ],

    timePattern: {
      weekdayRatio: 55,
      weekendRatio: 45,
      peakHours: [17, 18],
      peakDay: "토요일",
    },

    shoppingStyle: {
      type: "루틴형",
      description: "저빈도, 원스톱, 필수품 위주",
      characteristics: [
        "월 5.8회 방문",
        "대형 100%",
        "장바구니 9.9개 (중간)",
        "원스톱 쇼핑",
      ],
    },

    keyInsights: [
      "최대 고객군 (53.8%)",
      "VIP 전환율 2.7%",
      "이탈율 19.5%",
      "1개월 이내 이탈자 결정, 이후 안정",
    ],

    color: "#3b82f6",
  },

  {
    id: "010",
    name: "중형 Only",
    code: "010",
    description: "중형매장만 방문",

    customerCount: 587,
    customerRatio: 23.5,

    firstMonth: {
      visits: 5.4,
      sales: 144,
      basketSize: 8.9,
      basketValue: 26,
    },

    storePattern: {
      large: { visits: 0, ratio: 0 },
      medium: { visits: 5.4, ratio: 100 },
      small: { visits: 0, ratio: 0 },
    },

    categoryCount: 5.3,
    itemCount: 24.8,
    discountDependency: 54.6,

    departmentSales: [
      { name: "GROCERY", percentage: 51.7 },
      { name: "DRUG GM", percentage: 14.3 },
      { name: "FLORAL", percentage: 0.4 },
      { name: "KIOSK-GAS", percentage: 3.9 },
      { name: "PRODUCE", percentage: 6.4 },
      { name: "MEAT", percentage: 8.5 },
    ],

    itemPurchaseRates: [
      { name: "COUPON/MISC ITEMS", rate: 22 },
      { name: "MILK BY-PRODUCTS", rate: 38 },
      { name: "SOFT DRINKS", rate: 68 },
    ],

    gradeConversion: {
      vip: 2.0,
      loyal: 10.9,
      active: 40.7,
      risk: 21.6,
      churn: 24.7,
    },

    retention: [
      { period: "시작", days: 0, rate: 100.0 },
      { period: "+1개월", days: 30, rate: 70.0 },
      { period: "+2개월", days: 60, rate: 71.2 },
      { period: "+3개월", days: 90, rate: 72.7 },
      { period: "+6개월", days: 180, rate: 74.6 },
      { period: "+12개월", days: 365, rate: 75.5 },
      { period: "+18개월", days: 548, rate: 76.1 },
    ],

    timePattern: {
      weekdayRatio: 60,
      weekendRatio: 40,
      peakHours: [18, 19],
      peakDay: "수요일",
    },

    shoppingStyle: {
      type: "루틴형",
      description: "저빈도, 원스톱, 필수품 위주",
      characteristics: [
        "월 5.4회 방문",
        "중형 100%",
        "대형 유도 필요",
      ],
    },

    keyInsights: [
      "VIP 전환율 2.0%",
      "이탈율 24.7%",
      "초기 급락 후 안정",
      "대형매장 경험 유도 필요",
    ],

    color: "#8b5cf6",
  },

  {
    id: "001",
    name: "소형 Only",
    code: "001",
    description: "소형매장만 방문",

    customerCount: 83,
    customerRatio: 3.3,

    firstMonth: {
      visits: 4.0,
      sales: 131,
      basketSize: 11.1,
      basketValue: 33,
    },

    storePattern: {
      large: { visits: 0, ratio: 0 },
      medium: { visits: 0, ratio: 0 },
      small: { visits: 4.0, ratio: 100 },
    },

    categoryCount: 4.8,
    itemCount: 24.2,
    discountDependency: 57.6,

    departmentSales: [
      { name: "GROCERY", percentage: 53.6 },
      { name: "DRUG GM", percentage: 12.5 },
      { name: "FLORAL", percentage: 0.3 },
      { name: "KIOSK-GAS", percentage: 2.0 },
      { name: "PRODUCE", percentage: 7.5 },
      { name: "MEAT", percentage: 9.5 },
    ],

    itemPurchaseRates: [
      { name: "COUPON/MISC ITEMS", rate: 12, comparisonRate: 61, difference: "-49%p" },
      { name: "MILK BY-PRODUCTS", rate: 29, comparisonRate: 61, difference: "-32%p" },
      { name: "SOFT DRINKS", rate: 59, comparisonRate: 94, difference: "-35%p" },
    ],

    gradeConversion: {
      vip: 0.0,
      loyal: 9.6,
      active: 39.8,
      risk: 25.3,
      churn: 25.3,
    },

    retention: [
      { period: "시작", days: 0, rate: 100.0 },
      { period: "+1개월", days: 30, rate: 66.3 },
      { period: "+2개월", days: 60, rate: 71.1 },
      { period: "+3개월", days: 90, rate: 65.1 },
      { period: "+6개월", days: 180, rate: 62.7 },
      { period: "+12개월", days: 365, rate: 62.2 },
      { period: "+18개월", days: 548, rate: 74.4 },
    ],

    timePattern: {
      weekdayRatio: 65,
      weekendRatio: 35,
      peakHours: [12, 13],
      peakDay: "월요일",
    },

    shoppingStyle: {
      type: "필수품형",
      description: "저빈도 대량, 할인 의존, GROCERY 집중",
      characteristics: [
        "월 4.0회 방문 (최저)",
        "장바구니 11.1개, $33 (대량)",
        "카테고리 4.8개 (최저)",
        "할인 의존도 57.6% (최고)",
        "GROCERY 집중 (53.6%)",
      ],
    },

    keyInsights: [
      "VIP 전환율 0% (불가능)",
      "이탈율 25.3%",
      "위험+이탈 50.6%",
      "1개월 만에 33.7% 이탈",
      "할인 의존도 최고 (57.6%)",
      "필수품 위주 구매",
    ],

    color: "#6b7280",
  },
];

// 코호트 간 비교 데이터
export const COHORT_COMPARISON = {
  explorer_vs_small: {
    title: "탐색형 vs 필수품형",
    metrics: [
      { label: "방문 빈도", explorer: "16.2회/월", small: "4.0회/월", winner: "explorer" },
      { label: "장바구니", explorer: "6.1개, $21", small: "11.1개, $33", note: "소량 다빈도 vs 저빈도 대량" },
      { label: "카테고리", explorer: "7.6개", small: "4.8개", diff: "+58%" },
      { label: "FLORAL", explorer: "5.6%", small: "0.3%", diff: "19배" },
      { label: "할인 의존", explorer: "50.3%", small: "57.6%", note: "정가 구매 vs 할인 의존" },
      { label: "VIP 전환", explorer: "27.8%", small: "0%", winner: "explorer" },
      { label: "이탈율", explorer: "0%", small: "25.3%", winner: "explorer" },
    ],
  },
};

// 통계적 검증 결과
export const STATISTICAL_VALIDATION = {
  chiSquare: {
    statistic: 106.02,
    pValue: "< 0.001",
    conclusion: "첫 1개월 패턴 → 최종 등급 예측 유의미",
  },
  zTest: {
    vipRate: { statistic: 6.29, pValue: "< 0.001", conclusion: "다매장 vs 나머지 VIP율 유의미 차이" },
    churnRate: { statistic: -2.16, pValue: "0.031", conclusion: "다매장 vs 나머지 이탈율 유의미 차이" },
  },
};

// 첫 방문 매장 유형별 분석
export const FIRST_VISIT_ANALYSIS = [
  { storeType: "대형", customerCount: 1588, vipConversion: 3.0, churnRate: 18.5 },
  { storeType: "중형", customerCount: 790, vipConversion: 2.9, churnRate: 23.7 },
  { storeType: "소형", customerCount: 122, vipConversion: 1.6, churnRate: 26.2 },
];
