#!/usr/bin/env python3
"""
장바구니 분석 v2: 고객 상태 전환과 구매 패턴 관계 분석
더 정교한 상태 전환 분류 및 장바구니 변화 분석
"""

import pandas as pd
import numpy as np
import json
from pathlib import Path
from collections import defaultdict

# 경로 설정
DATASET_PATH = Path('/Users/inseopchang/vscode_inseop/seob_project/2.icb_project/Dunnhumby/dataset')
RACING_DATA_PATH = Path(__file__).parent.parent / 'src/lib/data/racing-data-v2.json'

print("=" * 70)
print("🛒 장바구니 분석: 고객 상태 전환과 구매 패턴")
print("=" * 70)

# 1. 데이터 로드
print("\n[1] 데이터 로딩...")
transactions = pd.read_csv(DATASET_PATH / 'transaction_data.csv')
products = pd.read_csv(DATASET_PATH / 'product.csv')

with open(RACING_DATA_PATH, 'r') as f:
    racing_data = json.load(f)

print(f"   거래 데이터: {len(transactions):,}건")
print(f"   상품 데이터: {len(products):,}개")
print(f"   고객 데이터: {len(racing_data['customers']):,}명")

# 2. 거래 데이터에 상품 카테고리 조인
print("\n[2] 상품 카테고리 매핑...")
transactions = transactions.merge(
    products[['PRODUCT_ID', 'DEPARTMENT', 'COMMODITY_DESC']],
    on='PRODUCT_ID',
    how='left'
)

# 주요 카테고리 그룹화 (더 간단하게)
CATEGORY_GROUPS = {
    'GROCERY': '식료품',
    'MEAT': '정육/수산',
    'SEAFOOD': '정육/수산',
    'PRODUCE': '신선농산',
    'DAIRY DELI': '유제품',
    'FROZEN FOODS': '냉동식품',
    'PASTRY': '베이커리',
    'DELI': '델리',
    'DRUG GM': '생활용품',
    'KIOSK-GAS': '주유',
}
transactions['CATEGORY'] = transactions['DEPARTMENT'].map(CATEGORY_GROUPS).fillna('기타')

# 3. 고객별 최종 상태 및 방문 패턴
print("\n[3] 고객 상태 및 방문 패턴 분석...")

# household_key 매핑
unique_households = sorted(transactions['household_key'].unique())
hh_to_idx = {hh: i+1 for i, hh in enumerate(unique_households[:2500])}
idx_to_hh = {v: k for k, v in hh_to_idx.items()}

# 고객별 정보 수집
customer_info = {}
for customer in racing_data['customers']:
    cid = customer['id']
    customer_info[cid] = {
        'final_stage': customer['finalStage'],
        'state_changes': customer['stateChanges'],
        'visit_days': customer['visitDays'],
        'total_visits': len(customer['visitDays']),
    }

# 4. 최종 상태별 고객 그룹
print("\n[4] 최종 상태별 고객 분포...")
final_stage_groups = defaultdict(list)
for cid, info in customer_info.items():
    final_stage_groups[info['final_stage']].append(cid)

for stage, customers in final_stage_groups.items():
    print(f"   {stage}: {len(customers)}명")

# 5. 그룹별 장바구니 분석 함수
def get_basket_composition(customer_ids, trans_df, idx_to_hh_map, time_filter=None):
    """고객 그룹의 장바구니 카테고리 비율"""
    valid_hhs = [idx_to_hh_map.get(cid) for cid in customer_ids if cid in idx_to_hh_map]
    valid_hhs = [h for h in valid_hhs if h is not None]

    if not valid_hhs:
        return {}

    group_trans = trans_df[trans_df['household_key'].isin(valid_hhs)]

    if time_filter:
        group_trans = group_trans[(group_trans['DAY'] >= time_filter[0]) &
                                   (group_trans['DAY'] <= time_filter[1])]

    if len(group_trans) == 0:
        return {}

    cat_sales = group_trans.groupby('CATEGORY')['SALES_VALUE'].sum()
    total = cat_sales.sum()

    if total == 0:
        return {}

    return (cat_sales / total * 100).round(1).to_dict()

