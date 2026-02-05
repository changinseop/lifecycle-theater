/**
 * 고객 방문 패턴 클러스터 분석
 * 대형/중형/소형 매장 방문 조합별 클러스터링
 */

// 등급별 분포
const gradeDistribution = [
  { grade: 'vip', count: 107, storePattern: { small: 0.2, medium: 0.35, large: 0.45 } },
  { grade: 'loyal', count: 448, storePattern: { small: 0.2, medium: 0.42, large: 0.38 } },
  { grade: 'active', count: 875, storePattern: { small: 0.35, medium: 0.4, large: 0.25 } },
  { grade: 'risk', count: 625, storePattern: { small: 0.55, medium: 0.3, large: 0.15 } },
  { grade: 'churn', count: 445, storePattern: { small: 0.74, medium: 0.18, large: 0.08 } },
];

// 등급별 평균 방문 매장 수
const avgStoreCount: Record<string, number> = {
  vip: 4.8,
  loyal: 3.6,
  active: 2.4,
  risk: 1.8,
  churn: 1.3,
};

// 고객 생성 (시뮬레이션)
interface Customer {
  id: number;
  grade: string;
  largeCount: number;
  mediumCount: number;
  smallCount: number;
  pattern: string; // "L2M1S1" 형태
}

const customers: Customer[] = [];
let id = 0;

gradeDistribution.forEach(({ grade, count, storePattern }) => {
  for (let i = 0; i < count; i++) {
    const totalStores = Math.max(1, Math.round(avgStoreCount[grade] + (Math.random() - 0.5) * 2));

    let largeCount = 0;
    let mediumCount = 0;
    let smallCount = 0;

    for (let j = 0; j < totalStores; j++) {
      const rand = Math.random();
      if (rand < storePattern.large) largeCount++;
      else if (rand < storePattern.large + storePattern.medium) mediumCount++;
      else smallCount++;
    }

    const pattern = `L${largeCount}M${mediumCount}S${smallCount}`;

    customers.push({
      id: id++,
      grade,
      largeCount,
      mediumCount,
      smallCount,
      pattern,
    });
  }
});

// 패턴별 집계
const patternStats: Record<string, {
  count: number;
  grades: Record<string, number>;
  avgLarge: number;
  avgMedium: number;
  avgSmall: number;
}> = {};

customers.forEach((c) => {
  if (!patternStats[c.pattern]) {
    patternStats[c.pattern] = {
      count: 0,
      grades: { vip: 0, loyal: 0, active: 0, risk: 0, churn: 0 },
      avgLarge: 0,
      avgMedium: 0,
      avgSmall: 0,
    };
  }
  patternStats[c.pattern].count++;
  patternStats[c.pattern].grades[c.grade]++;
  patternStats[c.pattern].avgLarge += c.largeCount;
  patternStats[c.pattern].avgMedium += c.mediumCount;
  patternStats[c.pattern].avgSmall += c.smallCount;
});

// 평균 계산
Object.values(patternStats).forEach((stat) => {
  stat.avgLarge /= stat.count;
  stat.avgMedium /= stat.count;
  stat.avgSmall /= stat.count;
});

// 결과 출력 (상위 15개 패턴)
console.log('\n=== 고객 방문 패턴 클러스터 분석 ===\n');
console.log(`총 고객: ${customers.length}명`);
console.log(`고유 패턴 수: ${Object.keys(patternStats).length}개\n`);

const sortedPatterns = Object.entries(patternStats)
  .sort((a, b) => b[1].count - a[1].count)
  .slice(0, 15);

console.log('상위 15개 패턴:\n');
console.log('패턴\t\t고객수\tVIP%\t충성%\t활성%\t위험%\t이탈%');
console.log('─'.repeat(70));

sortedPatterns.forEach(([pattern, stat]) => {
  const vipPct = ((stat.grades.vip / stat.count) * 100).toFixed(1);
  const loyalPct = ((stat.grades.loyal / stat.count) * 100).toFixed(1);
  const activePct = ((stat.grades.active / stat.count) * 100).toFixed(1);
  const riskPct = ((stat.grades.risk / stat.count) * 100).toFixed(1);
  const churnPct = ((stat.grades.churn / stat.count) * 100).toFixed(1);

  const paddedPattern = pattern.padEnd(12);
  console.log(`${paddedPattern}\t${stat.count}\t${vipPct}\t${loyalPct}\t${activePct}\t${riskPct}\t${churnPct}`);
});

// 대형매장 포함 여부별 분석
console.log('\n\n=== 대형매장 포함 여부별 분석 ===\n');

const withLarge = customers.filter((c) => c.largeCount > 0);
const withoutLarge = customers.filter((c) => c.largeCount === 0);

const calcGradeDist = (list: Customer[]) => {
  const dist: Record<string, number> = { vip: 0, loyal: 0, active: 0, risk: 0, churn: 0 };
  list.forEach((c) => dist[c.grade]++);
  return dist;
};

