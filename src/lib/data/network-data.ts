/**
 * 고객-매장 네트워크 데이터
 * Force-directed graph 시각화용
 */

import { CustomerGrade, StoreSize, GRADE_CONFIG, STORE_CONFIG } from './store-experience';

// 매장 노드 타입
export interface StoreNode {
  id: string;
  type: 'store';
  size: StoreSize;
  name: string;
  // 활동성 지표
  totalRevenue: number; // 총 매출
  visitCount: number; // 방문 빈도 (일평균)
  weekendRatio: number; // 주말 비중 (%)
  avgBasket: number; // 평균 객단가
  customerCount: number; // 연결 고객 수
  vipRatio: number; // VIP 고객 비율
  churnRatio: number; // 이탈 고객 비율
  peakHour: number; // 피크 시간대
}

// 고객 노드 타입
export interface CustomerNode {
  id: string;
  type: 'customer';
  grade: CustomerGrade;
  ltv: number;
  visitedStores: string[]; // 방문 매장 ID 리스트
  storeCount: number; // 방문 매장 수
  primaryStoreSize: StoreSize; // 주 이용 매장 크기
}

// 엣지 (연결) 타입
export interface NetworkEdge {
  source: string;
  target: string;
  weight: number; // 방문 횟수
}

// 전체 네트워크 데이터
export interface NetworkData {
  stores: StoreNode[];
  customers: CustomerNode[];
  edges: NetworkEdge[];
}

// 매장 300개 생성
function generateStores(): StoreNode[] {
  const stores: StoreNode[] = [];

  // 소형매장 127개
  for (let i = 0; i < 127; i++) {
    stores.push({
      id: `store_small_${i}`,
      type: 'store',
      size: 'small',
      name: `편의점 ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) || ''}`,
      totalRevenue: 50000 + Math.random() * 100000,
      visitCount: 100 + Math.random() * 150,
      weekendRatio: 20 + Math.random() * 15,
      avgBasket: 8000 + Math.random() * 12000,
      customerCount: 0, // 나중에 계산
      vipRatio: 0,
      churnRatio: 0,
      peakHour: [8, 12, 18, 21][Math.floor(Math.random() * 4)],
    });
  }

  // 중형매장 98개
  for (let i = 0; i < 98; i++) {
    stores.push({
      id: `store_medium_${i}`,
      type: 'store',
      size: 'medium',
      name: `슈퍼 ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) || ''}`,
      totalRevenue: 200000 + Math.random() * 300000,
      visitCount: 300 + Math.random() * 200,
      weekendRatio: 35 + Math.random() * 20,
      avgBasket: 25000 + Math.random() * 30000,
      customerCount: 0,
      vipRatio: 0,
      churnRatio: 0,
      peakHour: [10, 14, 17, 19][Math.floor(Math.random() * 4)],
    });
  }

  // 대형매장 75개
  for (let i = 0; i < 75; i++) {
    stores.push({
      id: `store_large_${i}`,
      type: 'store',
      size: 'large',
      name: `대형마트 ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) || ''}`,
      totalRevenue: 800000 + Math.random() * 700000,
      visitCount: 800 + Math.random() * 500,
      weekendRatio: 55 + Math.random() * 20,
      avgBasket: 55000 + Math.random() * 50000,
      customerCount: 0,
      vipRatio: 0,
      churnRatio: 0,
      peakHour: [10, 14, 16, 19][Math.floor(Math.random() * 4)],
    });
  }

  return stores;
}

