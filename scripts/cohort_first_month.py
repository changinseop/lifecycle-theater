"""
첫 1개월 방문 패턴 → 최종 등급 예측 분석
코호트 분석: 초기 행동이 최종 결과를 예측하는가?
"""

import pandas as pd
import numpy as np
from scipy import stats
import warnings
warnings.filterwarnings('ignore')

DATA_PATH = '/Users/inseopchang/vscode_inseop/seob_project/2.icb_project/Dunnhumby/dataset'

print("=" * 70)
print("첫 1개월 방문 패턴 → 최종 등급 예측 분석")
print("=" * 70)

# 1. 데이터 로드
transactions = pd.read_csv(f'{DATA_PATH}/transaction_data.csv')
products = pd.read_csv(f'{DATA_PATH}/product.csv')
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

# 3. 고객별 첫 방문일 찾기
first_visit = transactions.groupby('household_key')['DAY'].min().reset_index()
first_visit.columns = ['household_key', 'first_day']
transactions = transactions.merge(first_visit, on='household_key')

# 첫 30일 거래만 필터
transactions['days_since_first'] = transactions['DAY'] - transactions['first_day']
first_month = transactions[transactions['days_since_first'] <= 30].copy()

print(f"첫 30일 거래: {len(first_month):,}건")

# 4. 첫 1개월 방문 패턴 분석
first_month_store = first_month.groupby(['household_key', 'store_size'])['BASKET_ID'].nunique().reset_index()
pivot_first = first_month_store.pivot_table(
    index='household_key',
    columns='store_size',
    values='BASKET_ID',
    fill_value=0
).reset_index()

for col in ['large', 'medium', 'small']:
    if col not in pivot_first.columns:
        pivot_first[col] = 0

pivot_first.columns = ['household_key', 'first_large', 'first_medium', 'first_small']

# 방문 여부 플래그
pivot_first['has_large'] = (pivot_first['first_large'] > 0).astype(int)
pivot_first['has_medium'] = (pivot_first['first_medium'] > 0).astype(int)
pivot_first['has_small'] = (pivot_first['first_small'] > 0).astype(int)

# 첫 1개월 패턴
pivot_first['first_pattern'] = (pivot_first['has_large'].astype(str) +
                                pivot_first['has_medium'].astype(str) +
                                pivot_first['has_small'].astype(str))

# 첫 1개월 방문 횟수, 매출
first_month_stats = first_month.groupby('household_key').agg({
    'BASKET_ID': 'nunique',
    'SALES_VALUE': 'sum'
}).reset_index()
first_month_stats.columns = ['household_key', 'first_visits', 'first_sales']

pivot_first = pivot_first.merge(first_month_stats, on='household_key')

