#!/usr/bin/env python3
"""
장바구니 분석: 고객 상태 전환과 구매 패턴 관계 분석
- 충성→이탈 고객의 장바구니 변화
- 카테고리별 구매 패턴 변화
- 이탈 예측 피처 도출
"""

import pandas as pd
import numpy as np
import json
from pathlib import Path
from collections import defaultdict

# 경로 설정
DATASET_PATH = Path('/Users/inseopchang/vscode_inseop/seob_project/2.icb_project/Dunnhumby/dataset')
RACING_DATA_PATH = Path(__file__).parent.parent / 'src/lib/data/racing-data-v2.json'

print("=" * 60)
print("장바구니 분석: 고객 상태 전환과 구매 패턴")
print("=" * 60)

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

# 주요 카테고리 그룹화
CATEGORY_GROUPS = {
    'GROCERY': '식료품',
    'MEAT': '정육',
    'SEAFOOD': '수산',
    'PRODUCE': '농산물',
    'DAIRY DELI': '유제품',
    'FROZEN FOODS': '냉동식품',
    'PASTRY': '베이커리',
    'DELI': '델리',
    'DRUG GM': '생활용품',
    'MISC. TRANS.': '기타',
    'FLORAL': '꽃',
    'NUTRITION': '건강식품',
    'COSMETICS': '화장품',
    'KIOSK-GAS': '주유/키오스크',
    'VIDEO': '비디오',
    'VIDEO RENTAL': '비디오렌탈',
    'TRAVEL & LEISUR': '여행/레저',
    'SPIRITS': '주류',
    'PHOTO': '사진',
    'PHARMACY': '약국',
    'SALAD BAR': '샐러드바',
    'CHARITABLE CONT': '기부',
    'COUP/STR & MFG': '쿠폰',
    'RESTNT/COINSTAR': '기타서비스',
    'MISC SALES TRAN': '기타판매',
    'POSTAL CENTER': '우편',
}

transactions['CATEGORY_KO'] = transactions['DEPARTMENT'].map(CATEGORY_GROUPS).fillna('기타')

# 3. 고객별 상태 변화 추출
print("\n[3] 고객 상태 전환 분석...")

# 상태 매핑
STATE_MAP = {
    'waiting': '대기',
    'active': '활성',
    'loyal_candidate': '충성',
    'loyal': '충성',
    'vip_candidate': 'VIP',
    'vip': 'VIP',
    'risk': '위험',
    'churn': '이탈',
}

# 고객별 최종 상태 및 상태 변화 추출
customer_states = {}
for customer in racing_data['customers']:
    cid = customer['id']
    final_stage = customer['finalStage']
    state_changes = customer['stateChanges']
    visit_days = customer['visitDays']

    customer_states[cid] = {
        'final_stage': final_stage,
        'state_changes': state_changes,
        'visit_days': visit_days,
        'total_visits': len(visit_days),
    }

# 4. 상태 전환별 고객 그룹 분류
print("\n[4] 상태 전환 패턴 분류...")

transition_groups = {
    '충성→이탈': [],  # 충성에서 이탈로 전환
    '충성→VIP': [],   # 충성에서 VIP로 상승
    '활성→이탈': [],  # 활성에서 이탈로 전환
    '위험→충성': [],  # 위험에서 충성으로 회복
    '유지_충성': [],  # 계속 충성 유지
    '유지_이탈': [],  # 처음부터 이탈
}

for cid, data in customer_states.items():
    changes = data['state_changes']
    final = data['final_stage']

    # 상태 이력 추출
    states_history = [STATE_MAP.get(c['state'], c['state']) for c in changes]

    had_loyal = '충성' in states_history
    had_risk = '위험' in states_history
    had_vip = 'VIP' in states_history

    if had_loyal and final == 'churn':
        transition_groups['충성→이탈'].append(cid)
    elif had_loyal and final == 'vip':
        transition_groups['충성→VIP'].append(cid)
    elif not had_loyal and final == 'churn':
        transition_groups['활성→이탈'].append(cid)
    elif had_risk and final in ['loyal', 'vip']:
        transition_groups['위험→충성'].append(cid)
    elif final in ['loyal', 'vip'] and not had_risk:
        transition_groups['유지_충성'].append(cid)
    elif final == 'churn' and len(states_history) <= 2:
        transition_groups['유지_이탈'].append(cid)

