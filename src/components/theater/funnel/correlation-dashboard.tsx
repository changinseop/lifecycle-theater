"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CHURN_CORRELATIONS } from "@/lib/data/funnel-drivers";
import { ArrowUp, ArrowDown, Info } from "lucide-react";

export function CorrelationDashboard() {
  const [selectedFactor, setSelectedFactor] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"correlation" | "impact">("impact");

  const sortedCorrelations = [...CHURN_CORRELATIONS].sort((a, b) => {
    if (sortBy === "correlation") {
      return Math.abs(b.correlation) - Math.abs(a.correlation);
    }
    return (
      Math.abs(b.churnRateWith - b.churnRateWithout) -
      Math.abs(a.churnRateWith - a.churnRateWithout)
    );
  });

  const maxCorrelation = Math.max(
    ...CHURN_CORRELATIONS.map((c) => Math.abs(c.correlation))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-blue-400">CORR</span>
          <div>
            <h3 className="text-lg font-semibold text-white">
              변수별 이탈 상관관계
            </h3>
            <p className="text-sm text-white/50">
              각 요인이 이탈에 미치는 상관계수와 실제 이탈율 비교
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy("correlation")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              sortBy === "correlation"
                ? "bg-white/20 text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            상관계수순
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

      {/* Correlation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedCorrelations.map((item, index) => {
          const isSelected = selectedFactor === item.factor;
          const barWidth = (Math.abs(item.correlation) / maxCorrelation) * 100;

          return (
            <motion.div
              key={item.factor}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? "bg-white/15 border-white/40 scale-105"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
              onClick={() => setSelectedFactor(isSelected ? null : item.factor)}
            >
              {/* Factor Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    {item.label}
                  </span>
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                    item.direction === "increase"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-green-500/20 text-green-400"
                  }`}
                >
                  {item.direction === "increase" ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : (
                    <ArrowDown className="w-3 h-3" />
                  )}
                  {item.direction === "increase" ? "이탈 증가" : "이탈 감소"}
                </div>
              </div>

              {/* Correlation Bar */}
              <div className="relative h-6 bg-slate-800 rounded-lg overflow-hidden mb-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ delay: index * 0.05 + 0.3, duration: 0.5 }}
                  className={`absolute h-full rounded-lg ${
                    item.direction === "increase"
                      ? "bg-gradient-to-r from-red-600 to-red-400"
                      : "bg-gradient-to-r from-green-600 to-green-400"
                  }`}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    r = {item.correlation > 0 ? "+" : ""}
                    {item.correlation.toFixed(2)} {item.significance}
                  </span>
                </div>
              </div>

              {/* Churn Rate Comparison */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 rounded-lg bg-white/5">
                  <div className="text-lg font-bold text-white">
                    {item.churnRateWith.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-white/50">해당 시 이탈율</div>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <div className="text-lg font-bold text-white/60">
                    {item.churnRateWithout.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-white/50">미해당 시 이탈율</div>
                </div>
              </div>

              {/* Difference Indicator */}
              <div className="mt-3 text-center">
                <span
                  className={`text-sm font-bold ${
                    item.churnRateWith > item.churnRateWithout
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
                >
                  {item.churnRateWith > item.churnRateWithout ? "+" : ""}
                  {(item.churnRateWith - item.churnRateWithout).toFixed(1)}%p 차이
                </span>
              </div>

              {/* Expanded Detail */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 pt-4 border-t border-white/10"
                >
                  <div className="p-3 rounded-lg bg-white/5">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-white/70">
                        {item.factor === "small_store_only" &&
                          "소형매장만 이용하는 고객은 대형매장 경험 고객 대비 이탈율이 15.5%p 높음. 다양한 상품 경험 기회가 적기 때문."}
                        {item.factor === "no_coupon" &&
                          "쿠폰을 한 번도 사용하지 않은 고객은 혜택에 대한 인지가 낮아 이탈 확률 상승."}
                        {item.factor === "single_store" &&
                          "한 매장만 방문하는 고객은 접근성 문제 발생 시 대안이 없어 이탈 가능성 높음."}
                        {item.factor === "high_discount_sensitivity" &&
                          "할인에만 반응하는 고객은 정상가 구매 시 불만족으로 이탈 위험."}
                        {item.factor === "weekday_only" &&
                          "평일만 방문하는 고객은 주말 대안 발견 시 이탈 가능성 있음."}
                        {item.factor === "coupon_user" &&
                          "쿠폰 사용 고객은 브랜드 혜택을 인지하고 만족도가 높아 이탈률 현저히 낮음."}
                        {item.factor === "multi_store" &&
                          "여러 매장 방문 고객은 유연성이 높고 브랜드 충성도가 강함."}
                        {item.factor === "large_store_visit" &&
                          "대형매장 경험은 상품 다양성과 쇼핑 만족도를 높여 이탈 방지."}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Summary Interpretation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="p-5 rounded-2xl bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-white/10"
      >
        <div className="flex items-start gap-4">
          <div className="text-sm font-bold text-white/60">REF</div>
          <div>
            <h4 className="text-white font-semibold mb-2">상관관계 해석 가이드</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-white/5">
                <div className="text-white/50 text-xs mb-1">r = 0.20~0.29</div>
                <div className="text-white font-medium">약한 상관</div>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <div className="text-white/50 text-xs mb-1">r = 0.30~0.49</div>
                <div className="text-white font-medium">중간 상관</div>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <div className="text-white/50 text-xs mb-1">r = 0.50~0.69</div>
                <div className="text-white font-medium">강한 상관</div>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <div className="text-white/50 text-xs mb-1">r ≥ 0.70</div>
                <div className="text-white font-medium">매우 강한 상관</div>
              </div>
            </div>
            <p className="text-white/60 text-sm mt-4">
              *** p&lt;0.001 은 1000번 중 999번 이상 이 결과가 우연이 아님을
              의미합니다.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Key Takeaway */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1 }}
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <ArrowUp className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-semibold">이탈 증가 요인 TOP 3</span>
          </div>
          <ol className="space-y-2 text-sm text-white/80">
            <li>1. 소형매장만 방문 (r=+0.23)</li>
            <li>2. 쿠폰 미사용 (r=+0.19)</li>
            <li>3. 단일매장만 방문 (r=+0.17)</li>
          </ol>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.1 }}
          className="p-4 rounded-xl bg-green-500/10 border border-green-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <ArrowDown className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-semibold">이탈 감소 요인 TOP 3</span>
          </div>
          <ol className="space-y-2 text-sm text-white/80">
            <li>1. 쿠폰 사용 (r=-0.21)</li>
            <li>2. 다매장 방문 (r=-0.18)</li>
            <li>3. 대형매장 경험 (r=-0.15)</li>
          </ol>
        </motion.div>
      </div>
    </div>
  );
}