# 5. 최종 등급 계산 (전체 기간 기준)
customer_all = transactions.groupby('household_key').agg({
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

customer_all['churn_count'] = customer_all['DAY'].apply(count_churns)
customer_all['total_visits'] = customer_all['BASKET_ID']

no_churn = customer_all[customer_all['churn_count'] == 0]
vip_threshold = no_churn['total_visits'].quantile(0.85)

max_day = transactions['DAY'].max()
last_visit = transactions.groupby('household_key')['DAY'].max().reset_index()
last_visit.columns = ['household_key', 'last_day']
customer_all = customer_all.merge(last_visit, on='household_key')
customer_all['days_since_last'] = max_day - customer_all['last_day']

def classify_grade(row):
    if row['churn_count'] == 0:
        if row['total_visits'] >= vip_threshold:
            return 'vip'
        else:
            return 'loyal'
    elif row['days_since_last'] >= 25:
        return 'churn'
    elif row['days_since_last'] >= 8:
        return 'risk'
    else:
        return 'active'

customer_all['final_grade'] = customer_all.apply(classify_grade, axis=1)

# 6. 데이터 병합
data = pivot_first.merge(customer_all[['household_key', 'final_grade', 'total_visits']], on='household_key')

print(f"분석 대상 고객: {len(data):,}명")

# 7. 첫 1개월 패턴별 최종 등급 분석
print("\n" + "=" * 70)
print("첫 1개월 방문 패턴 → 최종 등급 전환율")
print("=" * 70)

pattern_names = {
    '111': '다매장 탐험가 (대+중+소)',
    '110': '대형+중형',
    '101': '대형+소형',
    '100': '대형 Only',
    '011': '중형+소형',
    '010': '중형 Only',
    '001': '소형 Only',
    '000': '방문 없음'
}

results = []

for pattern in sorted(data['first_pattern'].unique(), reverse=True):
    subset = data[data['first_pattern'] == pattern]
    count = len(subset)

    if count < 5:  # 최소 5명 이상
        continue

    grade_dist = subset['final_grade'].value_counts().to_dict()
    vip = grade_dist.get('vip', 0)
    loyal = grade_dist.get('loyal', 0)
    active = grade_dist.get('active', 0)
    risk = grade_dist.get('risk', 0)
    churn = grade_dist.get('churn', 0)

    vip_rate = vip / count * 100
    churn_rate = churn / count * 100

    avg_first_visits = subset['first_visits'].mean()
    avg_first_sales = subset['first_sales'].mean()
    avg_total_visits = subset['total_visits'].mean()

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
        'avg_first_visits': avg_first_visits,
        'avg_first_sales': avg_first_sales,
        'avg_total_visits': avg_total_visits
    })

    print(f"\n{'='*60}")
    print(f"첫 1개월: {pattern_names.get(pattern, pattern)}")
    print(f"{'='*60}")
    print(f"  고객 수: {count}명 ({count/len(data)*100:.1f}%)")
    print(f"  첫 1개월: 평균 {avg_first_visits:.1f}회 방문, ${avg_first_sales:.0f} 매출")
    print(f"  전체 기간: 평균 {avg_total_visits:.1f}회 방문")
    print(f"\n  → 최종 등급 전환:")
    print(f"     VIP로 전환: {vip}명 ({vip_rate:.1f}%)")
    print(f"     충성 유지: {loyal}명 ({loyal/count*100:.1f}%)")
    print(f"     활성: {active}명 ({active/count*100:.1f}%)")
    print(f"     위험: {risk}명 ({risk/count*100:.1f}%)")
    print(f"     이탈: {churn}명 ({churn_rate:.1f}%)")

# 8. 통계적 검증
print("\n\n" + "=" * 70)
print("통계적 검증: 첫 1개월 패턴이 최종 등급을 예측하는가?")
print("=" * 70)

# Chi-square
contingency = pd.crosstab(data['first_pattern'], data['final_grade'])
chi2, p_value, dof, expected = stats.chi2_contingency(contingency)
print(f"\n첫 1개월 패턴 → 최종 등급 연관성 (Chi-square):")
print(f"  Chi2: {chi2:.2f}")
print(f"  p-value: {p_value:.2e}")
print(f"  → {'유의미한 예측력 있음!' if p_value < 0.05 else '예측력 없음'}")

# 다매장 탐험가 vs 나머지 비교
explorer = data[data['first_pattern'] == '111']
others = data[data['first_pattern'] != '111']

if len(explorer) > 10:
    from statsmodels.stats.proportion import proportions_ztest

    # VIP 전환율 비교
    count_vip = [(explorer['final_grade'] == 'vip').sum(), (others['final_grade'] == 'vip').sum()]
    nobs = [len(explorer), len(others)]
    z_stat, p_val = proportions_ztest(count_vip, nobs)

    print(f"\n첫 1개월 다매장 탐험가 vs 나머지 (VIP 전환율):")
    print(f"  다매장 탐험가: {count_vip[0]/nobs[0]*100:.1f}%")
    print(f"  나머지: {count_vip[1]/nobs[1]*100:.1f}%")
    print(f"  Z-stat: {z_stat:.2f}, p-value: {p_val:.4f}")
    print(f"  → {'유의미한 차이!' if p_val < 0.05 else '차이 없음'}")

    # 이탈율 비교
    count_churn = [(explorer['final_grade'] == 'churn').sum(), (others['final_grade'] == 'churn').sum()]
    z_stat, p_val = proportions_ztest(count_churn, nobs)

    print(f"\n첫 1개월 다매장 탐험가 vs 나머지 (이탈율):")
    print(f"  다매장 탐험가: {count_churn[0]/nobs[0]*100:.1f}%")
    print(f"  나머지: {count_churn[1]/nobs[1]*100:.1f}%")
    print(f"  Z-stat: {z_stat:.2f}, p-value: {p_val:.4f}")
    print(f"  → {'유의미한 차이!' if p_val < 0.05 else '차이 없음'}")

# 9. 첫 1개월 대형매장 방문 여부별 분석
print("\n\n" + "=" * 70)
print("첫 1개월 대형매장 방문 여부 → 최종 등급")
print("=" * 70)

