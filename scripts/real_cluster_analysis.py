"""
Dunnhumby 실제 데이터 기반 고객 클러스터 분석
- 매장 방문 패턴 기반 클러스터링
- 클러스터별 Top 구매 품목 추출
"""

import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from collections import Counter
import warnings
warnings.filterwarnings('ignore')

# 데이터 경로
DATA_PATH = '/Users/inseopchang/vscode_inseop/seob_project/2.icb_project/Dunnhumby/dataset'

print("=" * 60)
print("Dunnhumby 고객 클러스터 분석")
print("=" * 60)

# 1. 데이터 로드
print("\n[1] 데이터 로드 중...")
transactions = pd.read_csv(f'{DATA_PATH}/transaction_data.csv')
products = pd.read_csv(f'{DATA_PATH}/product.csv')
demographics = pd.read_csv(f'{DATA_PATH}/hh_demographic.csv')

print(f"  - 거래 데이터: {len(transactions):,}건")
print(f"  - 상품 데이터: {len(products):,}개")
print(f"  - 고객 데이터: {len(demographics):,}명")

# 2. 매장 크기 분류 (거래량 기준)
print("\n[2] 매장 크기 분류...")
store_stats = transactions.groupby('STORE_ID').agg({
    'BASKET_ID': 'nunique',
    'SALES_VALUE': 'sum',
    'household_key': 'nunique'
}).reset_index()
store_stats.columns = ['STORE_ID', 'basket_count', 'total_sales', 'unique_customers']

# 매장을 3분위로 분류
store_stats['store_size'] = pd.qcut(store_stats['total_sales'], q=3, labels=['small', 'medium', 'large'])
store_size_map = store_stats.set_index('STORE_ID')['store_size'].to_dict()

print(f"  - 대형 매장: {sum(1 for v in store_size_map.values() if v == 'large')}개")
print(f"  - 중형 매장: {sum(1 for v in store_size_map.values() if v == 'medium')}개")
print(f"  - 소형 매장: {sum(1 for v in store_size_map.values() if v == 'small')}개")

# 3. 고객별 매장 방문 패턴 분석
print("\n[3] 고객별 매장 방문 패턴 분석...")
transactions['store_size'] = transactions['STORE_ID'].map(store_size_map)

customer_store_pattern = transactions.groupby(['household_key', 'store_size']).agg({
    'BASKET_ID': 'nunique',
    'SALES_VALUE': 'sum'
}).reset_index()

# 피벗 테이블 생성
pivot_visits = customer_store_pattern.pivot_table(
    index='household_key',
    columns='store_size',
    values='BASKET_ID',
    fill_value=0
).reset_index()

pivot_sales = customer_store_pattern.pivot_table(
    index='household_key',
    columns='store_size',
    values='SALES_VALUE',
    fill_value=0
).reset_index()

# 고객 특성 데이터 생성
customer_features = pivot_visits.copy()
customer_features.columns = ['household_key', 'large_visits', 'medium_visits', 'small_visits']
customer_features['total_visits'] = customer_features['large_visits'] + customer_features['medium_visits'] + customer_features['small_visits']

# 매장 유형별 비율
customer_features['large_ratio'] = customer_features['large_visits'] / customer_features['total_visits']
customer_features['medium_ratio'] = customer_features['medium_visits'] / customer_features['total_visits']
customer_features['small_ratio'] = customer_features['small_visits'] / customer_features['total_visits']

# 총 지출
pivot_sales.columns = ['household_key', 'large_sales', 'medium_sales', 'small_sales']
customer_features = customer_features.merge(pivot_sales, on='household_key')
customer_features['total_sales'] = customer_features['large_sales'] + customer_features['medium_sales'] + customer_features['small_sales']

print(f"  - 분석 대상 고객: {len(customer_features):,}명")

# 4. K-Means 클러스터링
print("\n[4] K-Means 클러스터링 (6개 클러스터)...")
features_for_clustering = ['large_ratio', 'medium_ratio', 'small_ratio', 'total_visits', 'total_sales']
X = customer_features[features_for_clustering].values

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

kmeans = KMeans(n_clusters=6, random_state=42, n_init=10)
customer_features['cluster'] = kmeans.fit_predict(X_scaled)

# 5. 클러스터 분석
print("\n[5] 클러스터별 특성 분석...")
print("-" * 80)

cluster_summary = []

