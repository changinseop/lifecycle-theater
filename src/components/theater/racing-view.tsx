"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "motion/react";
import { Play, Pause, RotateCcw, FastForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import racingDataV2 from "@/lib/data/racing-data-v2.json";

// 타입 정의
interface StateChange {
  day: number;
  state: string;
}

interface Customer {
  id: number;
  visitDays: number[];
  stateChanges: StateChange[];
  finalStage: string;
  totalVisits: number;
}

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
  customers: Customer[];
  dailyDistribution: DailyDist[];
}

const data = racingDataV2 as RacingDataV2;

// 대표 고객 샘플링 (각 등급당 20명씩 = 총 100명)
// 해당 등급의 평균 방문 횟수에 가장 가까운 고객 20명 선정 (평균 근접 샘플링)
function sampleRepresentativeCustomers(customers: Customer[], perGroup: number = 20): Customer[] {
  const stages = ["vip", "loyal", "active", "risk", "churn"];
  const sampled: Customer[] = [];

  stages.forEach((stage) => {
    const stageCustomers = customers.filter((c) => c.finalStage === stage);
    if (stageCustomers.length === 0) return;

    // 평균 방문 횟수 계산
    const avgVisits = stageCustomers.reduce((sum, c) => sum + c.totalVisits, 0) / stageCustomers.length;

    // 평균에 가까운 순으로 정렬
    const sorted = [...stageCustomers].sort(
      (a, b) => Math.abs(a.totalVisits - avgVisits) - Math.abs(b.totalVisits - avgVisits)
    );

    // 평균에 가장 가까운 상위 N명 선택
    const count = Math.min(perGroup, sorted.length);
    for (let i = 0; i < count; i++) {
      sampled.push(sorted[i]);
    }
  });

  return sampled;
}

// 샘플링된 대표 고객 (컴포넌트 외부에서 한 번만 계산)
const SAMPLED_CUSTOMERS = sampleRepresentativeCustomers(data.customers, 20);

// 레인 설정 (weight = 인원수 비례 높이 가중치)
const LANES = [
  { id: "vip", label: "VIP", emoji: "👑", color: "#fbbf24", y: 0, weight: 1.0 },
  { id: "loyal", label: "충성", emoji: "💚", color: "#22c55e", y: 1, weight: 1.0 },
  { id: "active", label: "활성", emoji: "🏃", color: "#3b82f6", y: 2, weight: 1.0 },
  { id: "risk", label: "위험", emoji: "🐢", color: "#f97316", y: 3, weight: 1.0 },
  { id: "churn", label: "이탈", emoji: "💀", color: "#6b7280", y: 4, weight: 1.0 },
];

// 상태를 레인으로 매핑
function stateToLane(state: string, finalStage: string, isLastDay: boolean): number {
  if (isLastDay) {
    // Day 711: 최종 분류 사용
    const idx = LANES.findIndex((l) => l.id === finalStage);
    return idx >= 0 ? idx : 2;
  }

  // 진행 중: 동적 상태
  switch (state) {
    case "vip_candidate":
      return 0; // VIP 레인
    case "loyal_candidate":
      return 1; // 충성 레인
    case "active":
      return 2; // 활성 레인
    case "risk":
      return 3; // 위험 레인
    case "churn":
      return 4; // 이탈 레인
    case "waiting":
      return 2; // 대기 → 활성 레인
    default:
      return 2;
  }
}

// 고객의 특정 day 상태 가져오기
function getCustomerStateAtDay(customer: Customer, day: number): string {
  let currentState = "waiting";
  for (const change of customer.stateChanges) {
    if (change.day <= day) {
      currentState = change.state;
    } else {
      break;
    }
  }
  return currentState;
}

// 고객의 특정 day까지의 마지막 방문일 가져오기
function getLastVisitDay(customer: Customer, day: number): number {
  const visitsUntilDay = customer.visitDays.filter((d) => d <= day);
  if (visitsUntilDay.length === 0) return 0;
  return Math.max(...visitsUntilDay);
}