visited_large = data[data['has_large'] == 1]
not_visited_large = data[data['has_large'] == 0]

print(f"\n첫 1개월 대형매장 방문 고객: {len(visited_large)}명")
vip_rate_large = (visited_large['final_grade'] == 'vip').mean() * 100
churn_rate_large = (visited_large['final_grade'] == 'churn').mean() * 100
print(f"  → VIP 전환: {vip_rate_large:.1f}%")
print(f"  → 이탈: {churn_rate_large:.1f}%")

print(f"\n첫 1개월 대형매장 미방문 고객: {len(not_visited_large)}명")
vip_rate_no_large = (not_visited_large['final_grade'] == 'vip').mean() * 100
churn_rate_no_large = (not_visited_large['final_grade'] == 'churn').mean() * 100
print(f"  → VIP 전환: {vip_rate_no_large:.1f}%")
print(f"  → 이탈: {churn_rate_no_large:.1f}%")

# 10. 요약
print("\n\n" + "=" * 70)
print("요약: 첫 1개월 패턴 → 최종 결과 예측")
print("=" * 70)

results_df = pd.DataFrame(results)
results_df = results_df.sort_values('vip_rate', ascending=False)

print(f"\n{'첫 1개월 패턴':<25} {'고객수':>8} {'→VIP':>8} {'→이탈':>8}")
print("-" * 55)
for _, row in results_df.iterrows():
    print(f"{row['name']:<25} {row['count']:>8} {row['vip_rate']:>7.1f}% {row['churn_rate']:>7.1f}%")

print("\n\n" + "=" * 70)
print("핵심 인사이트")
print("=" * 70)

best_vip = results_df.iloc[0]
worst_churn = results_df.sort_values('churn_rate', ascending=False).iloc[0]

print(f"""
1. 첫 1개월 패턴이 최종 등급을 예측함 (Chi2={chi2:.0f}, p<0.001)

2. VIP 전환 최고: "{best_vip['name']}"
   - 첫 1개월 평균 {best_vip['avg_first_visits']:.1f}회 방문
   - VIP 전환율: {best_vip['vip_rate']:.1f}%

3. 이탈 위험 최고: "{worst_churn['name']}"
   - 이탈율: {worst_churn['churn_rate']:.1f}%

4. 대형매장 첫 방문의 중요성:
   - 첫 1개월 대형매장 방문 → VIP {vip_rate_large:.1f}%, 이탈 {churn_rate_large:.1f}%
   - 첫 1개월 대형매장 미방문 → VIP {vip_rate_no_large:.1f}%, 이탈 {churn_rate_no_large:.1f}%

5. 액션 플랜:
   - 신규 고객 첫 1개월 내 대형매장 방문 유도
   - 다양한 매장 경험 제공 → VIP 전환율 극대화
""")

# 11. 클러스터별 Top 구매 품목 (첫 1개월)
print("\n" + "=" * 70)
print("첫 1개월 패턴별 Top 구매 품목")
print("=" * 70)

pattern_map = data.set_index('household_key')['first_pattern'].to_dict()
first_month['first_pattern'] = first_month['household_key'].map(pattern_map)

first_month_products = first_month.merge(
    products[['PRODUCT_ID', 'DEPARTMENT', 'COMMODITY_DESC']],
    on='PRODUCT_ID',
    how='left'
)

for pattern in ['111', '110', '100', '010', '001']:
    if pattern not in data['first_pattern'].values:
        continue

    subset = first_month_products[first_month_products['first_pattern'] == pattern]
    if len(subset) == 0:
        continue

    print(f"\n=== {pattern_names.get(pattern, pattern)} ===")

    # Top 카테고리
    dept_sales = subset.groupby('DEPARTMENT')['SALES_VALUE'].sum().sort_values(ascending=False)
    total = dept_sales.sum()

    print("Top 3 카테고리:")
    for dept, sales in dept_sales.head(3).items():
        print(f"  - {dept}: {sales/total*100:.0f}%")

    # Top 품목
    commodity = subset.groupby('COMMODITY_DESC')['household_key'].nunique().sort_values(ascending=False)
    pattern_count = data[data['first_pattern'] == pattern]['household_key'].nunique()

    print("Top 3 품목 (구매율):")
    for comm, cnt in commodity.head(3).items():
        print(f"  - {comm}: {cnt/pattern_count*100:.0f}%")
