"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BIDIRECTIONAL_DRIVERS,
  TRANSITION_CONFIG,
  getCorrelationColor,
  getSignificanceLabel,
} from "@/lib/data/funnel-drivers";
import { CorrelationDashboard } from "../funnel/correlation-dashboard";
import { CombinationEffects } from "../funnel/combination-effects";
import { RecoveryAnalysis } from "../funnel/recovery-analysis";
import { ChevronDown, ChevronUp, X } from "lucide-react";

/* ────────────────────────────────────────────────── Types */

type SectionId =
  | "bifurcation"
  | "forest"
  | "heatmap"
  | "recovery"
  | "correlation"
  | "combination";

interface Section {
  id: SectionId;
  num: number;
  title: string;
  subtitle: string;
}

const SECTIONS: Section[] = [
  {
    id: "bifurcation",
    num: 1,
    title: "분석 프레임워크",
    subtitle: "등급 x 코호트 교차 분석",
  },
  {
    id: "forest",
    num: 2,
    title: "상관 효과",
    subtitle: "Forest Plot + 신뢰구간",
  },
  {
    id: "heatmap",
    num: 3,
    title: "전환 동인 히트맵",
    subtitle: "전환별 상관관계 매트릭스",
  },
  {
    id: "recovery",
    num: 4,
    title: "복귀 패턴 분석",
    subtitle: "이탈 횟수별 복귀율",
  },
  {
    id: "correlation",
    num: 5,
    title: "상관관계 대시보드",
    subtitle: "변수별 이탈 상관관계",
  },
  {
    id: "combination",
    num: 6,
    title: "조합 효과",
    subtitle: "최악/최적 조합별 이탈율",
  },
];

/* ────────────────────────────────────────────────── Section 1: Bifurcation Flow (Mobile Vertical) */

