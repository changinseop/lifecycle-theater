"""
Phase 2: LightGBM Walk-forward Validation + SHAP + Scenario Simulation
ml_data.parquet → public/model/prediction_results.json
"""

import json
import warnings
import numpy as np
import pandas as pd
import lightgbm as lgb
import shap
from pathlib import Path
from sklearn.metrics import accuracy_score
from collections import Counter

warnings.filterwarnings("ignore")

BASE = Path(__file__).resolve().parent.parent
SCRIPT_DIR = BASE / "scripts"
PUBLIC_DIR = BASE / "public" / "model"

STATE_NAMES = {0: "active", 1: "loyal", 2: "vip", 3: "risk", 4: "churn"}
NUM_CLASSES = 5

FEATURE_COLS = [
    "visits", "cumulative_visits", "gap_days", "visit_trend", "coupon_used",
    "discount_ratio", "avg_basket_value", "avg_visit_interval",
    "store_variety", "product_variety", "dept_count", "commodity_count",
    "first_month_visits", "state_idx",
]

FEATURE_LABELS = {
    "visits": "월 방문 횟수",
    "cumulative_visits": "누적 방문",
    "gap_days": "방문 공백(일)",
    "visit_trend": "방문 추세",
    "coupon_used": "쿠폰 사용",
    "discount_ratio": "할인 비율",
    "avg_basket_value": "평균 장바구니",
    "avg_visit_interval": "평균 방문간격",
    "store_variety": "매장 다양성",
    "product_variety": "상품 다양성",
    "dept_count": "부서 다양성",
    "commodity_count": "카테고리 수",
    "first_month_visits": "첫달 방문",
    "state_idx": "현재 등급",
}

# Walk-forward splits: train on months [0, train_end], test on test_month
WALKFORWARD_SPLITS = [
    {"train_end": 5, "test_month": 6},
    {"train_end": 8, "test_month": 9},
    {"train_end": 11, "test_month": 12},
    {"train_end": 14, "test_month": 15},
    {"train_end": 17, "test_month": 18},
]

HORIZONS = [("target_1m", "1m", 1), ("target_3m", "3m", 3), ("target_6m", "6m", 6)]


def load_data():
    return pd.read_parquet(SCRIPT_DIR / "ml_data.parquet")


def get_lgb_params():
    return {
        "objective": "multiclass",
        "num_class": NUM_CLASSES,
        "metric": "multi_logloss",
        "boosting_type": "gbdt",
        "num_leaves": 31,
        "learning_rate": 0.05,
        "feature_fraction": 0.8,
        "bagging_fraction": 0.8,
        "bagging_freq": 5,
        "verbose": -1,
        "n_jobs": -1,
        "seed": 42,
    }


def train_model(X_train, y_train, X_val=None, y_val=None, num_rounds=300):
    train_set = lgb.Dataset(X_train, label=y_train)
    callbacks = [lgb.log_evaluation(0)]

    valid_sets = [train_set]
    valid_names = ["train"]

    if X_val is not None and y_val is not None:
        val_set = lgb.Dataset(X_val, label=y_val)
        valid_sets.append(val_set)
        valid_names.append("valid")
        callbacks.append(lgb.early_stopping(30, verbose=False))

    model = lgb.train(
        get_lgb_params(),
        train_set,
        num_boost_round=num_rounds,
        valid_sets=valid_sets,
        valid_names=valid_names,
        callbacks=callbacks,
    )
    return model


def dist_dict(labels, total=None):
    if total is None:
        total = len(labels)
    counts = Counter(int(x) for x in labels)
    return {
        STATE_NAMES[i]: {
            "count": int(counts.get(i, 0)),
            "ratio": round(counts.get(i, 0) / max(total, 1), 4),
        }
        for i in range(NUM_CLASSES)
    }


# ── Walk-forward Validation ──────────────────────────────────────────