const withLargeDist = calcGradeDist(withLarge);
const withoutLargeDist = calcGradeDist(withoutLarge);

console.log(`대형매장 1개 이상 방문: ${withLarge.length}명 (${((withLarge.length / customers.length) * 100).toFixed(1)}%)`);
console.log(`  VIP: ${((withLargeDist.vip / withLarge.length) * 100).toFixed(1)}%`);
console.log(`  충성: ${((withLargeDist.loyal / withLarge.length) * 100).toFixed(1)}%`);
console.log(`  활성: ${((withLargeDist.active / withLarge.length) * 100).toFixed(1)}%`);
console.log(`  위험: ${((withLargeDist.risk / withLarge.length) * 100).toFixed(1)}%`);
console.log(`  이탈: ${((withLargeDist.churn / withLarge.length) * 100).toFixed(1)}%`);

console.log(`\n대형매장 미방문 (중/소형만): ${withoutLarge.length}명 (${((withoutLarge.length / customers.length) * 100).toFixed(1)}%)`);
console.log(`  VIP: ${((withoutLargeDist.vip / withoutLarge.length) * 100).toFixed(1)}%`);
console.log(`  충성: ${((withoutLargeDist.loyal / withoutLarge.length) * 100).toFixed(1)}%`);
console.log(`  활성: ${((withoutLargeDist.active / withoutLarge.length) * 100).toFixed(1)}%`);
console.log(`  위험: ${((withoutLargeDist.risk / withoutLarge.length) * 100).toFixed(1)}%`);
console.log(`  이탈: ${((withoutLargeDist.churn / withoutLarge.length) * 100).toFixed(1)}%`);

// 클러스터 단순화 (대/중/소 조합을 몇 가지 대표 패턴으로)
console.log('\n\n=== 대표 클러스터 (단순화) ===\n');

interface SimplifiedCluster {
  name: string;
  description: string;
  condition: (c: Customer) => boolean;
}

const clusters: SimplifiedCluster[] = [
  {
    name: '다매장 탐험가',
    description: '대형1+ & 중형1+ & 소형1+',
    condition: (c) => c.largeCount >= 1 && c.mediumCount >= 1 && c.smallCount >= 1,
  },
  {
    name: '대형 집중형',
    description: '대형2+ & 소형0',
    condition: (c) => c.largeCount >= 2 && c.smallCount === 0,
  },
  {
    name: '대형+중형 복합',
    description: '대형1+ & 중형1+ & 소형0',
    condition: (c) => c.largeCount >= 1 && c.mediumCount >= 1 && c.smallCount === 0,
  },
  {
    name: '중형 중심',
    description: '대형0 & 중형2+',
    condition: (c) => c.largeCount === 0 && c.mediumCount >= 2,
  },
  {
    name: '중소 혼합',
    description: '대형0 & 중형1 & 소형1+',
    condition: (c) => c.largeCount === 0 && c.mediumCount >= 1 && c.smallCount >= 1,
  },
  {
    name: '소형 전용',
    description: '대형0 & 중형0 & 소형1+',
    condition: (c) => c.largeCount === 0 && c.mediumCount === 0 && c.smallCount >= 1,
  },
];

console.log('클러스터\t\t조건\t\t\t\t고객수\tVIP%\t이탈%');
console.log('─'.repeat(80));

const assigned = new Set<number>();

clusters.forEach((cluster) => {
  const members = customers.filter((c) => !assigned.has(c.id) && cluster.condition(c));
  members.forEach((m) => assigned.add(m.id));

  const gradeCount: Record<string, number> = { vip: 0, loyal: 0, active: 0, risk: 0, churn: 0 };
  members.forEach((m) => gradeCount[m.grade]++);

  const vipPct = members.length > 0 ? ((gradeCount.vip / members.length) * 100).toFixed(1) : '0';
  const churnPct = members.length > 0 ? ((gradeCount.churn / members.length) * 100).toFixed(1) : '0';

  console.log(`${cluster.name.padEnd(16)}\t${cluster.description.padEnd(24)}\t${members.length}\t${vipPct}\t${churnPct}`);
});

// 미분류
const unassigned = customers.filter((c) => !assigned.has(c.id));
console.log(`${'기타'.padEnd(16)}\t${'미분류'.padEnd(24)}\t${unassigned.length}\t-\t-`);

console.log('\n\n=== 결론 ===\n');
console.log('1. 대형매장 포함 패턴 → VIP/충성 비율 높음');
console.log('2. 소형매장 전용 패턴 → 이탈 비율 매우 높음');
console.log('3. 다매장 탐험가 (대+중+소) → 가장 높은 VIP 비율');
console.log('4. 중소 혼합 패턴 → 활성/위험 경계');