for cluster_id in range(6):
    cluster_data = customer_features[customer_features['cluster'] == cluster_id]

    avg_large = cluster_data['large_ratio'].mean()
    avg_medium = cluster_data['medium_ratio'].mean()
    avg_small = cluster_data['small_ratio'].mean()
    avg_visits = cluster_data['total_visits'].mean()
    avg_sales = cluster_data['total_sales'].mean()
    count = len(cluster_data)

    # 클러스터 이름 결정
    if avg_large > 0.5:
        if avg_medium > 0.2:
            name = "Large+Medium Hybrid"
        else:
            name = "Large Store Focused"
    elif avg_small > 0.5:
        if avg_medium > 0.2:
            name = "Medium+Small Mix"
        else:
            name = "Small Store Only"
    elif avg_medium > 0.4:
        name = "Medium Store Centered"
    else:
        name = "Multi-Store Explorer"

    cluster_summary.append({
        'cluster_id': cluster_id,
        'name': name,
        'count': count,
        'large_ratio': avg_large,
        'medium_ratio': avg_medium,
        'small_ratio': avg_small,
        'avg_visits': avg_visits,
        'avg_sales': avg_sales
    })

    print(f"\nCluster {cluster_id}: {name}")
    print(f"  고객 수: {count:,}명 ({count/len(customer_features)*100:.1f}%)")
    print(f"  대형 비율: {avg_large*100:.1f}% | 중형: {avg_medium*100:.1f}% | 소형: {avg_small*100:.1f}%")
    print(f"  평균 방문: {avg_visits:.1f}회 | 평균 지출: ${avg_sales:.0f}")

# 6. 클러스터별 Top 구매 품목
print("\n\n[6] 클러스터별 Top 구매 품목...")
print("-" * 80)

# 거래 데이터에 클러스터 정보 추가
transactions_with_cluster = transactions.merge(
    customer_features[['household_key', 'cluster']],
    on='household_key',
    how='left'
)

# 상품 정보 추가
transactions_with_cluster = transactions_with_cluster.merge(
    products[['PRODUCT_ID', 'DEPARTMENT', 'COMMODITY_DESC', 'SUB_COMMODITY_DESC']],
    on='PRODUCT_ID',
    how='left'
)

cluster_products = {}

for cluster_id in range(6):
    cluster_trans = transactions_with_cluster[transactions_with_cluster['cluster'] == cluster_id]

    # 카테고리(DEPARTMENT)별 매출
    dept_sales = cluster_trans.groupby('DEPARTMENT')['SALES_VALUE'].sum().sort_values(ascending=False)
    top_depts = dept_sales.head(5)

    # 세부 품목(COMMODITY_DESC)별 구매 빈도
    commodity_counts = cluster_trans.groupby('COMMODITY_DESC').agg({
        'BASKET_ID': 'nunique',
        'SALES_VALUE': 'sum'
    }).sort_values('BASKET_ID', ascending=False)
    top_commodities = commodity_counts.head(10)

    cluster_products[cluster_id] = {
        'top_departments': top_depts,
        'top_commodities': top_commodities
    }

    print(f"\n=== Cluster {cluster_id}: {cluster_summary[cluster_id]['name']} ===")
    print("\nTop 5 Departments:")
    for dept, sales in top_depts.items():
        pct = sales / cluster_trans['SALES_VALUE'].sum() * 100
        print(f"  - {dept}: ${sales:,.0f} ({pct:.1f}%)")

    print("\nTop 10 Products (by purchase frequency):")
    for i, (commodity, row) in enumerate(top_commodities.iterrows(), 1):
        print(f"  {i}. {commodity}: {row['BASKET_ID']:,} baskets, ${row['SALES_VALUE']:,.0f}")

# 7. TypeScript 데이터 출력
print("\n\n" + "=" * 80)
print("TypeScript 데이터 형식 출력")
print("=" * 80)

print("\n// cluster-data.ts 용 데이터")
print("export const VISIT_CLUSTERS: VisitCluster[] = [")

for i, summary in enumerate(cluster_summary):
    cluster_id = summary['cluster_id']
    prods = cluster_products[cluster_id]

    # Top 5 products
    top_prods = []
    for commodity, row in prods['top_commodities'].head(5).iterrows():
        buy_rate = int(row['BASKET_ID'] / summary['count'] * 100)
        dept = transactions_with_cluster[transactions_with_cluster['COMMODITY_DESC'] == commodity]['DEPARTMENT'].iloc[0]
        top_prods.append(f"      {{ name: '{commodity}', category: '{dept}', buyRate: {buy_rate} }}")

    # Top categories
    top_cats = []
    total_sales = prods['top_departments'].sum()
    for dept, sales in prods['top_departments'].head(4).items():
        pct = int(sales / total_sales * 100)
        top_cats.append(f"      {{ name: '{dept}', percentage: {pct} }}")

    print(f"""  {{
    id: 'cluster_{cluster_id}',
    name: '{summary["name"]}',
    customerCount: {summary['count']},
    storePattern: {{ large: {summary['large_ratio']:.2f}, medium: {summary['medium_ratio']:.2f}, small: {summary['small_ratio']:.2f} }},
    avgVisitFrequency: {summary['avg_visits']:.1f},
    avgBasket: {summary['avg_sales'] / summary['avg_visits']:.0f},
    topCategories: [
{chr(10).join(top_cats)}
    ],
    topProducts: [
{chr(10).join(top_prods)}
    ],
  }},""")

print("];")

print("\n\n분석 완료!")
