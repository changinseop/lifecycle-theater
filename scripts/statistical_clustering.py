"""
통계적 클러스터링 분석
- K-Means로 최적 클러스터 수 탐색
- Silhouette Score로 검증
- 클러스터 특성 분석 후 등급 매칭
"""

import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score, calinski_harabasz_score
import warnings
warnings.filterwarnings('ignore')

DATA_PATH = '/Users/inseopchang/vscode_inseop/seob_project/2.icb_project/Dunnhumby/dataset'

print("=" * 70)
print("통계적 클러스터링 분석")
print("=" * 70)

# 1. 데이터 로드 및 전처리
print("\n[1] 데이터 로드...")
transactions = pd.read_csv(f'{DATA_PATH}/transaction_data.csv')
products = pd.read_csv(f'{DATA_PATH}/product.csv')

print(f"  거래: {len(transactions):,}건")

# 2. 매장 분류 (보고서 기준)
print("\n[2] 매장 분류...")
store_customers = transactions.groupby('STORE_ID')['household_key'].nunique().reset_index()
store_customers.columns = ['STORE_ID', 'customer_count']

store_products = transactions.groupby('STORE_ID')['PRODUCT_ID'].nunique().reset_index()
store_products.columns = ['STORE_ID', 'product_count']

store_stats = store_customers.merge(store_products, on='STORE_ID')

def classify_store(row):
    if row['customer_count'] >= 100 and row['product_count'] >= 5000:
        return 'large'
    elif row['customer_count'] >= 30 and row['product_count'] >= 200:
        return 'medium'
    else:
        return 'small'

store_stats['store_size'] = store_stats.apply(classify_store, axis=1)
store_size_map = store_stats.set_index('STORE_ID')['store_size'].to_dict()

transactions['store_size'] = transactions['STORE_ID'].map(store_size_map)

# 3. 고객별 특성 추출
print("\n[3] 고객별 특성 추출...")

# 매장 크기별 방문 비율
customer_store = transactions.groupby(['household_key', 'store_size']).agg({
    'BASKET_ID': 'nunique',
    'SALES_VALUE': 'sum'
}).reset_index()

pivot_visits = customer_store.pivot_table(
    index='household_key',
    columns='store_size',
    values='BASKET_ID',
    fill_value=0
).reset_index()

for col in ['large', 'medium', 'small']:
    if col not in pivot_visits.columns:
        pivot_visits[col] = 0

pivot_visits.columns = ['household_key', 'large_visits', 'medium_visits', 'small_visits']
pivot_visits['total_visits'] = pivot_visits['large_visits'] + pivot_visits['medium_visits'] + pivot_visits['small_visits']

# 비율 계산
pivot_visits['large_ratio'] = pivot_visits['large_visits'] / pivot_visits['total_visits']
pivot_visits['medium_ratio'] = pivot_visits['medium_visits'] / pivot_visits['total_visits']
pivot_visits['small_ratio'] = pivot_visits['small_visits'] / pivot_visits['total_visits']

# 총 매출
customer_sales = transactions.groupby('household_key')['SALES_VALUE'].sum().reset_index()
customer_sales.columns = ['household_key', 'total_sales']

customer_features = pivot_visits.merge(customer_sales, on='household_key')

# 방문 다양성 (엔트로피)
def calc_entropy(row):
    probs = [row['large_ratio'], row['medium_ratio'], row['small_ratio']]
    probs = [p for p in probs if p > 0]
    if len(probs) <= 1:
        return 0
    return -sum(p * np.log(p) for p in probs)

customer_features['store_entropy'] = customer_features.apply(calc_entropy, axis=1)

print(f"  분석 대상 고객: {len(customer_features):,}명")

# 4. 클러스터링용 특성 선택
print("\n[4] 클러스터링 특성...")
feature_cols = ['large_ratio', 'medium_ratio', 'small_ratio', 'total_visits', 'store_entropy']
X = customer_features[feature_cols].values

# 정규화
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

print(f"  사용 특성: {feature_cols}")

# 5. 최적 클러스터 수 탐색
print("\n[5] 최적 클러스터 수 탐색...")
print("-" * 70)

results = []
for k in range(2, 11):
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X_scaled)

    inertia = kmeans.inertia_
    silhouette = silhouette_score(X_scaled, labels)
    calinski = calinski_harabasz_score(X_scaled, labels)

    results.append({
        'k': k,
        'inertia': inertia,
        'silhouette': silhouette,
        'calinski': calinski
    })

    print(f"  k={k}: Silhouette={silhouette:.4f}, Calinski-Harabasz={calinski:.1f}, Inertia={inertia:.1f}")

