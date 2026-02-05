"use client";

import { useState } from "react";
import { motion } from "motion/react";

export function BifurcationFlow() {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const grades = [
    { label: "VIP", color: "#fbbf24" },
    { label: "충성", color: "#22c55e" },
    { label: "활성", color: "#3b82f6" },
    { label: "위험", color: "#f97316" },
    { label: "이탈", color: "#6b7280" },
  ];

  const cohorts = [
    { code: "111", label: "다매장 탐험" },
    { code: "110", label: "초기 탐험" },
    { code: "100", label: "첫달만" },
    { code: "010", label: "중기 전환" },
    { code: "001", label: "후기 전환" },
  ];

  const results = [
    { num: 2, label: "상관 효과" },
    { num: 3, label: "상관 히트맵" },
    { num: 4, label: "복귀 패턴" },
    { num: 5, label: "상관관계" },
    { num: 6, label: "조합 효과" },
  ];

  return (
    <div className="relative py-3">
      {/* 분석 프레임워크 흐름: 좌→우 */}
      <div className="flex items-center gap-0">

        {/* Step 1: 대상 */}
        <motion.div
          className={`flex-shrink-0 w-[130px] p-4 rounded-l-2xl border border-r-0 transition-colors ${
            hoveredStep === 0
              ? "bg-white/10 border-white/30"
              : "bg-white/[0.02] border-white/10"
          }`}
          initial={{ opacity: 0, x: -40, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 120 }}
          onMouseEnter={() => setHoveredStep(0)}
          onMouseLeave={() => setHoveredStep(null)}
        >
          <div className="text-[10px] text-white/40 mb-1 tracking-widest">STEP 1</div>
          <motion.div
            className="text-2xl font-bold text-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            2,500
          </motion.div>
          <div className="text-xs text-white/50">명 · 711일</div>
          <motion.div
            className="mt-2 h-px bg-gradient-to-r from-white/30 to-transparent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
            style={{ transformOrigin: "left" }}
          />
          <div className="text-[9px] text-white/25 mt-1.5">거래 데이터</div>
        </motion.div>

        {/* 연결선 1: 흐르는 빛 */}
        <motion.div
          className="flex-shrink-0 w-12 h-[2px] relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="absolute inset-0 bg-white/10" />
          <motion.div
            className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            animate={{ x: ["-32px", "48px"] }}
            transition={{ duration: 1.2, delay: 0.6, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
          />
          {/* 화살표 끝 */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-white/30" />
        </motion.div>

        {/* Step 2: 등급 분류 */}
        <motion.div
          className={`flex-shrink-0 w-[150px] p-4 border transition-colors ${
            hoveredStep === 1
              ? "bg-white/10 border-white/30"
              : "bg-white/[0.02] border-white/10"
          }`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, type: "spring", stiffness: 120 }}
          onMouseEnter={() => setHoveredStep(1)}
          onMouseLeave={() => setHoveredStep(null)}
        >
          <div className="text-[10px] text-white/40 mb-1 tracking-widest">STEP 2</div>
          <div className="text-sm font-semibold text-white mb-2">5등급 분류</div>

          <div className="space-y-1">
            {grades.map((g, i) => (
              <motion.div
                key={g.label}
                className="flex items-center gap-1.5"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.08, type: "spring", stiffness: 200 }}
              >
                <motion.div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: g.color }}
                  animate={{
                    boxShadow: hoveredStep === 1
                      ? `0 0 8px ${g.color}60`
                      : `0 0 0px transparent`,
                  }}
                />
                <span className="text-[11px] text-white/70">{g.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* × 교차 기호 - 펄스 효과 */}
        <motion.div
          className="flex-shrink-0 w-12 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, type: "spring", stiffness: 300, damping: 15 }}
        >
          <motion.div
            className="w-9 h-9 rounded-full bg-white/5 border border-white/20 flex items-center justify-center relative"
            animate={{
              boxShadow: [
                "0 0 0px rgba(255,255,255,0)",
                "0 0 15px rgba(255,255,255,0.15)",
                "0 0 0px rgba(255,255,255,0)",
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-sm font-bold text-white/70">×</span>
          </motion.div>
        </motion.div>

        {/* Step 3: 코호트 */}
        <motion.div
          className={`flex-shrink-0 w-[150px] p-4 border transition-colors ${
            hoveredStep === 2
              ? "bg-white/10 border-white/30"
              : "bg-white/[0.02] border-white/10"
          }`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5, type: "spring", stiffness: 120 }}
          onMouseEnter={() => setHoveredStep(2)}
          onMouseLeave={() => setHoveredStep(null)}
        >
          <div className="text-[10px] text-white/40 mb-1 tracking-widest">STEP 3</div>
          <div className="text-sm font-semibold text-white mb-2">매장 코호트</div>

          <div className="space-y-1">
            {cohorts.map((c, i) => (
              <motion.div
                key={c.code}
                className="flex items-center gap-1.5"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + i * 0.08, type: "spring", stiffness: 200 }}
              >
                <code className="text-[9px] font-mono text-white/50 bg-white/5 px-1 rounded">
                  {c.code}
                </code>
                <span className="text-[11px] text-white/70">{c.label}</span>
              </motion.div>
            ))}
          </div>
          <div className="text-[8px] text-white/20 mt-1.5">1=다매장 0=단일</div>
        </motion.div>

        {/* 연결선 2: 흐르는 빛 */}
        <motion.div
          className="flex-shrink-0 w-12 h-[2px] relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <div className="absolute inset-0 bg-white/10" />
          <motion.div
            className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            animate={{ x: ["-32px", "48px"] }}
            transition={{ duration: 1.2, delay: 1.2, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
          />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-white/30" />
        </motion.div>

        {/* Result: 상태 전환 분석 */}
        <motion.div
          className={`flex-1 min-w-[160px] p-4 rounded-r-2xl border border-l-0 transition-colors ${
            hoveredStep === 3
              ? "bg-white/10 border-white/30"
              : "bg-white/[0.02] border-white/10"
          }`}
          initial={{ opacity: 0, x: 40, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 1.0, duration: 0.6, type: "spring", stiffness: 120 }}
          onMouseEnter={() => setHoveredStep(3)}
          onMouseLeave={() => setHoveredStep(null)}
        >
          <div className="text-[10px] text-white/40 mb-1 tracking-widest">RESULT</div>
          <div className="text-sm font-semibold text-white mb-2">상태 전환 분석</div>

          <div className="space-y-1">
            {results.map((item, i) => (
              <motion.div
                key={item.num}
                className="flex items-center gap-1.5"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 + i * 0.08, type: "spring", stiffness: 200 }}
              >
                <span className="text-[9px] font-mono text-white/30">{item.num}.</span>
                <span className="text-[11px] text-white/70">{item.label}</span>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-white/5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
          >
            {["Point-biserial r", "Chi2", "편상관"].map((tag) => (
              <span key={tag} className="text-[8px] text-white/25 px-1 py-0.5 rounded bg-white/5">
                {tag}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* 하단: 핵심 수치 한 줄 */}
      <motion.div
        className="flex items-center justify-center gap-6 mt-3 text-[10px] text-white/35"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.5 }}
      >
        <span>이탈 기준: 25일+ 공백</span>
        <span className="text-white/10">|</span>
        <span>VIP: 이탈 0회 + 362회+ 방문</span>
        <span className="text-white/10">|</span>
        <span>첫 1개월 패턴 → 최종 등급 예측 (Chi2=106, p&lt;0.001)</span>
      </motion.div>
    </div>
  );
}
