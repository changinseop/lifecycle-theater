"use client";

import { useState, Suspense, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "motion/react";
import {
  TIMELINE_SECTIONS,
  CONSTANTS,
  GRADES,
  STATISTICAL_VALIDATION,
  VIP_PROFILE,
} from "@/lib/data/overview-data";
import racingDataV2 from "@/lib/data/racing-data-v2.json";

const WaveBackground = dynamic(
  () => import("@/components/ui/wave-background").then((mod) => mod.WaveBackground),
  { ssr: false }
);

/* eslint-disable @next/next/no-img-element */

interface OverviewViewProps {
  onNavigate?: (tab: string) => void;
}

export function OverviewView({ onNavigate }: OverviewViewProps) {
  const [activeSection, setActiveSection] = useState<string>("intro");
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const currentIndex = TIMELINE_SECTIONS.findIndex((s) => s.id === activeSection);

  // 인디케이터 위치 업데이트
  useEffect(() => {
    const activeRef = tabRefs.current[currentIndex];
    if (activeRef) {
      setIndicatorStyle({
        left: activeRef.offsetLeft,
        width: activeRef.offsetWidth,
      });
    }
  }, [currentIndex]);

  // 섹션 변경 핸들러 (블러 효과 포함)
  const handleSectionChange = (sectionId: string) => {
    if (sectionId !== activeSection) {
      setIsTransitioning(true);
      setActiveSection(sectionId);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  return (
    <div className="w-full h-full flex flex-col relative">
      {/* 전체 페이지 3D 배경 */}
      <Suspense fallback={null}>
        <WaveBackground />
      </Suspense>

      {/* 상단 타임라인 (가로) - Glass Buttons with Underline Indicator */}
      <div className="flex-shrink-0 border-b border-white/5 px-6 py-4 bg-black/30 backdrop-blur-sm relative z-10">
        <div className="flex items-center justify-center">
          <div className="relative flex items-center gap-2">
            {/* 탭 버튼들 */}
            {TIMELINE_SECTIONS.map((section, idx) => {
              const isActive = section.id === activeSection;
              const isPast = idx < currentIndex;
              const distance = Math.abs(idx - currentIndex);

              return (
                <motion.button
                  key={section.id}
                  ref={(el) => { tabRefs.current[idx] = el; }}
                  onClick={() => handleSectionChange(section.id)}
                  whileTap={{ scale: 0.95 }}
                  className="relative flex items-center gap-2 px-4 py-2"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                  }}
                >
                  <motion.span
                    animate={{
                      scale: isActive ? 1.15 : 1,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 20,
                    }}
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-sky-500 text-white shadow-[0_0_12px_rgba(56,189,248,0.6)]"
                        : isPast
                          ? "bg-white/15 text-white/70"
                          : "bg-white/10 text-slate-500"
                    }`}
                  >
                    {isPast ? "✓" : section.step}
                  </motion.span>
                  <motion.span
                    className={`text-xs font-medium hidden sm:inline ${
                      isActive ? "text-sky-400" : isPast ? "text-slate-400" : "text-slate-500"
                    }`}
                    animate={{
                      filter: isTransitioning && distance <= 2 ? `blur(${3 - distance}px)` : 'blur(0px)',
                      opacity: isTransitioning && distance <= 2 ? 0.7 : 1,
                      x: isTransitioning && !isActive ? (idx < currentIndex ? -2 : 2) : 0,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 25,
                    }}
                  >
                    {section.title}
                  </motion.span>
                </motion.button>
              );
            })}

            {/* 움직이는 밑줄 인디케이터 */}
            <motion.div
              className="absolute -bottom-1 h-[2px] bg-sky-400 rounded-full"
              initial={false}
              animate={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
                scaleX: [1, 1.1, 1],
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
                mass: 0.8,
                scaleX: {
                  duration: 0.3,
                }
              }}
              style={{
                boxShadow: "0 0 12px rgba(56, 189, 248, 0.6), 0 0 24px rgba(56, 189, 248, 0.3)",
              }}
            />
          </div>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 overflow-y-auto p-6 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeSection === "overview" && <SectionOverview />}
            {activeSection === "intro" && <SectionIntro />}
            {activeSection === "churn-definition" && <SectionChurnDefinition />}
            {activeSection === "vip-definition" && <SectionVipDefinition />}
            {activeSection === "risk-threshold" && <SectionRiskThreshold />}
            {activeSection === "classification" && <SectionClassification />}
            {activeSection === "validation" && <SectionValidation />}
            {activeSection === "next" && <SectionNext onNavigate={onNavigate} />}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}

// 카운트업 애니메이션 컴포넌트
function CountUp({ target, duration = 1.5, delay = 0, suffix = "" }: { target: number; duration?: number; delay?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / (duration * 1000), 1);
        // easeOutExpo
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setCount(Math.floor(eased * target));
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDone(true);
        }
      };
      animate();
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [target, duration, delay]);

  return (
    <motion.span
      animate={done ? { scale: [1, 1.15, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      {count.toLocaleString()}{suffix}
    </motion.span>
  );
}

// ==========================================
// Mermaid 차트 컴포넌트
// ==========================================
// 분석 단계 정의
interface AnalysisStage {
  id: string;
  subgraphIds: string[]; // 머메이드 subgraph ID 목록
  step: number;
  title: string;
  description: string;
  detail: string;
  color: string;
}

const ANALYSIS_STAGES: AnalysisStage[] = [
  {
    id: "data",
    subgraphIds: ["SOURCE"],
    step: 1,
    title: "데이터 수집",
    description: "4개 테이블에서 원본 데이터를 가져옵니다",
    detail: "거래 260만건, 상품 9.2만건, 쿠폰 사용 기록, 할인/프로모션 데이터를 수집합니다. 핵심은 2,500 가구의 24개월간 전체 구매 여정입니다.",
    color: "#64748b",
  },
  {
    id: "join",
    subgraphIds: ["JOIN", "AGG"],
    step: 2,
    title: "결합 & 집계",
    description: "테이블을 결합하고 고객 단위로 집계합니다",
    detail: "PRODUCT_ID로 카테고리 정보를 붙이고, STORE_ID로 매장별 방문을 집계합니다. 고객(household_key) 기준으로 방문 빈도, 카테고리 다양성, 쿠폰/할인 경험을 계산합니다.",
    color: "#475569",
  },
  {
    id: "how",
    subgraphIds: ["STAGE1"],
    step: 3,
    title: "HOW: 등급 분류",
    description: "고객이 어떻게 변하는지 추적합니다",
    detail: "방문 간격(이번 방문 - 지난 방문)을 계산하고, 25일 이상 안 온 횟수를 이탈로 카운트합니다. 이를 기반으로 VIP / 충성 / 활성 / 위험 / 이탈 5등급으로 분류합니다.",
    color: "#3b82f6",
  },
  {
    id: "why",
    subgraphIds: ["STAGE2"],
    step: 4,
    title: "WHY: 코호트 분석",
    description: "왜 그렇게 변했는지 원인을 찾습니다",
    detail: "가입 후 첫 30일의 매장 방문 패턴만 추출합니다. 대형/중형/소형 매장 방문 여부로 7개 코호트(111, 110, 100...)를 생성하고, 18개월 뒤 등급과 교차분석합니다.",
    color: "#22c55e",
  },
];

// 기술 도움말 데이터
interface TechHelp {
  name: string;
  brief: string;
  detail: string;
  usedFor: string;
  icon: string;
}

const ANALYSIS_TECH_HELP: TechHelp[] = [
  {
    name: "Kruskal-Wallis H Test",
    brief: "비모수 검정",
    detail: "5개 등급(VIP~이탈)의 방문 횟수가 '우연히 달라 보이는 건지' 아니면 '진짜 다른 건지' 판별합니다. 정규분포가 아닌 데이터에서도 사용 가능한 검정법입니다.",
    usedFor: "등급별 방문 빈도 차이 검증 → p < 0.001 (99.9% 확률로 유의미한 차이)",
    icon: "📐",
  },
  {
    name: "Chi-Square Test",
    brief: "독립성 검정",
    detail: "두 범주형 변수 사이에 연관이 있는지 확인합니다. '첫 달 매장 패턴'과 '18개월 후 등급'이 서로 관련 있는지를 검증합니다.",
    usedFor: "χ² = 106.02, p < 0.001 → 첫 달 행동이 미래 등급을 예측 가능",
    icon: "📊",
  },
  {
    name: "Kaplan-Meier Survival",
    brief: "생존 분석",
    detail: "의학에서 환자 생존율을 추적하는 방법을 마케팅에 적용했습니다. '고객이 시간이 지나도 계속 방문하는 비율'을 곡선으로 보여줍니다.",
    usedFor: "코호트별 리텐션 비교 → 다매장 탐험가(111) 18개월 생존율 100%",
    icon: "📈",
  },
  {
    name: "RFM 변형 분석",
    brief: "고객 등급화",
    detail: "전통 RFM은 최근성(R), 빈도(F), 금액(M)을 봅니다. 이 분석에서는 금액 대신 '매장 방문 패턴(대형/중형/소형)'을 사용해 고객을 5등급으로 분류합니다.",
    usedFor: "VIP(2.8%), 충성(15.7%), 활성(39.6%), 위험(20.5%), 이탈(21.4%)",
    icon: "🏷️",
  },
  {
    name: "Point-biserial Correlation",
    brief: "이진-연속 상관",
    detail: "이진 변수(예: 쿠폰 사용 O/X)와 연속 변수(예: 등급 점수) 간 상관을 측정합니다. Pearson 상관의 특수 형태로, r=0이면 무관, ±1이면 완벽한 상관입니다.",
    usedFor: "6개 경험 요인 × 5개 전환 유형 상관 분석 → 쿠폰(r=0.150), 다매장(r=0.165)",
    icon: "🔗",
  },
  {
    name: "LightGBM",
    brief: "ML 등급 예측",
    detail: "Gradient Boosted Decision Trees의 경량 구현체입니다. 여러 결정 트리를 순차적으로 학습시켜 이전 트리의 오차를 보완합니다. 테이블 데이터에서 딥러닝보다 우수한 성능을 보입니다.",
    usedFor: "12개 피처로 1/3/6개월 후 등급 예측 → 정확도 66.1% (랜덤 20% 대비 3.3배)",
    icon: "🌳",
  },
  {
    name: "SHAP Analysis",
    brief: "ML 해석",
    detail: "게임이론의 Shapley Value를 ML에 적용한 해석 기법입니다. '이 고객이 이탈로 예측된 이유'를 각 변수의 기여도로 분해합니다. 블랙박스 모델을 설명 가능하게 만듭니다.",
    usedFor: "SHAP Top 5: 방문간격 > 현재등급 > 방문공백 > 월방문수 > 누적방문",
    icon: "🔍",
  },
  {
    name: "Walk-forward Validation",
    brief: "시계열 교차검증",
    detail: "일반 교차검증은 미래 데이터로 과거를 예측하는 '데이터 누수'가 발생합니다. Walk-forward는 항상 과거로 학습→미래를 예측하는 시계열 전용 검증법입니다.",
    usedFor: "5개 기간에 걸쳐 학습→예측 반복, 실전과 동일한 조건에서 정확도 측정",
    icon: "⏩",
  },
];

const VIZ_TECH_HELP: TechHelp[] = [
  {
    name: "Next.js 16 + React 19",
    brief: "풀스택 프레임워크",
    detail: "서버에서 HTML을 미리 만들어 보내주므로 초기 로딩이 빠릅니다. Turbopack은 코드 수정 시 즉시 반영되는 빌드 도구입니다.",
    usedFor: "대시보드 전체 구조, 페이지 라우팅, 서버 사이드 렌더링",
    icon: "⚡",
  },
  {
    name: "Canvas API",
    brief: "고성능 그래픽",
    detail: "HTML 요소를 하나하나 만드는 대신, 화면에 직접 그림을 그립니다. 수천 개의 데이터 포인트도 부드럽게 애니메이션할 수 있습니다.",
    usedFor: "레이싱 차트, 산키 다이어그램, 매장 흐름 애니메이션",
    icon: "🎨",
  },
  {
    name: "Framer Motion",
    brief: "선언적 애니메이션",
    detail: "'어디서 어디로 이동'만 지정하면 자연스러운 스프링 물리 기반 애니메이션을 자동 생성합니다. 코드 한 줄로 복잡한 전환 효과를 구현합니다.",
    usedFor: "탭 전환, 카드 등장, 모달 열기/닫기 애니메이션",
    icon: "✨",
  },
  {
    name: "Mermaid.js",
    brief: "텍스트→다이어그램",
    detail: "마크다운처럼 텍스트를 작성하면 자동으로 플로차트, 시퀀스 다이어그램 등을 SVG로 변환합니다. 코드만으로 다이어그램을 관리할 수 있습니다.",
    usedFor: "분석 파이프라인 시각화 (이 페이지의 데이터 흐름도)",
    icon: "🧜",
  },
  {
    name: "Tailwind CSS",
    brief: "유틸리티 스타일링",
    detail: "CSS 파일을 따로 만들지 않고, HTML 클래스로 직접 스타일을 지정합니다. 'text-white', 'bg-black' 같은 클래스를 조합해 빠르게 디자인합니다.",
    usedFor: "전체 UI 디자인, 반응형 레이아웃, 다크 테마",
    icon: "🎯",
  },
];

function TechItemWithTooltip({ tech }: { tech: TechHelp }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={itemRef}
      className="relative group/tech"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-start gap-1.5 cursor-help">
        <span className="text-white font-medium flex items-center gap-1">
          {tech.name}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500 group-hover/tech:text-sky-400 transition-colors flex-shrink-0">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </span>
        <div className="text-slate-400 mt-0.5">{tech.brief}</div>
      </div>

      {/* 도움말 팝업 */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bottom-full left-0 mb-2"
            style={{ width: "max(100%, 320px)" }}
          >
            <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-600/60 rounded-lg p-3 shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_1px_rgba(255,255,255,0.1)]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{tech.icon}</span>
                <span className="text-white font-semibold text-xs">{tech.name}</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed mb-2">{tech.detail}</p>
              <div className="flex items-start gap-1.5 pt-2 border-t border-slate-700/50">
                <span className="text-sky-400 text-[10px] font-medium flex-shrink-0 mt-0.5">사용처</span>
                <span className="text-slate-400 text-[10px] leading-relaxed">{tech.usedFor}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MermaidChart({ chart, id }: { chart: string; id: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const modalChartRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDraggingState, setIsDraggingState] = useState(false);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const uniqueId = useRef(`${id}-${Date.now()}`);

  // ESC 키로 모달 닫기, +/- 키로 줌
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsZoomed(false);
      if (e.key === "+" || e.key === "=") setZoomLevel(z => Math.min(z + 0.5, 5));
      if (e.key === "-") setZoomLevel(z => Math.max(z - 0.5, 1));
    };
    if (isZoomed) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isZoomed]);

  // 드래그 패닝
  useEffect(() => {
    if (!isZoomed) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPanOffset({ x: panStart.current.x + dx, y: panStart.current.y + dy });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      setIsDraggingState(false);
      document.body.style.cursor = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isZoomed]);

  // 모달 열 때 줌 200% + 패닝 리셋
  useEffect(() => {
    if (isZoomed) {
      setZoomLevel(2);
      setPanOffset({ x: 0, y: 0 });
    }
  }, [isZoomed]);

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
            padding: 15,
          },
        });

        const { svg } = await mermaid.render(uniqueId.current, chart);
        setSvg(svg);
      } catch (e) {
        console.error("Mermaid render error:", e);
      }
    };

    renderChart();
  }, [chart, id]);

  // 호버 시 SVG subgraph 강조 (배경 rect에만 글로우, 기존 이미지 유지)
  useEffect(() => {
    const chartEl = modalChartRef.current;
    if (!chartEl || !svg || !isZoomed) return;

    const clusters = chartEl.querySelectorAll<SVGGElement>(".cluster");

    // 텍스트 기반으로 단계 → subgraph 매칭
    const stageKeywords: Record<string, string[]> = {
      data: ["원본 데이터", "SOURCE"],
      join: ["데이터 결합", "집계", "JOIN", "AGG"],
      how: ["1단계", "HOW", "STAGE1"],
      why: ["2단계", "WHY", "STAGE2"],
    };

    if (!hoveredStage) {
      // 호버 없음: 모든 cluster rect 원래대로
      clusters.forEach(c => {
        const rect = c.querySelector("rect");
        if (rect) {
          rect.style.transition = "all 0.4s ease";
          rect.style.stroke = "";
          rect.style.strokeWidth = "";
          rect.style.filter = "";
          rect.style.fillOpacity = "";
        }
      });
      return;
    }

    const stage = ANALYSIS_STAGES.find(s => s.id === hoveredStage);
    if (!stage) return;
    const keywords = stageKeywords[hoveredStage] || [];

    clusters.forEach(c => {
      const text = c.textContent || "";
      const matched = keywords.some(kw => text.includes(kw));
      const rect = c.querySelector("rect");
      if (!rect) return;

      rect.style.transition = "all 0.4s ease";

      if (matched) {
        // 매칭: 밝은 테두리 + 글로우
        rect.style.stroke = stage.color;
        rect.style.strokeWidth = "3";
        rect.style.filter = `drop-shadow(0 0 20px ${stage.color}) drop-shadow(0 0 40px ${stage.color}60)`;
        rect.style.fillOpacity = "1";
      } else {
        // 비매칭: 어둡게
        rect.style.stroke = "";
        rect.style.strokeWidth = "";
        rect.style.filter = "";
        rect.style.fillOpacity = "0.3";
      }
    });
  }, [hoveredStage, svg, isZoomed]);

  const isPipelineChart = id === "pipeline-chart";

  return (
    <>
      <div
        className="relative group cursor-zoom-in"
        onClick={() => setIsZoomed(true)}
      >
        <div
          ref={containerRef}
          className="mermaid-container overflow-x-auto [&_svg]:max-w-full transition-opacity group-hover:opacity-70"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        {/* 돋보기 오버레이 */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/25 shadow-[0_0_30px_rgba(56,189,248,0.2)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="11" y1="8" x2="11" y2="14"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
            <span className="text-white/90 text-sm font-medium">클릭하여 확대</span>
          </div>
        </div>
      </div>

      {/* 확대 모달 */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsZoomed(false)}
            className="fixed inset-0 z-50 bg-black/95 cursor-zoom-out"
          >
            {/* 닫기 버튼 */}
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 rounded-lg text-xl"
            >
              ✕
            </button>

            {/* 줌 컨트롤 */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 border border-slate-600">
              <button
                onClick={(e) => { e.stopPropagation(); setZoomLevel(z => Math.max(z - 0.5, 1)); }}
                className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded text-lg font-bold"
              >
                −
              </button>
              <span className="text-white text-sm w-14 text-center font-mono">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={(e) => { e.stopPropagation(); setZoomLevel(z => Math.min(z + 0.5, 5)); }}
                className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded text-lg font-bold"
              >
                +
              </button>
            </div>

            {/* 2열 레이아웃: 차트 + 단계 설명 */}
            <div className="w-full h-full flex pt-16 pb-8" onClick={(e) => e.stopPropagation()}>
              {/* 왼쪽: 차트 영역 */}
              <div
                className={`${isPipelineChart ? "flex-1 min-w-0" : "w-full"} overflow-hidden`}
                style={{ cursor: isDraggingState ? 'grabbing' : 'grab' }}
                onWheel={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    if (e.deltaY < 0) setZoomLevel(z => Math.min(z + 0.25, 5));
                    else setZoomLevel(z => Math.max(z - 0.25, 1));
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  isDragging.current = true;
                  setIsDraggingState(true);
                  dragStart.current = { x: e.clientX, y: e.clientY };
                  panStart.current = { x: panOffset.x, y: panOffset.y };
                  document.body.style.cursor = 'grabbing';
                }}
              >
                <div className="min-h-full flex items-center justify-center px-4">
                  <div
                    ref={modalChartRef}
                    style={{
                      transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                      transformOrigin: 'center center',
                      transition: isDraggingState ? 'none' : 'transform 0.2s ease',
                    }}
                    className="[&_svg]:max-w-full [&_svg]:h-auto"
                    dangerouslySetInnerHTML={{ __html: svg }}
                  />
                </div>
              </div>

              {/* 오른쪽: 단계별 설명 (파이프라인 차트일 때만) */}
              {isPipelineChart && (
                <div className="w-[380px] max-xl:w-[280px] flex-shrink-0 px-6 overflow-y-auto">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-white mb-1">분석 프로세스</h3>
                    <p className="text-sm text-white/50">각 단계를 마우스 올려 왼쪽 다이어그램에서 확인하세요</p>
                  </div>

                  <div className="space-y-3">
                    {ANALYSIS_STAGES.map((stage) => {
                      const isHovered = hoveredStage === stage.id;
                      return (
                        <motion.div
                          key={stage.id}
                          onMouseEnter={() => setHoveredStage(stage.id)}
                          onMouseLeave={() => setHoveredStage(null)}
                          className={`relative p-4 rounded-xl border cursor-default transition-all duration-300 ${
                            isHovered
                              ? "bg-white/10 border-white/30"
                              : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06]"
                          }`}
                          animate={{
                            scale: isHovered ? 1.02 : 1,
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          {/* 글로우 효과 */}
                          {isHovered && (
                            <motion.div
                              className="absolute inset-0 rounded-xl pointer-events-none"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              style={{
                                boxShadow: `0 0 20px ${stage.color}30, inset 0 0 20px ${stage.color}10`,
                              }}
                            />
                          )}

                          {/* 단계 번호 + 제목 */}
                          <div className="flex items-center gap-3 mb-2 relative">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                              style={{
                                backgroundColor: isHovered ? stage.color : `${stage.color}60`,
                                transition: "background-color 0.3s",
                              }}
                            >
                              {stage.step}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white">{stage.title}</div>
                              <div className="text-xs text-white/50">{stage.description}</div>
                            </div>
                          </div>

                          {/* 상세 설명 (호버 시 확장) */}
                          <AnimatePresence>
                            {isHovered && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-2 mt-2 border-t border-white/10">
                                  <p className="text-xs text-white/70 leading-relaxed">{stage.detail}</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* 하단 화살표 흐름 요약 */}
                  <div className="mt-6 p-4 bg-white/[0.03] rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <span className="px-2 py-1 bg-slate-700/60 rounded text-white/80">데이터</span>
                      <span className="text-white/30">→</span>
                      <span className="px-2 py-1 bg-slate-700/60 rounded text-white/80">집계</span>
                      <span className="text-white/30">→</span>
                      <span className="px-2 py-1 bg-blue-900/60 rounded text-blue-300">등급</span>
                      <span className="text-white/30">→</span>
                      <span className="px-2 py-1 bg-green-900/60 rounded text-green-300">코호트</span>
                    </div>
                    <div className="text-[10px] text-white/40 mt-2">결론: 첫 1개월 매장 패턴이 18개월 등급을 예측 (p &lt; 0.001)</div>
                  </div>
                </div>
              )}
            </div>

            {/* 안내 */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/40 text-xs">
              Ctrl+휠로 확대/축소 · 바깥 클릭 또는 ESC로 닫기
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ==========================================
// 섹션 0: 분석개요
// ==========================================
function SectionOverview() {
  const pipelineChart = `
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

  return (
    <div className="relative min-h-[400px] flex flex-col justify-center">
      <div className="max-w-6xl">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight"
        >
          분석개요
        </motion.h1>

        {/* 데이터셋 + 2단계 요약 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex gap-4 mb-6"
        >
          <div className="flex-1">
            <div className="text-slate-500 text-xs mb-1">Dataset</div>
            <div className="text-white font-medium">Dunnhumby Complete Journey</div>
            <div className="text-slate-500 text-sm">2,500 가구 × 24개월 × 260만 거래</div>
          </div>
          <div className="bg-slate-800/60 border border-slate-600/50 rounded-lg px-4 py-2">
            <div className="text-slate-400 text-xs font-medium">1단계: HOW</div>
            <div className="text-white text-sm">방문 빈도 → 5등급</div>
          </div>
          <div className="bg-slate-800/60 border border-slate-600/50 rounded-lg px-4 py-2">
            <div className="text-slate-400 text-xs font-medium">2단계: WHY</div>
            <div className="text-white text-sm">첫 1개월 → 코호트</div>
          </div>
        </motion.div>

        {/* 파이프라인 + 설명 (2컬럼) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex gap-6 mb-6"
        >
          {/* Mermaid 차트 */}
          <div className="flex-1 bg-slate-900/70 rounded-lg p-4 border border-slate-600/40">
            <MermaidChart chart={pipelineChart} id="pipeline-chart" />
          </div>

          {/* 설명 패널 */}
          <div className="w-[500px] max-xl:w-[380px] flex-shrink-0 space-y-3">
            {/* 원본 데이터 설명 */}
            <div className="bg-slate-800/70 border border-slate-600/50 rounded-lg p-4">
              <div className="text-slate-200 text-sm font-medium mb-2">📁 사용 데이터 (4개 테이블)</div>
              <div className="text-slate-300 text-xs leading-relaxed space-y-1.5">
                <div><strong className="text-white">transaction_data</strong> <span className="text-slate-500">260만건</span> — household_key, DAY, STORE_ID, PRODUCT_ID, SALES_VALUE</div>
                <div><strong className="text-white">product</strong> <span className="text-slate-500">9.2만건</span> — PRODUCT_ID, DEPARTMENT (카테고리)</div>
                <div><strong className="text-white">coupon</strong> <span className="text-slate-500">쿠폰 사용 기록</span> — 쿠폰 효과 분석 (r=0.150***)</div>
                <div><strong className="text-white">causal_data</strong> <span className="text-slate-500">할인/프로모션</span> — 할인 경험 분석</div>
              </div>
              <div className="text-slate-400 text-xs mt-2 pt-2 border-t border-slate-700">
                <div>→ <strong className="text-white">PRODUCT_ID</strong> 조인 — 카테고리 다양성</div>
                <div>→ <strong className="text-white">STORE_ID</strong> 집계 — 매장별/다매장 분석</div>
                <div>→ <strong className="text-white">household_key</strong> 조인 — 쿠폰/할인 경험</div>
              </div>
            </div>

            {/* 1단계 설명 */}
            <div className="bg-slate-800/70 border border-slate-600/50 rounded-lg p-4">
              <div className="text-slate-200 text-sm font-medium mb-2">🔍 1단계: HOW (어떻게 변하는가)</div>
              <div className="text-slate-300 text-xs leading-relaxed space-y-1">
                <div><span className="text-white">방문 간격</span> — 이번 방문 - 지난 방문 = 며칠만에?</div>
                <div><span className="text-white">이탈 횟수</span> — 25일 이상 안 온 횟수 카운트</div>
                <div><span className="text-white">카테고리 다양성</span> — DEPARTMENT별 구매 카테고리 수</div>
                <div><span className="text-white">매장별 매출</span> — STORE_ID별 매출 집계</div>
                <div><span className="text-white">5등급 분류</span> — VIP/충성/활성/위험/이탈</div>
              </div>
            </div>

            {/* 2단계 설명 */}
            <div className="bg-slate-800/70 border border-slate-600/50 rounded-lg p-4">
              <div className="text-slate-200 text-sm font-medium mb-2">🔬 2단계: WHY (왜 변하는가)</div>
              <div className="text-slate-300 text-sm leading-relaxed">
                <span className="text-white">첫 30일</span> — 가입 후 30일 이내 방문만 필터<br/>
                <span className="text-white">매장 분류</span> — 고객수 100+ → 대형<br/>
                <span className="text-white">패턴 생성</span> — 대형+중형+소형 → "111"
              </div>
            </div>

            {/* 제약사항 */}
            <div className="bg-slate-800/70 border border-slate-500/40 rounded-lg p-4">
              <div className="text-slate-400 text-sm font-medium mb-2">⚠️ 데이터 분석 제약사항</div>
              <div className="text-slate-400 text-xs leading-relaxed space-y-1">
                <div className="whitespace-nowrap">• <span className="text-slate-300">거주지 정보 없음</span> — 근접성 분석 불가</div>
                <div className="whitespace-nowrap">• <span className="text-slate-300">인구통계 제한</span> — hh_demographic 800건만 → 미사용</div>
                <div className="whitespace-nowrap">• <span className="text-slate-300">매장 위치 없음</span> — 상권/지역 분석 불가</div>
                <div className="whitespace-nowrap">• <span className="text-slate-300">시계열 한계</span> — 24개월로 장기 패턴 검증 제한</div>
                <div className="whitespace-nowrap">• <span className="text-slate-300">외부 요인 미반영</span> — 경쟁사, 계절성 등 통제 불가</div>
              </div>
            </div>

            {/* 분석 기술 */}
            <div className="bg-slate-800/70 border border-slate-600/50 rounded-lg p-4">
              <div className="text-slate-200 text-sm font-medium mb-2.5 flex items-center gap-1.5">
                📊 분석 기술
                <span className="text-slate-500 text-[10px] font-normal ml-auto">마우스를 올려 상세 설명</span>
              </div>
              <div className="text-slate-300 text-xs leading-relaxed space-y-2.5">
                {ANALYSIS_TECH_HELP.map((tech) => (
                  <TechItemWithTooltip key={tech.name} tech={tech} />
                ))}
              </div>
            </div>

            {/* 시각화 기술 */}
            <div className="bg-slate-800/70 border border-slate-600/50 rounded-lg p-4">
              <div className="text-slate-200 text-sm font-medium mb-2.5 flex items-center gap-1.5">
                ⚛️ 시각화 기술
                <span className="text-slate-500 text-[10px] font-normal ml-auto">마우스를 올려 상세 설명</span>
              </div>
              <div className="text-slate-300 text-xs leading-relaxed space-y-2.5">
                {VIZ_TECH_HELP.map((tech) => (
                  <TechItemWithTooltip key={tech.name} tech={tech} />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

// ==========================================
// 섹션 1: 고객은 어떻게 변하는가?
// ==========================================
function SectionIntro() {
  return (
    <div className="relative min-h-[400px] flex flex-col justify-center">
      <div className="max-w-3xl">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight"
        >
          고객은 어떻게 변하는가?
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="space-y-3 text-base text-slate-300 mb-10"
        >
          <p>어떤 고객은 단골이 되고, 어떤 고객은 떠난다.</p>
          <p>우리는 그 <span className="text-sky-400 font-medium">'변화의 패턴'</span>을 추적하고자 한다.</p>
          <p>매출이나 객단가가 아닌, <span className="text-sky-400 font-medium">방문 행위 그 자체</span>에 집중한다.</p>
          <p className="text-slate-500">행동이 바뀌면 매출은 따라온다.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="space-y-2"
        >
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-light text-white">
              <CountUp target={CONSTANTS.TOTAL_CUSTOMERS} duration={1.2} delay={0.8} suffix="명" />
            </span>
            <span className="text-sm text-slate-500">분석 대상</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-light text-white">
              <CountUp target={CONSTANTS.TOTAL_TRANSACTIONS} duration={2.0} delay={1.0} suffix="건" />
            </span>
            <span className="text-sm text-slate-500">총 거래</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-light text-white">
              <CountUp target={CONSTANTS.TOTAL_VISITS} duration={1.5} delay={1.2} suffix="회" />
            </span>
            <span className="text-sm text-slate-500">총 방문</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-light text-white">
              <CountUp target={CONSTANTS.PERIOD_MONTHS} duration={0.8} delay={1.4} suffix="개월" />
            </span>
            <span className="text-sm text-slate-500">추적 기간</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ==========================================
// 섹션 2: 언제 '떠났다'고 볼 것인가?
// ==========================================
function SectionChurnDefinition() {
  return (
    <div className="relative min-h-[400px] flex flex-col justify-center">
      <div className="max-w-4xl">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight"
        >
          언제 '떠났다'고 볼 것인가?
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="space-y-2 text-base text-slate-300 mb-6"
        >
          <p>고객의 95%는 22일 이내에 재방문한다.</p>
          <p>따라서 <span className="text-white font-medium">25일</span>을 이탈의 기준으로 정의한다.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
          animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
          transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
          className="rounded-lg overflow-hidden mb-6"
        >
          <img
            src="/images/overview/01_interval_histogram.png?v=2"
            alt="방문 간격 분포"
            className="w-full h-auto"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="grid grid-cols-3 gap-6"
        >
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-lg p-4">
            <div className="text-2xl font-light text-white">3일</div>
            <div className="text-slate-500 text-xs mt-1">중앙값</div>
          </div>
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-lg p-4">
            <div className="text-2xl font-light text-white">22일</div>
            <div className="text-slate-500 text-xs mt-1">95%ile</div>
          </div>
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-lg p-4">
            <div className="text-2xl font-light text-white/60">25일+</div>
            <div className="text-slate-500 text-xs mt-1">이탈 기준</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ==========================================
// 섹션 3: 누가 진정한 단골인가?
// ==========================================
function SectionVipDefinition() {
  return (
    <div className="relative min-h-[400px] flex flex-col justify-center">
      <div className="max-w-4xl">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight"
        >
          누가 진정한 단골인가?
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="space-y-2 text-base text-slate-300 mb-6"
        >
          <p>이탈 0회 고객 463명 중 방문 횟수 <span className="text-white font-medium">85%ile = 362회</span></p>
          <p>362회 이상 방문 = <span className="text-white font-medium">상위 15% → VIP</span></p>
          <p className="text-slate-400">"많이 사는 고객"이 아니라 "자주 오는 고객"</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="rounded-lg overflow-hidden mb-6"
        >
          <img
            src="/images/overview/03_vip_definition.png?v=2"
            alt="VIP 정의"
            className="w-full h-auto"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="grid grid-cols-2 gap-6"
        >
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-lg p-4">
            <div className="text-white/50 text-xs font-medium mb-2">VIP</div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">1회 평균</span>
                <span className="text-white">${VIP_PROFILE.comparison.vip.avgAmount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">총 방문</span>
                <span className="text-white">{VIP_PROFILE.comparison.vip.totalVisits}회</span>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-lg p-4">
            <div className="text-white/50 text-xs font-medium mb-2">충성</div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">1회 평균</span>
                <span className="text-white">${VIP_PROFILE.comparison.loyal.avgAmount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">총 방문</span>
                <span className="text-white">{VIP_PROFILE.comparison.loyal.totalVisits}회</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ==========================================
// 섹션 4: 언제 개입해야 하는가?
// ==========================================
function SectionRiskThreshold() {
  return (
    <div className="relative min-h-[400px] flex flex-col justify-center">
      <div className="max-w-4xl">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight"
        >
          언제 개입해야 하는가?
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="space-y-2 text-base text-slate-300 mb-6"
        >
          <p>8일 전후로 이탈 확률이 <span className="text-white font-medium">5.6배</span> 급증한다.</p>
          <p className="text-slate-400">8일 경고 → 25일 이탈 전 17일의 개입 기회</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="rounded-lg overflow-hidden mb-6"
        >
          <img
            src="/images/overview/02_risk_threshold_8days.png?v=3"
            alt="8일 기준 이탈 확률"
            className="w-full h-auto"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="grid grid-cols-3 gap-6"
        >
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-lg p-4">
            <div className="text-2xl font-light text-white">8일</div>
            <div className="text-slate-500 text-xs mt-1">위험 임계점</div>
          </div>
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-lg p-4">
            <div className="text-2xl font-light text-white">5.6배</div>
            <div className="text-slate-500 text-xs mt-1">이탈 확률 증가</div>
          </div>
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-lg p-4">
            <div className="text-2xl font-light text-white">17일</div>
            <div className="text-slate-500 text-xs mt-1">이내 마케팅 개입</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ==========================================
// 섹션 5: 변화의 기준
// ==========================================
function SectionClassification() {
  const totalSales = GRADES.reduce((sum, g) => sum + g.avgSales * g.count, 0);

  return (
    <div className="relative min-h-[400px] flex flex-col justify-center">
      <div className="max-w-4xl">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight"
        >
          변화의 기준은?
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-base text-slate-300 mb-6"
        >
          <p>이탈 경험 여부와 최근 방문 시점으로 5단계 분류</p>
        </motion.div>

        {/* 그래프 (위) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="rounded-lg overflow-hidden mb-4"
        >
          <img
            src="/images/overview/04_grade_distribution.png?v=3"
            alt="5등급 분류 결과"
            className="w-full h-auto"
          />
        </motion.div>

        {/* 매출 표 (아래) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="overflow-hidden rounded-lg border border-slate-700/30 bg-slate-800/20"
        >
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400">
                <th className="text-left py-2 px-2">등급</th>
                <th className="text-right py-2 px-2">인원</th>
                <th className="text-right py-2 px-2">비율</th>
                <th className="text-right py-2 px-2">방문</th>
                <th className="text-right py-2 px-2">1인당 매출</th>
                <th className="text-right py-2 px-2">매출 비중</th>
              </tr>
            </thead>
            <tbody>
              {GRADES.map((grade) => {
                const gradeSales = grade.avgSales * grade.count;
                const salesPct = (gradeSales / totalSales * 100).toFixed(1);
                return (
                  <tr key={grade.id} className="border-t border-slate-700/20">
                    <td className="py-1.5 px-2 text-white">{grade.label}</td>
                    <td className="text-right py-1.5 px-2 text-slate-300">{grade.count}</td>
                    <td className="text-right py-1.5 px-2 text-slate-400">{grade.percentage}%</td>
                    <td className="text-right py-1.5 px-2 text-slate-300">{grade.avgVisits.toFixed(0)}</td>
                    <td className="text-right py-1.5 px-2 text-white">${grade.avgSales.toLocaleString()}</td>
                    <td className="text-right py-1.5 px-2 text-slate-400">{salesPct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  );
}

// ==========================================
// 섹션 6: 분류가 유의미한가?
// ==========================================
function SectionValidation() {
  const { kruskalWallis } = STATISTICAL_VALIDATION;
  const [viewTab, setViewTab] = useState<"stats" | "racing">("stats");

  return (
    <div className="relative min-h-[400px] flex flex-col justify-center">
      <div className="max-w-4xl">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight"
        >
          분류가 유의미한가?
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="space-y-2 text-base text-slate-300 mb-6"
        >
          <p>Kruskal-Wallis H = {kruskalWallis.visitCount.h.toLocaleString()}, p &lt; 0.001</p>
          <p className="text-slate-400">5개 등급은 통계적으로 명확히 구분된다.</p>
        </motion.div>

        {/* 탭 선택 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex gap-2 mb-4"
        >
          <button
            onClick={() => setViewTab("stats")}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
              viewTab === "stats"
                ? "bg-white/15 text-white"
                : "bg-white/5 text-white/50 hover:text-white/80"
            }`}
          >
            통계 검증
          </button>
          <button
            onClick={() => setViewTab("racing")}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
              viewTab === "racing"
                ? "bg-white/15 text-white"
                : "bg-white/5 text-white/50 hover:text-white/80"
            }`}
          >
            레이싱
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {viewTab === "stats" ? (
            <div>
              <div className="rounded-lg overflow-hidden mb-4">
                <img
                  src="/images/overview/05_statistical_validation.png?v=2"
                  alt="통계적 검증"
                  className="w-full h-auto"
                />
              </div>
              <div className="text-xs text-slate-500 space-y-1">
                <p><span className="text-slate-400">H = 186,642</span> : 검정 통계량. 값이 클수록 그룹 간 차이가 큼</p>
                <p><span className="text-slate-400">p &lt; 0.001</span> : 이 차이가 우연일 확률 0.1% 미만 → 99.9% 확신으로 5개 등급은 다른 집단</p>
              </div>
            </div>
          ) : (
            <MiniRacingChart />
          )}
        </motion.div>
      </div>
    </div>
  );
}

// 미니 레이싱 캔버스 (점들이 레인을 따라 이동, 8배속)
function MiniRacingChart() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const data = racingDataV2 as {
    metadata: { maxDay: number; finalStageCounts: Record<string, number> };
    customers: Array<{
      id: number;
      visitDays: number[];
      stateChanges: Array<{ day: number; state: string }>;
      finalStage: string;
      totalVisits: number;
    }>;
  };

  const maxDay = data.metadata.maxDay;

  // 대표 고객 100명 샘플링 (각 등급 20명)
  const sampledCustomers = useRef((() => {
    const stages = ["vip", "loyal", "active", "risk", "churn"];
    const sampled: typeof data.customers = [];
    stages.forEach((stage) => {
      const stageCustomers = data.customers.filter((c) => c.finalStage === stage);
      const avgVisits = stageCustomers.reduce((sum, c) => sum + c.totalVisits, 0) / stageCustomers.length;
      const sorted = [...stageCustomers].sort(
        (a, b) => Math.abs(a.totalVisits - avgVisits) - Math.abs(b.totalVisits - avgVisits)
      );
      sampled.push(...sorted.slice(0, 20));
    });
    return sampled;
  })()).current;

  const LANES = [
    { id: "vip", label: "VIP", color: "#fbbf24" },
    { id: "loyal", label: "충성", color: "#22c55e" },
    { id: "active", label: "활성", color: "#3b82f6" },
    { id: "risk", label: "위험", color: "#f97316" },
    { id: "churn", label: "이탈", color: "#6b7280" },
  ];

  const stateToLane = (state: string, finalStage: string, isLast: boolean): number => {
    if (isLast) {
      const idx = LANES.findIndex((l) => l.id === finalStage);
      return idx >= 0 ? idx : 2;
    }
    switch (state) {
      case "vip_candidate": return 0;
      case "loyal_candidate": return 1;
      case "active": return 2;
      case "risk": return 3;
      case "churn": return 4;
      default: return 2;
    }
  };

  const getCustomerState = (customer: typeof sampledCustomers[0], day: number): string => {
    let state = "waiting";
    for (const change of customer.stateChanges) {
      if (change.day <= day) state = change.state;
      else break;
    }
    return state;
  };

  // 캔버스 렌더링
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth;
    const height = 250;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const laneHeight = (height - 40) / 5;
    const isLastDay = currentDay >= maxDay;

    // 배경
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, width, height);

    // 레인 배경 및 라벨
    LANES.forEach((lane, idx) => {
      const y = 20 + idx * laneHeight;
      ctx.fillStyle = `${lane.color}15`;
      ctx.fillRect(0, y, width, laneHeight);

      ctx.strokeStyle = `${lane.color}30`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y + laneHeight);
      ctx.lineTo(width, y + laneHeight);
      ctx.stroke();

      ctx.fillStyle = lane.color;
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(lane.label, 8, y + laneHeight / 2 + 3);
    });

    // 현재 Day 라인
    const dayX = 50 + ((currentDay - 1) / (maxDay - 1)) * (width - 70);
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(dayX, 20);
    ctx.lineTo(dayX, height - 20);
    ctx.stroke();

    // 레인별 고객 인덱스 (Y 분산용)
    const laneCounters: Record<string, number> = { vip: 0, loyal: 0, active: 0, risk: 0, churn: 0 };
    const customerYOffset: Record<number, number> = {};

    sampledCustomers.forEach((customer) => {
      const stage = customer.finalStage;
      customerYOffset[customer.id] = laneCounters[stage];
      laneCounters[stage]++;
    });

    // 고객별 모든 방문 점 누적 렌더링
    sampledCustomers.forEach((customer) => {
      // 최종 등급으로 고정 레인
      const laneIdx = LANES.findIndex((l) => l.id === customer.finalStage);
      const lane = LANES[laneIdx >= 0 ? laneIdx : 2];
      const laneY = 20 + (laneIdx >= 0 ? laneIdx : 2) * laneHeight;

      // 레인 내 Y 오프셋 (고객별 고정)
      const idx = customerYOffset[customer.id] || 0;
      const total = laneCounters[customer.finalStage] || 1;
      const ySpread = laneHeight * 0.8;
      const offsetY = ((idx / (total - 1 || 1)) - 0.5) * ySpread + laneHeight / 2;

      // 현재 day까지의 모든 방문 점 그리기
      const visitsUntilDay = customer.visitDays.filter((d) => d <= currentDay);

      visitsUntilDay.forEach((visitDay) => {
        const x = 50 + ((visitDay - 1) / (maxDay - 1)) * (width - 70);
        const age = currentDay - visitDay;

        // 점 크기와 투명도 (최근일수록 크고 밝게)
        let radius = 2;
        let alpha = 0.7;

        if (age === 0) {
          radius = 4;
          alpha = 1;
        } else if (age <= 10) {
          radius = 3;
          alpha = 0.85;
        }

        ctx.beginPath();
        ctx.arc(x, laneY + offsetY, radius, 0, Math.PI * 2);
        ctx.fillStyle = lane.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
      });
    });

    ctx.globalAlpha = 1;

    // Day 표시
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Day ${currentDay}`, dayX, height - 5);
  }, [currentDay, maxDay, sampledCustomers]);

  // 8배속 애니메이션
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const animate = (time: number) => {
      if (time - lastTimeRef.current > 16) {
        lastTimeRef.current = time;
        setCurrentDay((d) => {
          if (d >= maxDay) {
            setIsPlaying(false);
            return maxDay;
          }
          return Math.min(d + 8, maxDay);
        });
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, maxDay]);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentDay(1);
  };

  return (
    <div className="bg-black/30 rounded-lg p-4 border border-white/10">
      {/* 컨트롤 */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <span className="text-white text-xs">{isPlaying ? "⏸" : "▶"}</span>
        </button>
        <button
          onClick={handleReset}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <span className="text-white text-xs">↺</span>
        </button>
        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-sky-500"
            style={{ width: `${(currentDay / maxDay) * 100}%` }}
          />
        </div>
        <div className="text-white/40 text-[10px]">8x</div>
      </div>

      {/* 캔버스 */}
      <div ref={containerRef} className="w-full">
        <canvas ref={canvasRef} />
      </div>

      {/* 최종 결과 */}
      {currentDay >= maxDay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-center text-emerald-400 text-xs"
        >
          ✓ 711일 후 최종 분류 완료
        </motion.div>
      )}
    </div>
  );
}

// ==========================================
// 섹션 7: 왜 변하는가?
// ==========================================
function SectionNext({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  return (
    <div className="relative min-h-[400px] flex flex-col justify-center">
      <div className="max-w-4xl">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight"
        >
          왜 변하는가?
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="space-y-2 text-base text-slate-300 mb-10"
        >
          <p>왜 어떤 고객은 VIP가 되고, 어떤 고객은 이탈하는가?</p>
          <p className="text-slate-400">어떤 경험이 등급 전환을 만드는가?</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid grid-cols-3 gap-4"
        >
          <button
            onClick={() => onNavigate?.("cohort")}
            className="bg-slate-800/40 hover:bg-slate-700/40 backdrop-blur-sm rounded-lg p-5 text-left transition-all group"
          >
            <div className="text-white font-medium group-hover:text-white/80 transition-colors">Cohort</div>
            <div className="text-slate-500 text-xs mt-1">첫 1개월 패턴</div>
          </button>
          <button
            onClick={() => onNavigate?.("sankey")}
            className="bg-slate-800/40 hover:bg-slate-700/40 backdrop-blur-sm rounded-lg p-5 text-left transition-all group"
          >
            <div className="text-white font-medium group-hover:text-white/80 transition-colors">Sankey</div>
            <div className="text-slate-500 text-xs mt-1">등급 전환 흐름</div>
          </button>
          <button
            onClick={() => onNavigate?.("funnel")}
            className="bg-slate-800/40 hover:bg-slate-700/40 backdrop-blur-sm rounded-lg p-5 text-left transition-all group"
          >
            <div className="text-white font-medium group-hover:text-white/80 transition-colors">Funnel</div>
            <div className="text-slate-500 text-xs mt-1">상관 효과</div>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