// 고객 2500명 생성 및 매장 연결
function generateCustomersAndEdges(stores: StoreNode[]): { customers: CustomerNode[]; edges: NetworkEdge[] } {
  const customers: CustomerNode[] = [];
  const edges: NetworkEdge[] = [];

  // 등급별 분포
  const gradeDistribution: { grade: CustomerGrade; count: number; storePattern: { small: number; medium: number; large: number } }[] = [
    { grade: 'vip', count: 107, storePattern: { small: 0.2, medium: 0.35, large: 0.45 } },
    { grade: 'loyal', count: 448, storePattern: { small: 0.2, medium: 0.42, large: 0.38 } },
    { grade: 'active', count: 875, storePattern: { small: 0.35, medium: 0.4, large: 0.25 } },
    { grade: 'risk', count: 625, storePattern: { small: 0.55, medium: 0.3, large: 0.15 } },
    { grade: 'churn', count: 445, storePattern: { small: 0.74, medium: 0.18, large: 0.08 } },
  ];

  // 매장을 크기별로 분류
  const smallStores = stores.filter(s => s.size === 'small');
  const mediumStores = stores.filter(s => s.size === 'medium');
  const largeStores = stores.filter(s => s.size === 'large');

  let customerId = 0;

  gradeDistribution.forEach(({ grade, count, storePattern }) => {
    for (let i = 0; i < count; i++) {
      // 방문 매장 수 결정 (등급별로 다름)
      const avgStoreCount = grade === 'vip' ? 4.8 : grade === 'loyal' ? 3.6 : grade === 'active' ? 2.4 : grade === 'risk' ? 1.8 : 1.3;
      const storeCount = Math.max(1, Math.round(avgStoreCount + (Math.random() - 0.5) * 2));

      const visitedStores: string[] = [];
      const storeVisits: { storeId: string; visits: number }[] = [];

      // 매장 선택
      for (let j = 0; j < storeCount; j++) {
        const rand = Math.random();
        let selectedStore: StoreNode;

        if (rand < storePattern.large) {
          selectedStore = largeStores[Math.floor(Math.random() * largeStores.length)];
        } else if (rand < storePattern.large + storePattern.medium) {
          selectedStore = mediumStores[Math.floor(Math.random() * mediumStores.length)];
        } else {
          selectedStore = smallStores[Math.floor(Math.random() * smallStores.length)];
        }

        if (!visitedStores.includes(selectedStore.id)) {
          visitedStores.push(selectedStore.id);
          const visitWeight = Math.ceil(Math.random() * 10);
          storeVisits.push({ storeId: selectedStore.id, visits: visitWeight });
        }
      }

      // 주 이용 매장 크기 결정
      const primarySize = storePattern.large > storePattern.medium && storePattern.large > storePattern.small
        ? 'large'
        : storePattern.medium > storePattern.small
        ? 'medium'
        : 'small';

      // LTV 계산 (등급 기반)
      const baseLtv = grade === 'vip' ? 8920 : grade === 'loyal' ? 4560 : grade === 'active' ? 2180 : grade === 'risk' ? 890 : 320;
      const ltv = baseLtv + (Math.random() - 0.5) * baseLtv * 0.3;

      const customer: CustomerNode = {
        id: `customer_${customerId++}`,
        type: 'customer',
        grade,
        ltv,
        visitedStores,
        storeCount: visitedStores.length,
        primaryStoreSize: primarySize,
      };

      customers.push(customer);

      // 엣지 생성
      storeVisits.forEach(({ storeId, visits }) => {
        edges.push({
          source: customer.id,
          target: storeId,
          weight: visits,
        });
      });
    }
  });

  return { customers, edges };
}

// 매장별 고객 통계 계산
function calculateStoreStats(stores: StoreNode[], customers: CustomerNode[], edges: NetworkEdge[]): void {
  stores.forEach(store => {
    const connectedEdges = edges.filter(e => e.target === store.id);
    const connectedCustomerIds = connectedEdges.map(e => e.source);
    const connectedCustomers = customers.filter(c => connectedCustomerIds.includes(c.id));

    store.customerCount = connectedCustomers.length;

    if (connectedCustomers.length > 0) {
      const vipCount = connectedCustomers.filter(c => c.grade === 'vip').length;
      const churnCount = connectedCustomers.filter(c => c.grade === 'churn').length;

      store.vipRatio = Math.round((vipCount / connectedCustomers.length) * 100 * 10) / 10;
      store.churnRatio = Math.round((churnCount / connectedCustomers.length) * 100 * 10) / 10;
    }
  });
}

// 네트워크 데이터 생성
export function generateNetworkData(): NetworkData {
  const stores = generateStores();
  const { customers, edges } = generateCustomersAndEdges(stores);
  calculateStoreStats(stores, customers, edges);

  return { stores, customers, edges };
}

// 싱글톤으로 데이터 유지 (매번 재생성 방지)
let cachedNetworkData: NetworkData | null = null;

export function getNetworkData(): NetworkData {
  if (!cachedNetworkData) {
    cachedNetworkData = generateNetworkData();
  }
  return cachedNetworkData;
}

// 매장 크기별 노드 크기
export const STORE_NODE_SIZES: Record<StoreSize, number> = {
  small: 6,
  medium: 12,
  large: 20,
};

// 고객 노드 크기
export const CUSTOMER_NODE_SIZE = 3;

// 매장 크기별 색상 (기존 설정 재활용)
export const STORE_COLORS: Record<StoreSize, string> = {
  small: STORE_CONFIG.small.color,
  medium: STORE_CONFIG.medium.color,
  large: STORE_CONFIG.large.color,
};

// 고객 등급별 색상 (기존 설정 재활용)
export const CUSTOMER_COLORS: Record<CustomerGrade, string> = {
  vip: GRADE_CONFIG.vip.color,
  loyal: GRADE_CONFIG.loyal.color,
  active: GRADE_CONFIG.active.color,
  risk: GRADE_CONFIG.risk.color,
  churn: GRADE_CONFIG.churn.color,
};
