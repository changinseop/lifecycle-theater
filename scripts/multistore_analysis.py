"""
다매장 방문 고객 분석
- 대형/중형/소형 매장 방문 조합별 고객 분포
- 각 조합별 등급 분포 및 VIP/이탈율 분석
"""

import pandas as pd
import numpy as np
from scipy import stats
import warnings
warnings.filterwarnings('ignore')

DATA_PATH = '/Users/inseopchang/vscode_inseop/seob_project/2.icb_project/Dunnhumby/dataset'

print("=" * 70)
print("매장 방문 패턴 × 고객 등급 분석")
print("=" * 70)

# 1. 데이터 로드
transactions = pd.read_csv(f'{DATA_PATH}/transaction_data.csv')
print(f"\n거래 데이터: {len(transactions):,}건")

# 2. 매장 분류
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

# 3. 고객별 매장 방문 여부 (0/1)
customer_store = transactions.groupby(['household_key', 'store_size'])['BASKET_ID'].nunique().reset_index()
pivot = customer_store.pivot_table(
    index='household_key',
    columns='store_size',
    values='BASKET_ID',
    fill_value=0
).reset_index()

for col in ['large', 'medium', 'small']:
    if col not in pivot.columns:
        pivot[col] = 0

# 방문 여부 플래그
pivot['has_large'] = (pivot['large'] > 0).astype(int)
pivot['has_medium'] = (pivot['medium'] > 0).astype(int)
pivot['has_small'] = (pivot['small'] > 0).astype(int)

# 방문 패턴 코드 생성
pivot['pattern'] = (pivot['has_large'].astype(str) +
                   pivot['has_medium'].astype(str) +
                   pivot['has_small'].astype(str))

# 4. 고객 등급 분류
customer_visits = transactions.groupby('household_key').agg({
    'DAY': list,
    'BASKET_ID': 'nunique',
    'SALES_VALUE': 'sum'
}).reset_index()

def count_churns(days):
    days = sorted(set(days))
    churns = 0
    for i in range(1, len(days)):
        if days[i] - days[i-1] >= 25:
            churns += 1
    return churns

customer_visits['churn_count'] = customer_visits['DAY'].apply(count_churns)
customer_visits['visit_count'] = customer_visits['BASKET_ID']

no_churn = customer_visits[customer_visits['churn_count'] == 0]
vip_threshold = no_churn['visit_count'].quantile(0.85)

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

# 5. 데이터 병합
data = pivot.merge(customer_visits[['household_key', 'grade', 'visit_count', 'SALES_VALUE']], on='household_key')

# 6. 패턴별 분석
print("\n" + "=" * 70)
print("매장 방문 패턴별 고객 분포")
print("=" * 70)

pattern_names = {
    '111': '다매장 탐험가 (대+중+소)',
    '110': '대형+중형',
    '101': '대형+소형',
    '100': '대형 Only',
    '011': '중형+소형',
    '010': '중형 Only',
    '001': '소형 Only',
}

results = []

for pattern in sorted(data['pattern'].unique(), reverse=True):
    subset = data[data['pattern'] == pattern]
    count = len(subset)

    if count == 0:
        continue

    grade_dist = subset['grade'].value_counts().to_dict()
    vip = grade_dist.get('vip', 0)
    loyal = grade_dist.get('loyal', 0)
    active = grade_dist.get('active', 0)
    risk = grade_dist.get('risk', 0)
    churn = grade_dist.get('churn', 0)

    vip_rate = vip / count * 100
    churn_rate = churn / count * 100

    avg_visits = subset['visit_count'].mean()
    avg_sales = subset['SALES_VALUE'].mean()

    results.append({
        'pattern': pattern,
        'name': pattern_names.get(pattern, pattern),
        'count': count,
        'vip': vip,
        'loyal': loyal,
        'active': active,
        'risk': risk,
        'churn': churn,
        'vip_rate': vip_rate,
        'churn_rate': churn_rate,
        'avg_visits': avg_visits,
        'avg_sales': avg_sales
    })

    print(f"\n{'='*60}")
    print(f"{pattern_names.get(pattern, pattern)}")
    print(f"{'='*60}")
    print(f"  고객 수: {count}명 ({count/len(data)*100:.1f}%)")
    print(f"  평균 방문: {avg_visits:.1f}회 | 평균 매출: ${avg_sales:.0f}")
    print(f"  등급 분포:")
    print(f"    VIP: {vip}명 ({vip_rate:.1f}%)")
    print(f"    충성: {loyal}명 ({loyal/count*100:.1f}%)")
    print(f"    활성: {active}명 ({active/count*100:.1f}%)")
    print(f"    위험: {risk}명 ({risk/count*100:.1f}%)")
    print(f"    이탈: {churn}명 ({churn_rate:.1f}%)")