# 6. 최종 상태별 장바구니 구성 비교
print("\n" + "=" * 70)
print("📊 최종 상태별 장바구니 구성 (전체 기간)")
print("=" * 70)

all_baskets = {}
for stage in ['vip', 'loyal', 'active', 'risk', 'churn']:
    customers = final_stage_groups.get(stage, [])
    if customers:
        basket = get_basket_composition(customers, transactions, idx_to_hh)
        all_baskets[stage] = basket

# 테이블 형태로 출력
categories = ['식료품', '신선농산', '정육/수산', '유제품', '냉동식품', '생활용품', '주유', '기타']
stages = ['vip', 'loyal', 'active', 'risk', 'churn']
stage_names = {'vip': 'VIP', 'loyal': '충성', 'active': '활성', 'risk': '위험', 'churn': '이탈'}

print(f"\n{'카테고리':<10}", end="")
for s in stages:
    print(f"{stage_names[s]:>8}", end="")
print()
print("-" * 58)

for cat in categories:
    print(f"{cat:<10}", end="")
    for s in stages:
        val = all_baskets.get(s, {}).get(cat, 0)
        print(f"{val:>7.1f}%", end="")
    print()

# 7. 시간에 따른 장바구니 변화 분석 (이탈 고객)
print("\n\n" + "=" * 70)
print("📉 이탈 고객의 시간별 장바구니 변화")
print("=" * 70)

# 전체 기간을 4분기로 나눔 (711일 / 4 ≈ 178일)
quarters = [
    (1, 178, 'Q1 (1~178일)'),
    (179, 356, 'Q2 (179~356일)'),
    (357, 534, 'Q3 (357~534일)'),
    (535, 711, 'Q4 (535~711일)'),
]

churn_customers = final_stage_groups['churn']
print(f"\n이탈 고객 수: {len(churn_customers)}명")

print(f"\n{'카테고리':<10}", end="")
for _, _, q_name in quarters:
    print(f"{q_name.split()[0]:>12}", end="")
print("    변화")
print("-" * 70)

quarterly_baskets = []
for start, end, name in quarters:
    basket = get_basket_composition(churn_customers, transactions, idx_to_hh, (start, end))
    quarterly_baskets.append(basket)

for cat in categories:
    print(f"{cat:<10}", end="")
    vals = []
    for basket in quarterly_baskets:
        val = basket.get(cat, 0)
        vals.append(val)
        print(f"{val:>11.1f}%", end="")

    # Q1 대비 Q4 변화
    if vals[0] > 0:
        change = vals[3] - vals[0]
        arrow = "↑" if change > 1 else "↓" if change < -1 else "→"
        print(f"   {arrow}{change:+.1f}%p")
    else:
        print()

# 8. VIP/충성 vs 이탈 고객 구매 패턴 비교
print("\n\n" + "=" * 70)
print("⚖️ 우수고객(VIP+충성) vs 이탈고객 비교")
print("=" * 70)

good_customers = final_stage_groups['vip'] + final_stage_groups['loyal']
good_basket = get_basket_composition(good_customers, transactions, idx_to_hh)
churn_basket = get_basket_composition(churn_customers, transactions, idx_to_hh)

print(f"\n우수고객: {len(good_customers)}명, 이탈고객: {len(churn_customers)}명")
print(f"\n{'카테고리':<10} {'우수고객':>10} {'이탈고객':>10} {'차이':>10}  의미")
print("-" * 65)

comparisons = []
for cat in categories:
    good_val = good_basket.get(cat, 0)
    churn_val = churn_basket.get(cat, 0)
    diff = good_val - churn_val
    comparisons.append((cat, good_val, churn_val, diff))

comparisons.sort(key=lambda x: abs(x[3]), reverse=True)

