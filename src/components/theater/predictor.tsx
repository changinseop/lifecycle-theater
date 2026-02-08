"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";

/* ────────────────────────────────────────────────── types */

interface StateDist {
  active: { count: number; ratio: number };
  loyal: { count: number; ratio: number };
  vip: { count: number; ratio: number };
  risk: { count: number; ratio: number };
  churn: { count: number; ratio: number };
}

interface BacktestPeriod {
  train_months: string;
  test_month: number;
  horizon: string;
  accuracy: number;
  n_test: number;
  actual_distribution: StateDist;
  predicted_distribution: StateDist;
}

interface FeatureItem {
  feature: string;
  label: string;
  importance: number;
}

interface PredictionData {
  backtest: {
    periods: BacktestPeriod[];
    overall_accuracy: Record<string, number>;
  };
  future: {
    current_month: number;
    current_distribution: StateDist;
    projected: Record<string, StateDist>;
    monthly_actual: { month: number; distribution: StateDist }[];
  };
  scenarios: Record<string, Record<string, StateDist>>;
  feature_importance: {
    global: FeatureItem[];
    per_class: Record<string, FeatureItem[]>;
  };
  model_info: {
    algorithm: string;
    accuracy_1m: number;
    accuracy_3m: number;
    accuracy_6m: number;
    total_samples: number;
    features_used: number;
    num_classes: number;
    validation_method: string;
  };
}

/* ────────────────────────────────────────────────── constants */

type StateKey = "active" | "loyal" | "vip" | "risk" | "churn";
const STATE_KEYS: StateKey[] = ["active", "loyal", "vip", "risk", "churn"];

const STATE_CFG: Record<StateKey, { label: string; color: string; text: string }> = {
  active: { label: "활성", color: "#60a5fa", text: "text-blue-400" },
  loyal: { label: "충성", color: "#34d399", text: "text-emerald-400" },
  vip: { label: "VIP", color: "#fbbf24", text: "text-amber-400" },
  risk: { label: "위험", color: "#fb923c", text: "text-orange-400" },
  churn: { label: "이탈", color: "#94a3b8", text: "text-slate-400" },
};

const HORIZON_LABELS: Record<string, string> = {
  "1m": "1개월 후",
  "3m": "3개월 후",
  "6m": "6개월 후",
};

const SCENARIO_LABELS: Record<string, { label: string; desc: string }> = {
  baseline: { label: "현 추세", desc: "아무 조치 없이 유지" },
  multi_store: { label: "다매장 캠페인", desc: "매장 다양성 75%ile로 상향" },
  coupon: { label: "쿠폰 캠페인", desc: "전 고객 쿠폰 지급" },
  combined: { label: "복합 캠페인", desc: "다매장 + 쿠폰 동시" },
};

type TabId = "backtest" | "future" | "features";

/* ────────────────────────────────────────────────── MethodInfo */

