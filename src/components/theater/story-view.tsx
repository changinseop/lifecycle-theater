"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
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

interface RacingDataV2 {
  metadata: {
    totalCustomers: number;
    maxDay: number;
    finalStageCounts: Record<string, number>;
  };
  customers: Customer[];
}

const data = racingDataV2 as RacingDataV2;

// 등급 설정
const STAGES = [
  { id: "vip", label: "VIP", emoji: "👑", color: "#fbbf24" },
  { id: "loyal", label: "충성", emoji: "💚", color: "#22c55e" },
  { id: "active", label: "활성", emoji: "🏃", color: "#3b82f6" },
  { id: "risk", label: "위험", emoji: "🐢", color: "#f97316" },
  { id: "churn", label: "이탈", emoji: "💀", color: "#6b7280" },
];

// 상태별 색상
const STATE_COLORS: Record<string, string> = {
  waiting: "#9ca3af",
  vip_candidate: "#fbbf24",
  loyal_candidate: "#22c55e",
  active: "#3b82f6",
  risk: "#f97316",
  churn: "#ef4444",
};

const STATE_LABELS: Record<string, string> = {
  waiting: "대기",
  vip_candidate: "VIP 후보",
  loyal_candidate: "충성 후보",
  active: "활성",
  risk: "위험",
  churn: "이탈",
};

// 각 등급에서 스토리가 풍부한 대표 고객 선정
function selectRepresentativeCustomers(customers: Customer[]): Record<string, Customer> {
  const representatives: Record<string, Customer> = {};

  STAGES.forEach((stage) => {
    const stageCustomers = customers.filter((c) => c.finalStage === stage.id);
    // 상태 변화가 많은 고객 선택 (스토리 풍부)
    const sorted = [...stageCustomers].sort(
      (a, b) => b.stateChanges.length - a.stateChanges.length
    );
    if (sorted.length > 0) {
      representatives[stage.id] = sorted[0];
    }
  });

  return representatives;
}

const REPRESENTATIVES = selectRepresentativeCustomers(data.customers);

