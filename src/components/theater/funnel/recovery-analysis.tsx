"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  CHURN_COUNT_RECOVERY,
  RECOVERY_VS_NONRECOVERY,
  CHURN_THRESHOLD,
} from "@/lib/data/funnel-drivers";

export function RecoveryAnalysis() {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [selectedView, setSelectedView] = useState<"rate" | "comparison" | "scenario">("rate");

  const maxRecoveryRate = Math.max(
    ...CHURN_COUNT_RECOVERY.filter((d) => d.recoveryRate !== null).map(
      (d) => d.recoveryRate as number
    )
  );

  return (
    <div className="space-y-8">
      {/* View Selector */}
      <div className="flex gap-2">
        {[
          { id: "rate", label: "이탈 횟수별 복귀율" },
          { id: "comparison", label: "복귀 vs 미복귀" },
          { id: "scenario", label: "전환 시나리오" },
        ].map((view) => (
          <button
            key={view.id}
            onClick={() => setSelectedView(view.id as typeof selectedView)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedView === view.id
                ? "bg-white/15 text-white border border-white/30"
                : "bg-white/5 text-white/60 hover:bg-white/10 border border-transparent"
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>

      {/* Recovery Rate by Churn Count */}
      {selectedView === "rate" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Key Message */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div>
              <div className="text-white font-semibold">
                이탈 {CHURN_THRESHOLD.critical}회가 분기점
              </div>
              <div className="text-sm text-white/60">
                {CHURN_THRESHOLD.description}
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-6">
              이탈 횟수별 복귀율 (현재 "활성" 상태인 비율)
            </h3>

            <div className="space-y-4">
              {CHURN_COUNT_RECOVERY.map((item, index) => {
                const isThreshold = item.churnCount === CHURN_THRESHOLD.critical;
                const isBelowThreshold =
                  item.recoveryRate !== null &&
                  item.recoveryRate < 50;

                return (
                  <motion.div
                    key={item.churnCount}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative ${
                      hoveredBar === index ? "z-10" : ""
                    }`}
                    onMouseEnter={() => setHoveredBar(index)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Label */}
                      <div className="w-24 text-sm text-white/80">
                        {item.label}
                      </div>

                      {/* Bar Container */}
                      <div className="flex-1 relative">
                        {/* Background */}
                        <div className="h-10 bg-white/5 rounded-lg overflow-hidden">
                          {item.recoveryRate !== null ? (
                            <motion.div
                              className={`h-full rounded-lg flex items-center justify-end pr-3 ${
                                isThreshold
                                  ? "bg-white/25"
                                  : isBelowThreshold
                                  ? "bg-white/15"
                                  : "bg-white/30"
                              }`}
                              initial={{ width: 0 }}
                              animate={{
                                width: `${(item.recoveryRate / maxRecoveryRate) * 100}%`,
                              }}
                              transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                            >
                              <span className="text-white font-bold text-sm">
                                {item.recoveryRate.toFixed(1)}%
                              </span>
                            </motion.div>
                          ) : (
                            <div className="h-full bg-white/10 rounded-lg flex items-center justify-center">
                              <span className="text-white/70 text-sm font-medium">
                                VIP/충성만 가능 (별도 경로)
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 50% Threshold Line */}
                        {item.recoveryRate !== null && (
                          <div
                            className="absolute top-0 bottom-0 w-px bg-white/30"
                            style={{
                              left: `${(50 / maxRecoveryRate) * 100}%`,
                            }}
                          />
                        )}

                        {/* Note */}
                        {item.note && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: hoveredBar === index ? 1 : 0.7 }}
                            className="absolute right-0 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded text-white/50"
                            style={{ transform: "translateX(100%) translateY(-50%)", marginLeft: "8px" }}
                          >
                            {item.note}
                          </motion.div>
                        )}
                      </div>

                      {/* Count */}
                      <div className="w-20 text-right text-sm text-white/50">
                        {item.count}명
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-4 text-xs text-white/50">
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 bg-white/30 rounded" />
                <span>복귀율 50% 이상</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 bg-white/25 rounded" />
                <span>분기점 (이탈 4회)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 bg-white/15 rounded" />
                <span>복귀율 50% 미만</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-px h-3 bg-white/30" />
                <span>50% 기준선</span>
              </div>
            </div>
          </div>

          {/* Key Insight */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-white font-semibold mb-1">이탈 1~3회</div>
              <div className="text-xl font-bold text-white mb-1">
                복귀율 &gt; 50%
              </div>
              <div className="text-sm text-white/60">
                아직 살릴 수 있는 고객. 적극적 복귀 캠페인 필요
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-white font-semibold mb-1">이탈 4회+</div>
              <div className="text-xl font-bold text-white mb-1">
                복귀율 &lt; 50%
              </div>
              <div className="text-sm text-white/60">
                이탈 패턴 고착화. 비용 효율 고려 필요
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recovery vs Non-Recovery Comparison */}
      {selectedView === "comparison" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-sm font-medium text-white/60 mb-2">복귀 (현재 활성)</div>
              <div className="text-3xl font-bold text-white">
                {RECOVERY_VS_NONRECOVERY.recovered.count}명
              </div>
              <div className="text-sm text-white/50 mt-2">
                이탈 경험자의 {RECOVERY_VS_NONRECOVERY.recovered.percentage}%
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-sm font-medium text-white/60 mb-2">미복귀 (현재 위험/이탈)</div>
              <div className="text-3xl font-bold text-white">
                {RECOVERY_VS_NONRECOVERY.notRecovered.count}명
              </div>
              <div className="text-sm text-white/50 mt-2">
                이탈 경험자의 {RECOVERY_VS_NONRECOVERY.notRecovered.percentage}%
              </div>
            </div>
          </div>

          {/* Experience Difference Table */}
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">
              복귀 vs 미복귀 경험 변수 비교
            </h3>

            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5">
                    <th className="text-left p-4 text-sm font-medium text-white/70">
                      경험 변수
                    </th>
                    <th className="text-center p-4 text-sm font-medium text-white/70">
                      복귀 그룹
                    </th>
                    <th className="text-center p-4 text-sm font-medium text-white/70">
                      미복귀 그룹
                    </th>
                    <th className="text-center p-4 text-sm font-medium text-white/70">
                      차이
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {RECOVERY_VS_NONRECOVERY.experienceDiff.map((item, index) => (
                    <motion.tr
                      key={item.factor}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border-t border-white/5 hover:bg-white/5"
                    >
                      <td className="p-4 text-white">
                        {item.factor}
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-lg font-bold text-white">
                          {typeof item.recovered === "number"
                            ? item.recovered.toFixed(1)
                            : item.recovered}
                          {item.factor.includes("율") ? "%" : "개"}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-lg font-bold text-white/60">
                          {typeof item.notRecovered === "number"
                            ? item.notRecovered.toFixed(1)
                            : item.notRecovered}
                          {item.factor.includes("율") ? "%" : "개"}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-3 py-1 rounded-full bg-white/10 text-white/80 font-bold text-sm">
                          {item.diff}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Note */}
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="text-white font-semibold text-sm">
                다매장 방문율 차이가 가장 큼 (+16%p)
              </div>
              <div className="text-sm text-white/60 mt-1">
                복귀 그룹의 다매장 방문율(68%)이 미복귀 그룹(52%)보다 16%p 높다.
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Transition Scenarios */}
      {selectedView === "scenario" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Scenario 1: No Churn Path */}
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/10">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white">
                시나리오 1: VIP/충성 경로 (이탈 0회)
              </h3>
              <p className="text-sm text-white/50">
                한 번도 25일+ 공백 없이 꾸준히 방문
              </p>
            </div>

            {/* Flow Diagram */}
            <div className="flex items-center justify-center gap-4 py-6">
              <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-xs font-medium text-white/50 mb-1">Visit</div>
                <div className="text-white font-medium">꾸준한 방문</div>
              </div>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-2xl text-white/30"
              >
                →
              </motion.div>
              <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-xs font-medium text-white/50 mb-1">Loyal</div>
                <div className="text-white font-medium">충성</div>
              </div>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                className="text-2xl text-white/30"
              >
                →
              </motion.div>
              <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-xs font-medium text-white/50 mb-1">VIP</div>
                <div className="text-white font-medium">VIP (362회+)</div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="p-3 rounded-lg bg-white/5 text-center">
                <div className="text-xl font-bold text-white">463명</div>
                <div className="text-xs text-white/50">전체의 18.5%</div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 text-center">
                <div className="text-xl font-bold text-white">70명</div>
                <div className="text-xs text-white/50">VIP</div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 text-center">
                <div className="text-xl font-bold text-white">393명</div>
                <div className="text-xs text-white/50">충성</div>
              </div>
            </div>

            {/* Key Correlation Factors */}
            <div className="mt-4 p-3 rounded-lg bg-white/5">
              <div className="text-xs text-white/50 mb-2">유의한 상관 요인</div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded bg-white/10 text-white/70 text-sm">
                  쿠폰 사용 r=0.150***
                </span>
                <span className="px-2 py-1 rounded bg-white/10 text-white/70 text-sm">
                  다매장 방문 r=0.129***
                </span>
                <span className="px-2 py-1 rounded bg-white/10 text-white/70 text-sm">
                  할인 경험 r=0.118***
                </span>
              </div>
            </div>
          </div>

          {/* Scenario 2: Has Churn Path */}
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/10">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white">
                시나리오 2: 이탈 1회+ 경로 (복귀 가능)
              </h3>
              <p className="text-sm text-white/50">
                25일+ 공백 경험 있음, 양방향 전환 가능
              </p>
            </div>

            {/* Bidirectional Flow Diagram */}
            <div className="flex items-center justify-center gap-4 py-6">
              <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-xs font-medium text-white/50 mb-1">Active</div>
                <div className="text-white font-medium">활성</div>
                <div className="text-xs text-white/40 mt-1">990명</div>
              </div>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-xl text-white/30"
              >
                ↔
              </motion.div>
              <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-xs font-medium text-white/50 mb-1">Risk</div>
                <div className="text-white font-medium">위험</div>
                <div className="text-xs text-white/40 mt-1">513명</div>
              </div>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                className="text-xl text-white/30"
              >
                ↔
              </motion.div>
              <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="text-xs font-medium text-white/50 mb-1">Churn</div>
                <div className="text-white font-medium">이탈</div>
                <div className="text-xs text-white/40 mt-1">534명</div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 rounded-lg bg-white/5 text-center">
                <div className="text-xl font-bold text-white">2,037명</div>
                <div className="text-xs text-white/50">전체의 81.5%</div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 text-center">
                <div className="text-xl font-bold text-white">49%</div>
                <div className="text-xs text-white/50">복귀율</div>
              </div>
            </div>

            {/* Key Correlation Factors */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xs text-white/50 mb-2">복귀 상관 요인</div>
                <div className="space-y-1">
                  <div className="text-sm text-white/80">다매장 방문 r=0.134***</div>
                  <div className="text-sm text-white/80">쿠폰 사용 r=0.061**</div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xs text-white/50 mb-2">이탈 방지 상관 요인</div>
                <div className="space-y-1">
                  <div className="text-sm text-white/80">다매장 방문 r=0.165***</div>
                  <div className="text-sm text-white/80">쿠폰 사용 r=0.117***</div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-white font-semibold text-sm">요약</div>
            <div className="text-sm text-white/60 mt-1">
              이탈 경험자 2,037명 중 49%(990명)가 현재 활성 상태로 복귀.
              다매장 방문과 쿠폰 사용이 복귀·이탈 방지와 양의 상관을 보인다.
              이탈 횟수가 적을수록 복귀율이 높다(1회 73.5% → 4회 48.1%).
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