# 7. 통계적 검증
print("\n\n" + "=" * 70)
print("통계적 검증")
print("=" * 70)

# Chi-square 검정
contingency = pd.crosstab(data['pattern'], data['grade'])
chi2, p_value, dof, expected = stats.chi2_contingency(contingency)
print(f"\n패턴-등급 연관성 (Chi-square):")
print(f"  Chi2: {chi2:.2f}")
print(f"  p-value: {p_value:.2e}")
print(f"  → {'유의미한 연관성 있음 (p < 0.05)' if p_value < 0.05 else '연관성 없음'}")

# VIP율 비교 (다매장 vs 나머지)
multi_store = data[data['pattern'] == '111']
single_type = data[data['pattern'].isin(['100', '010', '001'])]

if len(multi_store) > 0 and len(single_type) > 0:
    multi_vip_rate = (multi_store['grade'] == 'vip').mean()
    single_vip_rate = (single_type['grade'] == 'vip').mean()

    # 비율 검정
    from statsmodels.stats.proportion import proportions_ztest
    count_vip = [(multi_store['grade'] == 'vip').sum(), (single_type['grade'] == 'vip').sum()]
    nobs = [len(multi_store), len(single_type)]

    z_stat, p_val = proportions_ztest(count_vip, nobs)

    print(f"\n다매장 vs 단일유형 VIP율 비교:")
    print(f"  다매장 탐험가 VIP율: {multi_vip_rate*100:.1f}%")
    print(f"  단일유형 매장 VIP율: {single_vip_rate*100:.1f}%")
    print(f"  Z-statistic: {z_stat:.2f}")
    print(f"  p-value: {p_val:.4f}")
    print(f"  → {'유의미한 차이 (p < 0.05)' if p_val < 0.05 else '차이 없음'}")

# 이탈율 비교
if len(multi_store) > 0 and len(single_type) > 0:
    multi_churn_rate = (multi_store['grade'] == 'churn').mean()
    single_churn_rate = (single_type['grade'] == 'churn').mean()

    count_churn = [(multi_store['grade'] == 'churn').sum(), (single_type['grade'] == 'churn').sum()]
    z_stat, p_val = proportions_ztest(count_churn, nobs)

    print(f"\n다매장 vs 단일유형 이탈율 비교:")
    print(f"  다매장 탐험가 이탈율: {multi_churn_rate*100:.1f}%")
    print(f"  단일유형 매장 이탈율: {single_churn_rate*100:.1f}%")
    print(f"  Z-statistic: {z_stat:.2f}")
    print(f"  p-value: {p_val:.4f}")
    print(f"  → {'유의미한 차이 (p < 0.05)' if p_val < 0.05 else '차이 없음'}")

# 8. 요약
print("\n\n" + "=" * 70)
print("요약: VIP율 순위")
print("=" * 70)

results_df = pd.DataFrame(results)
results_df = results_df.sort_values('vip_rate', ascending=False)

print(f"\n{'패턴':<25} {'고객수':>8} {'VIP율':>8} {'이탈율':>8}")
print("-" * 55)
for _, row in results_df.iterrows():
    print(f"{row['name']:<25} {row['count']:>8} {row['vip_rate']:>7.1f}% {row['churn_rate']:>7.1f}%")

print("\n\n" + "=" * 70)
print("결론")
print("=" * 70)

# 다매장 탐험가 찾기
explorer = results_df[results_df['pattern'] == '111']
if len(explorer) > 0:
    exp = explorer.iloc[0]
    print(f"\n✓ 다매장 탐험가 (대+중+소 모두 방문):")
    print(f"  - 고객 수: {exp['count']}명 ({exp['count']/len(data)*100:.1f}%)")
    print(f"  - VIP율: {exp['vip_rate']:.1f}%")
    print(f"  - 이탈율: {exp['churn_rate']:.1f}%")
else:
    print("\n✗ 다매장 탐험가 패턴 없음")

print("\n유의미한 클러스터:")
for _, row in results_df.head(5).iterrows():
    significance = ""
    if row['vip_rate'] > 5:
        significance = "★ VIP 집중"
    elif row['churn_rate'] > 25:
        significance = "⚠ 이탈 위험"
    print(f"  - {row['name']}: VIP {row['vip_rate']:.1f}%, 이탈 {row['churn_rate']:.1f}% {significance}")
