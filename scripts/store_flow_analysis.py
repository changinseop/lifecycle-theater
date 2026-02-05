"""
매장 방문 흐름 분석
- 코호트별 첫 방문 매장 분포
- 매장 간 전환 패턴 (첫 방문 → 두번째 → 세번째)
"""

import pandas as pd
import numpy as np
import json
import warnings
warnings.filterwarnings('ignore')

DATA_PATH = '/Users/inseopchang/vscode_inseop/seob_project/2.icb_project/Dunnhumby/dataset'

print("=" * 70)
print("매장 방문 흐름 분석")
print("=" * 70)

# 1. 데이터 로드
transactions = pd.read_csv(f'{DATA_PATH}/transaction_data.csv')
print(f"\n거래 데이터: {len(transactions):,}건")

# 2. 매장 분류 (기존 로직)
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

print(f"\n매장 분류:")
print(store_stats['store_size'].value_counts())

# 3. 고객별 첫 방문일 찾기
first_visit = transactions.groupby('household_key')['DAY'].min().reset_index()
first_visit.columns = ['household_key', 'first_day']
transactions = transactions.merge(first_visit, on='household_key')
transactions['days_since_first'] = transactions['DAY'] - transactions['first_day']

# 첫 30일 거래만 필터
first_month = transactions[transactions['days_since_first'] <= 30].copy()

# 4. 코호트 패턴 계산
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

pivot_first['has_large'] = (pivot_first['large'] > 0).astype(int)
pivot_first['has_medium'] = (pivot_first['medium'] > 0).astype(int)
pivot_first['has_small'] = (pivot_first['small'] > 0).astype(int)
pivot_first['cohort'] = (pivot_first['has_large'].astype(str) +
                         pivot_first['has_medium'].astype(str) +
                         pivot_first['has_small'].astype(str))

print(f"\n코호트 분포:")
print(pivot_first['cohort'].value_counts().sort_index())

# 5. 첫 방문 매장 분석 (코호트별)
# 각 고객의 첫 방문 (DAY 기준 가장 빠른 날의 거래)
first_visit_tx = first_month[first_month['days_since_first'] == 0].copy()

# 첫 방문 날의 매장 유형 (여러 매장 방문 시 가장 먼저 방문한 매장 - TRANS_TIME 기준)
first_visit_tx = first_visit_tx.sort_values(['household_key', 'TRANS_TIME'])
first_store = first_visit_tx.groupby('household_key').first()[['store_size']].reset_index()
first_store.columns = ['household_key', 'first_store_type']

# 코호트 정보와 병합
cohort_first_store = pivot_first[['household_key', 'cohort']].merge(first_store, on='household_key')

print("\n" + "=" * 70)
print("코호트별 첫 방문 매장 분포")
print("=" * 70)

result = {}
for cohort in sorted(cohort_first_store['cohort'].unique()):
    cohort_data = cohort_first_store[cohort_first_store['cohort'] == cohort]
    first_store_dist = cohort_data['first_store_type'].value_counts(normalize=True) * 100

    print(f"\n코호트 {cohort} (n={len(cohort_data)}):")
    for store_type in ['large', 'medium', 'small']:
        pct = first_store_dist.get(store_type, 0)
        print(f"  {store_type}: {pct:.1f}%")

    result[cohort] = {
        'count': len(cohort_data),
        'first_store': {
            'large': round(first_store_dist.get('large', 0), 1),
            'medium': round(first_store_dist.get('medium', 0), 1),
            'small': round(first_store_dist.get('small', 0), 1)
        }
    }

# 6. 매장 전환 흐름 분석 (첫 30일 내 방문 순서)
print("\n" + "=" * 70)
print("매장 방문 순서 분석 (첫 30일)")
print("=" * 70)

# 각 고객의 방문 순서 (날짜 + 시간 기준)
first_month_sorted = first_month.sort_values(['household_key', 'DAY', 'TRANS_TIME'])

# 고객별 방문 매장 순서 (중복 제거하지 않고 순서대로)
def get_store_sequence(group):
    # 날짜별로 첫 방문 매장만
    daily_first = group.groupby('DAY').first()['store_size'].tolist()
    return daily_first[:5]  # 최대 5개까지

store_sequences = first_month_sorted.groupby('household_key').apply(get_store_sequence).reset_index()
store_sequences.columns = ['household_key', 'sequence']

# 코호트 정보와 병합
cohort_sequences = pivot_first[['household_key', 'cohort']].merge(store_sequences, on='household_key')

# 코호트별 전환 패턴 분석
for cohort in ['111', '110', '100', '010']:  # 주요 코호트만
    cohort_data = cohort_sequences[cohort_sequences['cohort'] == cohort]

    if len(cohort_data) == 0:
        continue

    print(f"\n코호트 {cohort} (n={len(cohort_data)}):")

    # 1→2 전환
    transitions_1_2 = {}
    transitions_2_3 = {}

    for seq in cohort_data['sequence']:
        if len(seq) >= 2:
            key = f"{seq[0]}→{seq[1]}"
            transitions_1_2[key] = transitions_1_2.get(key, 0) + 1
        if len(seq) >= 3:
            key = f"{seq[1]}→{seq[2]}"
            transitions_2_3[key] = transitions_2_3.get(key, 0) + 1

    if transitions_1_2:
        total = sum(transitions_1_2.values())
        print(f"  1→2 전환:")
        for k, v in sorted(transitions_1_2.items(), key=lambda x: -x[1])[:5]:
            print(f"    {k}: {v/total*100:.1f}%")

    # 결과에 전환 정보 추가
    if cohort in result:
        result[cohort]['transitions'] = {
            '1_to_2': {k: round(v/sum(transitions_1_2.values())*100, 1) for k, v in transitions_1_2.items()} if transitions_1_2 else {},
            '2_to_3': {k: round(v/sum(transitions_2_3.values())*100, 1) for k, v in transitions_2_3.items()} if transitions_2_3 else {}
        }

# 7. JSON 출력
print("\n" + "=" * 70)
print("JSON 결과")
print("=" * 70)
print(json.dumps(result, indent=2, ensure_ascii=False))

# 8. TypeScript용 데이터 형식으로 출력
print("\n" + "=" * 70)
print("TypeScript 데이터 형식")
print("=" * 70)

print("\nconst STORE_FLOW_DATA = {")
for cohort, data in result.items():
    first = data.get('first_store', {})
    trans = data.get('transitions', {}).get('1_to_2', {})
    print(f'  "{cohort}": {{')
    print(f'    firstStore: {{ large: {first.get("large", 0)}, medium: {first.get("medium", 0)}, small: {first.get("small", 0)} }},')
    if trans:
        trans_str = ', '.join([f'"{k}": {v}' for k, v in list(trans.items())[:6]])
        print(f'    transitions: {{ {trans_str} }},')
    print(f'  }},')
print("};")