def walk_forward_validation(df):
    print("\n2. Walk-forward Validation...")
    results = {"periods": [], "overall_accuracy": {}}

    for target_col, h_name, _ in HORIZONS:
        all_true, all_pred = [], []

        for split in WALKFORWARD_SPLITS:
            train_end = split["train_end"]
            test_month = split["test_month"]

            train_mask = (df["month"] <= train_end) & (df[target_col] >= 0)
            test_mask = (df["month"] == test_month) & (df[target_col] >= 0)
            train_data = df[train_mask]
            test_data = df[test_mask]

            if len(train_data) < 100 or len(test_data) < 10:
                continue

            X_tr = train_data[FEATURE_COLS].values
            y_tr = train_data[target_col].values
            X_te = test_data[FEATURE_COLS].values
            y_te = test_data[target_col].values

            # 80/20 for early stopping within train
            sp = int(len(X_tr) * 0.8)
            model = train_model(X_tr[:sp], y_tr[:sp], X_tr[sp:], y_tr[sp:])

            y_pred = model.predict(X_te).argmax(axis=1)
            acc = accuracy_score(y_te, y_pred)

            all_true.extend(y_te.tolist())
            all_pred.extend(y_pred.tolist())

            results["periods"].append({
                "train_months": f"0-{train_end}",
                "test_month": int(test_month),
                "horizon": h_name,
                "accuracy": round(float(acc), 4),
                "n_test": int(len(y_te)),
                "actual_distribution": dist_dict(y_te),
                "predicted_distribution": dist_dict(y_pred),
            })

        overall = accuracy_score(all_true, all_pred) if all_true else 0
        results["overall_accuracy"][h_name] = round(float(overall), 4)
        print(f"   {h_name}: {overall:.1%}  (n={len(all_true)})")

    return results


# ── Final model training ─────────────────────────────────────────────

def train_final_models(df):
    print("\n3. 최종 모델 학습 (전체 데이터)...")
    models = {}
    for target_col, h_name, _ in HORIZONS:
        valid = df[df[target_col] >= 0]
        X = valid[FEATURE_COLS].values
        y = valid[target_col].values

        sp = int(len(X) * 0.8)
        model = train_model(X[:sp], y[:sp], X[sp:], y[sp:], num_rounds=500)
        models[h_name] = model

        full_acc = accuracy_score(y, model.predict(X).argmax(axis=1))
        print(f"   {h_name} 전체 정확도: {full_acc:.4f}")

    return models


# ── SHAP ─────────────────────────────────────────────────────────────

def compute_shap(model, df):
    print("\n4. SHAP 분석...")
    valid = df[df["target_1m"] >= 0]
    n = min(5000, len(valid))
    sample = valid.sample(n, random_state=42)
    X = sample[FEATURE_COLS].values

    explainer = shap.TreeExplainer(model)
    sv = explainer.shap_values(X)  # list[ndarray] or ndarray

    # Normalize to list-of-arrays format
    if isinstance(sv, np.ndarray) and sv.ndim == 3:
        sv = [sv[:, :, c] for c in range(sv.shape[2])]

    global_imp = np.zeros(len(FEATURE_COLS))
    per_class = {}

    for cls_idx in range(NUM_CLASSES):
        if cls_idx >= len(sv):
            continue
        cls_abs = np.abs(sv[cls_idx]).mean(axis=0)
        global_imp += cls_abs
        order = np.argsort(-cls_abs)
        per_class[STATE_NAMES[cls_idx]] = [
            {
                "feature": FEATURE_COLS[i],
                "label": FEATURE_LABELS[FEATURE_COLS[i]],
                "importance": round(float(cls_abs[i]), 6),
            }
            for i in order[:10]
        ]

    global_imp /= NUM_CLASSES
    order = np.argsort(-global_imp)
    global_list = [
        {
            "feature": FEATURE_COLS[i],
            "label": FEATURE_LABELS[FEATURE_COLS[i]],
            "importance": round(float(global_imp[i]), 6),
        }
        for i in order
    ]

    print(f"   Top 5: {[g['label'] for g in global_list[:5]]}")
    return {"global": global_list, "per_class": per_class}


# ── Future Projections ───────────────────────────────────────────────

def project_future(models, df):
    print("\n5. 미래 예측...")
    max_m = int(df["month"].max())
    latest = df[df["month"] == max_m]

    current = dist_dict(latest["state_idx"].values)
    projected = {}
    for h_name, model in models.items():
        X = latest[FEATURE_COLS].values
        y_pred = model.predict(X).argmax(axis=1)
        projected[h_name] = dist_dict(y_pred)

    # 추세 데이터: 전체 월별 실제 분포
    monthly_actual = []
    for m in sorted(df["month"].unique()):
        mdf = df[df["month"] == m]
        monthly_actual.append({
            "month": int(m),
            "distribution": dist_dict(mdf["state_idx"].values),
        })

    return {
        "current_month": max_m,
        "current_distribution": current,
        "projected": projected,
        "monthly_actual": monthly_actual,
    }