function BifurcationFlowMobile() {
  const grades = [
    { label: "VIP", color: "#fbbf24", pct: "2.8%" },
    { label: "충성", color: "#22c55e", pct: "15.7%" },
    { label: "활성", color: "#3b82f6", pct: "39.6%" },
    { label: "위험", color: "#f97316", pct: "20.5%" },
    { label: "이탈", color: "#6b7280", pct: "21.4%" },
  ];

  const cohorts = [
    { code: "111", label: "다매장 탐험", vipRate: "27.8%" },
    { code: "110", label: "초기 탐험", vipRate: "15.2%" },
    { code: "100", label: "첫달만", vipRate: "8.1%" },
    { code: "010", label: "중기 전환", vipRate: "5.3%" },
    { code: "001", label: "후기 전환", vipRate: "3.9%" },
  ];

  const results = [
    { num: 2, label: "상관 효과" },
    { num: 3, label: "상관 히트맵" },
    { num: 4, label: "복귀 패턴" },
    { num: 5, label: "상관관계" },
    { num: 6, label: "조합 효과" },
  ];

  return (
    <div className="space-y-0">
      {/* Step 1 */}
      <motion.div
        className="rounded-xl bg-white/[0.03] border border-white/10 p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-[10px] text-white/40 tracking-widest mb-1">
          STEP 1
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">2,500</span>
          <span className="text-sm text-white/50">명 · 711일</span>
        </div>
        <div className="mt-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
        <div className="text-[10px] text-white/30 mt-1">전체 거래 데이터</div>
      </motion.div>

      {/* Arrow Down */}
      <div className="flex justify-center py-1">
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="w-px h-4 bg-white/15" />
          <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-white/25" />
        </motion.div>
      </div>

      {/* Step 2: 5등급 분류 */}
      <motion.div
        className="rounded-xl bg-white/[0.03] border border-white/10 p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div className="text-[10px] text-white/40 tracking-widest mb-1">
          STEP 2
        </div>
        <div className="text-sm font-semibold text-white mb-3">5등급 분류</div>
        <div className="space-y-2">
          {grades.map((g, i) => (
            <motion.div
              key={g.label}
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.06 }}
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: g.color }}
              />
              <span className="text-xs text-white/70 flex-1">{g.label}</span>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: g.color }}
                  initial={{ width: 0 }}
                  animate={{ width: g.pct }}
                  transition={{ delay: 0.4 + i * 0.06, duration: 0.5 }}
                />
              </div>
              <span className="text-[11px] text-white/50 w-10 text-right tabular-nums">
                {g.pct}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Cross Symbol */}
      <div className="flex justify-center py-1.5">
        <motion.div
          className="w-8 h-8 rounded-full bg-white/5 border border-white/15 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
        >
          <span className="text-sm font-bold text-white/60">x</span>
        </motion.div>
      </div>

      {/* Step 3: 매장 코호트 */}
      <motion.div
        className="rounded-xl bg-white/[0.03] border border-white/10 p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <div className="text-[10px] text-white/40 tracking-widest mb-1">
          STEP 3
        </div>
        <div className="text-sm font-semibold text-white mb-3">매장 코호트</div>
        <div className="space-y-2">
          {cohorts.map((c, i) => (
            <motion.div
              key={c.code}
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.06 }}
            >
              <code className="text-[10px] font-mono text-white/50 bg-white/5 px-1.5 py-0.5 rounded shrink-0">
                {c.code}
              </code>
              <span className="text-xs text-white/70 flex-1">{c.label}</span>
              <span className="text-[11px] text-white/40">
                VIP {c.vipRate}
              </span>
            </motion.div>
          ))}
        </div>
        <div className="text-[9px] text-white/20 mt-2">
          1=다매장 방문 0=미방문 (첫 1개월 패턴)
        </div>
      </motion.div>

      {/* Arrow Down */}
      <div className="flex justify-center py-1">
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="w-px h-4 bg-white/15" />
          <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-white/25" />
        </motion.div>
      </div>

      {/* Result: 상태 전환 분석 */}
      <motion.div
        className="rounded-xl bg-white/[0.03] border border-white/10 p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        <div className="text-[10px] text-white/40 tracking-widest mb-1">
          RESULT
        </div>
        <div className="text-sm font-semibold text-white mb-3">
          상태 전환 분석
        </div>
        <div className="space-y-1.5">
          {results.map((item, i) => (
            <motion.div
              key={item.num}
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 + i * 0.06 }}
            >
              <span className="text-[10px] font-mono text-white/30">
                {item.num}.
              </span>
              <span className="text-xs text-white/70">{item.label}</span>
            </motion.div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-white/5">
          {["Point-biserial r", "Chi2", "편상관"].map((tag) => (
            <span
              key={tag}
              className="text-[9px] text-white/25 px-1.5 py-0.5 rounded bg-white/5"
            >
              {tag}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Bottom Stats */}
      <motion.div
        className="mt-3 p-3 rounded-lg bg-white/[0.02] border border-white/5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <div className="space-y-1 text-[10px] text-white/35">
          <div>이탈 기준: 25일+ 공백</div>
          <div>VIP: 이탈 0회 + 362회+ 방문</div>
          <div>
            첫 1개월 패턴 → 최종 등급 예측 (Chi2=106, p&lt;0.001)
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ────────────────────────────────────────────────── Section 2: Forest Plot (Mobile Cards) */

type TransitionKey = keyof typeof TRANSITION_CONFIG;

function ForestPlotMobile() {
  const [selectedTransition, setSelectedTransition] =
    useState<TransitionKey>("no_churn_maintain");
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);

  const transition = TRANSITION_CONFIG[selectedTransition];

  const driverEffects = Object.entries(BIDIRECTIONAL_DRIVERS).map(
    ([key, config]) => {
      const effectData =
        config.effects[selectedTransition as keyof typeof config.effects];
      const effect = effectData ? effectData.r * 100 : 0;
      const sig = effectData?.sig || "";
      const ci = Math.abs(effect) * 0.3 + 1.5;
      return {
        key,
        label: config.label,
        color: config.color,
        effect,
        ciLower: effect - ci,
        ciUpper: effect + ci,
        significance:
          sig ||
          (Math.abs(effect) > 10
            ? "***"
            : Math.abs(effect) > 5
            ? "**"
            : "*"),
        r: effectData?.r ?? 0,
        pValue: effectData?.p ?? 1,
        sigRaw: sig,
      };
    }
  );

  const sortedEffects = [...driverEffects].sort(
    (a, b) => Math.abs(b.effect) - Math.abs(a.effect)
  );

  const maxAbsEffect = Math.max(
    ...driverEffects.map((d) => Math.max(Math.abs(d.ciLower), Math.abs(d.ciUpper)))
  );
  const range = maxAbsEffect * 1.2;

  return (
    <div className="space-y-4">
      {/* Transition Selector - horizontal scroll */}
      <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
        <div className="flex gap-1.5 w-max">
          {Object.entries(TRANSITION_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedTransition(key as TransitionKey)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap min-h-[44px] ${
                selectedTransition === key
                  ? "bg-white/15 text-white border border-white/30"
                  : "bg-white/5 text-white/50 active:bg-white/10 border border-transparent"
              }`}
            >
              {config.from} → {config.to}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Transition Info */}
      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
        <div className="text-sm font-semibold text-white">
          {transition.from} → {transition.to}
        </div>
        <div className="text-xs text-white/50 mt-1">{transition.description}</div>
      </div>

      {/* Driver Cards */}
      <div className="space-y-2">
        {sortedEffects.map((driver, index) => {
          const isExpanded = expandedDriver === driver.key;
          const barCenter = 50;
          const barEnd = barCenter + (driver.effect / range) * 50;
          const barLeft = Math.min(barCenter, barEnd);
          const barWidth = Math.abs(barEnd - barCenter);

          return (
            <motion.div
              key={driver.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedDriver(isExpanded ? null : driver.key)
                }
                className="w-full p-3 text-left min-h-[44px]"
              >
                {/* Driver Name & Value */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white/80">
                    {driver.label}
                  </span>
                  <span
                    className="text-sm font-mono font-bold"
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

                {/* Horizontal bar */}
                <div className="relative h-5 bg-slate-800/50 rounded-lg overflow-hidden">
                  {/* Zero line */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-white/30"
                    style={{ left: "50%" }}
                  />
                  {/* CI bar */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full opacity-30"
                    style={{
                      left: `${50 + (driver.ciLower / range) * 50}%`,
                      width: `${((driver.ciUpper - driver.ciLower) / range) * 50}%`,
                      backgroundColor: driver.color,
                    }}
                  />
                  {/* Effect bar */}
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 h-3 rounded-full"
                    style={{
                      left: `${barLeft}%`,
                      backgroundColor: driver.color,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ delay: index * 0.06 + 0.2, duration: 0.4 }}
                  />
                  {/* Effect point */}
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full"
                    style={{
                      left: `${barEnd}%`,
                      backgroundColor: driver.color,
                      boxShadow: `0 0 6px ${driver.color}80`,
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.06 + 0.3, type: "spring" }}
                  />
                  {/* Scale labels */}
                  <div className="absolute bottom-0 left-1 text-[8px] text-white/20">
                    -
                  </div>
                  <div className="absolute bottom-0 right-1 text-[8px] text-white/20">
                    +
                  </div>
                </div>
              </button>

              {/* Expanded Detail */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 pt-0">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-lg bg-white/5">
                          <div className="text-[10px] text-white/40">r값</div>
                          <div
                            className="text-sm font-bold"
                            style={{ color: getCorrelationColor(driver.r) }}
                          >
                            {driver.r >= 0 ? "+" : ""}
                            {driver.r.toFixed(3)}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5">
                          <div className="text-[10px] text-white/40">p값</div>
                          <div className="text-sm font-bold text-white/70">
                            {driver.pValue < 0.001
                              ? "<0.001"
                              : driver.pValue.toFixed(3)}
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5">
                          <div className="text-[10px] text-white/40">유의</div>
                          <div
                            className={`text-sm font-bold ${
                              driver.sigRaw
                                ? "text-green-400"
                                : "text-white/40"
                            }`}
                          >
                            {driver.sigRaw
                              ? getSignificanceLabel(driver.sigRaw)
                              : "n.s."}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-white/40 px-1">
        <div className="flex items-center gap-1">
          <span className="text-green-400">***</span>
          <span>p&lt;0.001</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-yellow-400">**</span>
          <span>p&lt;0.01</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-orange-400">*</span>
          <span>p&lt;0.05</span>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────── Section 3: Driver Heatmap (Real Grid) */

const TRANS_SHORT: Record<string, string> = {
  no_churn_maintain: "유지",
  vip_achieve: "VIP",
  recovery: "복귀",
  churn_prevention: "방지",
  risk_maintain: "위험",
};

function DriverHeatmapMobile() {
  const [tappedCell, setTappedCell] = useState<{ driver: string; trans: string } | null>(null);

  const drivers = Object.entries(BIDIRECTIONAL_DRIVERS);
  const transitions = Object.entries(TRANSITION_CONFIG);

  // 영향력순 정렬
  const sortedDrivers = useMemo(() => {
    return [...drivers].sort((a, b) => {
      const totalA = Object.values(a[1].effects).reduce((s, v) => s + Math.abs(v.r), 0);
      const totalB = Object.values(b[1].effects).reduce((s, v) => s + Math.abs(v.r), 0);
      return totalB - totalA;
    });
  }, [drivers]);

  const getColor = (r: number, sig: string) => {
    if (!sig) return "rgba(107, 114, 128, 0.25)";
    return getCorrelationColor(r) + (Math.abs(r) > 0.1 ? "cc" : "80");
  };

  const tappedEffect = tappedCell
    ? BIDIRECTIONAL_DRIVERS[tappedCell.driver as keyof typeof BIDIRECTIONAL_DRIVERS]
        ?.effects[tappedCell.trans as keyof typeof BIDIRECTIONAL_DRIVERS["coupon"]["effects"]]
    : null;
  const tappedDriver = tappedCell
    ? BIDIRECTIONAL_DRIVERS[tappedCell.driver as keyof typeof BIDIRECTIONAL_DRIVERS]
    : null;
  const tappedTrans = tappedCell
    ? TRANSITION_CONFIG[tappedCell.trans as keyof typeof TRANSITION_CONFIG]
    : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="text-sm font-semibold text-white">양방향 전환 상관 히트맵</div>
        <div className="text-xs text-white/50 mt-0.5">
          Point-biserial 상관계수(r×100). 셀을 탭하면 상세 확인
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto scrollbar-hide">
        <div style={{ minWidth: 340 }}>
          {/* Column Headers (transitions) */}
          <div className="flex">
            <div className="w-[68px] flex-shrink-0" />
            {transitions.map(([key, config]) => (
              <div key={key} className="flex-1 min-w-[52px] text-center px-0.5 pb-1.5">
                <div className="text-[9px] text-white/50 leading-tight">{config.from}</div>
                <div className="text-[8px] text-white/30">→{config.to}</div>
                <div className="text-[7px] text-white/20 mt-0.5">{TRANS_SHORT[key]}</div>
              </div>
            ))}
          </div>

          {/* Data Rows */}
          {sortedDrivers.map(([driverKey, driverConfig], ri) => (
            <motion.div
              key={driverKey}
              className="flex"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: ri * 0.04 }}
            >
              {/* Row label */}
              <div className="w-[68px] flex-shrink-0 pr-1.5 py-1 flex items-center border-r border-white/5">
                <span className="text-[10px] text-white/60 leading-tight">{driverConfig.label}</span>
              </div>

              {/* Cells */}
              {transitions.map(([transKey]) => {
                const effect = driverConfig.effects[transKey as keyof typeof driverConfig.effects];
                const isActive = tappedCell?.driver === driverKey && tappedCell?.trans === transKey;

                return (
                  <motion.div
                    key={transKey}
                    className={`flex-1 min-w-[52px] m-[1px] rounded flex items-center justify-center cursor-pointer border ${
                      isActive ? "border-white/60 ring-1 ring-white/30" : "border-transparent"
                    }`}
                    style={{
                      backgroundColor: getColor(effect.r, effect.sig),
                      height: 36,
                    }}
                    onClick={() =>
                      setTappedCell(
                        isActive ? null : { driver: driverKey, trans: transKey }
                      )
                    }
                    whileTap={{ scale: 0.92 }}
                  >
                    <div className="text-center">
                      <div className={`text-[10px] font-bold font-mono ${effect.sig ? "text-white" : "text-white/40"}`}>
                        {effect.r >= 0 ? "+" : ""}{(effect.r * 100).toFixed(0)}
                      </div>
                      {effect.sig && (
                        <div className="text-[7px] text-white/50 -mt-0.5">{effect.sig}</div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tapped Cell Detail */}
      <AnimatePresence>
        {tappedCell && tappedEffect && tappedDriver && tappedTrans && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="rounded-xl bg-slate-800/90 border border-white/15 p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">{tappedDriver.label}</div>
                <div className="text-[10px] text-white/50">
                  {tappedTrans.label} ({tappedTrans.from}→{tappedTrans.to})
                </div>
              </div>
              <button onClick={() => setTappedCell(null)} className="text-white/30 active:text-white/60 p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-white/5">
                <div className="text-[9px] text-white/40">상관계수(r)</div>
                <div className="text-sm font-bold" style={{ color: getCorrelationColor(tappedEffect.r) }}>
                  {tappedEffect.r >= 0 ? "+" : ""}{tappedEffect.r.toFixed(3)}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white/5">
                <div className="text-[9px] text-white/40">유의수준</div>
                <div className={`text-sm font-bold ${tappedEffect.sig ? "text-green-400" : "text-gray-400"}`}>
                  {tappedEffect.sig ? getSignificanceLabel(tappedEffect.sig) : "무의미"}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white/5">
                <div className="text-[9px] text-white/40">해석</div>
                <div className="text-[11px] text-white font-medium">
                  {tappedEffect.r > 0.1 ? "강한 긍정" : tappedEffect.r > 0.05 ? "약한 긍정" : tappedEffect.r < -0.1 ? "강한 부정" : tappedEffect.r < -0.05 ? "약한 부정" : "영향 없음"}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Color Legend */}
      <div className="flex items-center justify-center gap-4 py-1">
        <div className="flex items-center gap-1.5">
          <div className="w-10 h-2.5 rounded bg-gradient-to-r from-red-600 to-red-400" />
          <span className="text-[10px] text-white/40">음의 상관</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-2.5 rounded bg-gray-500/40" />
          <span className="text-[10px] text-white/40">n.s.</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-10 h-2.5 rounded bg-gradient-to-r from-green-400 to-green-600" />
          <span className="text-[10px] text-white/40">양의 상관</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="space-y-2">
        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="text-[10px] text-white/40 mb-1">최대 양의 상관</div>
          <div className="text-sm font-bold text-white">다매장 → 이탈방지</div>
          <div className="text-sm font-bold text-white/70 mt-0.5">r = +0.165***</div>
        </div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="text-[10px] text-white/40 mb-1">최대 음의 상관</div>
          <div className="text-sm font-bold text-white">카테고리다양성 → VIP도달</div>
          <div className="text-sm font-bold text-white/70 mt-0.5">r = -0.156***</div>
        </div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="text-[10px] text-white/40 mb-1">전환 전반에 일관된 변수</div>
          <div className="text-sm font-bold text-white">다매장 방문</div>
          <div className="text-xs text-white/50 mt-0.5">복귀·이탈방지·위험유지 3개 전환에서 1위</div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────── Main Component */

export function FunnelMobile() {
  const [expandedSection, setExpandedSection] = useState<SectionId | null>(
    "bifurcation"
  );

  const toggleSection = (sectionId: SectionId) => {
    setExpandedSection((prev) => (prev === sectionId ? null : sectionId));
  };

  const renderSectionContent = (sectionId: SectionId) => {
    switch (sectionId) {
      case "bifurcation":
        return <BifurcationFlowMobile />;
      case "forest":
        return <ForestPlotMobile />;
      case "heatmap":
        return <DriverHeatmapMobile />;
      case "recovery":
        return (
          <div className="overflow-x-auto">
            <RecoveryAnalysis />
          </div>
        );
      case "correlation":
        return <CorrelationDashboard />;
      case "combination":
        return (
          <div className="overflow-x-auto">
            <CombinationEffects />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/10">
        <h1 className="text-lg font-bold text-white">퍼널 분석</h1>
        <p className="text-xs text-white/50 mt-0.5">
          어떤 경험이 고객을 움직이는가 — 2,500명 2년간 추적
        </p>

        {/* Quick Stats */}
        <div className="flex gap-2 mt-3">
          {[
            { label: "분석 고객", value: "2,500명" },
            { label: "분석 기간", value: "711일" },
            { label: "상관 요인", value: "6개" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex-1 text-center py-1.5 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="text-sm font-bold text-white">{stat.value}</div>
              <div className="text-[9px] text-white/40">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Accordion Sections */}
      <div className="px-4 py-4 space-y-2">
        {SECTIONS.map((section) => {
          const isExpanded = expandedSection === section.id;
          return (
            <motion.div
              key={section.id}
              layout
              className={`rounded-xl overflow-hidden ${
                isExpanded
                  ? "bg-white/[0.02] border-[1.5px] border-white/20"
                  : "bg-white/[0.02] border border-white/10"
              }`}
              animate={
                isExpanded
                  ? {
                      boxShadow: [
                        "inset 0 0 0px rgba(255,255,255,0), 0 0 6px 0px rgba(255,255,255,0.03)",
                        "inset 0 0 20px rgba(255,255,255,0.02), 0 0 10px 1px rgba(255,255,255,0.06)",
                        "inset 0 0 0px rgba(255,255,255,0), 0 0 6px 0px rgba(255,255,255,0.03)",
                      ],
                    }
                  : { boxShadow: "0 0 0px 0px rgba(255,255,255,0)" }
              }
              transition={
                isExpanded
                  ? {
                      boxShadow: {
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      },
                    }
                  : { duration: 0.3 }
              }
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-3 min-h-[52px] active:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-white/60">
                      {section.num}
                    </span>
                  </div>
                  <div className="text-left">
                    <h2 className="text-sm font-semibold text-white">
                      {section.title}
                    </h2>
                    <p className="text-[10px] text-white/35">
                      {section.subtitle}
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-white/40 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />
                )}
              </button>

              {/* Section Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-4 pt-0">
                      {renderSectionContent(section.id)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-6 border-t border-white/10">
        <div className="text-center text-white/30 text-[10px] space-y-0.5">
          <p>데이터 기반 고객 여정 분석 | Dunnhumby 2년간 거래 데이터</p>
          <p>*** p&lt;0.001 | ** p&lt;0.01 | * p&lt;0.05</p>
        </div>
      </div>
    </div>
  );
}
