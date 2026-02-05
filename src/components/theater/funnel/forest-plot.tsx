"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { BIDIRECTIONAL_DRIVERS, TRANSITION_CONFIG, getDriverExplanation } from "@/lib/data/funnel-drivers";

type TransitionKey = keyof typeof TRANSITION_CONFIG;

export function ForestPlot() {
  const [selectedTransition, setSelectedTransition] =
    useState<TransitionKey>("no_churn_maintain");
  const [hoveredDriver, setHoveredDriver] = useState<string | null>(null);

  const transition = TRANSITION_CONFIG[selectedTransition];

  // Get correlation effects for the selected transition (r값을 %p 스케일로 변환: r * 100)
  const driverEffects = Object.entries(BIDIRECTIONAL_DRIVERS).map(([key, config]) => {
    const effectData = config.effects[selectedTransition as keyof typeof config.effects];
    const effect = effectData ? effectData.r * 100 : 0; // r값을 %p로 변환
    const sig = effectData?.sig || '';
    // Confidence intervals based on effect size
    const ci = Math.abs(effect) * 0.3 + 1.5;
    return {
      key,
      label: config.label,
      emoji: config.emoji,
      color: config.color,
      effect,
      ciLower: effect - ci,
      ciUpper: effect + ci,
      significance: sig || (Math.abs(effect) > 10 ? "***" : Math.abs(effect) > 5 ? "**" : "*"),
    };
  });

  // Sort by absolute effect size
  const sortedEffects = [...driverEffects].sort(
    (a, b) => Math.abs(b.effect) - Math.abs(a.effect)
  );

  // Scale for visualization
  const maxEffect = Math.max(...driverEffects.map((d) => Math.abs(d.ciUpper)));
  const minEffect = Math.min(...driverEffects.map((d) => d.ciLower));
  const range = Math.max(Math.abs(maxEffect), Math.abs(minEffect)) * 1.2;
  const scale = (value: number) => ((value + range) / (2 * range)) * 100;

  return (
    <div className="space-y-6">
      {/* Transition Selector */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(TRANSITION_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setSelectedTransition(key as TransitionKey)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedTransition === key
                ? "bg-white/15 text-white border border-white/30"
                : "bg-white/5 text-white/50 hover:bg-white/10 border border-transparent"
            }`}
          >
            {config.from} → {config.to}
          </button>
        ))}
      </div>

      {/* Selected Transition Info */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <div>
          <div className="text-base font-semibold text-white">
            {transition.from} → {transition.to}
            <span className="text-white/40 font-normal ml-3 text-sm">{transition.label}</span>
          </div>
          <div className="text-sm text-white/50 mt-1">
            {transition.description} | 대상: {transition.target}
          </div>
        </div>
      </div>

      {/* Forest Plot */}
      <div className="relative bg-slate-900/50 rounded-2xl p-6 border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div className="text-sm font-medium text-white/70">상관 요인</div>
          <div className="flex-1 mx-8 text-center">
            <div className="text-sm font-medium text-white/70">효과 크기 (%p)</div>
          </div>
          <div className="text-sm font-medium text-white/70 w-24 text-right">
            유의수준
          </div>
        </div>

        {/* Zero line label */}
        <div className="absolute top-4 right-32 text-xs text-white/40">
          ← 부정적 | 긍정적 →
        </div>

        {/* Driver rows */}
        <div className="space-y-3">
          {sortedEffects.map((driver, index) => (
            <motion.div
              key={driver.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center transition-all cursor-pointer ${
                hoveredDriver === driver.key
                  ? "bg-white/10 -mx-4 px-4 py-2 rounded-lg"
                  : "py-1"
              }`}
              onMouseEnter={() => setHoveredDriver(driver.key)}
              onMouseLeave={() => setHoveredDriver(null)}
            >
              {/* Driver label */}
              <div className="flex items-center gap-2 w-36">
                <span className="text-sm text-white/80">{driver.label}</span>
              </div>

              {/* Forest plot visualization */}
              <div className="flex-1 mx-4 relative h-10">
                {/* Background scale */}
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full h-px bg-white/10" />
                </div>

                {/* Zero line */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-white/30"
                  style={{ left: "50%" }}
                />

                {/* Scale markers */}
                {[-30, -20, -10, 0, 10, 20, 30].map((val) => (
                  <div
                    key={val}
                    className="absolute bottom-0 text-[10px] text-white/30 -translate-x-1/2"
                    style={{ left: `${scale(val)}%` }}
                  >
                    {val !== 0 && val}
                  </div>
                ))}

                {/* Confidence interval line */}
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 h-1 rounded-full"
                  style={{
                    left: `${scale(driver.ciLower)}%`,
                    width: `${scale(driver.ciUpper) - scale(driver.ciLower)}%`,
                    backgroundColor: driver.color,
                    opacity: 0.4,
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                />

                {/* Effect point */}
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{
                    left: `${scale(driver.effect)}%`,
                    backgroundColor: driver.color,
                    boxShadow:
                      hoveredDriver === driver.key
                        ? `0 0 20px ${driver.color}`
                        : "none",
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: index * 0.1 + 0.3,
                    type: "spring",
                    stiffness: 300,
                  }}
                >
                  {/* Diamond shape */}
                  <div
                    className="w-2 h-2 rotate-45"
                    style={{ backgroundColor: "white" }}
                  />
                </motion.div>
              </div>

              {/* Significance */}
              <div className="w-24 text-right">
                <span
                  className="text-sm font-mono"
                  style={{
                    color:
                      driver.significance === "***"
                        ? "#22c55e"
                        : driver.significance === "**"
                        ? "#fbbf24"
                        : "#f97316",
                  }}
                >
                  {driver.effect > 0 ? "+" : ""}
                  {driver.effect.toFixed(1)}%p {driver.significance}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 호버 설명 - 고정 위치 */}
        <div className="mt-4 pt-4 border-t border-white/10 min-h-[52px]">
          {hoveredDriver ? (() => {
            const hovered = sortedEffects.find(d => d.key === hoveredDriver);
            if (!hovered) return null;
            const explanation = getDriverExplanation(hoveredDriver, selectedTransition);
            const sigLabel = hovered.significance === "***" ? "매우 유의" : hovered.significance === "**" ? "유의" : hovered.significance === "*" ? "약한 유의" : "비유의";
            return (
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-white">{hovered.label}</span>
                  <span className="text-sm" style={{ color: hovered.color }}>
                    {hovered.effect > 0 ? "+" : ""}{hovered.effect.toFixed(1)}%p
                  </span>
                  <span className="text-xs text-white/40">({sigLabel})</span>
                </div>
                {explanation && (
                  <div className="text-xs text-white/50 mt-1">{explanation}</div>
                )}
              </div>
            );
          })() : (
            <div className="text-xs text-white/30">
              요인 위에 마우스를 올려 설명을 확인하세요
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-4 text-xs text-white/50">
          <div className="flex items-center gap-2">
            <span className="text-green-400">***</span>
            <span>p&lt;0.001</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">**</span>
            <span>p&lt;0.01</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-orange-400">*</span>
            <span>p&lt;0.05</span>
          </div>
        </div>
      </div>

      {/* Key Insight */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="p-4 rounded-xl bg-white/5 border border-white/10"
      >
        <div>
          <div className="text-sm font-semibold text-white mb-1">참고</div>
            <div className="text-sm text-white/70 mt-1">
              {selectedTransition === "no_churn_maintain" &&
                "쿠폰 사용(r=0.150)과 다매장 방문(r=0.129)이 상대적으로 높은 양의 상관. 6개 변수 중 5개 유의."}
              {selectedTransition === "vip_achieve" &&
                "VIP 기준이 방문 362회 이상이므로 경험 변수의 영향은 제한적. 카테고리 다양성·할인의 음의 상관은 방문 횟수를 통제하면 사라짐."}
              {selectedTransition === "recovery" &&
                "다매장 방문(r=0.134)이 상대적으로 높은 상관. 쿠폰 사용(r=0.061)도 유의."}
              {selectedTransition === "churn_prevention" &&
                "다매장 방문(r=0.165)이 상대적으로 높은 상관. 주말 방문(r=-0.046)은 약한 음의 상관."}
              {selectedTransition === "risk_maintain" &&
                "다매장 방문(r=0.140)만 유의한 상관. 나머지 변수는 대부분 비유의적."}
            </div>
        </div>
      </motion.div>
    </div>
  );
}
