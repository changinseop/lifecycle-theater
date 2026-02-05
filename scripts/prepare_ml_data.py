"""
Phase 1: 월별 피처 생성 + ML 학습 데이터 준비
racing-data-v2.json + CSV 파일에서 customer × month 피처 테이블 생성
"""

import json
import pandas as pd
import numpy as np
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
DATA_DIR = BASE / "src" / "lib" / "data"
SRC_DIR = BASE.parent / "src"
DATASET_DIR = BASE.parent.parent / "dataset"
OUT_DIR = BASE / "scripts"
PUBLIC_DIR = BASE / "public" / "model"

DAYS_PER_MONTH = 30
MAX_DAY = 711
NUM_MONTHS = MAX_DAY // DAYS_PER_MONTH  # 23 months

STATE_MAP = {
    "waiting": "active",
    "active": "active",
    "loyal_candidate": "loyal",
    "loyal": "loyal",
    "vip_candidate": "vip",
    "vip": "vip",
    "risk": "risk",
    "churn": "churn",
}
STATE_IDX = {"active": 0, "loyal": 1, "vip": 2, "risk": 3, "churn": 4}


def load_racing_data():
    with open(DATA_DIR / "racing-data-v2.json", "r") as f:
        data = json.load(f)
    return data["customers"], data["metadata"]


def load_csvs():
    features = pd.read_csv(SRC_DIR / "customer_features_comprehensive.csv")
    profile = pd.read_csv(SRC_DIR / "customer_full_profile.csv")
    diversity = pd.read_csv(SRC_DIR / "customer_diversity_full.csv")
    early = pd.read_csv(SRC_DIR / "new_customer_early_behavior.csv")

    coupon_path = DATASET_DIR / "coupon_redempt.csv"
    coupon = pd.read_csv(coupon_path) if coupon_path.exists() else pd.DataFrame()

    return features, profile, diversity, early, coupon


def get_monthly_state(state_changes, month_idx):
    """해당 월 마지막 날 기준 상태를 반환"""
    month_end_day = (month_idx + 1) * DAYS_PER_MONTH
    current_state = "active"  # default
    for sc in state_changes:
        if sc["day"] <= month_end_day:
            raw = sc["state"]
            current_state = STATE_MAP.get(raw, "active")
        else:
            break
    return current_state


def get_monthly_visits(visit_days, month_idx):
    """해당 월의 방문 횟수"""
    start = month_idx * DAYS_PER_MONTH
    end = (month_idx + 1) * DAYS_PER_MONTH
    return sum(1 for d in visit_days if start <= d < end)


def get_gap_days(visit_days, month_idx):
    """해당 월 말일 기준 마지막 방문 이후 일수"""
    month_end = (month_idx + 1) * DAYS_PER_MONTH
    past_visits = [d for d in visit_days if d <= month_end]
    if not past_visits:
        return month_end
    return month_end - max(past_visits)


def build_monthly_features(customers, coupon_df):
    """고객별 월별 피처 생성"""
    rows = []

    # 쿠폰 데이터를 고객별 월별로 집계
    coupon_monthly = {}
    if not coupon_df.empty and "household_key" in coupon_df.columns:
        for _, row in coupon_df.iterrows():
            hk = int(row["household_key"])
            day = int(row["DAY"])
            m = day // DAYS_PER_MONTH
            if m < NUM_MONTHS:
                coupon_monthly.setdefault(hk, set()).add(m)

    for cust in customers:
        cid = cust["id"]
        visit_days = cust["visitDays"]
        state_changes = cust["stateChanges"]

        for m in range(NUM_MONTHS):
            visits = get_monthly_visits(visit_days, m)
            cum_visits = sum(get_monthly_visits(visit_days, i) for i in range(m + 1))
            gap = get_gap_days(visit_days, m)
            state = get_monthly_state(state_changes, m)

            # 방문 추세 (최근 3개월 평균 vs 이전 3개월 평균)
            if m >= 3:
                recent = np.mean([get_monthly_visits(visit_days, m - i) for i in range(3)])
                prev = np.mean([get_monthly_visits(visit_days, m - 3 - i) for i in range(min(3, m - 2))])
                trend = (recent - prev) / max(prev, 1)
            else:
                trend = 0.0

            coupon_used = 1 if cid in coupon_monthly and m in coupon_monthly[cid] else 0

            rows.append({
                "customer_id": cid,
                "month": m,
                "visits": visits,
                "cumulative_visits": cum_visits,
                "gap_days": gap,
                "visit_trend": round(trend, 4),
                "coupon_used": coupon_used,
                "state": state,
                "state_idx": STATE_IDX[state],
            })

    return pd.DataFrame(rows)


