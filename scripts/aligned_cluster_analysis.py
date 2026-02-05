"""
보고서 기준에 맞춘 고객 방문 패턴 클러스터 분석
- 매장 분류: 고객수 + 제품수 기준 (대형/중형/소형)
- 고객 등급: VIP/충성/활성/위험/이탈 (보고서 기준)
"""

import pandas as pd
import numpy as np
from collections import Counter
import warnings
warnings.filterwarnings('ignore')

DATA_PATH = '/Users/inseopchang/vscode_inseop/seob_project/2.icb_project/Dunnhumby/dataset'

print("=" * 70)
print("보고서 기준 고객 방문 패턴 클러스터 분석")
print("=" * 70)

# 1. 데이터 로드
print("\n[1] 데이터 로드...")
transactions = pd.read_csv(f'{DATA_PATH}/transaction_data.csv')
products = pd.read_csv(f'{DATA_PATH}/product.csv')

print(f"  거래: {len(transactions):,}건")

# 2. 매장 분류 (보고서 기준: 고객수 + 제품수)
print("\n[2] 매장 분류 (보고서 기준)...")

# 매장별 고객 수
store_customers = transactions.groupby('STORE_ID')['household_key'].nunique().reset_index()
store_customers.columns = ['STORE_ID', 'customer_count']

# 매장별 제품 수
store_products = transactions.groupby('STORE_ID')['PRODUCT_ID'].nunique().reset_index()
store_products.columns = ['STORE_ID', 'product_count']

store_stats = store_customers.merge(store_products, on='STORE_ID')

# 보고서 기준 분류
def classify_store(row):
    if row['customer_count'] >= 100 and row['product_count'] >= 5000:
        return 'large'
    elif row['customer_count'] >= 30 and row['product_count'] >= 200:
        return 'medium'
    else:
        return 'small'

store_stats['store_size'] = store_stats.apply(classify_store, axis=1)
store_size_map = store_stats.set_index('STORE_ID')['store_size'].to_dict()

large_count = sum(1 for v in store_size_map.values() if v == 'large')
medium_count = sum(1 for v in store_size_map.values() if v == 'medium')
small_count = sum(1 for v in store_size_map.values() if v == 'small')

print(f"  대형: {large_count}개, 중형: {medium_count}개, 소형: {small_count}개")

# 3. 고객 등급 분류 (보고서 기준: 이탈 횟수 + 방문 횟수)
print("\n[3] 고객 등급 분류 (보고서 기준)...")

# 고객별 방문 기록
customer_visits = transactions.groupby('household_key').agg({
    'DAY': list,
    'BASKET_ID': 'nunique',
    'SALES_VALUE': 'sum'
}).reset_index()

# 방문 간격 계산 및 이탈 횟수 (25일+ 미방문 = 1회 이탈)
def count_churns(days):
    days = sorted(set(days))
    churns = 0
    for i in range(1, len(days)):
        if days[i] - days[i-1] >= 25:
            churns += 1
    return churns

customer_visits['churn_count'] = customer_visits['DAY'].apply(count_churns)
customer_visits['visit_count'] = customer_visits['BASKET_ID']

# 이탈 0회 고객 중 상위 15% = VIP
no_churn = customer_visits[customer_visits['churn_count'] == 0]
vip_threshold = no_churn['visit_count'].quantile(0.85)

# 마지막 방문일 확인 (현재 상태)
max_day = transactions['DAY'].max()
last_visit = transactions.groupby('household_key')['DAY'].max().reset_index()
last_visit.columns = ['household_key', 'last_day']
customer_visits = customer_visits.merge(last_visit, on='household_key')
customer_visits['days_since_last'] = max_day - customer_visits['last_day']

def classify_grade(row):
    if row['churn_count'] == 0:
        if row['visit_count'] >= vip_threshold:
            return 'vip'
        else:
            return 'loyal'
    elif row['days_since_last'] >= 25:
        return 'churn'
    elif row['days_since_last'] >= 8:
        return 'risk'
    else:
        return 'active'

customer_visits['grade'] = customer_visits.apply(classify_grade, axis=1)

grade_counts = customer_visits['grade'].value_counts()
print(f"  VIP: {grade_counts.get('vip', 0)}명")
print(f"  충성: {grade_counts.get('loyal', 0)}명")
print(f"  활성: {grade_counts.get('active', 0)}명")
print(f"  위험: {grade_counts.get('risk', 0)}명")
print(f"  이탈: {grade_counts.get('churn', 0)}명")

# 4. 고객별 매장 방문 패턴 분석
print("\n[4] 고객별 매장 방문 패턴 분석...")

transactions['store_size'] = transactions['STORE_ID'].map(store_size_map)

# 고객별 매장 크기별 방문 횟수
customer_store = transactions.groupby(['household_key', 'store_size']).agg({
    'BASKET_ID': 'nunique'
}).reset_index()

pivot = customer_store.pivot_table(
    index='household_key',
    columns='store_size',
    values='BASKET_ID',
    fill_value=0
).reset_index()

# 컬럼이 없을 수 있으므로 확인
for col in ['large', 'medium', 'small']:
    if col not in pivot.columns:
        pivot[col] = 0