# ── Scenarios ────────────────────────────────────────────────────────

def simulate_scenarios(models, df):
    print("\n6. 시나리오 시뮬레이션...")
    max_m = int(df["month"].max())
    latest = df[df["month"] == max_m].copy()

    sv_idx = FEATURE_COLS.index("store_variety")
    cp_idx = FEATURE_COLS.index("coupon_used")
    p75_sv = float(np.percentile(latest[FEATURE_COLS].iloc[:, sv_idx], 75))

    scenarios = {}
    for h_name, model in models.items():
        X_base = latest[FEATURE_COLS].values.copy()

        # Baseline
        y_base = model.predict(X_base).argmax(axis=1)
        base_dist = dist_dict(y_base)

        # Multi-store
        X_ms = X_base.copy()
        X_ms[:, sv_idx] = np.maximum(X_ms[:, sv_idx], p75_sv)
        y_ms = model.predict(X_ms).argmax(axis=1)

        # Coupon
        X_cp = X_base.copy()
        X_cp[:, cp_idx] = 1
        y_cp = model.predict(X_cp).argmax(axis=1)

        # Combined
        X_cb = X_base.copy()
        X_cb[:, sv_idx] = np.maximum(X_cb[:, sv_idx], p75_sv)
        X_cb[:, cp_idx] = 1
        y_cb = model.predict(X_cb).argmax(axis=1)

        scenarios[h_name] = {
            "baseline": dist_dict(y_base),
            "multi_store": dist_dict(y_ms),
            "coupon": dist_dict(y_cp),
            "combined": dist_dict(y_cb),
        }

        churn_base = base_dist["churn"]["ratio"]
        churn_comb = scenarios[h_name]["combined"]["churn"]["ratio"]
        diff = churn_comb - churn_base
        print(f"   {h_name} 이탈률: baseline {churn_base:.1%} → combined {churn_comb:.1%} ({diff:+.1%})")

    return scenarios


# ── Main ─────────────────────────────────────────────────────────────

def main():
    print("=" * 50)
    print("Phase 2: LightGBM 학습 + Walk-forward + SHAP")
    print("=" * 50)

    print("\n1. 데이터 로딩...")
    df = load_data()
    print(f"   {len(df)} rows, {len(FEATURE_COLS)} features, months 0-{df['month'].max()}")

    backtest = walk_forward_validation(df)
    models = train_final_models(df)
    importance = compute_shap(models["1m"], df)
    future = project_future(models, df)
    scenarios = simulate_scenarios(models, df)

    # ── Assemble output ──
    output = {
        "backtest": backtest,
        "future": future,
        "scenarios": scenarios,
        "feature_importance": importance,
        "model_info": {
            "algorithm": "LightGBM (GBDT)",
            "accuracy_1m": backtest["overall_accuracy"].get("1m", 0),
            "accuracy_3m": backtest["overall_accuracy"].get("3m", 0),
            "accuracy_6m": backtest["overall_accuracy"].get("6m", 0),
            "total_samples": int(len(df)),
            "features_used": len(FEATURE_COLS),
            "num_classes": NUM_CLASSES,
            "feature_names": FEATURE_COLS,
            "feature_labels": FEATURE_LABELS,
            "state_names": {str(k): v for k, v in STATE_NAMES.items()},
            "validation_method": "Walk-forward (5 periods)",
        },
    }

    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    out_path = PUBLIC_DIR / "prediction_results.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"\n   저장: {out_path}")

    # ── Summary ──
    print("\n" + "=" * 50)
    print("결과 요약")
    print("=" * 50)
    print(f"\nWalk-forward 정확도:")
    for h, acc in backtest["overall_accuracy"].items():
        print(f"  {h}: {acc*100:.1f}%")

    print(f"\nSHAP Top 5:")
    for f in importance["global"][:5]:
        print(f"  {f['label']}: {f['importance']:.4f}")

    print(f"\n미래 예측 (현재 → 3m):")
    for state in ["active", "loyal", "vip", "risk", "churn"]:
        cur = future["current_distribution"][state]["ratio"]
        proj = future["projected"]["3m"][state]["ratio"]
        print(f"  {state}: {cur*100:.1f}% → {proj*100:.1f}% ({(proj-cur)*100:+.1f}%)")

    print("\n완료.")


if __name__ == "__main__":
    main()