def add_static_features(monthly_df, features_df, profile_df, diversity_df, early_df):
    """고객 단위 정적 피처를 월별 테이블에 조인"""
    # 정적 피처 준비
    static = features_df[["household_key", "discount_ratio", "avg_basket_value",
                           "avg_visit_interval"]].copy()
    static = static.rename(columns={"household_key": "customer_id"})

    # store_variety, product_variety
    if "store_variety" in profile_df.columns:
        store_var = profile_df[["household_key", "store_variety", "product_variety"]].copy()
        store_var = store_var.rename(columns={"household_key": "customer_id"})
        static = static.merge(store_var, on="customer_id", how="left")

    # dept_count
    if "dept_count" in diversity_df.columns:
        dept = diversity_df[["household_key", "dept_count", "commodity_count"]].copy()
        dept = dept.rename(columns={"household_key": "customer_id"})
        static = static.merge(dept, on="customer_id", how="left")

    # 첫 1개월 방문
    if "week4_visit_count" in early_df.columns:
        early_feat = early_df[["household_key", "week4_visit_count"]].copy()
        early_feat = early_feat.rename(columns={
            "household_key": "customer_id",
            "week4_visit_count": "first_month_visits"
        })
        static = static.merge(early_feat, on="customer_id", how="left")

    # 조인
    merged = monthly_df.merge(static, on="customer_id", how="left")
    merged = merged.fillna(0)

    return merged


def add_targets(df):
    """1개월 후, 3개월 후, 6개월 후 상태를 타겟으로 추가"""
    df = df.sort_values(["customer_id", "month"]).reset_index(drop=True)

    for horizon, col in [(1, "target_1m"), (3, "target_3m"), (6, "target_6m")]:
        df[col] = np.nan
        for cid in df["customer_id"].unique():
            mask = df["customer_id"] == cid
            cust_df = df.loc[mask].copy()
            future_states = cust_df["state_idx"].shift(-horizon)
            df.loc[mask, col] = future_states.values

    return df


def main():
    print("=== Phase 1: ML 데이터 준비 ===")

    print("1. 데이터 로딩...")
    customers, metadata = load_racing_data()
    features_df, profile_df, diversity_df, early_df, coupon_df = load_csvs()
    print(f"   고객 수: {len(customers)}, 쿠폰 이벤트: {len(coupon_df)}")

    print("2. 월별 피처 생성...")
    monthly_df = build_monthly_features(customers, coupon_df)
    print(f"   생성된 행 수: {len(monthly_df)} ({len(customers)} customers × {NUM_MONTHS} months)")

    print("3. 정적 피처 조인...")
    merged_df = add_static_features(monthly_df, features_df, profile_df, diversity_df, early_df)
    print(f"   피처 수: {len(merged_df.columns)}")

    print("4. 타겟 변수 추가...")
    final_df = add_targets(merged_df)

    # 타겟이 있는 행만 필터 (1개월 후 기준)
    train_df = final_df.dropna(subset=["target_1m"]).copy()
    train_df["target_1m"] = train_df["target_1m"].astype(int)
    for col in ["target_3m", "target_6m"]:
        train_df[col] = train_df[col].fillna(-1).astype(int)

    print(f"   학습 가능 행 수: {len(train_df)}")

    # 저장
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    train_df.to_parquet(OUT_DIR / "ml_data.parquet", index=False)
    print(f"   저장: {OUT_DIR / 'ml_data.parquet'}")

    # 요약 통계 출력
    print("\n=== 데이터 요약 ===")
    print(f"총 행: {len(train_df)}")
    print(f"피처: {[c for c in train_df.columns if c not in ['customer_id', 'month', 'state', 'state_idx', 'target_1m', 'target_3m', 'target_6m']]}")
    print(f"\n타겟 분포 (1개월 후):")
    idx_to_state = {v: k for k, v in STATE_IDX.items()}
    for idx, count in train_df["target_1m"].value_counts().sort_index().items():
        print(f"  {idx_to_state.get(idx, '?')}: {count} ({count/len(train_df)*100:.1f}%)")

    print("\n완료.")


if __name__ == "__main__":
    main()