pivot.columns = ['household_key', 'large_visits', 'medium_visits', 'small_visits']
pivot['total_visits'] = pivot['large_visits'] + pivot['medium_visits'] + pivot['small_visits']

# 등급 정보 추가
customer_data = pivot.merge(
    customer_visits[['household_key', 'grade', 'SALES_VALUE']],
    on='household_key'
)

# 5. 방문 패턴 클러스터 정의 (보고서 인사이트 기반)
print("\n[5] 방문 패턴 클러스터 분석...")
print("-" * 70)

def classify_pattern(row):
    large = row['large_visits']
    medium = row['medium_visits']
    small = row['small_visits']
    total = row['total_visits']

    if total == 0:
        return 'no_visit'

    large_pct = large / total
    medium_pct = medium / total
    small_pct = small / total

    # 패턴 분류
    if large >= 1 and medium >= 1 and small >= 1:
        return 'explorer'  # 다매장 탐험가
    elif large >= 2 and small == 0:
        return 'large_focused'  # 대형 집중
    elif large >= 1 and medium >= 1 and small == 0:
        return 'large_medium'  # 대형+중형 복합
    elif large == 0 and medium >= 2:
        return 'medium_focused'  # 중형 중심
    elif large == 0 and medium >= 1 and small >= 1:
        return 'medium_small'  # 중소 혼합
    elif large == 0 and medium == 0 and small >= 1:
        return 'small_only'  # 소형 전용
    else:
        return 'other'

customer_data['pattern'] = customer_data.apply(classify_pattern, axis=1)

# 클러스터별 통계
print("\n클러스터별 분석 결과:\n")

cluster_results = []

for pattern in ['explorer', 'large_focused', 'large_medium', 'medium_focused', 'medium_small', 'small_only']:
    cluster = customer_data[customer_data['pattern'] == pattern]
    if len(cluster) == 0:
        continue

    grade_dist = cluster['grade'].value_counts().to_dict()
    vip_count = grade_dist.get('vip', 0)
    loyal_count = grade_dist.get('loyal', 0)
    active_count = grade_dist.get('active', 0)
    risk_count = grade_dist.get('risk', 0)
    churn_count = grade_dist.get('churn', 0)

    total = len(cluster)
    vip_rate = vip_count / total * 100 if total > 0 else 0
    churn_rate = churn_count / total * 100 if total > 0 else 0

    avg_large = cluster['large_visits'].mean()
    avg_medium = cluster['medium_visits'].mean()
    avg_small = cluster['small_visits'].mean()
    avg_sales = cluster['SALES_VALUE'].mean()
    avg_visits = cluster['total_visits'].mean()

    cluster_results.append({
        'pattern': pattern,
        'count': total,
        'vip': vip_count,
        'loyal': loyal_count,
        'active': active_count,
        'risk': risk_count,
        'churn': churn_count,
        'vip_rate': vip_rate,
        'churn_rate': churn_rate,
        'avg_large': avg_large,
        'avg_medium': avg_medium,
        'avg_small': avg_small,
        'avg_sales': avg_sales,
        'avg_visits': avg_visits
    })

    pattern_names = {
        'explorer': '다매장 탐험가',
        'large_focused': '대형 집중',
        'large_medium': '대형+중형 복합',
        'medium_focused': '중형 중심',
        'medium_small': '중소 혼합',
        'small_only': '소형 전용'
    }

    print(f"=== {pattern_names.get(pattern, pattern)} ===")
    print(f"  고객 수: {total}명 ({total/len(customer_data)*100:.1f}%)")
    print(f"  등급 분포: VIP {vip_count} / 충성 {loyal_count} / 활성 {active_count} / 위험 {risk_count} / 이탈 {churn_count}")
    print(f"  VIP율: {vip_rate:.1f}% | 이탈율: {churn_rate:.1f}%")
    print(f"  평균 방문: 대형 {avg_large:.1f} / 중형 {avg_medium:.1f} / 소형 {avg_small:.1f}")
    print(f"  평균 매출: ${avg_sales:.0f}")
    print()

# 6. 클러스터별 Top 구매 품목
print("\n[6] 클러스터별 Top 구매 품목...")
print("-" * 70)

# 거래에 패턴 정보 추가
pattern_map = customer_data.set_index('household_key')['pattern'].to_dict()
transactions['pattern'] = transactions['household_key'].map(pattern_map)

# 상품 정보 추가
transactions_with_product = transactions.merge(
    products[['PRODUCT_ID', 'DEPARTMENT', 'COMMODITY_DESC', 'SUB_COMMODITY_DESC']],
    on='PRODUCT_ID',
    how='left'
)

