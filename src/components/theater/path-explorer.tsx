"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  State,
  STATES,
  STATE_CONFIG,
  TIME_POINTS,
  TIME_LABELS,
  TimePoint,
} from "@/lib/data/constants";
import {
  analyzeCommonPaths,
  VIP_STATS,
  CHURN_STATS,
} from "@/lib/data/customers";

interface PathExplorerProps {
  selectedState: string | null;
}

type ViewMode = "vip" | "churn" | "compare";

export function PathExplorer({ selectedState }: PathExplorerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("compare");

  // Use pre-computed paths (instant - no computation)
  const vipPaths = useMemo(() => analyzeCommonPaths('vip'), []);
  const churnPaths = useMemo(() => analyzeCommonPaths('churn'), []);

  // Use pre-computed stats (instant)
  const vipStats = VIP_STATS;
  const churnStats = CHURN_STATS;

  const renderPath = (path: State[], highlight: "vip" | "churn") => {
    const baseColor = highlight === "vip" ? STATE_CONFIG[STATES.VIP].colorHex : STATE_CONFIG[STATES.CHURN].colorHex;

    return (
      <div className="flex items-center gap-1">
        {path.map((state, i) => (
          <div key={i} className="flex items-center">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center"
            >
              <span
                className="text-lg"
                style={{
                  filter:
                    state === (highlight === "vip" ? STATES.VIP : STATES.CHURN)
                      ? `drop-shadow(0 0 8px ${baseColor})`
                      : undefined,
                }}
              >
                {STATE_CONFIG[state].emoji}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {TIME_LABELS[TIME_POINTS[i]]}
              </span>
            </motion.div>
            {i < path.length - 1 && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 + 0.05 }}
                className="text-muted-foreground mx-0.5"
              >
                →
              </motion.span>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-full min-h-[550px] relative">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute top-4 left-4"
      >
        <h3 className="text-lg font-semibold text-white mb-1">경로 탐색 (Path Explorer)</h3>
        <p className="text-sm text-muted-foreground">
          VIP와 이탈 고객의 여정 비교
        </p>
      </motion.div>

      {/* View mode toggle */}
      <div className="absolute top-4 right-4 flex gap-2">
        <Button
          variant={viewMode === "compare" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("compare")}
          className="text-xs"
        >
          비교
        </Button>
        <Button
          variant={viewMode === "vip" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("vip")}
          className="text-xs"
        >
          👑 VIP
        </Button>
        <Button
          variant={viewMode === "churn" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("churn")}
          className="text-xs"
        >
          👻 이탈
        </Button>
      </div>

      <div className="pt-20 px-4 space-y-6">
        {/* Compare View */}
        <AnimatePresence mode="wait">
          {viewMode === "compare" && (
            <motion.div
              key="compare"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-2 gap-6"
            >
              {/* VIP Summary */}
              <Card className="p-4 bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">👑</span>
                  <div>
                    <h4 className="font-semibold text-yellow-400">VIP 경로</h4>
                    <p className="text-sm text-muted-foreground">
                      {vipStats.total}명 (2.8%)
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-black/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-2">핵심 발견</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>위험 경험 0회</span>
                        <span className="text-green-400 font-semibold">
                          {((vipStats.neverRisk / vipStats.total) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>이탈 경험 0회</span>
                        <span className="text-green-400 font-semibold">
                          {(
                            ((vipStats.total - vipStats.churnExperience) / vipStats.total) *
                            100
                          ).toFixed(0)}
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground mb-2">대표 경로</div>
                    {vipPaths.slice(0, 2).map((p, i) => (
                      <div
                        key={i}
                        className="bg-black/20 rounded-lg p-2 mb-2"
                      >
                        {renderPath(p.path, "vip")}
                        <div className="text-xs text-muted-foreground mt-1">
                          {p.count}명 ({p.percentage.toFixed(1)}%)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Churn Summary */}
              <Card className="p-4 bg-gradient-to-br from-gray-500/10 to-transparent border-gray-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">👻</span>
                  <div>
                    <h4 className="font-semibold text-gray-400">이탈 경로</h4>
                    <p className="text-sm text-muted-foreground">
                      {churnStats.total}명 (21.4%)
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-black/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-2">핵심 발견</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>위험 경험 있음</span>
                        <span className="text-red-400 font-semibold">
                          {churnStats.riskPct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>3개월 내 위험 신호</span>
                        <span className="text-orange-400 font-semibold">62%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground mb-2">대표 경로</div>
                    {churnPaths.slice(0, 2).map((p, i) => (
                      <div
                        key={i}
                        className="bg-black/20 rounded-lg p-2 mb-2"
                      >
                        {renderPath(p.path, "churn")}
                        <div className="text-xs text-muted-foreground mt-1">
                          {p.count}명 ({p.percentage.toFixed(1)}%)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* VIP Detail View */}
          {viewMode === "vip" && (
            <motion.div
              key="vip"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="p-6 bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/30">
                <h4 className="text-xl font-semibold text-yellow-400 mb-4">
                  👑 VIP 고객의 여정 분석
                </h4>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-black/30 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-yellow-400">{vipStats.total}</div>
                    <div className="text-sm text-muted-foreground">총 VIP 고객</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-400">
                      {((vipStats.neverRisk / vipStats.total) * 100).toFixed(0)}%
                    </div>
                    <div className="text-sm text-muted-foreground">위험 경험 없음</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-400">100%</div>
                    <div className="text-sm text-muted-foreground">충성 단계 경험</div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground mb-2">상위 5개 경로</div>
                <div className="space-y-3">
                  {vipPaths.slice(0, 5).map((p, i) => (
                    <div key={i} className="bg-black/20 rounded-lg p-3 flex items-center justify-between">
                      <div>{renderPath(p.path, "vip")}</div>
                      <div className="text-right">
                        <div className="font-semibold">{p.count}명</div>
                        <div className="text-xs text-muted-foreground">
                          {p.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Churn Detail View */}
          {viewMode === "churn" && (
            <motion.div
              key="churn"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="p-6 bg-gradient-to-br from-gray-500/10 to-transparent border-gray-500/30">
                <h4 className="text-xl font-semibold text-gray-400 mb-4">
                  👻 이탈 고객의 여정 분석
                </h4>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-black/30 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-gray-400">{churnStats.total}</div>
                    <div className="text-sm text-muted-foreground">총 이탈 고객</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-red-400">
                      {churnStats.riskPct.toFixed(0)}%
                    </div>
                    <div className="text-sm text-muted-foreground">위험 경험 있음</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-orange-400">62%</div>
                    <div className="text-sm text-muted-foreground">3개월 내 위험 신호</div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground mb-2">상위 5개 경로</div>
                <div className="space-y-3">
                  {churnPaths.slice(0, 5).map((p, i) => (
                    <div key={i} className="bg-black/20 rounded-lg p-3 flex items-center justify-between">
                      <div>{renderPath(p.path, "churn")}</div>
                      <div className="text-right">
                        <div className="font-semibold">{p.count}명</div>
                        <div className="text-xs text-muted-foreground">
                          {p.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Key Insight Box */}
        <Card className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h5 className="font-semibold text-white mb-1">핵심 인사이트</h5>
              <p className="text-sm text-muted-foreground">
                <strong className="text-yellow-400">VIP</strong>는 단 한 번도 위험 상태를 경험하지 않은
                고객입니다. 반면 <strong className="text-gray-400">이탈</strong> 고객의 62%는 3개월
                이내에 위험 신호를 보였습니다. <strong className="text-white">경로가 운명을 결정합니다.</strong>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