export function StoryView() {
  const [selectedStage, setSelectedStage] = useState<string>("active");
  const maxDay = data.metadata.maxDay;

  const customer = REPRESENTATIVES[selectedStage];

  // 주요 이벤트 추출 (상태 변화 중 의미있는 것들)
  const keyEvents = useMemo(() => {
    if (!customer) return [];

    const events: { day: number; type: string; from?: string; to: string; description: string }[] = [];
    const changes = customer.stateChanges;

    for (let i = 0; i < changes.length; i++) {
      const current = changes[i];
      const prev = i > 0 ? changes[i - 1] : null;

      // 이탈 진입
      if (current.state === "churn" && prev?.state !== "churn") {
        events.push({
          day: current.day,
          type: "churn",
          from: prev?.state,
          to: current.state,
          description: "이탈 상태 진입 (25일+ 미방문)",
        });
      }
      // 회복 (이탈에서 활성으로)
      else if (prev?.state === "churn" && current.state !== "churn") {
        events.push({
          day: current.day,
          type: "recovery",
          from: prev.state,
          to: current.state,
          description: "회복! 다시 방문 시작",
        });
      }
      // 위험 진입
      else if (current.state === "risk" && prev?.state !== "risk" && prev?.state !== "churn") {
        events.push({
          day: current.day,
          type: "risk",
          from: prev?.state,
          to: current.state,
          description: "위험 상태 (8~24일 미방문)",
        });
      }
      // 첫 방문
      else if (prev?.state === "waiting" && current.state !== "waiting") {
        events.push({
          day: current.day,
          type: "first",
          from: prev.state,
          to: current.state,
          description: "첫 방문!",
        });
      }
    }

    return events;
  }, [customer]);

  // 이탈/회복 횟수 계산
  const stats = useMemo(() => {
    if (!customer) return { churnCount: 0, recoveryCount: 0 };

    let churnCount = 0;
    let recoveryCount = 0;
    const changes = customer.stateChanges;

    for (let i = 1; i < changes.length; i++) {
      if (changes[i].state === "churn" && changes[i - 1].state !== "churn") {
        churnCount++;
      }
      if (changes[i - 1].state === "churn" && changes[i].state !== "churn") {
        recoveryCount++;
      }
    }

    return { churnCount, recoveryCount };
  }, [customer]);

  if (!customer) {
    return <div className="text-white">고객 데이터가 없습니다.</div>;
  }

  return (
    <div className="w-full h-full min-h-[550px] flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">
            🎭 고객 여정 스토리 (Customer Journey)
          </h3>
          <p className="text-sm text-muted-foreground">
            711일간의 이탈과 회복 드라마 · 실제 고객 데이터 기반
          </p>
        </div>
      </div>

      {/* 등급 선택 */}
      <div className="flex gap-2 mb-4">
        {STAGES.map((stage) => {
          const rep = REPRESENTATIVES[stage.id];
          const isSelected = selectedStage === stage.id;

          return (
            <button
              key={stage.id}
              onClick={() => setSelectedStage(stage.id)}
              className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                isSelected
                  ? "border-white/50 bg-white/10"
                  : "border-transparent bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="text-xl">{stage.emoji}</div>
              <div className="text-sm font-medium" style={{ color: stage.color }}>
                {stage.label}
              </div>
              <div className="text-xs text-white/50">
                {rep?.totalVisits || 0}회 방문
              </div>
            </button>
          );
        })}
      </div>

      {/* 고객 정보 카드 */}
      <div className="p-4 rounded-lg bg-white/5 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              style={{ backgroundColor: STAGES.find((s) => s.id === selectedStage)?.color + "30" }}
            >
              {STAGES.find((s) => s.id === selectedStage)?.emoji}
            </div>
            <div>
              <div className="text-white font-bold">고객 #{customer.id}</div>
              <div className="text-sm text-white/60">
                최종 분류: {STAGES.find((s) => s.id === selectedStage)?.label}
              </div>
            </div>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-400">{customer.totalVisits}</div>
              <div className="text-xs text-white/60">총 방문</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{stats.churnCount}</div>
              <div className="text-xs text-white/60">이탈 횟수</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{stats.recoveryCount}</div>
              <div className="text-xs text-white/60">회복 횟수</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">{customer.stateChanges.length}</div>
              <div className="text-xs text-white/60">상태 변화</div>
            </div>
          </div>
        </div>
      </div>

      {/* 타임라인 */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto pr-2">
          {/* 방문 히트맵 */}
          <div className="mb-4">
            <div className="text-sm text-white/60 mb-2">방문 패턴 (711일)</div>
            <div className="h-8 rounded bg-black/30 relative overflow-hidden">
              {customer.visitDays.map((day) => (
                <div
                  key={day}
                  className="absolute top-0 bottom-0 w-px"
                  style={{
                    left: `${(day / maxDay) * 100}%`,
                    backgroundColor: STAGES.find((s) => s.id === selectedStage)?.color,
                    opacity: 0.7,
                  }}
                />
              ))}
              {/* 눈금 */}
              {[0, 100, 200, 300, 400, 500, 600, 700].map((day) => (
                <div
                  key={day}
                  className="absolute top-0 text-[8px] text-white/30"
                  style={{ left: `${(day / maxDay) * 100}%` }}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>

          {/* 상태 변화 타임라인 */}
          <div className="mb-4">
            <div className="text-sm text-white/60 mb-2">상태 변화 타임라인</div>
            <div className="h-6 rounded bg-black/30 relative overflow-hidden flex">
              {customer.stateChanges.map((change, idx) => {
                const nextChange = customer.stateChanges[idx + 1];
                const endDay = nextChange ? nextChange.day : maxDay;
                const width = ((endDay - change.day) / maxDay) * 100;

                return (
                  <div
                    key={idx}
                    className="h-full"
                    style={{
                      width: `${width}%`,
                      backgroundColor: STATE_COLORS[change.state] || "#666",
                      opacity: 0.8,
                    }}
                    title={`Day ${change.day}: ${STATE_LABELS[change.state]}`}
                  />
                );
              })}
            </div>
            {/* 범례 */}
            <div className="flex flex-wrap gap-3 mt-2">
              {Object.entries(STATE_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-1 text-xs">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: STATE_COLORS[key] }}
                  />
                  <span className="text-white/60">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 주요 이벤트 목록 */}
          <div>
            <div className="text-sm text-white/60 mb-2">
              주요 이벤트 ({keyEvents.length}개)
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {keyEvents.slice(0, 20).map((event, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-2 rounded-lg flex items-center gap-3 ${
                    event.type === "churn"
                      ? "bg-red-500/20"
                      : event.type === "recovery"
                      ? "bg-green-500/20"
                      : event.type === "risk"
                      ? "bg-orange-500/20"
                      : "bg-blue-500/20"
                  }`}
                >
                  <div className="text-lg">
                    {event.type === "churn"
                      ? "💀"
                      : event.type === "recovery"
                      ? "⚡"
                      : event.type === "risk"
                      ? "⚠️"
                      : "🎉"}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white font-medium">
                      Day {event.day}: {event.description}
                    </div>
                    <div className="text-xs text-white/50">
                      {event.from && STATE_LABELS[event.from]} → {STATE_LABELS[event.to]}
                    </div>
                  </div>
                </motion.div>
              ))}
              {keyEvents.length > 20 && (
                <div className="text-center text-white/40 text-sm py-2">
                  ... 외 {keyEvents.length - 20}개 이벤트
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 인사이트 */}
      <div className="mt-4 p-3 rounded-lg bg-white/5 text-sm">
        {selectedStage === "vip" && (
          <span className="text-yellow-300">
            💡 <strong>VIP 고객</strong>: 꾸준한 방문으로 이탈 없이 최고 등급 달성.
            총 {customer.totalVisits}회 방문으로 평균 {(711 / customer.totalVisits).toFixed(1)}일마다 방문.
          </span>
        )}
        {selectedStage === "loyal" && (
          <span className="text-green-300">
            💡 <strong>충성 고객</strong>: 이탈 경험 없이 꾸준히 방문.
            {stats.churnCount === 0 ? " 한 번도 이탈하지 않음!" : ` 이탈 ${stats.churnCount}회, 회복 ${stats.recoveryCount}회.`}
          </span>
        )}
        {selectedStage === "active" && (
          <span className="text-blue-300">
            💡 <strong>활성 고객</strong>: 이탈과 회복을 반복하며 현재 활성 상태.
            {stats.recoveryCount > 0 && ` ${stats.recoveryCount}번의 회복으로 다시 돌아옴!`}
          </span>
        )}
        {selectedStage === "risk" && (
          <span className="text-orange-300">
            💡 <strong>위험 고객</strong>: 최근 8~24일간 미방문. 조치가 필요한 상태.
            과거 {stats.recoveryCount}번 회복한 이력이 있어 재방문 가능성 있음.
          </span>
        )}
        {selectedStage === "churn" && (
          <span className="text-gray-300">
            💡 <strong>이탈 고객</strong>: 25일 이상 미방문으로 이탈 확정.
            {stats.recoveryCount > 0
              ? ` 과거 ${stats.recoveryCount}번 회복했으나 최종 이탈.`
              : " 회복 이력 없이 이탈."}
          </span>
        )}
      </div>
    </div>
  );
}
