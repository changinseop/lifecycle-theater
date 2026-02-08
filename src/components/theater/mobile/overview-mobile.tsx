"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "motion/react";
import {
  CONSTANTS,
  GRADES,
  STATISTICAL_VALIDATION,
  VIP_PROFILE,
  TIMELINE_SECTIONS,
} from "@/lib/data/overview-data";

const WaveBackground = dynamic(
  () =>
    import("@/components/ui/wave-background").then((mod) => mod.WaveBackground),
  { ssr: false }
);

/* eslint-disable @next/next/no-img-element */

// ==========================================
// CountUp animation
// ==========================================
function CountUp({
  target,
  duration = 1.2,
  delay = 0,
  suffix = "",
}: {
  target: number;
  duration?: number;
  delay?: number;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / (duration * 1000), 1);
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setCount(Math.floor(eased * target));
        if (progress < 1) requestAnimationFrame(animate);
      };
      animate();
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [target, duration, delay]);

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ==========================================
// Grade color map
// ==========================================
const GRADE_COLORS: Record<string, string> = {
  vip: "#fbbf24",
  loyal: "#22c55e",
  active: "#3b82f6",
  risk: "#f97316",
  churn: "#6b7280",
};

// ==========================================
// Main Component
// ==========================================
export function OverviewMobile({
  onNavigate,
}: {
  onNavigate?: (tab: string) => void;
}) {
  const [activeSection, setActiveSection] = useState("intro");
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentIndex = TIMELINE_SECTIONS.findIndex(
    (s) => s.id === activeSection
  );

  const handleSectionChange = (sectionId: string) => {
    if (sectionId !== activeSection) {
      setActiveSection(sectionId);
    }
  };

  // Auto-scroll tab into view
  useEffect(() => {
    const btn = document.getElementById(`mtab-${activeSection}`);
    btn?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeSection]);

  return (
    <div className="w-full min-h-full relative">
      {/* Background animation - same as desktop */}
      <Suspense fallback={null}>
        <WaveBackground />
      </Suspense>

      {/* Timeline step indicator */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md border-b border-white/5">
        <div
          ref={scrollRef}
          className="overflow-x-auto scrollbar-hide px-3 py-2.5"
        >
          <div className="flex items-center gap-1.5 w-max min-w-full">
            {TIMELINE_SECTIONS.map((section, idx) => {
              const isActive = section.id === activeSection;
              const isPast = idx < currentIndex;

              return (
                <button
                  key={section.id}
                  id={`mtab-${section.id}`}
                  onClick={() => handleSectionChange(section.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? "bg-white/15 border border-white/20 shadow-lg"
                      : "bg-white/[0.03] border border-white/[0.06]"
                  }`}
                >
                  <motion.span
                    animate={{ scale: isActive ? 1.1 : 1 }}
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium ${
                      isActive
                        ? "bg-sky-500 text-white shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                        : isPast
                          ? "bg-white/15 text-white/70"
                          : "bg-white/10 text-white/40"
                    }`}
                  >
                    {isPast ? "✓" : section.step}
                  </motion.span>
                  <span
                    className={`text-[11px] font-medium ${
                      isActive
                        ? "text-sky-400"
                        : isPast
                          ? "text-white/50"
                          : "text-white/30"
                    }`}
                  >
                    {section.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section content */}
      <div className="relative z-10 min-h-[calc(100vh-120px)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="px-5 py-6"
          >
            {activeSection === "intro" && <SectionIntro />}
            {activeSection === "overview" && <SectionOverview />}
            {activeSection === "churn-definition" && <SectionChurnDefinition />}
            {activeSection === "vip-definition" && <SectionVipDefinition />}
            {activeSection === "risk-threshold" && <SectionRiskThreshold />}
            {activeSection === "classification" && <SectionClassification />}
            {activeSection === "validation" && <SectionValidation />}
            {activeSection === "next" && (
              <SectionNext onNavigate={onNavigate} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation arrows */}
      <div className="sticky bottom-0 z-20 bg-gradient-to-t from-black via-black/90 to-transparent px-5 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (currentIndex > 0)
                handleSectionChange(TIMELINE_SECTIONS[currentIndex - 1].id);
            }}
            disabled={currentIndex <= 0}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium transition-all min-h-[44px] ${
              currentIndex > 0
                ? "bg-white/10 text-white/70 active:bg-white/20"
                : "bg-white/5 text-white/20"
            }`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            이전
          </button>

          <div className="flex items-center gap-1">
            {TIMELINE_SECTIONS.map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentIndex
                    ? "bg-sky-400 w-4"
                    : idx < currentIndex
                      ? "bg-white/30"
                      : "bg-white/10"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => {
              if (currentIndex < TIMELINE_SECTIONS.length - 1)
                handleSectionChange(TIMELINE_SECTIONS[currentIndex + 1].id);
            }}
            disabled={currentIndex >= TIMELINE_SECTIONS.length - 1}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium transition-all min-h-[44px] ${
              currentIndex < TIMELINE_SECTIONS.length - 1
                ? "bg-white/10 text-white/70 active:bg-white/20"
                : "bg-white/5 text-white/20"
            }`}
          >
            다음
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Section 1: 고객은 어떻게 변하는가?
// ==========================================
function SectionIntro() {
  return (
    <div className="min-h-[60vh] flex flex-col justify-center">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-2xl font-bold text-white mb-6 leading-tight"
      >
        고객은 어떻게 변하는가?
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="space-y-2.5 text-sm text-white/60 mb-8"
      >
        <p>어떤 고객은 단골이 되고, 어떤 고객은 떠난다.</p>
        <p>
          우리는 그{" "}
          <span className="text-sky-400 font-medium">'변화의 패턴'</span>을
          추적하고자 한다.
        </p>
        <p>
          매출이나 객단가가 아닌,{" "}
          <span className="text-sky-400 font-medium">방문 행위 그 자체</span>에
          집중한다.
        </p>
        <p className="text-white/30">행동이 바뀌면 매출은 따라온다.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="space-y-3"
      >
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-light text-white">
            <CountUp
              target={CONSTANTS.TOTAL_CUSTOMERS}
              duration={1.2}
              delay={0.8}
              suffix="명"
            />
          </span>
          <span className="text-xs text-white/40">분석 대상</span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-light text-white">
            <CountUp
              target={CONSTANTS.TOTAL_TRANSACTIONS}
              duration={2.0}
              delay={1.0}
              suffix="건"
            />
          </span>
          <span className="text-xs text-white/40">총 거래</span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-light text-white">
            <CountUp
              target={CONSTANTS.TOTAL_VISITS}
              duration={1.5}
              delay={1.2}
              suffix="회"
            />
          </span>
          <span className="text-xs text-white/40">총 방문</span>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-light text-white">
            <CountUp
              target={CONSTANTS.PERIOD_MONTHS}
              duration={0.8}
              delay={1.4}
              suffix="개월"
            />
          </span>
          <span className="text-xs text-white/40">추적 기간</span>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.0, duration: 0.8 }}
        className="mt-10 text-[11px] text-white/30"
      >
        이 대시보드는 패스트캠퍼스 INNER CIRCLE:데이터 분석 Course 4기 팀프로젝트로 제작되었습니다.
      </motion.p>
    </div>
  );
}

// ==========================================
// Mermaid 파이프라인 차트 정의
// ==========================================
const PIPELINE_CHART = `
flowchart TB
    subgraph SOURCE["📁 원본 데이터 4개"]
        A["transaction_data<br/>260만 건"]
        B["product<br/>9.2만 건"]
        B2["coupon<br/>쿠폰 사용"]
        B3["causal_data<br/>할인/프로모션"]
    end

    subgraph JOIN["🔗 데이터 결합"]
        C["거래+상품+쿠폰+할인<br/>household_key, PRODUCT_ID"]
    end

    subgraph AGG["📊 집계"]
        D["방문 단위 집계"]
        D2["카테고리 다양성"]
        D3["매장별/다매장 분석"]
        D4["쿠폰/할인 경험"]
    end

    subgraph STAGE1["1단계: HOW"]
        E["방문 간격"]
        F["이탈 횟수"]
        G["5등급 분류"]
    end

    subgraph STAGE2["2단계: WHY"]
        H["첫 30일"]
        I["상관 효과 분석"]
        J["코호트 생성"]
    end

    A --> C
    B -->|"PRODUCT_ID"| C
    B2 -->|"household_key"| C
    B3 --> C
    C --> D & D2 & D3 & D4
    D --> E --> F --> G
    D --> H
    D4 --> I
    H --> J
    G -.->|"교차분석"| I

    style A fill:#475569,stroke:#64748b,color:#f1f5f9
    style B fill:#475569,stroke:#64748b,color:#f1f5f9
    style B2 fill:#475569,stroke:#64748b,color:#f1f5f9
    style B3 fill:#475569,stroke:#64748b,color:#f1f5f9
    style C fill:#334155,stroke:#475569,color:#f1f5f9
    style D fill:#374151,stroke:#4b5563,color:#f1f5f9
    style D2 fill:#374151,stroke:#4b5563,color:#f1f5f9
    style D3 fill:#374151,stroke:#4b5563,color:#f1f5f9
    style D4 fill:#374151,stroke:#4b5563,color:#f1f5f9
    style E fill:#4b5563,stroke:#6b7280,color:#f1f5f9
    style F fill:#4b5563,stroke:#6b7280,color:#f1f5f9
    style G fill:#4b5563,stroke:#6b7280,color:#f1f5f9
    style H fill:#4b5563,stroke:#6b7280,color:#f1f5f9
    style I fill:#4b5563,stroke:#6b7280,color:#f1f5f9
    style J fill:#4b5563,stroke:#6b7280,color:#f1f5f9
`;

// 분석 기술 데이터
const ANALYSIS_TECHS = [
  { icon: "📐", name: "Kruskal-Wallis H Test", brief: "비모수 검정", detail: "5개 등급의 방문 횟수가 진짜 다른지 판별. p < 0.001" },
  { icon: "📊", name: "Chi-Square Test", brief: "독립성 검정", detail: "χ² = 106.02, p < 0.001 → 첫 달 행동이 미래 등급 예측" },
  { icon: "📈", name: "Kaplan-Meier Survival", brief: "생존 분석", detail: "코호트별 리텐션 비교 → 다매장 탐험가 18개월 생존율 100%" },
  { icon: "🏷️", name: "RFM 변형 분석", brief: "고객 등급화", detail: "VIP(2.8%), 충성(15.7%), 활성(39.6%), 위험(20.5%), 이탈(21.4%)" },
  { icon: "🔗", name: "Point-biserial Correlation", brief: "이진-연속 상관", detail: "6개 경험 요인 × 5개 전환 유형 → 쿠폰(r=0.150), 다매장(r=0.165)" },
  { icon: "🌳", name: "LightGBM", brief: "ML 등급 예측", detail: "12개 피처로 등급 예측 → 정확도 66.1% (랜덤 대비 3.3배)" },
  { icon: "🔍", name: "SHAP Analysis", brief: "ML 해석", detail: "Top 5: 방문간격 > 현재등급 > 방문공백 > 월방문수 > 누적방문" },
  { icon: "⏩", name: "Walk-forward Validation", brief: "시계열 교차검증", detail: "5개 기간 학습→예측 반복, 실전 동일 조건 정확도 측정" },
];

const VIZ_TECHS = [
  { icon: "⚡", name: "Next.js 16 + React 19", brief: "풀스택 프레임워크" },
  { icon: "🎨", name: "Canvas API", brief: "고성능 그래픽 (레이싱, 산키, 매장 흐름)" },
  { icon: "✨", name: "Framer Motion", brief: "선언적 애니메이션" },
  { icon: "🧜", name: "Mermaid.js", brief: "텍스트→다이어그램" },
  { icon: "🎯", name: "Tailwind CSS", brief: "유틸리티 스타일링" },
];

// 단계 → Mermaid subgraph 매칭용 키워드
const STAGE_KEYWORDS: Record<number, { keywords: string[]; color: string }> = {
  1: { keywords: ["원본 데이터", "SOURCE"], color: "#64748b" },
  2: { keywords: ["데이터 결합", "집계", "JOIN", "AGG"], color: "#475569" },
  3: { keywords: ["1단계", "HOW", "STAGE1"], color: "#3b82f6" },
  4: { keywords: ["2단계", "WHY", "STAGE2"], color: "#22c55e" },
};

// SVG subgraph 강조 적용 함수 (은은한 전환)
function applyHighlight(container: HTMLElement | null, stage: number | null) {
  if (!container) return;
  const clusters = container.querySelectorAll<SVGGElement>(".cluster");

  if (!stage) {
    clusters.forEach((c) => {
      const rect = c.querySelector("rect");
      if (rect) {
        rect.style.transition = "stroke 0.8s ease, stroke-width 0.8s ease, filter 1s ease, fill-opacity 0.8s ease";
        rect.style.stroke = "";
        rect.style.strokeWidth = "";
        rect.style.filter = "";
        rect.style.fillOpacity = "";
      }
    });
    return;
  }

  const { keywords, color } = STAGE_KEYWORDS[stage] || { keywords: [], color: "#fff" };

  clusters.forEach((c) => {
    const text = c.textContent || "";
    const matched = keywords.some((kw) => text.includes(kw));
    const rect = c.querySelector("rect");
    if (!rect) return;

    rect.style.transition = "stroke 0.8s ease, stroke-width 0.8s ease, filter 1s ease, fill-opacity 0.8s ease";
    if (matched) {
      rect.style.stroke = color;
      rect.style.strokeWidth = "2";
      rect.style.filter = `drop-shadow(0 0 8px ${color}90) drop-shadow(0 0 20px ${color}40)`;
      rect.style.fillOpacity = "1";
    } else {
      rect.style.stroke = "";
      rect.style.strokeWidth = "";
      rect.style.filter = "";
      rect.style.fillOpacity = "0.35";
    }
  });
}

// ==========================================
// Mobile Mermaid Chart (with fullscreen modal + highlight)
// ==========================================
function MobileMermaidChart({ highlightedStage }: { highlightedStage: number | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const modalChartRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const uniqueId = useRef(`mermaid-mobile-${Math.random().toString(36).slice(2, 8)}`);

  useEffect(() => {
    const renderChart = async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            primaryColor: "#3b82f6",
            primaryTextColor: "#fff",
            primaryBorderColor: "#60a5fa",
            lineColor: "#64748b",
            secondaryColor: "#22c55e",
            tertiaryColor: "#1e293b",
            background: "transparent",
            mainBkg: "#1e293b",
            nodeBorder: "#475569",
            clusterBkg: "#0f172a80",
            clusterBorder: "#334155",
            titleColor: "#f1f5f9",
            edgeLabelBackground: "transparent",
            nodeTextColor: "#f1f5f9",
          },
          flowchart: {
            htmlLabels: true,
            curve: "basis",
            padding: 12,
          },
        });

        const { svg: renderedSvg } = await mermaid.render(uniqueId.current, PIPELINE_CHART);
        setSvg(renderedSvg);
      } catch (e) {
        console.error("Mermaid render error:", e);
      }
    };

    renderChart();
  }, []);

  // 인라인 미리보기 강조
  useEffect(() => {
    applyHighlight(containerRef.current, highlightedStage);
  }, [highlightedStage, svg]);

  // 모달 강조
  useEffect(() => {
    if (isFullscreen) {
      // 모달 렌더링 후 강조 적용
      requestAnimationFrame(() => {
        applyHighlight(modalChartRef.current, highlightedStage);
      });
    }
  }, [highlightedStage, isFullscreen, svg]);

  if (!svg) {
    return (
      <div className="bg-white/5 rounded-xl border border-white/10 p-4 flex items-center justify-center h-40">
        <div className="text-white/30 text-xs">차트 로딩 중...</div>
      </div>
    );
  }

  return (
    <>
      {/* 인라인 미리보기 */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-3 overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-white">분석 파이프라인</span>
          <button
            onClick={() => setIsFullscreen(true)}
            className="text-[9px] text-white/40 flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 active:bg-white/10 border border-white/10 transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/50">
              <polyline points="15 3 21 3 21 9"/>
              <polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/>
              <line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
            확대
          </button>
        </div>
        <div
          ref={containerRef}
          className="[&_svg]:max-w-full [&_svg]:h-auto"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      {/* 전체화면 모달 — createPortal로 body에 직접 렌더링 (backdrop-filter containing block 우회) */}
      {isFullscreen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
          {/* 상단 닫기 바 — 스크롤 밖, 항상 표시 */}
          <div className="flex-shrink-0 flex justify-center items-center gap-2 px-3 py-3 border-b border-white/10 bg-black">
            {/* 단계 표시 */}
            {[
              { step: 1, label: "수집", color: "#64748b" },
              { step: 2, label: "집계", color: "#475569" },
              { step: 3, label: "HOW", color: "#3b82f6" },
              { step: 4, label: "WHY", color: "#22c55e" },
            ].map((s) => (
              <ModalStageButton
                key={s.step}
                step={s.step}
                label={s.label}
                color={s.color}
                active={highlightedStage === s.step}
              />
            ))}

            {/* 닫기 버튼 */}
            <button
              onClick={() => setIsFullscreen(false)}
              className="ml-2 flex items-center gap-1 px-3 py-2 text-xs font-bold text-white bg-red-600/80 active:bg-red-500 rounded-full border border-red-400/40"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              닫기
            </button>
          </div>

          {/* 차트 스크롤 영역 — 상하좌우 자유 스크롤 */}
          <div
            className="flex-1 overflow-scroll"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {/* Mermaid SVG */}
            <div className="p-4">
              <div
                ref={modalChartRef}
                className="[&_svg]:w-[700px] [&_svg]:max-w-none [&_svg]:h-auto"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            </div>
          </div>

          {/* 하단 힌트 */}
          <div className="flex-shrink-0 px-4 py-1.5 bg-black/90 border-t border-white/5">
            <p className="text-[10px] text-white/30 text-center">드래그하여 상하좌우 탐색</p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// 모달 내 단계 표시용 (읽기 전용 - 하이라이트 상태 표시만)
function ModalStageButton({ step, label, color, active }: {
  step: number;
  label: string;
  color: string;
  active: boolean;
}) {
  return (
    <div
      className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium"
      style={{
        transition: "border-color 0.8s ease, background-color 0.8s ease, box-shadow 0.8s ease, color 0.6s ease",
        border: active ? `2px solid ${color}` : "1px solid rgba(255,255,255,0.1)",
        backgroundColor: active ? `${color}15` : "transparent",
        boxShadow: active ? `0 0 10px ${color}30` : "none",
        color: active ? "#fff" : "rgba(255,255,255,0.4)",
      }}
    >
      <div
        className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {step}
      </div>
      <span>{label}</span>
    </div>
  );
}

// ==========================================
// Expandable tech section
// ==========================================
function TechAccordion({ title, icon, items }: {
  title: string;
  icon: string;
  items: { icon: string; name: string; brief: string; detail?: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 active:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">{icon}</span>
          <span className="text-xs font-semibold text-white">{title}</span>
          <span className="text-[9px] text-white/30 ml-1">{items.length}개</span>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-white/30"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2.5 border-t border-white/5 pt-3">
              {items.map((tech) => (
                <div key={tech.name} className="flex items-start gap-2">
                  <span className="text-xs mt-0.5 flex-shrink-0">{tech.icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-white font-medium">{tech.name}</span>
                      <span className="text-[9px] text-white/40">{tech.brief}</span>
                    </div>
                    {tech.detail && (
                      <p className="text-[10px] text-white/35 leading-relaxed mt-0.5">{tech.detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// Section 2: 분석개요
// ==========================================
function SectionOverview() {
  const [selectedStage, setSelectedStage] = useState<number | null>(null);

  const handleStageTap = (step: number) => {
    setSelectedStage((prev) => (prev === step ? null : step));
  };

  return (
    <div className="space-y-5">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-2xl font-bold text-white leading-tight"
      >
        분석개요
      </motion.h1>

      {/* Dataset info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <div className="text-white/40 text-[10px] tracking-wider">DATASET</div>
        <div className="text-white text-sm font-medium">
          Dunnhumby Complete Journey
        </div>
        <div className="text-white/40 text-xs">
          2,500 가구 × 24개월 × 260만 거래
        </div>
      </motion.div>

      {/* 2-stage summary */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 gap-2.5"
      >
        <div className="bg-white/5 rounded-xl border border-white/10 p-3.5">
          <div className="text-white/50 text-[10px] font-medium mb-1">
            1단계: HOW
          </div>
          <div className="text-white text-sm">방문 빈도 → 5등급</div>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-3.5">
          <div className="text-white/50 text-[10px] font-medium mb-1">
            2단계: WHY
          </div>
          <div className="text-white text-sm">첫 1개월 → 코호트</div>
        </div>
      </motion.div>

      {/* Mermaid Pipeline Chart */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <MobileMermaidChart highlightedStage={selectedStage} />
      </motion.div>

      {/* Pipeline steps (탭하여 차트 강조) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white">
            파이프라인 단계별 요약
          </span>
          <span className="text-[9px] text-white/30">탭하여 차트 강조</span>
        </div>

        <PipelineStep
          step={1}
          color="#64748b"
          title="데이터 수집"
          detail="거래 260만건, 상품 9.2만건, 쿠폰, 할인/프로모션"
          active={selectedStage === 1}
          onTap={() => handleStageTap(1)}
        />
        <PipelineArrow />
        <PipelineStep
          step={2}
          color="#475569"
          title="결합 & 집계"
          detail="PRODUCT_ID 조인, STORE_ID 집계, 고객 단위 방문/카테고리/쿠폰"
          active={selectedStage === 2}
          onTap={() => handleStageTap(2)}
        />
        <PipelineArrow />
        <PipelineStep
          step={3}
          color="#3b82f6"
          title="HOW: 등급 분류"
          detail="방문 간격 → 이탈 횟수 → VIP/충성/활성/위험/이탈"
          active={selectedStage === 3}
          onTap={() => handleStageTap(3)}
        />
        <PipelineArrow />
        <PipelineStep
          step={4}
          color="#22c55e"
          title="WHY: 코호트 분석"
          detail="첫 30일 매장 패턴 → 7개 코호트 → 18개월 후 교차분석"
          active={selectedStage === 4}
          onTap={() => handleStageTap(4)}
        />
      </motion.div>

      {/* Data tables */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-2"
      >
        <div className="text-xs font-semibold text-white mb-2">
          사용 데이터
        </div>
        <DataRow name="transaction_data" count="260만건" desc="거래 이력" />
        <DataRow name="product" count="9.2만건" desc="카테고리 정보" />
        <DataRow name="coupon" count="" desc="쿠폰 사용 기록 (r=0.150***)" />
        <DataRow name="causal_data" count="" desc="할인/프로모션 데이터" />
      </motion.div>

      {/* 분석 기술 + 시각화 기술 (아코디언) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="space-y-2.5"
      >
        <TechAccordion title="분석 기술" icon="📊" items={ANALYSIS_TECHS} />
        <TechAccordion title="시각화 기술" icon="⚛️" items={VIZ_TECHS} />
      </motion.div>

      {/* Constraints */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white/5 rounded-xl border border-white/10 p-4"
      >
        <div className="text-xs font-semibold text-white/60 mb-2">
          데이터 제약사항
        </div>
        <div className="text-[11px] text-white/40 space-y-1">
          <p>• 거주지 정보 없음 — 근접성 분석 불가</p>
          <p>• 인구통계 제한 — hh_demographic 800건만</p>
          <p>• 매장 위치 없음 — 상권/지역 분석 불가</p>
          <p>• 24개월 한계 — 장기 패턴 검증 제한</p>
          <p>• 외부 요인 미반영 — 경쟁사, 계절성 등 통제 불가</p>
        </div>
      </motion.div>
    </div>
  );
}

// ==========================================
// Section 3: 이탈 정의
// ==========================================
function SectionChurnDefinition() {
  return (
    <div className="space-y-5">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-2xl font-bold text-white leading-tight"
      >
        언제 &lsquo;떠났다&rsquo;고 볼 것인가?
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-2 text-sm text-white/60"
      >
        <p>고객의 95%는 22일 이내에 재방문한다.</p>
        <p>
          따라서 <span className="text-white font-medium">25일</span>을 이탈의
          기준으로 정의한다.
        </p>
      </motion.div>

      {/* Histogram image */}
      <motion.div
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 1.2, delay: 0.5 }}
        className="rounded-xl overflow-hidden"
      >
        <img
          src="/images/overview/01_interval_histogram.png?v=2"
          alt="방문 간격 분포"
          className="w-full h-auto"
        />
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-3 gap-2.5"
      >
        <StatCard value="3일" label="중앙값" />
        <StatCard value="22일" label="95%ile" />
        <StatCard value="25일+" label="이탈 기준" muted />
      </motion.div>
    </div>
  );
}

// ==========================================
// Section 4: VIP 정의
// ==========================================
function SectionVipDefinition() {
  return (
    <div className="space-y-5">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-2xl font-bold text-white leading-tight"
      >
        누가 진정한 단골인가?
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-2 text-sm text-white/60"
      >
        <p>
          이탈 0회 고객 463명 중 방문 횟수{" "}
          <span className="text-white font-medium">85%ile = 362회</span>
        </p>
        <p>
          362회 이상 방문 ={" "}
          <span className="text-white font-medium">상위 15% → VIP</span>
        </p>
        <p className="text-white/30">
          "많이 사는 고객"이 아니라 "자주 오는 고객"
        </p>
      </motion.div>

      {/* VIP definition image */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl overflow-hidden"
      >
        <img
          src="/images/overview/03_vip_definition.png?v=2"
          alt="VIP 정의"
          className="w-full h-auto"
        />
      </motion.div>

      {/* VIP vs Loyal comparison */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-2 gap-2.5"
      >
        <div className="bg-white/5 rounded-xl border border-white/10 p-3.5">
          <div
            className="text-xs font-semibold mb-2"
            style={{ color: "#fbbf24" }}
          >
            VIP
          </div>
          <div className="space-y-1.5">
            <ComparisonRow
              label="1회 평균"
              value={`$${VIP_PROFILE.comparison.vip.avgAmount}`}
            />
            <ComparisonRow
              label="총 방문"
              value={`${VIP_PROFILE.comparison.vip.totalVisits}회`}
            />
            <ComparisonRow
              label="평균 품목"
              value={`${VIP_PROFILE.comparison.vip.avgItems}개`}
            />
            <ComparisonRow
              label="소량 구매"
              value={`${VIP_PROFILE.comparison.vip.smallPurchaseRate}%`}
            />
          </div>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-3.5">
          <div
            className="text-xs font-semibold mb-2"
            style={{ color: "#22c55e" }}
          >
            충성
          </div>
          <div className="space-y-1.5">
            <ComparisonRow
              label="1회 평균"
              value={`$${VIP_PROFILE.comparison.loyal.avgAmount}`}
            />
            <ComparisonRow
              label="총 방문"
              value={`${VIP_PROFILE.comparison.loyal.totalVisits}회`}
            />
            <ComparisonRow
              label="평균 품목"
              value={`${VIP_PROFILE.comparison.loyal.avgItems}개`}
            />
            <ComparisonRow
              label="소량 구매"
              value={`${VIP_PROFILE.comparison.loyal.smallPurchaseRate}%`}
            />
          </div>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="text-[11px] text-white/40 leading-relaxed"
      >
        {VIP_PROFILE.insight}
      </motion.p>
    </div>
  );
}

// ==========================================
// Section 5: 위험 임계점
// ==========================================
function SectionRiskThreshold() {
  return (
    <div className="space-y-5">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-2xl font-bold text-white leading-tight"
      >
        언제 개입해야 하는가?
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-2 text-sm text-white/60"
      >
        <p>
          8일 전후로 이탈 확률이{" "}
          <span className="text-white font-medium">5.6배</span> 급증한다.
        </p>
        <p className="text-white/30">
          8일 경고 → 25일 이탈 전 17일의 개입 기회
        </p>
      </motion.div>

      {/* Risk threshold image */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl overflow-hidden"
      >
        <img
          src="/images/overview/02_risk_threshold_8days.png?v=3"
          alt="8일 기준 이탈 확률"
          className="w-full h-auto"
        />
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-3 gap-2.5"
      >
        <StatCard value="8일" label="위험 임계점" />
        <StatCard value="5.6배" label="이탈 확률 증가" />
        <StatCard value="17일" label="마케팅 개입 기회" />
      </motion.div>
    </div>
  );
}

// ==========================================
// Section 6: 5등급 분류
// ==========================================
function SectionClassification() {
  const totalSales = GRADES.reduce((sum, g) => sum + g.avgSales * g.count, 0);

  return (
    <div className="space-y-5">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-2xl font-bold text-white leading-tight"
      >
        변화의 기준은?
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-white/60"
      >
        이탈 경험 여부와 최근 방문 시점으로 5단계 분류
      </motion.p>

      {/* Grade distribution image */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl overflow-hidden"
      >
        <img
          src="/images/overview/04_grade_distribution.png?v=3"
          alt="5등급 분류 결과"
          className="w-full h-auto"
        />
      </motion.div>

      {/* Grade cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="space-y-2"
      >
        {GRADES.map((grade, idx) => {
          const color = GRADE_COLORS[grade.id] || "#6b7280";
          const gradeSales = grade.avgSales * grade.count;
          const salesPct = ((gradeSales / totalSales) * 100).toFixed(1);

          return (
            <motion.div
              key={grade.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + idx * 0.06 }}
              className="bg-white/5 rounded-xl border border-white/10 p-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    {grade.emoji}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white">
                      {grade.label}
                    </span>
                    <span className="text-[10px] text-white/30 ml-1.5">
                      {grade.definition}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-white">
                    {grade.count}명
                  </span>
                  <span className="text-[10px] text-white/30 ml-1">
                    ({grade.percentage}%)
                  </span>
                </div>
              </div>
              {/* Stats row */}
              <div className="flex items-center gap-3 mt-2 text-[10px] text-white/40">
                <span>방문 {grade.avgVisits.toFixed(0)}회</span>
                <span>매출 ${grade.avgSales.toLocaleString()}</span>
                <span>비중 {salesPct}%</span>
              </div>
              {/* Bar */}
              <div className="h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${grade.percentage}%` }}
                  transition={{ delay: 1.0 + idx * 0.06, duration: 0.5 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

// ==========================================
// Section 7: 통계 검증
// ==========================================
function SectionValidation() {
  const { kruskalWallis } = STATISTICAL_VALIDATION;

  return (
    <div className="space-y-5">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-2xl font-bold text-white leading-tight"
      >
        분류가 유의미한가?
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-2 text-sm text-white/60"
      >
        <p>
          Kruskal-Wallis H = {kruskalWallis.visitCount.h.toLocaleString()}, p
          &lt; 0.001
        </p>
        <p className="text-white/30">
          5개 등급은 통계적으로 명확히 구분된다.
        </p>
      </motion.div>

      {/* Validation image */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl overflow-hidden"
      >
        <img
          src="/images/overview/05_statistical_validation.png?v=2"
          alt="통계적 검증"
          className="w-full h-auto"
        />
      </motion.div>

      {/* Explanation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3"
      >
        <div>
          <div className="text-xs text-white/50 mb-1">Kruskal-Wallis H Test</div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-white">
              H = {kruskalWallis.visitCount.h.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-400">p &lt; 0.001</span>
          </div>
          <p className="text-[10px] text-white/30 mt-1">
            값이 클수록 그룹 간 차이가 큼. 이 차이가 우연일 확률 0.1% 미만.
          </p>
        </div>

        <div className="border-t border-white/5" />

        {/* Pairwise */}
        <div>
          <div className="text-xs text-white/50 mb-2">
            등급 간 비교 (Mann-Whitney U)
          </div>
          <div className="space-y-1.5">
            {STATISTICAL_VALIDATION.mannWhitneyU.map((test) => (
              <div
                key={test.comparison}
                className="flex items-center justify-between"
              >
                <span className="text-[11px] text-white/60">
                  {test.comparison}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/40 font-mono">
                    {test.visitDiff}
                  </span>
                  <span className="text-[10px] text-emerald-400/80">
                    p &lt; 0.001
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/5" />

        <p className="text-[11px] text-white/50 leading-relaxed">
          {STATISTICAL_VALIDATION.conclusion}
        </p>
      </motion.div>
    </div>
  );
}

// ==========================================
// Section 8: 왜 변하는가? (Navigation)
// ==========================================
function SectionNext({
  onNavigate,
}: {
  onNavigate?: (tab: string) => void;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col justify-center">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-2xl font-bold text-white mb-4 leading-tight"
      >
        왜 변하는가?
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-2 text-sm text-white/60 mb-8"
      >
        <p>왜 어떤 고객은 VIP가 되고, 어떤 고객은 이탈하는가?</p>
        <p className="text-white/30">어떤 경험이 등급 전환을 만드는가?</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-2.5"
      >
        <NavButton
          label="Cohort"
          desc="첫 1개월 매장 패턴이 등급을 예측"
          onClick={() => onNavigate?.("cohort")}
        />
        <NavButton
          label="Sankey"
          desc="등급 전환 흐름을 시각적으로 확인"
          onClick={() => onNavigate?.("sankey")}
        />
        <NavButton
          label="Funnel"
          desc="어떤 경험이 등급 전환을 만드는가"
          onClick={() => onNavigate?.("funnel")}
        />
      </motion.div>
    </div>
  );
}

// ==========================================
// Shared sub-components
// ==========================================

function StatCard({
  value,
  label,
  muted = false,
}: {
  value: string;
  label: string;
  muted?: boolean;
}) {
  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-3 text-center">
      <div
        className={`text-lg font-light ${muted ? "text-white/50" : "text-white"}`}
      >
        {value}
      </div>
      <div className="text-[10px] text-white/40 mt-0.5">{label}</div>
    </div>
  );
}

function ComparisonRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[11px] text-white/40">{label}</span>
      <span className="text-xs text-white/80 font-mono">{value}</span>
    </div>
  );
}

function PipelineStep({
  step,
  color,
  title,
  detail,
  active = false,
  onTap,
}: {
  step: number;
  color: string;
  title: string;
  detail: string;
  active?: boolean;
  onTap?: () => void;
}) {
  return (
    <button
      onClick={onTap}
      className="w-full flex items-start gap-3 text-left p-2.5 -m-2.5 rounded-xl active:bg-white/5"
      style={{
        transition: "box-shadow 0.8s ease, background-color 0.6s ease",
        boxShadow: active
          ? `0 0 18px ${color}25, 0 0 6px ${color}15, inset 0 0 0 1px ${color}35`
          : "0 0 0px transparent, 0 0 0px transparent, inset 0 0 0 1px transparent",
        backgroundColor: active ? `${color}08` : "transparent",
      }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
        style={{
          backgroundColor: color,
          transition: "transform 0.6s ease, box-shadow 0.8s ease",
          transform: active ? "scale(1.1)" : "scale(1)",
          boxShadow: active ? `0 0 12px ${color}50` : "none",
        }}
      >
        {step}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="text-sm font-medium"
          style={{
            transition: "color 0.6s ease",
            color: active ? "#fff" : "rgba(255,255,255,0.9)",
          }}
        >
          {title}
        </div>
        <div
          className="text-[11px] mt-0.5"
          style={{
            transition: "color 0.6s ease",
            color: active ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.4)",
          }}
        >
          {detail}
        </div>
      </div>
      <div
        className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full"
        style={{
          backgroundColor: color,
          transition: "opacity 0.8s ease, transform 0.8s ease",
          opacity: active ? 1 : 0,
          transform: active ? "scale(1)" : "scale(0)",
          animation: active ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" : "none",
        }}
      />
    </button>
  );
}

function PipelineArrow() {
  return (
    <div className="flex justify-center pl-3">
      <svg
        width="12"
        height="16"
        viewBox="0 0 12 16"
        fill="none"
        className="text-white/20"
      >
        <path d="M6 0v12M2 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

function DataRow({
  name,
  count,
  desc,
}: {
  name: string;
  count: string;
  desc: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-xs text-white font-medium">{name}</span>
      {count && (
        <span className="text-[10px] text-white/30">{count}</span>
      )}
      <span className="text-[10px] text-white/40 ml-auto">{desc}</span>
    </div>
  );
}

function NavButton({
  label,
  desc,
  onClick,
}: {
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white/5 hover:bg-white/10 active:bg-white/15 rounded-xl border border-white/10 p-4 text-left transition-colors min-h-[44px]"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-white">{label}</div>
          <div className="text-[11px] text-white/40 mt-0.5">{desc}</div>
        </div>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-white/30 flex-shrink-0"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </button>
  );
}