function MethodInfo({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white/[0.02] rounded-xl border border-white/10 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-white/40"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="text-xs font-medium text-white/50">{title}</span>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-white/30 text-xs"
        >
          ▼
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 text-xs text-white/50 leading-relaxed space-y-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────────────────────────────── component */

export function Predictor() {
  const [data, setData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("backtest");

  useEffect(() => {
    fetch("/model/prediction_results.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-white/60 text-sm">데이터 로딩 중...</p>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-red-400 text-sm">로드 실패: {error}</p>
      </div>
    );
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "backtest", label: "백테스트 검증" },
    { id: "future", label: "미래 예측" },
    { id: "features", label: "핵심 변수" },
  ];

  return (
    <div className="w-full h-full overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">
                AI 예측: 별책부록
              </h1>
              <p className="text-xs md:text-sm text-white/50 mt-1">
                통계 분석의 독립 검증 - LightGBM Walk-forward Validation
              </p>
            </div>
            <div className="flex gap-2 md:gap-3">
              {(["1m", "3m", "6m"] as const).map((h) => (
                <div
                  key={h}
                  className="text-center flex-1 md:flex-none px-3 md:px-4 py-2 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="text-base md:text-lg font-bold text-white">
                    {((data.backtest.overall_accuracy[h] || 0) * 100).toFixed(
                      1
                    )}
                    %
                  </div>
                  <div className="text-[10px] md:text-xs text-white/50">{HORIZON_LABELS[h]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tab nav */}
          <div className="flex gap-2 mt-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 md:px-5 py-2.5 md:py-2 rounded-lg text-sm font-medium transition-all min-h-[44px] whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-white/15 text-white border border-white/20"
                    : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <AnimatePresence mode="wait">
          {activeTab === "backtest" && (
            <motion.div
              key="backtest"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <BacktestTab data={data} />
            </motion.div>
          )}
          {activeTab === "future" && (
            <motion.div
              key="future"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <FutureTab data={data} />
            </motion.div>
          )}
          {activeTab === "features" && (
            <motion.div
              key="features"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <FeaturesTab data={data} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto px-6 py-6 border-t border-white/10">
        <div className="text-center text-white/30 text-xs space-y-1">
          <p>
            {data.model_info.algorithm} | {data.model_info.total_samples.toLocaleString()}개 학습 샘플 |{" "}
            {data.model_info.features_used}개 피처 | {data.model_info.validation_method}
          </p>
          <p>퍼널 분석(통계)과 독립적으로 같은 결론을 도출하는 ML 검증</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Tab 1: 백테스트 검증
   ═══════════════════════════════════════════════════════════ */

function BacktestTab({ data }: { data: PredictionData }) {
  const [selectedHorizon, setSelectedHorizon] = useState<string>("1m");

  const periods = useMemo(
    () => data.backtest.periods.filter((p) => p.horizon === selectedHorizon),
    [data, selectedHorizon]
  );

  // 월별 실제 분포 (시계열 차트용)
  const monthlyData = data.future.monthly_actual;

  return (
    <div className="space-y-6">
      {/* Section title + horizon selector */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Walk-forward 백테스트
          </h2>
          <p className="text-xs md:text-sm text-white/40">
            과거 데이터를 순차적으로 학습하며 미래를 예측 - 시계열 검증
          </p>
        </div>
        <div className="flex gap-2">
          {(["1m", "3m", "6m"] as const).map((h) => (
            <button
              key={h}
              onClick={() => setSelectedHorizon(h)}
              className={`px-3 py-2 md:py-1.5 rounded text-xs font-medium transition-all min-h-[44px] md:min-h-0 ${
                selectedHorizon === h
                  ? "bg-white/15 text-white"
                  : "bg-white/5 text-white/40 hover:text-white/60"
              }`}
            >
              {HORIZON_LABELS[h]}
            </button>
          ))}
        </div>
      </div>

      {/* Monthly distribution timeline */}
      <div className="bg-white/[0.02] rounded-xl border border-white/10 p-4 md:p-5">
        <h3 className="text-sm font-medium text-white/60 mb-4">
          월별 등급 분포 추이 (실제)
        </h3>
        <div className="overflow-x-auto">
          <div className="flex gap-1 items-end h-32 min-w-[400px]">
            {monthlyData.map((md, idx) => (
              <div key={idx} className="flex-1 h-full flex flex-col justify-end">
                <StackedBar dist={md.distribution} height={120} />
                {idx % 3 === 0 && (
                  <div className="text-[9px] text-white/30 text-center mt-1">
                    {md.month}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-3 md:gap-4 mt-3 justify-center flex-wrap">
          {STATE_KEYS.map((s) => (
            <div key={s} className="flex items-center gap-1">
              <div
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: STATE_CFG[s].color }}
              />
              <span className="text-[10px] text-white/50">{STATE_CFG[s].label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 선택된 horizon 정확도 강조 */}
      <div className="bg-white/[0.02] rounded-xl border border-white/10 p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="text-sm text-white/60">{HORIZON_LABELS[selectedHorizon]} 예측</span>
          <span className="text-xs text-white/30 ml-2">Walk-forward {periods.length}개 구간</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">종합 정확도</span>
          <span className="text-xl font-bold text-white">
            {((data.backtest.overall_accuracy[selectedHorizon] || 0) * 100).toFixed(1)}%
          </span>
          <span className="text-xs text-white/30 ml-1">(랜덤 20%)</span>
        </div>
      </div>

      {/* Walk-forward periods */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-white/60">
          검증 구간별 실제 vs 예측
        </h3>
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedHorizon}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {periods.map((period, idx) => (
              <motion.div
                key={`${period.horizon}-${period.test_month}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="bg-white/[0.02] rounded-xl border border-white/10 p-4"
              >
                <div className="flex flex-col gap-1.5 mb-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                    <span className="text-[10px] md:text-xs font-mono text-white/30 bg-white/5 px-2 py-0.5 rounded">
                      Train {period.train_months}
                    </span>
                    <span className="text-white/20">→</span>
                    <span className="text-[10px] md:text-xs text-white/60">
                      Month {period.test_month} ({HORIZON_LABELS[selectedHorizon]})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40">정확도</span>
                    <span
                      className={`text-sm font-bold ${
                        period.accuracy >= 0.7
                          ? "text-emerald-400"
                          : period.accuracy >= 0.6
                          ? "text-white"
                          : "text-orange-400"
                      }`}
                    >
                      {(period.accuracy * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] text-white/30 mb-1.5">실제</div>
                    <HorizontalDistBars dist={period.actual_distribution} />
                  </div>
                  <div>
                    <div className="text-[10px] text-white/30 mb-1.5">예측</div>
                    <HorizontalDistBars dist={period.predicted_distribution} />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Methodology */}
      <MethodInfo title="분석 기법 상세">
        <div>
          <p className="text-white/70 font-medium mb-1">Walk-forward Validation (시계열 교차 검증)</p>
          <p>
            일반적인 랜덤 분할(train/test split)은 시계열 데이터에서 미래 정보가 학습에 포함되는
            &quot;정보 유출(data leakage)&quot; 문제를 일으킵니다. Walk-forward는 시간 순서를 엄격히 지켜,
            항상 과거 데이터만으로 학습하고 미래를 예측합니다.
          </p>
        </div>
        <div>
          <p className="text-white/70 font-medium mb-1">검증 방식</p>
          <div className="font-mono text-[10px] text-white/40 space-y-0.5">
            <p>구간 1: Train [Month 0-5]  → Predict Month 6</p>
            <p>구간 2: Train [Month 0-8]  → Predict Month 9</p>
            <p>구간 3: Train [Month 0-11] → Predict Month 12</p>
            <p>구간 4: Train [Month 0-14] → Predict Month 15</p>
            <p>구간 5: Train [Month 0-17] → Predict Month 18</p>
          </div>
          <p className="mt-1">
            학습 데이터가 늘어날수록 정확도가 향상되는지, 일정하게 유지되는지를 확인합니다.
          </p>
        </div>
        <div>
          <p className="text-white/70 font-medium mb-1">모델: LightGBM (Gradient Boosted Decision Tree)</p>
          <p>
            수백 개의 작은 결정 트리를 순차적으로 학습시켜, 이전 트리가 틀린 부분을 다음 트리가
            보완하는 앙상블 기법입니다. 테이블 형태 데이터에서 딥러닝보다 우수한 성능을 보입니다.
          </p>
        </div>
        <div>
          <p className="text-white/70 font-medium mb-1">정확도 해석</p>
          <p>
            5개 등급을 무작위로 찍으면 정확도 20%입니다. 66%는 랜덤 대비 3.3배의 예측력으로,
            모델이 고객 상태 변화의 패턴을 학습하고 있음을 의미합니다. 14개 피처(방문 빈도, 매장 다양성,
            쿠폰 사용 등)가 입력됩니다.
          </p>
        </div>
      </MethodInfo>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Tab 2: 미래 예측
   ═══════════════════════════════════════════════════════════ */

function FutureTab({ data }: { data: PredictionData }) {
  const [selectedHorizon, setSelectedHorizon] = useState<string>("3m");
  const [selectedScenario, setSelectedScenario] = useState<string>("baseline");

  const current = data.future.current_distribution;
  const scenarioDist = data.scenarios[selectedHorizon]?.[selectedScenario];
  const baselineDist = data.scenarios[selectedHorizon]?.["baseline"];

  if (!scenarioDist || !baselineDist) return null;

  // Risk+Churn 비율 계산
  const currentRC = current.risk.ratio + current.churn.ratio;
  const baselineRC = baselineDist.risk.ratio + baselineDist.churn.ratio;
  const scenarioRC = scenarioDist.risk.ratio + scenarioDist.churn.ratio;
  const improvementRC = baselineRC - scenarioRC;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">미래 예측 시뮬레이션</h2>
          <p className="text-xs md:text-sm text-white/40">
            현재 고객 기반 → {HORIZON_LABELS[selectedHorizon]} 등급 분포 예측
          </p>
        </div>
        <div className="flex gap-2">
          {(["1m", "3m", "6m"] as const).map((h) => (
            <button
              key={h}
              onClick={() => setSelectedHorizon(h)}
              className={`px-3 py-2 md:py-1.5 rounded text-xs font-medium transition-all min-h-[44px] md:min-h-0 ${
                selectedHorizon === h
                  ? "bg-white/15 text-white"
                  : "bg-white/5 text-white/40 hover:text-white/60"
              }`}
            >
              {HORIZON_LABELS[h]}
            </button>
          ))}
        </div>
      </div>

      {/* Scenario selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {Object.entries(SCENARIO_LABELS).map(([key, { label, desc }]) => (
          <button
            key={key}
            onClick={() => setSelectedScenario(key)}
            className={`text-left p-3 rounded-xl border transition-all min-h-[44px] ${
              selectedScenario === key
                ? "bg-white/10 border-white/25"
                : "bg-white/[0.02] border-white/10 hover:border-white/15"
            }`}
          >
            <div className="text-sm font-medium text-white">{label}</div>
            <div className="text-[10px] text-white/40 mt-0.5">{desc}</div>
          </button>
        ))}
      </div>

      {/* Distribution comparison */}
      <div className="bg-white/[0.02] rounded-xl border border-white/10 p-4 md:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Current */}
          <div>
            <h3 className="text-sm font-medium text-white/60 mb-4">현재 분포 (Month {data.future.current_month})</h3>
            <div className="space-y-3">
              {STATE_KEYS.map((s) => (
                <DistRow key={s} state={s} ratio={current[s].ratio} count={current[s].count} />
              ))}
            </div>
          </div>

          {/* Projected */}
          <div>
            <h3 className="text-sm font-medium text-white/60 mb-4">
              {HORIZON_LABELS[selectedHorizon]} 예측
              {selectedScenario !== "baseline" && (
                <span className="ml-2 text-white/40">
                  ({SCENARIO_LABELS[selectedScenario].label})
                </span>
              )}
            </h3>
            <div className="space-y-3">
              {STATE_KEYS.map((s) => {
                const diff = scenarioDist[s].ratio - current[s].ratio;
                return (
                  <DistRow
                    key={s}
                    state={s}
                    ratio={scenarioDist[s].ratio}
                    count={scenarioDist[s].count}
                    diff={diff}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Impact summary */}
      {selectedScenario !== "baseline" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.02] rounded-xl border border-white/10 p-5"
        >
          <h3 className="text-sm font-medium text-white/60 mb-3">
            캠페인 효과 요약 ({HORIZON_LABELS[selectedHorizon]})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <MetricCard
              label="위험+이탈 비율"
              value={`${(scenarioRC * 100).toFixed(1)}%`}
              sub={`현 추세 ${(baselineRC * 100).toFixed(1)}%`}
            />
            <MetricCard
              label="개선 효과"
              value={`${(improvementRC * 100).toFixed(1)}%p`}
              sub={improvementRC > 0 ? "위험+이탈 감소" : "효과 미미"}
            />
            <MetricCard
              label="영향 고객"
              value={`~${Math.round(improvementRC * 2500)}명`}
              sub="2,500명 기준"
            />
          </div>
        </motion.div>
      )}

      {/* Scenario comparison table */}
      <div className="bg-white/[0.02] rounded-xl border border-white/10 p-5">
        <h3 className="text-sm font-medium text-white/60 mb-3">
          시나리오 비교 ({HORIZON_LABELS[selectedHorizon]})
        </h3>
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 text-white/40 font-medium">시나리오</th>
                {STATE_KEYS.map((s) => (
                  <th key={s} className="text-right py-2 text-white/40 font-medium px-2">
                    {STATE_CFG[s].label}
                  </th>
                ))}
                <th className="text-right py-2 text-white/40 font-medium px-2">
                  위험+이탈
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(SCENARIO_LABELS).map(([key, { label }]) => {
                const dist = data.scenarios[selectedHorizon]?.[key];
                if (!dist) return null;
                const rc = dist.risk.ratio + dist.churn.ratio;
                return (
                  <tr
                    key={key}
                    className={`border-b border-white/5 ${
                      key === selectedScenario ? "bg-white/5" : ""
                    }`}
                  >
                    <td className="py-2 text-white/70">{label}</td>
                    {STATE_KEYS.map((s) => (
                      <td key={s} className="text-right py-2 px-2 text-white/60 font-mono text-xs">
                        {(dist[s].ratio * 100).toFixed(1)}%
                      </td>
                    ))}
                    <td className="text-right py-2 px-2 font-mono text-xs font-semibold text-white/80">
                      {(rc * 100).toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Methodology */}
      <MethodInfo title="시나리오 시뮬레이션 방법">
        <div>
          <p className="text-white/70 font-medium mb-1">시나리오 기반 예측 (Counterfactual Simulation)</p>
          <p>
            학습된 모델에 현재 고객 데이터를 입력하되, 특정 변수만 조작하여 &quot;만약 이 조건이 바뀌었다면?&quot;을
            시뮬레이션합니다. 인과관계가 아닌 모델의 반응을 측정하는 방식입니다.
          </p>
        </div>
        <div>
          <p className="text-white/70 font-medium mb-1">시나리오 정의</p>
          <div className="space-y-1">
            <p><span className="text-white/60">현 추세:</span> 모든 피처를 현재 값 그대로 유지</p>
            <p><span className="text-white/60">다매장 캠페인:</span> store_variety를 전체 고객 75%ile 이상으로 상향 조정</p>
            <p><span className="text-white/60">쿠폰 캠페인:</span> coupon_used를 전 고객 1(사용)로 설정</p>
            <p><span className="text-white/60">복합 캠페인:</span> 다매장 + 쿠폰 동시 적용</p>
          </div>
        </div>
        <div>
          <p className="text-white/70 font-medium mb-1">해석 시 주의</p>
          <p>
            모델의 예측은 상관관계 기반이며, 실제 캠페인 효과와 다를 수 있습니다.
            퍼널 분석(통계)의 상관계수와 방향이 일치하는지 교차 검증하는 것이 핵심입니다.
          </p>
        </div>
      </MethodInfo>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Tab 3: 핵심 변수
   ═══════════════════════════════════════════════════════════ */

function FeaturesTab({ data }: { data: PredictionData }) {
  const [selectedClass, setSelectedClass] = useState<string>("global");

  const importance =
    selectedClass === "global"
      ? data.feature_importance.global
      : data.feature_importance.per_class[selectedClass] || [];

  const maxImp = importance.length > 0 ? importance[0].importance : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-white">
          ML이 찾은 핵심 변수 (SHAP)
        </h2>
        <p className="text-sm text-white/40">
          모델이 예측에 가장 많이 의존한 변수 순위 - 퍼널 분석과 독립 비교
        </p>
      </div>

      {/* Class selector */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedClass("global")}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
            selectedClass === "global"
              ? "bg-white/15 text-white"
              : "bg-white/5 text-white/40 hover:text-white/60"
          }`}
        >
          전체
        </button>
        {STATE_KEYS.map((s) => (
          <button
            key={s}
            onClick={() => setSelectedClass(s)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              selectedClass === s
                ? "bg-white/15 text-white"
                : "bg-white/5 text-white/40 hover:text-white/60"
            }`}
          >
            {STATE_CFG[s].label}
          </button>
        ))}
      </div>

      {/* Importance chart */}
      <div className="bg-white/[0.02] rounded-xl border border-white/10 p-5">
        <h3 className="text-sm font-medium text-white/60 mb-4">
          {selectedClass === "global"
            ? "전체 SHAP Feature Importance"
            : `${STATE_CFG[selectedClass as StateKey]?.label || selectedClass} 등급 예측 기여도`}
        </h3>
        <div className="space-y-2.5">
          {importance.map((item, idx) => (
            <motion.div
              key={item.feature}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="flex items-center gap-3"
            >
              <span className="text-xs text-white/50 w-5 text-right font-mono">
                {idx + 1}
              </span>
              <span className="text-xs text-white/70 w-28 truncate">
                {item.label}
              </span>
              <div className="flex-1 h-5 bg-white/5 rounded overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.importance / maxImp) * 100}%` }}
                  transition={{ duration: 0.5, delay: idx * 0.04 }}
                  className="h-full rounded"
                  style={{
                    backgroundColor:
                      idx === 0
                        ? "rgba(255,255,255,0.35)"
                        : idx < 3
                        ? "rgba(255,255,255,0.25)"
                        : "rgba(255,255,255,0.15)",
                  }}
                />
              </div>
              <span className="text-xs text-white/40 w-14 text-right font-mono">
                {item.importance.toFixed(4)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cross-validation with funnel */}
      <div className="bg-white/[0.02] rounded-xl border border-white/10 p-5">
        <h3 className="text-sm font-medium text-white/60 mb-3">
          통계 분석 vs ML: 독립 교차 검증
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs text-white/40 mb-2">퍼널 분석 (Point-biserial)</h4>
            <div className="space-y-2 text-xs">
              {[
                { var: "방문 간격", corr: "r=0.71***", dir: "길수록 이탈" },
                { var: "방문 공백", corr: "r=0.58***", dir: "길수록 이탈" },
                { var: "매장 다양성", corr: "r=-0.34***", dir: "높을수록 유지" },
                { var: "쿠폰 사용", corr: "r=-0.12***", dir: "사용 시 유지" },
                { var: "할인 비율", corr: "r=-0.08*", dir: "높을수록 유지" },
              ].map((row) => (
                <div key={row.var} className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-white/60">{row.var}</span>
                  <div className="text-right">
                    <span className="text-white/70 font-mono">{row.corr}</span>
                    <span className="text-white/40 ml-2">{row.dir}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs text-white/40 mb-2">ML (SHAP importance)</h4>
            <div className="space-y-2 text-xs">
              {data.feature_importance.global.slice(0, 5).map((f) => (
                <div key={f.feature} className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-white/60">{f.label}</span>
                  <span className="text-white/70 font-mono">
                    {f.importance.toFixed(4)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="text-xs text-white/40 mt-4">
          통계 분석과 ML이 독립적으로 같은 핵심 변수를 최상위로 선정.
          방문 간격/공백이 양쪽 모두에서 가장 강력한 이탈 예측 변수로 확인됨.
        </p>
      </div>

      {/* Methodology */}
      <MethodInfo title="SHAP 분석 기법 상세">
        <div>
          <p className="text-white/70 font-medium mb-1">SHAP (SHapley Additive exPlanations)</p>
          <p>
            게임이론의 Shapley 값을 ML에 적용한 해석 기법입니다. 각 피처가 개별 예측에 얼마나
            기여했는지를 수치로 계산합니다. 단순히 &quot;이 변수가 중요하다&quot;가 아니라, &quot;이 변수가
            이 고객의 이탈 확률을 몇 % 높였다/낮췄다&quot;를 알 수 있습니다.
          </p>
        </div>
        <div>
          <p className="text-white/70 font-medium mb-1">읽는 법</p>
          <p>
            값이 클수록 모델이 해당 변수에 더 의존합니다.
            &quot;전체&quot;는 5개 등급 전체에 대한 평균 기여도이고,
            개별 등급을 선택하면 해당 등급 예측에 특별히 중요한 변수를 확인할 수 있습니다.
          </p>
        </div>
        <div>
          <p className="text-white/70 font-medium mb-1">교차 검증의 의미</p>
          <p>
            왼쪽(퍼널 분석)은 Point-biserial 상관계수로, 각 변수와 이탈 여부의 선형 상관을 측정합니다.
            오른쪽(SHAP)은 비선형 관계까지 포함합니다. 두 방법이 독립적으로 같은 결론을 내면,
            해당 변수의 영향력에 대한 신뢰도가 높아집니다.
          </p>
        </div>
      </MethodInfo>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Shared sub-components
   ═══════════════════════════════════════════════════════════ */

function StackedBar({ dist, height }: { dist: StateDist; height: number }) {
  return (
    <div className="flex flex-col-reverse w-full" style={{ height }}>
      {STATE_KEYS.map((s) => {
        const h = dist[s].ratio * height;
        return (
          <div
            key={s}
            style={{ height: h, backgroundColor: STATE_CFG[s].color, opacity: 0.7 }}
            className="w-full"
          />
        );
      })}
    </div>
  );
}

function HorizontalDistBars({ dist }: { dist: StateDist }) {
  return (
    <div className="space-y-1.5">
      {STATE_KEYS.map((s) => (
        <div key={s} className="flex items-center gap-2">
          <span className="text-[10px] text-white/40 w-8">{STATE_CFG[s].label}</span>
          <div className="flex-1 h-3 bg-white/5 rounded overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${dist[s].ratio * 100}%` }}
              transition={{ duration: 0.4 }}
              className="h-full rounded"
              style={{ backgroundColor: STATE_CFG[s].color, opacity: 0.7 }}
            />
          </div>
          <span className="text-[10px] text-white/40 w-10 text-right font-mono">
            {(dist[s].ratio * 100).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}

function DistRow({
  state,
  ratio,
  count,
  diff,
}: {
  state: StateKey;
  ratio: number;
  count: number;
  diff?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
        style={{ backgroundColor: STATE_CFG[state].color }}
      />
      <span className="text-xs text-white/60 w-10">{STATE_CFG[state].label}</span>
      <div className="flex-1 h-4 bg-white/5 rounded overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${ratio * 100}%` }}
          transition={{ duration: 0.5 }}
          className="h-full rounded"
          style={{ backgroundColor: STATE_CFG[state].color, opacity: 0.6 }}
        />
      </div>
      <span className="text-xs text-white/60 w-14 text-right font-mono">
        {(ratio * 100).toFixed(1)}%
      </span>
      {diff !== undefined && (
        <span
          className={`text-[10px] w-12 text-right font-mono ${
            diff > 0.005
              ? "text-orange-400"
              : diff < -0.005
              ? "text-emerald-400"
              : "text-white/30"
          }`}
        >
          {diff > 0 ? "+" : ""}
          {(diff * 100).toFixed(1)}
        </span>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-white/5 rounded-lg p-3 text-center">
      <div className="text-xs text-white/40 mb-1">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-[10px] text-white/30 mt-0.5">{sub}</div>
    </div>
  );
}