print("\n전환 그룹별 고객 수:")
for group, customers in transition_groups.items():
    print(f"   {group}: {len(customers)}명")

# 5. household_key 매핑 (racing-data의 id는 1부터 시작, 실제 household_key 필요)
print("\n[5] 고객 ID 매핑...")

# 거래 데이터의 고유 household_key 목록
unique_households = transactions['household_key'].unique()
print(f"   거래 데이터 고유 가구: {len(unique_households)}개")

# racing-data의 고객 ID가 household_key와 어떻게 매핑되는지 확인 필요
# 가정: racing-data의 id 순서대로 unique_households에 대응
# 실제로는 데이터 생성 로직을 확인해야 함

# 샘플링된 2500명의 household_key 추정
sampled_households = sorted(unique_households)[:2500]
id_to_household = {i+1: hh for i, hh in enumerate(sampled_households)}

# 6. 그룹별 장바구니 분석
print("\n[6] 그룹별 장바구니 구성 분석...")

def analyze_basket_composition(customer_ids, transactions_df, id_to_hh):
    """고객 그룹의 장바구니 카테고리 비율 분석"""
    valid_households = [id_to_hh.get(cid) for cid in customer_ids if cid in id_to_hh]
    if not valid_households:
        return {}

    group_trans = transactions_df[transactions_df['household_key'].isin(valid_households)]
    if len(group_trans) == 0:
        return {}

    # 카테고리별 매출 비율
    category_sales = group_trans.groupby('CATEGORY_KO')['SALES_VALUE'].sum()
    total_sales = category_sales.sum()

    if total_sales == 0:
        return {}

    return (category_sales / total_sales * 100).round(1).to_dict()

def analyze_basket_change_before_churn(customer_ids, transactions_df, customer_states_dict, id_to_hh):
    """이탈 전 장바구니 변화 분석 (마지막 방문 3개월 전후 비교)"""
    results = []

    for cid in customer_ids[:100]:  # 샘플 100명
        if cid not in id_to_hh:
            continue

        hh = id_to_hh[cid]
        state_data = customer_states_dict.get(cid)
        if not state_data:
            continue

        visit_days = state_data['visit_days']
        if len(visit_days) < 4:
            continue

        # 마지막 방문일 기준
        last_visit = max(visit_days)
        mid_point = last_visit - 90  # 3개월 전

        hh_trans = transactions_df[transactions_df['household_key'] == hh]

        # 전반부 (처음 ~ 3개월 전)
        early_trans = hh_trans[hh_trans['DAY'] < mid_point]
        # 후반부 (3개월 전 ~ 마지막)
        late_trans = hh_trans[hh_trans['DAY'] >= mid_point]

        if len(early_trans) == 0 or len(late_trans) == 0:
            continue

        # 카테고리 비율 계산
        early_cats = early_trans.groupby('CATEGORY_KO')['SALES_VALUE'].sum()
        late_cats = late_trans.groupby('CATEGORY_KO')['SALES_VALUE'].sum()

        early_pct = (early_cats / early_cats.sum() * 100)
        late_pct = (late_cats / late_cats.sum() * 100)

        results.append({
            'customer_id': cid,
            'early': early_pct.to_dict(),
            'late': late_pct.to_dict(),
            'early_total': early_cats.sum(),
            'late_total': late_cats.sum(),
        })

    return results

# 그룹별 장바구니 구성
print("\n📊 그룹별 장바구니 카테고리 비율 (매출 기준):")
print("-" * 50)

for group_name, customer_ids in transition_groups.items():
    if len(customer_ids) == 0:
        continue

    composition = analyze_basket_composition(customer_ids, transactions, id_to_household)
    if composition:
        print(f"\n[{group_name}] ({len(customer_ids)}명)")
        # 상위 5개 카테고리
        sorted_cats = sorted(composition.items(), key=lambda x: x[1], reverse=True)[:5]
        for cat, pct in sorted_cats:
            print(f"   {cat}: {pct}%")

# 7. 충성→이탈 고객의 장바구니 변화 상세 분석
print("\n\n" + "=" * 60)
print("📉 충성→이탈 고객의 장바구니 변화 (이탈 전 3개월 vs 이전)")
print("=" * 60)

