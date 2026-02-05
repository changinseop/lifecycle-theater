"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { Play, Pause, RotateCcw, FastForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import racingDataV2 from "@/lib/data/racing-data-v2.json";

// 타입 정의
interface DailyDist {
  day: number;
  vip_candidate: number;
  loyal_candidate: number;
  active: number;
  risk: number;
  churn: number;
  waiting: number;
}

interface RacingDataV2 {
  metadata: {
    totalCustomers: number;
    maxDay: number;
    finalStageCounts: Record<string, number>;
  };
  dailyDistribution: DailyDist[];
}

const data = racingDataV2 as RacingDataV2;

// 물통 설정
const BUCKETS = [
  { id: "vip", label: "VIP", emoji: "👑", color: "#fbbf24", bgColor: "rgba(251, 191, 36, 0.2)" },
  { id: "loyal", label: "충성", emoji: "💚", color: "#22c55e", bgColor: "rgba(34, 197, 94, 0.2)" },
  { id: "active", label: "활성", emoji: "🏃", color: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.2)" },
  { id: "risk", label: "위험", emoji: "🐢", color: "#f97316", bgColor: "rgba(249, 115, 22, 0.2)" },
  { id: "churn", label: "이탈", emoji: "💀", color: "#6b7280", bgColor: "rgba(107, 114, 128, 0.2)" },
];

export function BucketView() {
  const [currentDay, setCurrentDay] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const maxDay = data.metadata.maxDay;
  const totalCustomers = data.metadata.totalCustomers;

  // 현재 일자의 분포 가져오기
  const getCurrentDistribution = useCallback(() => {
    const dist = data.dailyDistribution.find((d) => d.day === currentDay);
    if (dist) return dist;

    // 정확한 day가 없으면 가장 가까운 것
    const sorted = [...data.dailyDistribution].sort(
      (a, b) => Math.abs(a.day - currentDay) - Math.abs(b.day - currentDay)
    );
    return sorted[0];
  }, [currentDay]);

  const distribution = getCurrentDistribution();

  // 각 물통의 인원수
  const bucketCounts = {
    vip: distribution?.vip_candidate || 0,
    loyal: distribution?.loyal_candidate || 0,
    active: distribution?.active || 0,
    risk: distribution?.risk || 0,
    churn: distribution?.churn || 0,
  };

  // 최대값 (스케일링용)
  const maxCount = Math.max(...Object.values(bucketCounts), 1);

  // 애니메이션 루프
  useEffect(() => {
    if (!isPlaying) return;

    const animate = (timestamp: number) => {
      const interval = 50 / speed;

      if (timestamp - lastTimeRef.current > interval) {
        lastTimeRef.current = timestamp;
        setCurrentDay((prev) => {
          if (prev >= maxDay) {
            setIsPlaying(false);
            return maxDay;
          }
          return prev + 1;
        });
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, speed, maxDay]);

  return (
    <div className="w-full h-full min-h-[550px] flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">
            🪣 고객 물통 (Customer Buckets) - 2,500명
          </h3>
          <p className="text-sm text-muted-foreground">
            711일간 상태별 인원 변화 · 물이 차고 빠지는 흐름
          </p>
        </div>
      </div>

      {/* 컨트롤 */}
      <div className="flex items-center gap-4 mb-4 p-3 bg-white/5 rounded-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setCurrentDay(1);
            setIsPlaying(false);
          }}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        <Button
          variant={isPlaying ? "secondary" : "default"}
          size="sm"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSpeed((s) => (s >= 8 ? 1 : s * 2))}
        >
          <FastForward className="w-4 h-4 mr-1" />
          {speed}x
        </Button>

        {/* 슬라이더 */}
        <input
          type="range"
          min={1}
          max={maxDay}
          value={currentDay}
          onChange={(e) => setCurrentDay(Number(e.target.value))}
          className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
        />

        <span className="text-white font-mono w-28 text-right">
          Day {currentDay} / {maxDay}
        </span>
      </div>

      {/* 물통 시각화 */}
      <div className="flex-1 flex items-end justify-center gap-6 p-6 bg-black/40 rounded-lg">
        {BUCKETS.map((bucket) => {
          const count = bucketCounts[bucket.id as keyof typeof bucketCounts] || 0;
          const percentage = (count / totalCustomers) * 100;
          const heightPercent = (count / maxCount) * 100;

          return (
            <div key={bucket.id} className="flex flex-col items-center gap-2">
              {/* 인원수 */}
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="text-2xl font-bold" style={{ color: bucket.color }}>
                  {count.toLocaleString()}
                </div>
                <div className="text-xs text-white/60">
                  {percentage.toFixed(1)}%
                </div>
              </motion.div>

              {/* 물통 */}
              <div
                className="relative w-24 h-64 rounded-b-xl border-2 border-t-0 overflow-hidden"
                style={{
                  borderColor: bucket.color,
                  backgroundColor: "rgba(0,0,0,0.3)"
                }}
              >
                {/* 물 */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0 rounded-b-lg"
                  style={{ backgroundColor: bucket.color }}
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercent}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {/* 물결 효과 */}
                  <div
                    className="absolute top-0 left-0 right-0 h-2 opacity-50"
                    style={{
                      background: `linear-gradient(180deg, white 0%, transparent 100%)`
                    }}
                  />
                </motion.div>

                {/* 눈금 */}
                <div className="absolute inset-0 flex flex-col justify-between py-2 px-1">
                  {[100, 75, 50, 25, 0].map((mark) => (
                    <div key={mark} className="flex items-center gap-1">
                      <div className="w-2 h-px bg-white/20" />
                      <span className="text-[8px] text-white/30">{mark}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 라벨 */}
              <div className="text-center">
                <div className="text-xl">{bucket.emoji}</div>
                <div className="text-sm font-medium" style={{ color: bucket.color }}>
                  {bucket.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 흐름 설명 */}
      <div className="mt-4 p-3 rounded-lg bg-white/5">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-white/60">총 고객:</span>
            <span className="text-white font-bold">{totalCustomers.toLocaleString()}명</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/60">대기:</span>
            <span className="text-white">{distribution?.waiting || 0}명</span>
          </div>
        </div>

        {/* 단계별 설명 */}
        <div className="mt-3 text-sm">
          {currentDay <= 100 && (
            <span className="text-blue-300">
              💬 <strong>초반 (Day 1-100)</strong>: 고객들이 유입되기 시작합니다.
              대부분 활성 상태로 시작합니다.
            </span>
          )}
          {currentDay > 100 && currentDay <= 400 && (
            <span className="text-yellow-300">
              💬 <strong>분기점 (Day 100-400)</strong>: 위험과 이탈이 증가합니다.
              VIP/충성 후보도 형성됩니다.
            </span>
          )}
          {currentDay > 400 && currentDay < maxDay && (
            <span className="text-green-300">
              💬 <strong>후반 (Day 400+)</strong>: 패턴이 안정화됩니다.
              각 그룹의 크기가 수렴합니다.
            </span>
          )}
          {currentDay >= maxDay && (
            <span className="text-green-300">
              🏁 <strong>완료!</strong> 최종: VIP {bucketCounts.vip}명,
              충성 {bucketCounts.loyal}명, 활성 {bucketCounts.active}명,
              위험 {bucketCounts.risk}명, 이탈 {bucketCounts.churn}명
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
