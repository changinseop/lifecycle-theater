"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { COMBINATION_EFFECTS } from "@/lib/data/funnel-drivers";
import { Skull, Crown, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

export function CombinationEffects() {
  const [activeTab, setActiveTab] = useState<"worst" | "best">("worst");
  const [hoveredCombo, setHoveredCombo] = useState<number | null>(null);

  const worstCombos = COMBINATION_EFFECTS.filter((c) => c.type === "worst");
  const bestCombos = COMBINATION_EFFECTS.filter((c) => c.type === "best");
  const currentCombos = activeTab === "worst" ? worstCombos : bestCombos;

  const maxRate = Math.max(...COMBINATION_EFFECTS.map((c) => c.churnRate));

  return (
    <div className="space-y-6">
      {/* Tab Selector */}
      <div className="flex items-center justify-center gap-2 p-1 bg-white/5 rounded-xl w-fit mx-auto">
        <button
          onClick={() => setActiveTab("worst")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all ${
            activeTab === "worst"
              ? "bg-red-500/20 text-red-400"
              : "text-white/60 hover:text-white/80"
          }`}
        >
          <Skull className="w-5 h-5" />
          최악 조합 (이탈 위험 ↑)
        </button>
        <button
          onClick={() => setActiveTab("best")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all ${
            activeTab === "best"
              ? "bg-green-500/20 text-green-400"
              : "text-white/60 hover:text-white/80"
          }`}
        >
          <Crown className="w-5 h-5" />
          최적 조합 (충성 ↑)
        </button>
      </div>

      {/* Combination Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentCombos.map((combo, index) => {
          const isHovered = hoveredCombo === index;
          const barWidth = (combo.churnRate / maxRate) * 100;
          const isWorst = combo.type === "worst";

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                isHovered
                  ? isWorst
                    ? "bg-red-500/15 border-red-500/40 scale-[1.02]"
                    : "bg-green-500/15 border-green-500/40 scale-[1.02]"
                  : isWorst
                  ? "bg-red-500/5 border-red-500/20 hover:bg-red-500/10"
                  : "bg-green-500/5 border-green-500/20 hover:bg-green-500/10"
              }`}
              onMouseEnter={() => setHoveredCombo(index)}
              onMouseLeave={() => setHoveredCombo(null)}
            >
              {/* Rank Badge */}
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${
                    isWorst ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                  }`}
                >
                  {isWorst ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Crown className="w-4 h-4" />
                  )}
                  {isWorst ? `위험 ${index + 1}위` : `안전 ${index + 1}위`}
                </div>
                <div className="text-sm font-bold text-white/50">
                  #{index + 1}
                </div>
              </div>

              {/* Combination Name */}
              <h4 className="text-lg font-semibold text-white mb-2">
                {combo.name}
              </h4>

              {/* Factors */}
              <div className="flex flex-wrap gap-2 mb-4">
                {combo.factors.map((factor, i) => (
                  <span
                    key={i}
                    className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      isWorst
                        ? "bg-red-500/10 text-red-300 border border-red-500/20"
                        : "bg-green-500/10 text-green-300 border border-green-500/20"
                    }`}
                  >
                    {factor}
                  </span>
                ))}
              </div>

              {/* Churn Rate Bar */}
              <div className="relative h-8 bg-slate-800/50 rounded-lg overflow-hidden mb-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.6 }}
                  className={`absolute h-full rounded-lg ${
                    isWorst
                      ? "bg-gradient-to-r from-red-700 via-red-500 to-red-400"
                      : "bg-gradient-to-r from-green-700 via-green-500 to-green-400"
                  }`}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    이탈율: {combo.churnRate.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-white/5">
                  <div className="text-lg font-bold text-white">
                    {combo.count.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-white/50">해당 고객</div>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <div
                    className={`text-lg font-bold ${
                      isWorst ? "text-red-400" : "text-green-400"
                    }`}
                  >
                    {combo.vsAverage > 0 ? "+" : ""}
                    {combo.vsAverage.toFixed(0)}%p
                  </div>
                  <div className="text-[10px] text-white/50">vs 평균</div>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <div className="text-lg font-bold text-white">
                    {combo.significance}
                  </div>
                  <div className="text-[10px] text-white/50">유의수준</div>
                </div>
              </div>

              {/* Hover Insight */}
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 pt-4 border-t border-white/10"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-blue-400">Insight</span>
                    <p className="text-sm text-white/70">{combo.insight}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Comparison Visualization */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="p-6 rounded-2xl bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-white/10"
      >
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          조합별 이탈율 비교
        </h4>

        {/* Horizontal Bar Chart */}
        <div className="space-y-3">
          {COMBINATION_EFFECTS.sort((a, b) => b.churnRate - a.churnRate).map(
            (combo, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-40 text-xs text-white/70 truncate">
                  {combo.name}
                </div>
                <div className="flex-1 h-6 bg-slate-800/50 rounded-lg overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(combo.churnRate / maxRate) * 100}%` }}
                    transition={{ delay: index * 0.05 + 0.8, duration: 0.5 }}
                    className={`h-full rounded-lg ${
                      combo.type === "worst"
                        ? "bg-gradient-to-r from-red-600 to-red-400"
                        : "bg-gradient-to-r from-green-600 to-green-400"
                    }`}
                  />
                  {/* Average line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-yellow-400"
                    style={{ left: `${(21.4 / maxRate) * 100}%` }}
                  />
                </div>
                <div className="w-16 text-sm font-bold text-white text-right">
                  {combo.churnRate.toFixed(1)}%
                </div>
              </div>
            )
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-gradient-to-r from-red-600 to-red-400 rounded" />
            <span className="text-xs text-white/50">위험 조합</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-gradient-to-r from-green-600 to-green-400 rounded" />
            <span className="text-xs text-white/50">안전 조합</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-4 bg-yellow-400" />
            <span className="text-xs text-white/50">전체 평균 (21.4%)</span>
          </div>
        </div>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="p-5 rounded-2xl bg-white/5 border border-white/10"
      >
        <div>
          <h4 className="text-white font-semibold text-sm mb-2">조합별 이탈율 비교</h4>
          <p className="text-sm text-white/60">
            소형매장 + 쿠폰 미사용 + 단일매장 조합의 이탈율은 48.2%로 평균(21.4%)의 약 2배.
            쿠폰 사용 + 다매장 + 대형매장 조합은 8.3%로 평균의 약 1/3.
            단일 변수보다 조합의 이탈율 차이가 크다.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
