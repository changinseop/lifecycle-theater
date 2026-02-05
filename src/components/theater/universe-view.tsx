"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  State,
  STATES,
  STATE_CONFIG,
  TimePoint,
  TIME_LABELS,
} from "@/lib/data/constants";
import { getStateDistribution, STATE_DISTRIBUTIONS } from "@/lib/data/customers";

interface UniverseViewProps {
  onStateSelect: (state: string | null) => void;
}

// Stage positions - Journey flow from left to right
const STAGE_LAYOUT: Record<State, { x: number; y: number; lane: 'top' | 'middle' | 'bottom' }> = {
  [STATES.NEW]: { x: 5, y: 50, lane: 'middle' },
  [STATES.LOYAL]: { x: 28, y: 25, lane: 'top' },
  [STATES.VIP]: { x: 50, y: 15, lane: 'top' },
  [STATES.ACTIVE]: { x: 50, y: 50, lane: 'middle' },
  [STATES.RISK]: { x: 72, y: 75, lane: 'bottom' },
  [STATES.CHURN]: { x: 95, y: 85, lane: 'bottom' },
};

// Flow connections (from -> to with type)
const FLOW_CONNECTIONS: { from: State; to: State; type: 'normal' | 'recovery' | 'churn' }[] = [
  // Growth paths
  { from: STATES.NEW, to: STATES.LOYAL, type: 'normal' },
  { from: STATES.LOYAL, to: STATES.VIP, type: 'normal' },
  { from: STATES.LOYAL, to: STATES.ACTIVE, type: 'normal' },
  // Decline paths
  { from: STATES.ACTIVE, to: STATES.RISK, type: 'churn' },
  { from: STATES.LOYAL, to: STATES.RISK, type: 'churn' },
  { from: STATES.RISK, to: STATES.CHURN, type: 'churn' },
  // Recovery paths
  { from: STATES.RISK, to: STATES.ACTIVE, type: 'recovery' },
  { from: STATES.ACTIVE, to: STATES.LOYAL, type: 'recovery' },
];

// Particle type for animated dots
interface Particle {
  id: number;
  fromState: State;
  toState: State;
  progress: number;
  type: 'normal' | 'recovery' | 'churn';
}

const TIME_POINTS: TimePoint[] = [0, 1, 3, 6, 12, 18, 24];

