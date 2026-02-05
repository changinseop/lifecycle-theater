"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BifurcationFlow } from "./funnel/bifurcation-flow";
import { ForestPlot } from "./funnel/forest-plot";
import { DriverHeatmap } from "./funnel/driver-heatmap";
import { CorrelationDashboard } from "./funnel/correlation-dashboard";
import { CombinationEffects } from "./funnel/combination-effects";
import { RecoveryAnalysis } from "./funnel/recovery-analysis";
import { ChevronDown, ChevronUp } from "lucide-react";

/* ────────────────────────────────────────────────── MethodInfo */

function MethodInfo({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white/[0.02] rounded-xl border border-white/10 overflow-hidden mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-white/40"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="text-xs font-medium text-white/50">{title}</span>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-white/30 text-xs"
        >
          ▼
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 text-xs text-white/50 leading-relaxed space-y-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ────────────────────────────────────────────────── section method descriptions */

const SECTION_METHODS: Record<string, React.ReactNode> = {
  bifurcation: (
    <>
      <p className="text-white/70 font-medium">분석 기법: 교차분석 + 코호트 세분화</p>
      <p>
        <span className="text-white/60">Chi-Square 독립성 검정</span> — 첫 1개월 매장 방문 패턴(코호트)과 최종 등급 간 독립성을
        검정합니다. Chi2=106.02, p&lt;0.001로 코호트와 등급이 통계적으로 유의한 관계임을 확인했습니다.
      </p>
      <p>
        <span className="text-white/60">이분법 프레임워크</span> — 2,500명 고객을 &quot;이탈 경험 없음(463명, 18.5%)&quot;과
        &quot;이탈 경험 있음(2,037명, 81.5%)&quot;으로 먼저 분류합니다. 이탈 기준은 25일 이상 방문 공백입니다.
      </p>
      <p>
        <span className="text-white/60">코호트 정의</span> — 첫 1개월 동안 어떤 매장을 방문했는지로
        5개 코호트(111, 110, 100, 010, 001)로 분류합니다. 111(다매장 탐험가)의 VIP 전환율이 27.8%로 가장 높습니다.
      </p>
      <p className="text-white/40 italic">읽는 법: 왼쪽에서 오른쪽으로, 전체 고객이 이탈 경험 유무로 갈라진 후 → 코호트별로 최종 등급에 도달하는 흐름을 봅니다.</p>
    </>
  ),
  forest: (
    <>
      <p className="text-white/70 font-medium">분석 기법: Point-biserial 상관분석 + Forest Plot</p>
      <p>
        <span className="text-white/60">Point-biserial 상관계수 (r)</span> — 이진 변수(예: 쿠폰 사용 여부)와 연속 변수(예: 등급 변화) 간
        상관을 측정합니다. r=0이면 무관, r=±1이면 완벽한 상관. 일반적으로 |r|&gt;0.1이면 실질적 의미가 있습니다.
      </p>
      <p>
        <span className="text-white/60">Forest Plot</span> — 각 요인의 상관계수(점)와 95% 신뢰구간(가로 선)을 한 눈에 비교하는
        차트입니다. 신뢰구간이 0을 포함하지 않으면 통계적으로 유의합니다.
      </p>
      <p>
        <span className="text-white/60">5가지 전환 유형</span> — 이탈 미경험 유지, VIP 달성, 복귀 성공, 이탈 방지, 위험 유지.
        각 전환별로 6개 경험 요인의 상관을 별도로 분석합니다.
      </p>
      <p className="text-white/40 italic">읽는 법: 점이 오른쪽에 있을수록 해당 요인이 전환에 긍정적입니다. 가로 선이 짧을수록 추정이 정확합니다.</p>
    </>
  ),
  heatmap: (
    <>
      <p className="text-white/70 font-medium">분석 기법: 상관계수 매트릭스 + 히트맵</p>
      <p>
        <span className="text-white/60">상관계수 매트릭스</span> — 6개 경험 요인(행) × 5개 전환 유형(열)의 Point-biserial r 값을
        행렬로 정리합니다. 총 30개 조합의 상관을 한 눈에 비교합니다.
      </p>
      <p>
        <span className="text-white/60">색상 코딩</span> — 파란색(긍정 상관) → 흰색(무상관) → 빨간색(부정 상관).
        색이 진할수록 상관이 강합니다.
      </p>
      <p>
        <span className="text-white/60">유의수준 표시</span> — *** p&lt;0.001 (매우 유의), ** p&lt;0.01 (유의), * p&lt;0.05 (약간 유의),
        n.s. (유의하지 않음).
      </p>
      <p className="text-white/40 italic">읽는 법: 색이 진한 셀을 찾으세요. 그것이 가장 영향력 있는 요인-전환 조합입니다. 정렬 기능으로 패턴을 찾을 수 있습니다.</p>
    </>
  ),
  recovery: (
    <>
      <p className="text-white/70 font-medium">분석 기법: 조건부 확률 + 임계점 분석</p>
      <p>
        <span className="text-white/60">조건부 확률</span> — &quot;이탈을 N회 경험한 고객이 다시 복귀할 확률&quot;을 계산합니다.
        P(복귀 | 이탈 N회) = 복귀 고객 수 ÷ 이탈 N회 고객 수.
      </p>
      <p>
        <span className="text-white/60">임계점 분석</span> — 복귀율이 50% 미만으로 떨어지는 지점(4회)을 &quot;골든 타임&quot;으로 정의합니다.
        1회 이탈: 73.5% 복귀 → 4회 이탈: 48.1%로 급감.
      </p>
      <p>
        <span className="text-white/60">복귀 vs 비복귀 비교</span> — 복귀에 성공한 고객과 실패한 고객의 행동 패턴 차이를
        분석하여 복귀 성공 요인을 도출합니다.
      </p>
      <p className="text-white/40 italic">읽는 법: 이탈 횟수가 늘어날수록 복귀율이 어떻게 변하는지 추세를 봅니다. 4회가 핵심 분기점입니다.</p>
    </>
  ),
  correlation: (
    <>
      <p className="text-white/70 font-medium">분석 기법: 다변량 상관분석 + 효과 크기 순위</p>
      <p>
        <span className="text-white/60">효과 크기 순위화</span> — 6개 경험 요인의 이탈 상관을 효과 크기(|r|) 순서로 정렬합니다.
        단순 상관 방향(+/-)뿐만 아니라 영향의 절대적 크기를 비교합니다.
      </p>
      <p>
        <span className="text-white/60">양방향 분석</span> — 같은 요인이 전환 유형에 따라 긍정/부정 상관을 동시에 가질 수 있습니다.
        예: 할인 경험은 이탈 미경험 유지에 긍정(r=0.118)이지만 VIP 달성에는 부정(r=-0.136).
      </p>
      <p className="text-white/40 italic">읽는 법: 막대가 긴 요인이 이탈과 가장 강하게 연관된 변수입니다. 방향(+/-)은 보호/위험 요인을 구분합니다.</p>
    </>
  ),
  combination: (
    <>
      <p className="text-white/70 font-medium">분석 기법: 조합 효과 분석 (Interaction Effects)</p>
      <p>
        <span className="text-white/60">다변량 조합 분석</span> — 개별 요인이 아닌, 여러 요인이 동시에 작용할 때의 시너지 효과를
        측정합니다. 예: 쿠폰 + 다매장 + 대형매장 조합 시 이탈율 8.3%.
      </p>
      <p>
        <span className="text-white/60">최악 vs 최적 시나리오</span> — 이탈율이 가장 높은 조합(최악)과 가장 낮은 조합(최적)을 비교합니다.
        최적 조합의 이탈율이 최악 조합 대비 얼마나 낮은지로 조합 효과의 크기를 파악합니다.
      </p>
      <p>
        <span className="text-white/60">실무 적용</span> — 어떤 경험 조합을 제공하면 이탈을 최소화할 수 있는지에 대한 실무 가이드를
        제공합니다.
      </p>
      <p className="text-white/40 italic">읽는 법: 최악/최적 탭을 전환하며, 어떤 조합이 이탈을 줄이는지(또는 높이는지) 비교합니다.</p>
    </>
  ),
};

/* ────────────────────────────────────────────────── types & config */

interface FunnelAnalysisViewProps {
  onStateSelect?: (state: string | null) => void;
}

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
  color: string;
}

const SECTIONS: Section[] = [
  {
    id: "bifurcation",
    num: 1,
    title: "분석 프레임워크",
    subtitle: "등급 × 코호트 교차 → 상태 전환 분석",
    color: "#64748b",
  },
  {
    id: "forest",
    num: 2,
    title: "상관 효과",
    subtitle: "Forest Plot + 신뢰구간",
    color: "#64748b",
  },
  {
    id: "heatmap",
    num: 3,
    title: "상관 히트맵",
    subtitle: "전환별 상관관계 매트릭스",
    color: "#64748b",
  },
  {
    id: "recovery",
    num: 4,
    title: "복귀 패턴 분석",
    subtitle: "이탈 횟수별 복귀율",
    color: "#64748b",
  },
  {
    id: "correlation",
    num: 5,
    title: "상관관계 대시보드",
    subtitle: "변수별 이탈 상관관계",
    color: "#64748b",
  },
  {
    id: "combination",
    num: 6,
    title: "조합 효과",
    subtitle: "최악/최적 조합별 이탈율",
    color: "#64748b",
  },
];

export function FunnelAnalysisView({ onStateSelect }: FunnelAnalysisViewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(
    new Set(["bifurcation"])
  );
  const [activeSection, setActiveSection] = useState<SectionId>("bifurcation");

  const toggleSection = (sectionId: SectionId) => {
    setExpandedSections((prev) => {
      if (prev.has(sectionId)) {
        return new Set<SectionId>();
      }
      return new Set<SectionId>([sectionId]);
    });
    setActiveSection(sectionId);
  };

  const renderSectionContent = (sectionId: SectionId) => {
    switch (sectionId) {
      case "bifurcation":
        return <BifurcationFlow />;
      case "forest":
        return <ForestPlot />;
      case "heatmap":
        return <DriverHeatmap />;
      case "recovery":
        return <RecoveryAnalysis />;
      case "correlation":
        return <CorrelationDashboard />;
      case "combination":
        return <CombinationEffects />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                퍼널 분석: 경험이 만드는 고객 변화
              </h1>
              <p className="text-sm text-white/60 mt-1">
                &ldquo;어떤 경험이 고객을 움직이는가?&rdquo; - 2,500명 고객 2년간 추적 분석
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4">
              {[
                { label: "분석 고객", value: "2,500명" },
                { label: "분석 기간", value: "711일" },
                { label: "상관 요인", value: "6개" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="text-center px-4 py-2 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="text-lg font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-white/50">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section Navigation */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  if (!expandedSections.has(section.id)) {
                    toggleSection(section.id);
                  }
                  setActiveSection(section.id);
                  document
                    .getElementById(`section-${section.id}`)
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeSection === section.id
                    ? "bg-white/20 text-white"
                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80"
                }`}
                style={{
                  borderLeft:
                    activeSection === section.id
                      ? "3px solid rgba(255,255,255,0.4)"
                      : "3px solid transparent",
                }}
              >
                <span className="text-white/50 font-mono text-xs">{section.num}.</span>
                {section.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {SECTIONS.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          return (
          <motion.div
            key={section.id}
            id={`section-${section.id}`}
            layout
            className={`rounded-2xl overflow-hidden bg-white/[0.02] ${
              isExpanded
                ? "border-[1.5px] border-white/25"
                : "border border-white/10 hover:border-white/15"
            }`}
            animate={
              isExpanded
                ? {
                    boxShadow: [
                      "inset 0 0 0px rgba(255,255,255,0), 0 0 8px 0px rgba(255,255,255,0.04)",
                      "inset 0 0 30px rgba(255,255,255,0.03), 0 0 12px 1px rgba(255,255,255,0.08)",
                      "inset 0 0 0px rgba(255,255,255,0), 0 0 8px 0px rgba(255,255,255,0.04)",
                    ],
                  }
                : { boxShadow: "0 0 0px 0px rgba(255,255,255,0)" }
            }
            transition={
              isExpanded
                ? { boxShadow: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } }
                : { duration: 0.3 }
            }
          >
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <span className="text-sm font-semibold text-white/70">{section.num}</span>
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-semibold text-white">
                    {section.title}
                  </h2>
                  <p className="text-sm text-white/40">{section.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {expandedSections.has(section.id) ? (
                  <ChevronUp className="w-5 h-5 text-white/50" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white/50" />
                )}
              </div>
            </button>

            {/* Section Content */}
            <AnimatePresence>
              {expandedSections.has(section.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-0">
                    {SECTION_METHODS[section.id] && (
                      <MethodInfo title={`${section.title} — 분석 기법 설명`}>
                        {SECTION_METHODS[section.id]}
                      </MethodInfo>
                    )}
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
      <div className="max-w-7xl mx-auto px-6 py-8 border-t border-white/10">
        <div className="text-center text-white/40 text-sm">
          <p>데이터 기반 고객 여정 분석 | Dunnhumby 2년간 거래 데이터</p>
          <p className="mt-1">
            *** p&lt;0.001 | ** p&lt;0.01 | * p&lt;0.05 (통계적 유의수준)
          </p>
        </div>
      </div>
    </div>
  );
}