# 최적 k 선택 (Silhouette 기준)
best_k = max(results, key=lambda x: x['silhouette'])['k']
print(f"\n  → 최적 클러스터 수 (Silhouette 기준): k = {best_k}")

# Elbow method 분석
print("\n  Elbow 분석:")
for i in range(1, len(results)):
    prev_inertia = results[i-1]['inertia']
    curr_inertia = results[i]['inertia']
    reduction = (prev_inertia - curr_inertia) / prev_inertia * 100
    print(f"    k={results[i]['k']}: Inertia 감소율 {reduction:.1f}%")

# 6. 최적 k로 클러스터링
print(f"\n[6] k={best_k} 클러스터링 수행...")

kmeans = KMeans(n_clusters=best_k, random_state=42, n_init=10)
customer_features['cluster'] = kmeans.fit_predict(X_scaled)

# 7. 고객 등급 계산 (보고서 기준)
print("\n[7] 고객 등급 분류 (보고서 기준)...")

customer_visits_raw = transactions.groupby('household_key').agg({
    'DAY': list,
    'BASKET_ID': 'nunique'
}).reset_index()

def count_churns(days):
    days = sorted(set(days))
    churns = 0
    for i in range(1, len(days)):
        if days[i] - days[i-1] >= 25:
            churns += 1
    return churns

customer_visits_raw['churn_count'] = customer_visits_raw['DAY'].apply(count_churns)
customer_visits_raw['visit_count'] = customer_visits_raw['BASKET_ID']

no_churn = customer_visits_raw[customer_visits_raw['churn_count'] == 0]
vip_threshold = no_churn['visit_count'].quantile(0.85)

max_day = transactions['DAY'].max()
last_visit = transactions.groupby('household_key')['DAY'].max().reset_index()
last_visit.columns = ['household_key', 'last_day']
customer_visits_raw = customer_visits_raw.merge(last_visit, on='household_key')
customer_visits_raw['days_since_last'] = max_day - customer_visits_raw['last_day']

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

customer_visits_raw['grade'] = customer_visits_raw.apply(classify_grade, axis=1)

# 등급 정보 병합
customer_features = customer_features.merge(
    customer_visits_raw[['household_key', 'grade']],
    on='household_key'
)

# 8. 클러스터 분석
print("\n[8] 클러스터별 특성 분석...")
print("=" * 70)

cluster_summary = []

for cluster_id in range(best_k):
    cluster = customer_features[customer_features['cluster'] == cluster_id]

    # 기본 통계
    count = len(cluster)
    avg_large = cluster['large_ratio'].mean()
    avg_medium = cluster['medium_ratio'].mean()
    avg_small = cluster['small_ratio'].mean()
    avg_visits = cluster['total_visits'].mean()
    avg_sales = cluster['total_sales'].mean()
    avg_entropy = cluster['store_entropy'].mean()

    # 등급 분포
    grade_dist = cluster['grade'].value_counts().to_dict()
    vip_count = grade_dist.get('vip', 0)
    loyal_count = grade_dist.get('loyal', 0)
    active_count = grade_dist.get('active', 0)
    risk_count = grade_dist.get('risk', 0)
    churn_count = grade_dist.get('churn', 0)

    vip_rate = vip_count / count * 100
    churn_rate = churn_count / count * 100

    # 클러스터 특성 기반 이름
    if avg_large > 0.7:
        name = "대형매장 집중"
    elif avg_medium > 0.7:
        name = "중형매장 집중"
    elif avg_small > 0.7:
        name = "소형매장 집중"
    elif avg_entropy > 0.8:
        name = "다양한 매장 이용"
    elif avg_large > 0.4 and avg_medium > 0.3:
        name = "대형+중형 조합"
    elif avg_medium > 0.4 and avg_small > 0.3:
        name = "중형+소형 조합"
    else:
        name = f"혼합형 {cluster_id}"

    cluster_summary.append({
        'cluster_id': cluster_id,
        'name': name,
        'count': count,
        'large_ratio': avg_large,
        'medium_ratio': avg_medium,
        'small_ratio': avg_small,
        'avg_visits': avg_visits,
        'avg_sales': avg_sales,
        'entropy': avg_entropy,
        'vip': vip_count,
        'loyal': loyal_count,
        'active': active_count,
        'risk': risk_count,
        'churn': churn_count,
        'vip_rate': vip_rate,
        'churn_rate': churn_rate
    })

    print(f"\n=== Cluster {cluster_id}: {name} ===")
    print(f"  고객 수: {count}명 ({count/len(customer_features)*100:.1f}%)")
    print(f"  매장 방문 비율: 대형 {avg_large*100:.1f}% | 중형 {avg_medium*100:.1f}% | 소형 {avg_small*100:.1f}%")
    print(f"  매장 다양성 (entropy): {avg_entropy:.3f}")
    print(f"  평균 방문: {avg_visits:.1f}회 | 평균 매출: ${avg_sales:.0f}")
    print(f"  등급 분포: VIP {vip_count} | 충성 {loyal_count} | 활성 {active_count} | 위험 {risk_count} | 이탈 {churn_count}")
    print(f"  VIP율: {vip_rate:.1f}% | 이탈율: {churn_rate:.1f}%")