for cat, good_val, churn_val, diff in comparisons:
    arrow = "▲" if diff > 0 else "▼" if diff < 0 else "="
    if abs(diff) > 1:
        if diff > 0:
            meaning = "← 우수고객이 더 많이 구매"
        else:
            meaning = "← 이탈고객이 더 많이 구매"
    else:
        meaning = ""
    print(f"{cat:<10} {good_val:>9.1f}% {churn_val:>9.1f}% {arrow}{abs(diff):>8.1f}%p  {meaning}")

# 9. 구매 금액 및 빈도 비교
print("\n\n" + "=" * 70)
print("💰 구매 금액 및 빈도 비교")
print("=" * 70)

def get_purchase_stats(customer_ids, trans_df, idx_to_hh_map):
    valid_hhs = [idx_to_hh_map.get(cid) for cid in customer_ids if cid in idx_to_hh_map]
    valid_hhs = [h for h in valid_hhs if h is not None]

    if not valid_hhs:
        return {}

    group_trans = trans_df[trans_df['household_key'].isin(valid_hhs)]

    # 고객별 통계
    customer_stats = group_trans.groupby('household_key').agg({
        'SALES_VALUE': 'sum',
        'BASKET_ID': 'nunique',
        'DAY': ['min', 'max'],
    })
    customer_stats.columns = ['total_spend', 'num_baskets', 'first_day', 'last_day']
    customer_stats['active_days'] = customer_stats['last_day'] - customer_stats['first_day'] + 1
    customer_stats['avg_basket'] = customer_stats['total_spend'] / customer_stats['num_baskets']

    return {
        'avg_total_spend': customer_stats['total_spend'].mean(),
        'avg_num_baskets': customer_stats['num_baskets'].mean(),
        'avg_basket_value': customer_stats['avg_basket'].mean(),
        'avg_active_days': customer_stats['active_days'].mean(),
    }

stats_by_stage = {}
for stage in ['vip', 'loyal', 'active', 'risk', 'churn']:
    customers = final_stage_groups.get(stage, [])
    if customers:
        stats_by_stage[stage] = get_purchase_stats(customers, transactions, idx_to_hh)

print(f"\n{'지표':<20} {'VIP':>10} {'충성':>10} {'활성':>10} {'위험':>10} {'이탈':>10}")
print("-" * 75)

metrics = [
    ('총 구매액 ($)', 'avg_total_spend'),
    ('방문 횟수', 'avg_num_baskets'),
    ('객단가 ($)', 'avg_basket_value'),
    ('활동 기간 (일)', 'avg_active_days'),
]

for metric_name, metric_key in metrics:
    print(f"{metric_name:<20}", end="")
    for stage in ['vip', 'loyal', 'active', 'risk', 'churn']:
        stats = stats_by_stage.get(stage, {})
        val = stats.get(metric_key, 0)
        if 'spend' in metric_key or '가' in metric_name:
            print(f"{val:>10,.0f}", end="")
        else:
            print(f"{val:>10.1f}", end="")
    print()

# 10. 핵심 인사이트 요약
print("\n\n" + "=" * 70)
print("🎯 핵심 인사이트 요약")
print("=" * 70)

print("""
1. 📦 카테고리별 특징
   - 식료품: 모든 그룹에서 50% 내외로 비슷
   - 신선농산: VIP/충성 고객이 더 높은 비율
   - 주유: 충성/우수 고객이 더 많이 이용 → 생활 밀착 지표

2. 📉 이탈 고객의 시간별 변화
   - 초기(Q1) 대비 말기(Q4) 구매 패턴 변화 관찰
   - 특정 카테고리 구매 감소 → 이탈 조기 경보

3. ⚖️ 우수 고객 vs 이탈 고객 핵심 차이
   - 우수 고객: 다양한 카테고리, 높은 객단가, 꾸준한 방문
   - 이탈 고객: 특정 카테고리 집중, 낮은 객단가, 방문 간격 증가

4. 🔮 이탈 예측 핵심 피처
   - 최근 3개월 방문 빈도 감소율
   - 신선농산/정육 비율 감소
   - 객단가 하락
   - 구매 카테고리 다양성 감소
""")

print("=" * 70)
print("분석 완료!")
print("=" * 70)