export function UniverseView({ onStateSelect }: UniverseViewProps) {
  const [currentTime, setCurrentTime] = useState<TimePoint>(24);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [hoveredState, setHoveredState] = useState<State | null>(null);

  const distribution = useMemo(
    () => getStateDistribution(currentTime),
    [currentTime]
  );

  const total = Object.values(distribution).reduce((a, b) => a + b, 0);

  // Generate flowing particles for transitions
  useEffect(() => {
    if (currentTime === 0) {
      setParticles([]);
      return;
    }

    // Create particles based on transition probabilities
    const newParticles: Particle[] = [];
    let particleId = 0;

    FLOW_CONNECTIONS.forEach(({ from, to, type }) => {
      const fromCount = distribution[from] || 0;
      if (fromCount === 0) return;

      // Particle count based on state size and type
      let count = Math.min(8, Math.ceil(fromCount / 150));
      if (type === 'recovery') count = Math.max(2, Math.ceil(count * 0.6));
      if (type === 'churn' && to === STATES.CHURN) count = Math.max(3, count);

      for (let i = 0; i < count; i++) {
        newParticles.push({
          id: particleId++,
          fromState: from,
          toState: to,
          progress: Math.random(),
          type,
        });
      }
    });

    setParticles(newParticles);
  }, [currentTime, distribution]);

  // Animate particles
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev =>
        prev.map(p => ({
          ...p,
          progress: (p.progress + 0.008) % 1,
        }))
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Calculate particle position along path
  const getParticlePosition = (particle: Particle) => {
    const from = STAGE_LAYOUT[particle.fromState];
    const to = STAGE_LAYOUT[particle.toState];
    const t = particle.progress;

    // Curved path using quadratic bezier
    const controlOffset = particle.type === 'recovery' ? -15 :
                         particle.type === 'churn' ? 10 : 5;
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2 + controlOffset;

    // Quadratic bezier interpolation
    const x = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * midX + t * t * to.x;
    const y = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * midY + t * t * to.y;

    return { x, y };
  };

  // Get states to display
  const activeStates = (Object.keys(STAGE_LAYOUT) as State[]).filter(
    state => distribution[state] > 0
  );

  return (
    <div className="w-full h-full min-h-[500px] relative overflow-hidden">
      {/* Header with Timeline */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">
            고객 여정 우주 (Customer Journey Universe)
          </h3>
          <p className="text-sm text-muted-foreground">
            {TIME_LABELS[currentTime]} · 원 크기 = 고객 수 · 점 = 상태 전환 흐름
          </p>
        </div>

        {/* Timeline Buttons */}
        <div className="flex gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
          {TIME_POINTS.map((time) => (
            <button
              key={time}
              onClick={() => setCurrentTime(time)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                currentTime === time
                  ? "bg-white/20 text-white"
                  : "text-white/50 hover:text-white/80 hover:bg-white/10"
              }`}
            >
              {time === 0 ? "시작" : `${time}개월`}
            </button>
          ))}
        </div>
      </div>

      {/* Journey lanes guide */}
      <div className="absolute left-2 top-20 bottom-20 flex flex-col justify-between text-[10px] text-white/20 z-10">
        <span>👑 VIP Zone</span>
        <span>🎯 Active Zone</span>
        <span>⚠️ Risk Zone</span>
      </div>

      {/* Main visualization area */}
      <div className="absolute inset-0 pt-16 pb-16">
        {/* SVG for connections and particles */}
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
          <defs>
            {/* Gradients for flow lines */}
            <linearGradient id="flowNormal" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
            </linearGradient>
            <linearGradient id="flowRecovery" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="rgba(34,197,94,0.5)" />
              <stop offset="100%" stopColor="rgba(34,197,94,0.2)" />
            </linearGradient>
            <linearGradient id="flowChurn" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(239,68,68,0.3)" />
              <stop offset="100%" stopColor="rgba(107,114,128,0.3)" />
            </linearGradient>
            {/* Glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Flow connection paths */}
          {FLOW_CONNECTIONS.map(({ from, to, type }, i) => {
            const fromPos = STAGE_LAYOUT[from];
            const toPos = STAGE_LAYOUT[to];
            const fromCount = distribution[from] || 0;
            const toCount = distribution[to] || 0;

            if (fromCount === 0 && toCount === 0) return null;

            const controlOffset = type === 'recovery' ? -15 : type === 'churn' ? 10 : 5;
            const midX = (fromPos.x + toPos.x) / 2;
            const midY = (fromPos.y + toPos.y) / 2 + controlOffset;

            const strokeColor = type === 'recovery' ? 'url(#flowRecovery)' :
                               type === 'churn' ? 'url(#flowChurn)' : 'url(#flowNormal)';

            return (
              <motion.path
                key={`flow-${from}-${to}`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ duration: 1, delay: i * 0.1 }}
                d={`M ${fromPos.x}% ${fromPos.y}% Q ${midX}% ${midY}% ${toPos.x}% ${toPos.y}%`}
                fill="none"
                stroke={strokeColor}
                strokeWidth={type === 'recovery' ? 2 : 1.5}
                strokeDasharray={type === 'recovery' ? "6,4" : undefined}
              />
            );
          })}

          {/* Animated particles */}
          {particles.map((particle) => {
            const pos = getParticlePosition(particle);
            const color = particle.type === 'recovery' ? '#22c55e' :
                         particle.type === 'churn' ? '#ef4444' : '#ffffff';
            const size = particle.type === 'recovery' ? 4 : 3;

            return (
              <motion.circle
                key={`particle-${particle.id}`}
                cx={`${pos.x}%`}
                cy={`${pos.y}%`}
                r={size}
                fill={color}
                opacity={0.8}
                filter="url(#glow)"
              />
            );
          })}
        </svg>

        {/* State nodes */}
        <AnimatePresence mode="popLayout">
          {activeStates.map((state) => {
            const config = STATE_CONFIG[state];
            const count = distribution[state];
            const percentage = ((count / total) * 100).toFixed(1);
            const position = STAGE_LAYOUT[state];

            // Size based on count (sqrt scale)
            const baseSize = Math.max(70, Math.min(160, 50 + Math.sqrt(count) * 4));
            const isHovered = hoveredState === state;
            const size = isHovered ? baseSize * 1.15 : baseSize;

            return (
              <motion.div
                key={state}
                layout
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", duration: 0.6, delay: 0.1 }}
                className="absolute cursor-pointer z-10"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
                onMouseEnter={() => setHoveredState(state)}
                onMouseLeave={() => setHoveredState(null)}
                onClick={() => onStateSelect(state)}
              >
                {/* Outer glow ring */}
                <motion.div
                  className="absolute rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.1, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{
                    width: size * 1.4,
                    height: size * 1.4,
                    backgroundColor: config.colorHex,
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    filter: "blur(20px)",
                  }}
                />

                {/* Main node */}
                <motion.div
                  className="relative rounded-full flex flex-col items-center justify-center shadow-2xl"
                  animate={{ scale: isHovered ? 1.05 : 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  style={{
                    width: size,
                    height: size,
                    background: `radial-gradient(circle at 30% 30%, ${config.colorHex}60, ${config.colorHex}15)`,
                    border: `3px solid ${config.colorHex}`,
                    boxShadow: `0 0 30px ${config.colorHex}50, inset 0 0 30px ${config.colorHex}20`,
                  }}
                >
                  <motion.span
                    className="text-3xl"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {config.emoji}
                  </motion.span>
                  <span className="text-xs font-bold text-white/90 mt-1">
                    {config.labelKo}
                  </span>
                  <motion.span
                    key={count}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="text-lg font-black"
                    style={{ color: config.colorHex }}
                  >
                    {count.toLocaleString()}
                  </motion.span>
                  <span className="text-[10px] text-white/50">{percentage}%</span>
                </motion.div>

                {/* State label below */}
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
                  >
                    <span className="text-[10px] text-white/70 bg-black/50 px-2 py-0.5 rounded">
                      클릭하여 상세보기
                    </span>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center px-4 py-2 bg-black/40 rounded-lg">
        <div className="flex gap-3">
          {(Object.entries(STATE_CONFIG) as [State, typeof STATE_CONFIG[State]][]).map(([state, config]) => (
            <div
              key={state}
              className={`flex items-center gap-1.5 text-xs cursor-pointer transition-opacity ${
                hoveredState && hoveredState !== state ? 'opacity-40' : 'opacity-100'
              }`}
              onMouseEnter={() => setHoveredState(state)}
              onMouseLeave={() => setHoveredState(null)}
              onClick={() => onStateSelect(state)}
            >
              <span>{config.emoji}</span>
              <span className="text-white/70">{config.labelKo}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 text-[10px]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-white/60" />
            <span className="text-white/50">일반 전환</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-green-400/80">회복 (Recovery)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <span className="text-red-400/70">이탈 경로</span>
          </div>
        </div>
      </div>
    </div>
  );
}