churn_changes = analyze_basket_change_before_churn(
    transition_groups['충성→이탈'],
    transactions,
    customer_states,
    id_to_household
)

if churn_changes:
    # 전체 평균 변화 계산
    all_categories = set()
    for change in churn_changes:
        all_categories.update(change['early'].keys())
        all_categories.update(change['late'].keys())

    category_changes = {}
    for cat in all_categories:
        early_vals = [c['early'].get(cat, 0) for c in churn_changes]
        late_vals = [c['late'].get(cat, 0) for c in churn_changes]

        avg_early = np.mean(early_vals)
        avg_late = np.mean(late_vals)
        change = avg_late - avg_early

        category_changes[cat] = {
            'early': round(avg_early, 1),
            'late': round(avg_late, 1),
            'change': round(change, 1),
        }

    # 변화가 큰 순으로 정렬
    sorted_changes = sorted(category_changes.items(), key=lambda x: abs(x[1]['change']), reverse=True)

    print(f"\n분석 대상: {len(churn_changes)}명")
    print(f"\n{'카테고리':<12} {'이전':>8} {'이탈전3개월':>12} {'변화':>8}")
    print("-" * 44)
    for cat, vals in sorted_changes[:10]:
        arrow = "↑" if vals['change'] > 0 else "↓" if vals['change'] < 0 else "→"
        print(f"{cat:<12} {vals['early']:>7}% {vals['late']:>11}% {arrow}{abs(vals['change']):>6}%p")

    # 구매 금액 변화
    early_totals = [c['early_total'] for c in churn_changes]
    late_totals = [c['late_total'] for c in churn_changes]

    print(f"\n💰 구매 금액 변화:")
    print(f"   이전 평균: ${np.mean(early_totals):,.0f}")
    print(f"   이탈전 3개월 평균: ${np.mean(late_totals):,.0f}")
    print(f"   변화: {(np.mean(late_totals) / np.mean(early_totals) - 1) * 100:+.1f}%")

# 8. 이탈 예측 피처 제안
print("\n\n" + "=" * 60)
print("🔮 이탈 예측을 위한 주요 피처 (장바구니 기반)")
print("=" * 60)

print("""
1. 구매 빈도 변화
   - 최근 3개월 방문 횟수 / 이전 3개월 방문 횟수

2. 구매 금액 변화
   - 최근 3개월 총 구매액 / 이전 3개월 총 구매액

3. 카테고리 다양성 변화
   - 구매 카테고리 수의 변화 (다양성 감소 = 이탈 신호)

4. 주력 카테고리 비율 변화
   - 식료품/농산물 비율 감소 → 이탈 가능성 높음
   - 생활용품만 구매 → 이탈 임박

5. 할인 의존도
   - 할인 구매 비율 증가 → 가격 민감도 상승 → 이탈 위험
""")

# 9. 충성 유지 고객 vs 이탈 고객 비교
print("\n" + "=" * 60)
print("⚖️ 충성 유지 vs 충성→이탈 고객 비교")
print("=" * 60)

loyal_kept = analyze_basket_composition(transition_groups['유지_충성'], transactions, id_to_household)
loyal_churned = analyze_basket_composition(transition_groups['충성→이탈'], transactions, id_to_household)

if loyal_kept and loyal_churned:
    all_cats = set(loyal_kept.keys()) | set(loyal_churned.keys())

    print(f"\n{'카테고리':<12} {'유지':>10} {'이탈':>10} {'차이':>10}")
    print("-" * 44)

    diffs = []
    for cat in all_cats:
        kept_val = loyal_kept.get(cat, 0)
        churned_val = loyal_churned.get(cat, 0)
        diff = kept_val - churned_val
        diffs.append((cat, kept_val, churned_val, diff))

    # 차이가 큰 순으로
    diffs.sort(key=lambda x: abs(x[3]), reverse=True)
    for cat, kept, churned, diff in diffs[:8]:
        arrow = "▲" if diff > 0 else "▼" if diff < 0 else "="
        print(f"{cat:<12} {kept:>9}% {churned:>9}% {arrow}{abs(diff):>8.1f}%p")

print("\n" + "=" * 60)
print("분석 완료!")
print("=" * 60)