for pattern in ['explorer', 'large_focused', 'large_medium', 'medium_focused', 'medium_small', 'small_only']:
    cluster_trans = transactions_with_product[transactions_with_product['pattern'] == pattern]
    if len(cluster_trans) == 0:
        continue

    pattern_names = {
        'explorer': '다매장 탐험가',
        'large_focused': '대형 집중',
        'large_medium': '대형+중형 복합',
        'medium_focused': '중형 중심',
        'medium_small': '중소 혼합',
        'small_only': '소형 전용'
    }

    print(f"\n=== {pattern_names.get(pattern, pattern)} ===")

    # Top 카테고리
    dept_sales = cluster_trans.groupby('DEPARTMENT')['SALES_VALUE'].sum().sort_values(ascending=False)
    total_sales = dept_sales.sum()

    print("\nTop 5 카테고리:")
    for i, (dept, sales) in enumerate(dept_sales.head(5).items(), 1):
        pct = sales / total_sales * 100
        print(f"  {i}. {dept}: {pct:.1f}%")

    # Top 품목
    commodity_stats = cluster_trans.groupby('COMMODITY_DESC').agg({
        'household_key': 'nunique',
        'SALES_VALUE': 'sum'
    }).sort_values('household_key', ascending=False)

    cluster_count = customer_data[customer_data['pattern'] == pattern]['household_key'].nunique()

    print("\nTop 5 품목 (구매 고객 비율):")
    for i, (commodity, row) in enumerate(commodity_stats.head(5).iterrows(), 1):
        buy_rate = row['household_key'] / cluster_count * 100
        dept = cluster_trans[cluster_trans['COMMODITY_DESC'] == commodity]['DEPARTMENT'].iloc[0]
        print(f"  {i}. {commodity} ({dept}): {buy_rate:.1f}%")

# 7. TypeScript 형식 출력
print("\n\n" + "=" * 70)
print("TypeScript cluster-data.ts 형식")
print("=" * 70)

print("""
// 실제 Dunnhumby 데이터 분석 기반 클러스터
export const VISIT_CLUSTERS: VisitCluster[] = [""")

pattern_config = {
    'explorer': {'name': '다매장 탐험가', 'icon': '🧭', 'color': '#fbbf24'},
    'large_focused': {'name': '대형 집중형', 'icon': '🛒', 'color': '#22c55e'},
    'large_medium': {'name': '대형+중형 복합', 'icon': '🏬', 'color': '#3b82f6'},
    'medium_focused': {'name': '중형 중심', 'icon': '🏪', 'color': '#8b5cf6'},
    'medium_small': {'name': '중소 혼합', 'icon': '🔄', 'color': '#f97316'},
    'small_only': {'name': '소형 전용', 'icon': '📍', 'color': '#6b7280'},
}

for result in cluster_results:
    pattern = result['pattern']
    if pattern not in pattern_config:
        continue

    config = pattern_config[pattern]

    # 해당 클러스터의 Top 품목
    cluster_trans = transactions_with_product[transactions_with_product['pattern'] == pattern]
    commodity_stats = cluster_trans.groupby('COMMODITY_DESC').agg({
        'household_key': 'nunique',
        'SALES_VALUE': 'sum'
    }).sort_values('household_key', ascending=False)

    dept_sales = cluster_trans.groupby('DEPARTMENT')['SALES_VALUE'].sum().sort_values(ascending=False)
    total_sales = dept_sales.sum()

    # Top 카테고리
    top_cats = []
    for dept, sales in dept_sales.head(4).items():
        pct = int(sales / total_sales * 100)
        top_cats.append(f"{{ name: '{dept}', percentage: {pct} }}")

    # Top 품목
    top_prods = []
    for commodity, row in commodity_stats.head(5).iterrows():
        buy_rate = int(row['household_key'] / result['count'] * 100)
        dept = cluster_trans[cluster_trans['COMMODITY_DESC'] == commodity]['DEPARTMENT'].iloc[0]
        top_prods.append(f"{{ name: '{commodity}', category: '{dept}', buyRate: {buy_rate} }}")

    # 방문 패턴 설명
    total_visits = result['avg_large'] + result['avg_medium'] + result['avg_small']
    large_pct = result['avg_large'] / total_visits if total_visits > 0 else 0
    medium_pct = result['avg_medium'] / total_visits if total_visits > 0 else 0
    small_pct = result['avg_small'] / total_visits if total_visits > 0 else 0

    print(f"""  {{
    id: '{pattern}',
    name: '{config["name"]}',
    description: '대형 {large_pct*100:.0f}% / 중형 {medium_pct*100:.0f}% / 소형 {small_pct*100:.0f}%',
    customerCount: {result['count']},
    icon: '{config["icon"]}',
    color: '{config["color"]}',
    gradeDistribution: {{ vip: {result['vip']}, loyal: {result['loyal']}, active: {result['active']}, risk: {result['risk']}, churn: {result['churn']} }},
    vipRate: {result['vip_rate']:.1f},
    churnRate: {result['churn_rate']:.1f},
    avgLtv: {result['avg_sales']:.0f},
    storePattern: {{ large: {result['avg_large']:.1f}, medium: {result['avg_medium']:.1f}, small: {result['avg_small']:.1f} }},
    avgVisitFrequency: {result['avg_visits']:.1f},
    avgBasket: {result['avg_sales']/result['avg_visits']:.0f},
    topCategories: [{', '.join(top_cats)}],
    topProducts: [{', '.join(top_prods)}],
  }},""")

print("];")
print("\n분석 완료!")
