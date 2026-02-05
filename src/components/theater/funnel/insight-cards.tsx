"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { KEY_INSIGHTS } from "@/lib/data/funnel-drivers";
import { ChevronRight, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";

export function InsightCards() {
  const [expandedCard, setExpandedCard] = useState<number | null>(0);

  const getIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-5 h-5" />;
      case "success":
        return <CheckCircle className="w-5 h-5" />;
      case "positive":
        return <TrendingUp className="w-5 h-5" />;
      case "negative":
        return <TrendingDown className="w-5 h-5" />;
      default:
        return <ChevronRight className="w-5 h-5" />;
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "warning":
        return {
          bg: "bg-orange-500/10",
          border: "border-orange-500/30",
          text: "text-orange-400",
          iconBg: "bg-orange-500/20",
        };
      case "success":
        return {
          bg: "bg-green-500/10",
          border: "border-green-500/30",
          text: "text-green-400",
          iconBg: "bg-green-500/20",
        };
      case "positive":
        return {
          bg: "bg-blue-500/10",
          border: "border-blue-500/30",
          text: "text-blue-400",
          iconBg: "bg-blue-500/20",
        };
      case "negative":
        return {
          bg: "bg-red-500/10",
          border: "border-red-500/30",
          text: "text-red-400",
          iconBg: "bg-red-500/20",
        };
      default:
        return {
          bg: "bg-purple-500/10",
          border: "border-purple-500/30",
          text: "text-purple-400",
          iconBg: "bg-purple-500/20",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white">Part 2~5 분석 결과 요약</h3>
        <p className="text-sm text-white/50">
          2,500명 고객 711일 추적 데이터 기반 (Point-biserial 상관, 보고서 기준)
        </p>
      </div>

      {/* Insight Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {KEY_INSIGHTS.map((insight, index) => {
          const styles = getTypeStyles(insight.type);
          const isExpanded = expandedCard === index;

          return (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-2xl overflow-hidden cursor-pointer transition-all ${styles.bg} border ${styles.border}`}
              onClick={() => setExpandedCard(isExpanded ? null : index)}
            >
              <div className="p-5">
                {/* Card Header */}
                <div className="flex items-start gap-4">
                  <motion.div
                    className={`p-3 rounded-xl ${styles.iconBg} ${styles.text}`}
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                  >
                    {getIcon(insight.type)}
                  </motion.div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-semibold">{insight.title}</h4>
                      {'part' in insight && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/50">
                          {insight.part}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/70 mt-1">{insight.summary}</p>
                  </div>
                </div>

                {/* Key Metric */}
                <motion.div
                  className="mt-4 p-3 rounded-xl bg-white/5 flex items-center justify-between"
                  initial={false}
                  animate={{ scale: isExpanded ? 1.02 : 1 }}
                >
                  <span className="text-sm text-white/60">주요 수치</span>
                  <span className={`text-xl font-bold ${styles.text}`}>
                    {insight.metric}
                  </span>
                </motion.div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-3">
                        {/* Detailed Description */}
                        <div className="p-3 rounded-xl bg-white/5">
                          <div className="text-xs text-white/50 mb-1">상세 설명</div>
                          <p className="text-sm text-white/80">{insight.detail}</p>
                        </div>

                        {/* Supporting Data */}
                        <div className="grid grid-cols-2 gap-2">
                          {insight.supportingData?.map((data, i) => (
                            <div
                              key={i}
                              className="p-2 rounded-lg bg-white/5 text-center"
                            >
                              <div className="text-lg font-bold text-white">
                                {data.value}
                              </div>
                              <div className="text-[10px] text-white/50">
                                {data.label}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Action Recommendation */}
                        <div className="p-3 rounded-xl bg-gradient-to-r from-white/10 to-white/5 border border-white/10">
                          <div className="text-xs text-white/50 mb-1">
                            권장 액션
                          </div>
                          <p className="text-sm text-white/90 font-medium">
                            {insight.action}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Expand hint */}
                <div className="mt-3 text-center">
                  <span className="text-xs text-white/30">
                    {isExpanded ? "접기" : "클릭하여 상세 보기"}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="p-6 rounded-2xl bg-white/5 border border-white/10"
      >
        <div>
          <h4 className="text-base font-semibold text-white">종합 요약</h4>
          <p className="text-sm text-white/60 mt-2">
            쿠폰 사용(r=0.150)과 다매장 방문(r=0.134~0.165)이 이탈 0회 유지, 복귀, 이탈 방지에서
            일관되게 양의 상관을 보인다. VIP 도달의 음의 상관은 등급 기준(방문 362회+)에서 비롯된 결과이다.
            이탈 횟수가 늘수록 복귀율이 감소하며, 4회부터 50% 미만이 된다.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { label: "쿠폰 ↔ 유지", value: "r=0.150", color: "text-white/80" },
            { label: "다매장 ↔ 이탈방지", value: "r=0.165", color: "text-white/80" },
            { label: "VIP 음의 상관", value: "통제 시 n.s.", color: "text-white/60" },
            { label: "복귀율 50% 미만", value: "이탈 4회~", color: "text-white/80" },
          ].map((stat, i) => (
            <div key={i} className="text-center p-3 rounded-xl bg-white/5">
              <div className={`text-base font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-white/50">{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