export function RacingView() {
  const [currentDay, setCurrentDay] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const maxDay = data.metadata.maxDay;
  const isLastDay = currentDay >= maxDay;

  // 현재 일자의 분포 가져오기
  const currentDistribution = useMemo(() => {
    const dist = data.dailyDistribution.find((d) => d.day === currentDay);
    if (dist) return dist;

    // 정확한 day가 없으면 가장 가까운 것
    const sorted = [...data.dailyDistribution].sort(
      (a, b) => Math.abs(a.day - currentDay) - Math.abs(b.day - currentDay)
    );
    return sorted[0];
  }, [currentDay]);

  // 레인별 카운트 계산
  const laneCounts = useMemo(() => {
    if (isLastDay) {
      return data.metadata.finalStageCounts;
    }
    return {
      vip: currentDistribution?.vip_candidate || 0,
      loyal: currentDistribution?.loyal_candidate || 0,
      active: currentDistribution?.active || 0,
      risk: currentDistribution?.risk || 0,
      churn: currentDistribution?.churn || 0,
    };
  }, [currentDistribution, isLastDay]);

  // Canvas 렌더링
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const totalWeight = LANES.reduce((sum, l) => sum + l.weight, 0);
    const availableHeight = height - 60;

    // 배경
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, width, height);

    // 레인별 Y 위치 및 높이 계산 (weight 기반)
    const lanePositions: { y: number; height: number }[] = [];
    let currentY = 30;
    LANES.forEach((lane) => {
      const laneHeight = (lane.weight / totalWeight) * availableHeight;
      lanePositions.push({ y: currentY, height: laneHeight });
      currentY += laneHeight;
    });

    // 레인 배경
    LANES.forEach((lane, idx) => {
      const pos = lanePositions[idx];
      ctx.fillStyle = `${lane.color}10`;
      ctx.fillRect(0, pos.y, width, pos.height);

      // 레인 구분선
      ctx.strokeStyle = `${lane.color}30`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, pos.y + pos.height);
      ctx.lineTo(width, pos.y + pos.height);
      ctx.stroke();

      // 레인 라벨
      ctx.fillStyle = lane.color;
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`${lane.emoji} ${lane.label}`, 10, pos.y + pos.height / 2 + 5);
    });

    // X축 (Day 타임라인)
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;

    // 현재 Day 위치 표시
    const dayX = 80 + ((currentDay - 1) / (maxDay - 1)) * (width - 100);
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(dayX, 30);
    ctx.lineTo(dayX, height - 30);
    ctx.stroke();

    // Day 마커
    for (let d = 1; d <= maxDay; d += 100) {
      const x = 80 + ((d - 1) / (maxDay - 1)) * (width - 100);
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${d}`, x, height - 10);
    }

    // 대표 고객 100명의 누적 방문 이력 표시
    // Y = 최종 등급 고정, X = 방문일

    // finalStage를 레인 인덱스로 매핑
    const stageToLaneIdx: Record<string, number> = {
      vip: 0,
      loyal: 1,
      active: 2,
      risk: 3,
      churn: 4,
    };

    // 각 등급별 고객 인덱스 (Y 분산용)
    const customerIndexInLane: Record<string, number> = {};
    const laneCounters: Record<string, number> = { vip: 0, loyal: 0, active: 0, risk: 0, churn: 0 };

    SAMPLED_CUSTOMERS.forEach((customer) => {
      const stage = customer.finalStage;
      customerIndexInLane[customer.id] = laneCounters[stage];
      laneCounters[stage]++;
    });

    // 현재 day에 방문한 점들 (나중에 강조해서 그리기 위해 수집)
    const currentDayVisits: { x: number; y: number; color: string }[] = [];
    const recentVisits: { x: number; y: number; color: string; age: number }[] = [];

    SAMPLED_CUSTOMERS.forEach((customer) => {
      // currentDay까지의 방문일만 필터 (누적!)
      const visitsUntilNow = customer.visitDays.filter((d) => d <= currentDay);

      const laneIdx = stageToLaneIdx[customer.finalStage] ?? 2;
      const lane = LANES[laneIdx];
      const pos = lanePositions[laneIdx];

      // 레인 내 고객별 고정 Y 위치 (인덱스 기반)
      const customerIdx = customerIndexInLane[customer.id] ?? 0;
      const totalInLane = laneCounters[customer.finalStage] || 1;
      const ySpread = pos.height * 0.85;
      const yOffset = ((customerIdx / (totalInLane - 1 || 1)) - 0.5) * ySpread;
      const y = pos.y + pos.height / 2 + yOffset;

      // 각 방문일에 점 찍기
      visitsUntilNow.forEach((visitDay) => {
        const x = 80 + ((visitDay - 1) / (maxDay - 1)) * (width - 100);
        const age = currentDay - visitDay;

        if (age === 0) {
          // 현재 day 방문 - 나중에 강조
          currentDayVisits.push({ x, y, color: lane.color });
        } else if (age <= 10) {
          // 최근 10일 내 방문 - 강조
          recentVisits.push({ x, y, color: lane.color, age });
        } else {
          // 지나간 점 - 잘 보이게 유지
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fillStyle = lane.color;
          ctx.globalAlpha = 0.85;
          ctx.fill();
        }
      });
    });

    // 최근 방문 점 그리기 (age에 따라 크기 변화, 투명도는 유지)
    recentVisits.forEach(({ x, y, color, age }) => {
      const sizeFactor = 1 - (age / 15);
      const radius = 3 + sizeFactor * 3; // 3~6

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.9;
      ctx.fill();
    });

    // 현재 day 방문 점 강조 (글로우 + 큰 크기 + 펄스)
    const pulsePhase = (Date.now() % 500) / 500; // 0~1 사이 값
    const pulseScale = 1 + Math.sin(pulsePhase * Math.PI * 2) * 0.3;

    currentDayVisits.forEach(({ x, y, color }) => {
      // 글로우 효과 (여러 겹의 원)
      ctx.globalAlpha = 0.15;
      ctx.beginPath();
      ctx.arc(x, y, 18 * pulseScale, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(x, y, 12 * pulseScale, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // 메인 점
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // 하이라이트 (흰색 중심)
      ctx.beginPath();
      ctx.arc(x - 1, y - 1, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = 0.8;
      ctx.fill();
    });

    ctx.globalAlpha = 1.0;

    // Day 표시
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`Day ${currentDay}`, width - 20, 30);

    // 최종 Day 표시
    if (isLastDay) {
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("🏁 FINISH!", width - 20, 55);
    }
  }, [currentDay, isLastDay, maxDay]);

  // 애니메이션 루프 (시간 기반, 부드러운 재생)
  const accumulatedTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying) return;

    accumulatedTimeRef.current = 0;
    lastTimeRef.current = 0;

    const animate = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }

      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // 속도에 따라 시간 누적 (speed 배수만큼 빠르게)
      accumulatedTimeRef.current += deltaTime * speed;

      const baseDayDuration = 30; // 1x에서 1일당 30ms

      // 누적된 시간만큼 day 증가 (부드럽게)
      while (accumulatedTimeRef.current >= baseDayDuration) {
        accumulatedTimeRef.current -= baseDayDuration;
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

  // Canvas 크기 조정
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      renderCanvas();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [renderCanvas]);

  // 렌더 루프 (펄스 애니메이션을 위해 지속적으로 렌더링)
  const renderLoopRef = useRef<number | null>(null);

  useEffect(() => {
    const renderLoop = () => {
      renderCanvas();
      renderLoopRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoopRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (renderLoopRef.current) {
        cancelAnimationFrame(renderLoopRef.current);
      }
    };
  }, [renderCanvas]);

  return (
    <div className="w-full h-full min-h-[400px] md:min-h-[700px] flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">
            🏁 고객 방문 패턴 (등급별 평균 근접 100명)
          </h3>
          <p className="text-sm text-muted-foreground">
            711일간 실제 방문 이력 · 각 등급 평균 방문 횟수에 가장 가까운 20명
          </p>
        </div>
      </div>

      {/* 컨트롤 */}
      <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-4 p-2 md:p-3 bg-white/5 rounded-lg">
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

        <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1 border border-white/20">
          {[1, 4, 8, 16].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 md:px-4 py-1 md:py-1.5 rounded-md text-xs md:text-sm font-bold transition-all ${
                speed === s
                  ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/30"
                  : "bg-transparent text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* 슬라이더 */}
        <input
          type="range"
          min={1}
          max={maxDay}
          value={currentDay}
          onChange={(e) => setCurrentDay(Number(e.target.value))}
          className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
        />

        <span className="text-white font-mono text-xs md:text-base w-20 md:w-28 text-right">
          Day {currentDay}/{maxDay}
        </span>
      </div>

      {/* 레인별 카운트 */}
      <div className="grid grid-cols-5 gap-1 md:flex md:gap-2 mb-4">
        {LANES.map((lane) => {
          const count = laneCounts[lane.id as keyof typeof laneCounts] || 0;
          return (
            <motion.div
              key={lane.id}
              className="flex-1 p-2 rounded-lg text-center"
              style={{ backgroundColor: `${lane.color}20` }}
              animate={{
                scale: count > 0 ? 1 : 0.95,
                opacity: count > 0 ? 1 : 0.5,
              }}
            >
              <div className="text-sm md:text-lg">{lane.emoji}</div>
              <motion.div
                key={count}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-base md:text-xl font-bold"
                style={{ color: lane.color }}
              >
                {count.toLocaleString()}
              </motion.div>
              <div className="text-[10px] md:text-xs text-white/60 truncate">{lane.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* 캔버스 */}
      <div className="flex-1 relative bg-black/40 rounded-lg overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* 스테이지 해설 */}
      <div className="mt-4 p-3 rounded-lg text-sm" style={{
        backgroundColor: currentDay <= 100 ? "rgba(59, 130, 246, 0.2)" :
                        currentDay <= 400 ? "rgba(251, 191, 36, 0.2)" :
                        "rgba(34, 197, 94, 0.2)"
      }}>
        {currentDay <= 100 && (
          <span className="text-blue-300">
            💬 <strong>초반 (Day 1-100)</strong>: 첫 이탈이 발생하기 시작합니다.
            대부분은 아직 활성 상태입니다.
          </span>
        )}
        {currentDay > 100 && currentDay <= 400 && (
          <span className="text-yellow-300">
            💬 <strong>분기점 (Day 100-400)</strong>: 고객들이 본격적으로 갈립니다.
            이탈했다가 회복하는 패턴이 나타납니다.
          </span>
        )}
        {currentDay > 400 && currentDay < maxDay && (
          <span className="text-green-300">
            💬 <strong>후반 (Day 400+)</strong>: 패턴이 안정화됩니다.
            VIP 후보들은 꾸준히 상위 레인에 머뭅니다.
          </span>
        )}
        {currentDay >= maxDay && (
          <span className="text-green-300">
            🏁 <strong>완료!</strong> 최종 결과: VIP {laneCounts.vip}명,
            충성 {laneCounts.loyal}명, 활성 {laneCounts.active}명,
            위험 {laneCounts.risk}명, 이탈 {laneCounts.churn}명
          </span>
        )}
      </div>
    </div>
  );
}
