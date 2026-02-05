"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import {
  BIDIRECTIONAL_DRIVERS,
  TRANSITION_CONFIG,
  getCorrelationColor,
  getSignificanceLabel,
} from "@/lib/data/funnel-drivers";

export function DriverHeatmap() {
  const [hoveredCell, setHoveredCell] = useState<{
    driver: string;
    transition: string;
  } | null>(null);
  const [sortBy, setSortBy] = useState<"driver" | "impact">("impact");

  const drivers = Object.entries(BIDIRECTIONAL_DRIVERS);
  const transitions = Object.entries(TRANSITION_CONFIG);

  // Sort drivers by total absolute impact
  const sortedDrivers = useMemo(() => {
    if (sortBy === "impact") {
      return [...drivers].sort((a, b) => {
        const totalA = Object.values(a[1].effects).reduce(
          (sum, v) => sum + Math.abs(v.r),
          0
        );
        const totalB = Object.values(b[1].effects).reduce(
          (sum, v) => sum + Math.abs(v.r),
          0
        );
        return totalB - totalA;
      });
    }
    return drivers;
  }, [sortBy, drivers]);

  const getColor = (r: number, sig: string) => {
    if (!sig) return "rgba(107, 114, 128, 0.3)"; // 무의미
    return getCorrelationColor(r) + (Math.abs(r) > 0.1 ? "cc" : "80");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">
            양방향 전환 상관 히트맵
          </h3>
          <p className="text-sm text-white/60">
            각 셀은 Point-biserial 상관계수(r). 초록=양의 상관, 빨강=음의 상관, 회색=비유의적
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy("driver")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              sortBy === "driver"
                ? "bg-white/20 text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            이름순
          </button>
          <button
            onClick={() => setSortBy("impact")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              sortBy === "impact"
                ? "bg-white/20 text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            영향력순
          </button>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header row - Transitions */}
          <div className="flex">
            <div className="w-36 shrink-0" />
            {transitions.map(([key, config], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex-1 p-2 text-center min-w-[120px]"
              >
                <div className="text-xs text-white/60 mb-1">
                  {config.from} → {config.to}
                </div>
                <div className="text-[10px] text-white/40 leading-tight">
                  {config.label}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Data rows */}
          {sortedDrivers.map(([driverKey, driverConfig], rowIndex) => (
            <motion.div
              key={driverKey}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: rowIndex * 0.05 }}
              className="flex"
            >
              {/* Driver label */}
              <div className="w-36 shrink-0 p-3 flex items-center gap-2 border-r border-white/10">
                <span className="text-sm text-white/80">{driverConfig.label}</span>
              </div>

              {/* Effect cells */}
              {transitions.map(([transKey], colIndex) => {
                const effect =
                  driverConfig.effects[transKey as keyof typeof driverConfig.effects];
                const isHovered =
                  hoveredCell?.driver === driverKey &&
                  hoveredCell?.transition === transKey;

                return (
                  <motion.div
                    key={transKey}
                    className={`flex-1 min-w-[120px] p-3 flex items-center justify-center cursor-pointer transition-all border border-white/5 ${
                      isHovered ? "scale-105 z-10 shadow-xl" : ""
                    }`}
                    style={{
                      backgroundColor: getColor(effect.r, effect.sig),
                    }}
                    onMouseEnter={() =>
                      setHoveredCell({ driver: driverKey, transition: transKey })
                    }
                    onMouseLeave={() => setHoveredCell(null)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: isHovered ? 1.05 : 1 }}
                    transition={{ delay: (rowIndex + colIndex) * 0.02 }}
                  >
                    <div className="text-center">
                      <div className={`text-sm font-bold ${effect.sig ? "text-white" : "text-white/50"}`}>
                        {effect.r >= 0 ? "+" : ""}
                        {(effect.r * 100).toFixed(1)}
                      </div>
                      <div className="text-[9px] text-white/60">
                        {effect.sig || "n.s."}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Color Legend */}
      <div className="flex items-center justify-center gap-8 py-4">
        <div className="flex items-center gap-2">
          <div className="w-20 h-4 rounded bg-gradient-to-r from-red-600 via-red-500 to-red-400" />
          <span className="text-xs text-white/50">음의 상관</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-12 h-4 rounded bg-gray-500/50" />
          <span className="text-xs text-white/50">무의미</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-4 rounded bg-gradient-to-r from-green-400 via-green-500 to-green-600" />
          <span className="text-xs text-white/50">양의 상관 (긍정)</span>
        </div>
      </div>

      {/* Detailed Tooltip Card */}
      {hoveredCell && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 p-4 rounded-xl bg-slate-800 border border-white/20 shadow-2xl z-50 min-w-[350px]"
        >
          {(() => {
            const driver = BIDIRECTIONAL_DRIVERS[hoveredCell.driver as keyof typeof BIDIRECTIONAL_DRIVERS];
            const transition = TRANSITION_CONFIG[hoveredCell.transition as keyof typeof TRANSITION_CONFIG];
            const effect = driver.effects[hoveredCell.transition as keyof typeof driver.effects];

            return (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div>
                    <div className="text-white font-semibold">{driver.label}</div>
                    <div className="text-xs text-white/50">
                      {transition.label} ({transition.target})
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="p-2 rounded bg-white/5">
                    <div className="text-white/50 text-xs">상관계수 (r)</div>
                    <div
                      className="text-lg font-bold"
                      style={{ color: getCorrelationColor(effect.r) }}
                    >
                      {effect.r >= 0 ? "+" : ""}
                      {effect.r.toFixed(3)}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-white/5">
                    <div className="text-white/50 text-xs">유의수준</div>
                    <div className={`font-bold ${effect.sig ? "text-green-400" : "text-gray-400"}`}>
                      {effect.sig ? getSignificanceLabel(effect.sig) : "무의미"}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-white/5">
                    <div className="text-white/50 text-xs">해석</div>
                    <div className="text-white text-xs">
                      {effect.r > 0.1
                        ? "강한 긍정적"
                        : effect.r > 0.05
                        ? "약한 긍정적"
                        : effect.r < -0.1
                        ? "강한 부정적"
                        : effect.r < -0.05
                        ? "약한 부정적"
                        : "영향 없음"}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </motion.div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-white/50 text-xs font-medium mb-2">최대 양의 상관</div>
          <div className="text-base font-bold text-white">다매장 → 이탈방지</div>
          <div className="text-lg font-bold text-white/80 mt-1">r = +0.165***</div>
          <div className="text-xs text-white/50 mt-2">
            여러 매장을 다니는 고객은 완전히 떠나기 어려움.
            이탈 경험자 2,037명 대상.
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-white/50 text-xs font-medium mb-2">최대 음의 상관</div>
          <div className="text-base font-bold text-white">카테고리다양성 → VIP도달</div>
          <div className="text-lg font-bold text-white/80 mt-1">r = -0.156***</div>
          <div className="text-xs text-white/50 mt-2">
            VIP는 자주 와서 늘 사던 것만 사는 습관형.
            다양하게 사는 고객은 계획적이라 방문 빈도가 낮은 편.
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-white/50 text-xs font-medium mb-2">전환 전반에 일관된 변수</div>
          <div className="text-base font-bold text-white">다매장 방문</div>
          <div className="text-xs text-white/50 mt-2">
            복귀·이탈방지·위험유지 3개 전환에서 1위.
            여러 매장을 아는 고객은 한 곳을 안 가도 다른 곳으로 돌아옴.
          </div>
        </div>
      </div>
    </div>
  );
}