# 9. 통계적 검증
print("\n\n[9] 클러스터 간 차이 통계 검증...")
print("-" * 70)

from scipy import stats

# ANOVA - VIP율 차이
cluster_vip_rates = []
for cluster_id in range(best_k):
    cluster = customer_features[customer_features['cluster'] == cluster_id]
    vip_binary = (cluster['grade'] == 'vip').astype(int)
    cluster_vip_rates.append(vip_binary.values)

if len(cluster_vip_rates) >= 2:
    f_stat, p_value = stats.f_oneway(*cluster_vip_rates)
    print(f"\n  VIP율 클러스터 간 차이 (ANOVA):")
    print(f"    F-statistic: {f_stat:.4f}")
    print(f"    p-value: {p_value:.6f}")
    print(f"    → {'유의미한 차이 있음 (p < 0.05)' if p_value < 0.05 else '유의미한 차이 없음'}")

# 이탈율 차이
cluster_churn_rates = []
for cluster_id in range(best_k):
    cluster = customer_features[customer_features['cluster'] == cluster_id]
    churn_binary = (cluster['grade'] == 'churn').astype(int)
    cluster_churn_rates.append(churn_binary.values)

if len(cluster_churn_rates) >= 2:
    f_stat, p_value = stats.f_oneway(*cluster_churn_rates)
    print(f"\n  이탈율 클러스터 간 차이 (ANOVA):")
    print(f"    F-statistic: {f_stat:.4f}")
    print(f"    p-value: {p_value:.6f}")
    print(f"    → {'유의미한 차이 있음 (p < 0.05)' if p_value < 0.05 else '유의미한 차이 없음'}")

# Chi-square 검정 - 등급과 클러스터 독립성
contingency = pd.crosstab(customer_features['cluster'], customer_features['grade'])
chi2, p_value, dof, expected = stats.chi2_contingency(contingency)
print(f"\n  클러스터-등급 연관성 (Chi-square):")
print(f"    Chi2: {chi2:.4f}")
print(f"    p-value: {p_value:.10f}")
print(f"    → {'클러스터와 등급 간 유의미한 연관성 있음' if p_value < 0.05 else '연관성 없음'}")

# 10. 클러스터별 Top 품목
print("\n\n[10] 클러스터별 Top 구매 품목...")
print("-" * 70)

pattern_map = customer_features.set_index('household_key')['cluster'].to_dict()
transactions['cluster'] = transactions['household_key'].map(pattern_map)

transactions_with_product = transactions.merge(
    products[['PRODUCT_ID', 'DEPARTMENT', 'COMMODITY_DESC']],
    on='PRODUCT_ID',
    how='left'
)

for cluster_id in range(best_k):
    cluster_trans = transactions_with_product[transactions_with_product['cluster'] == cluster_id]
    if len(cluster_trans) == 0:
        continue

    summary = cluster_summary[cluster_id]
    print(f"\n=== Cluster {cluster_id}: {summary['name']} ===")

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

    print("\nTop 5 품목:")
    for i, (commodity, row) in enumerate(commodity_stats.head(5).iterrows(), 1):
        buy_rate = row['household_key'] / summary['count'] * 100
        print(f"  {i}. {commodity}: {buy_rate:.1f}% 구매")

# 11. 결론
print("\n\n" + "=" * 70)
print("분석 결론")
print("=" * 70)

print(f"\n최적 클러스터 수: {best_k}개")
print(f"Silhouette Score: {max(results, key=lambda x: x['silhouette'])['silhouette']:.4f}")

print("\n클러스터별 요약:")
for s in sorted(cluster_summary, key=lambda x: -x['vip_rate']):
    print(f"  {s['name']}: {s['count']}명, VIP {s['vip_rate']:.1f}%, 이탈 {s['churn_rate']:.1f}%")

print("\n핵심 인사이트:")
best_vip = max(cluster_summary, key=lambda x: x['vip_rate'])
worst_churn = max(cluster_summary, key=lambda x: x['churn_rate'])
print(f"  - VIP 최고 클러스터: {best_vip['name']} (VIP율 {best_vip['vip_rate']:.1f}%)")
print(f"  - 이탈 최고 클러스터: {worst_churn['name']} (이탈율 {worst_churn['churn_rate']:.1f}%)")
