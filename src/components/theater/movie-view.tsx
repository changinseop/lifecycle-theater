"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import { Play, Pause, RotateCcw } from "lucide-react";
import dynamic from "next/dynamic";

// 제작 과정 데이터
const PRODUCTION_STEPS = [
  {
    phase: "Phase 1",
    title: "데이터 준비",
    description: "대시보드의 분석 데이터를 Remotion 씬 데이터로 변환",
    details: [
      "cohort-view.tsx의 리텐션 히트맵 데이터 추출",
      "funnel-drivers.ts의 상관관계 히트맵 데이터 추출",
      "overview-data.ts의 핵심 메트릭 추출",
    ],
  },
  {
    phase: "Phase 2",
    title: "씬 구성",
    description: "7개 씬으로 스토리라인 구성 (80초)",
    details: [
      "Scene00: 타이틀 (0-150프레임, 5초)",
      "Scene01: 데이터 개요 (150-360프레임)",
      "Scene02: 분석 프레임워크 (360-600프레임)",
      "Scene03: 이탈 정의 (600-840프레임)",
      "Scene04: VIP 정의 (840-1080프레임)",
      "Scene05: 5등급 체계 (1080-1290프레임)",
      "Scene06: 코호트 리텐션 (1290-1650프레임)",
      "Scene07: 결론 (1650-2400프레임)",
    ],
  },
  {
    phase: "Phase 3",
    title: "애니메이션 구현",
    description: "Remotion의 useCurrentFrame() + interpolate() 활용",
    details: [
      "프레임 기반 애니메이션 (30fps)",
      "순차적 등장 효과 (stagger animation)",
      "하이라이트 펄스 효과 (Math.sin 활용)",
      "페이드 인/아웃 전환",
    ],
  },
  {
    phase: "Phase 4",
    title: "다큐멘터리 스타일",
    description: "단순 그래프 설명이 아닌 스토리텔링 나레이션",
    details: [
      "\"한 리테일 기업이 2년간 수집한 고객 데이터\"",
      "\"이 25일이 '떠났다'와 '아직이다'를 가르는 기준\"",
      "\"결국 모든 것은 '첫 한 달'에 결정됩니다\"",
    ],
  },
];

const TECH_STACK = [
  { name: "Remotion", description: "React 기반 프로그래매틱 비디오 프레임워크" },
  { name: "TypeScript", description: "타입 안전한 애니메이션 데이터 구조" },
  { name: "Framer Motion", description: "보조 UI 애니메이션" },
  { name: "Claude Code", description: "AI 페어 프로그래밍으로 전체 코드 생성" },
];

// Remotion Player를 클라이언트에서만 로드
const RemotionPlayer = dynamic(
  () => import("./movie-player"),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-video bg-black/50 flex items-center justify-center rounded-xl border border-white/10">
        <div className="text-white/40">Loading player...</div>
      </div>
    ),
  }
);

export const MovieView: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 헤더 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            고객 라이프사이클 다큐멘터리
          </h1>
          <p className="text-white/60">
            Remotion으로 제작한 데이터 스토리텔링 영상 (80초)
          </p>
        </div>

        {/* 비디오 플레이어 섹션 */}
        <div className="relative">
          <RemotionPlayer
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            currentFrame={currentFrame}
            setCurrentFrame={setCurrentFrame}
          />
        </div>

        {/* 제작 과정 섹션 */}
        <div className="pt-8 border-t border-white/10">
          <h2 className="text-2xl font-bold text-white mb-6">
            제작 과정: 코드로 만드는 영상
          </h2>

          <div className="bg-white/5 rounded-xl p-6 mb-8 border border-white/10">
            <p className="text-white/80 leading-relaxed">
              이 영상은 <span className="text-blue-400 font-semibold">별도의 영상 편집 도구 없이</span>,
              오직 <span className="text-purple-400 font-semibold">Remotion + Claude Code</span>만으로 제작되었습니다.
              대시보드의 데이터를 그대로 활용하여 프로그래매틱하게 애니메이션을 생성했습니다.
            </p>
          </div>

          {/* 단계별 설명 */}
          <div className="grid md:grid-cols-2 gap-6">
            {PRODUCTION_STEPS.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2 py-1 text-xs font-mono bg-blue-500/20 text-blue-400 rounded">
                    {step.phase}
                  </span>
                  <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                </div>
                <p className="text-white/60 text-sm mb-3">{step.description}</p>
                <ul className="space-y-1.5">
                  {step.details.map((detail, i) => (
                    <li key={i} className="text-white/50 text-xs flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 기술 스택 */}
        <div className="pt-6">
          <h3 className="text-lg font-semibold text-white mb-4">사용 기술</h3>
          <div className="flex flex-wrap gap-3">
            {TECH_STACK.map((tech, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10"
              >
                <span className="text-white font-medium">{tech.name}</span>
                <span className="text-white/40">|</span>
                <span className="text-white/50 text-sm">{tech.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 코드 예시 */}
        <div className="pt-6 pb-8">
          <h3 className="text-lg font-semibold text-white mb-4">핵심 코드 패턴</h3>
          <div className="bg-[#1e1e1e] rounded-xl p-5 border border-white/10 overflow-x-auto">
            <pre className="text-sm font-mono">
              <code className="text-white/80">
{`// Remotion 프레임 기반 애니메이션
const frame = useCurrentFrame();

// 순차적 등장 효과
const cellDelay = 70 + colIdx * 12;
const cellOpacity = interpolate(
  frame,
  [cellDelay, cellDelay + 18],
  [0, 1],
  { extrapolateRight: "clamp" }
);

// 높은 값 강조 펄스 효과
const isHigh = value >= 0.15;
const pulse = isHigh
  ? Math.sin(frame * 0.1) * 0.08 + 1
  : 1;

<div style={{
  transform: \`scale(\${pulse})\`,
  boxShadow: isHigh ? "0 0 30px rgba(96,165,250,0.7)" : "none"
}}>
  {value.toFixed(3)}
</div>`}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
