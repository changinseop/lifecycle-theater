"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { useIsMobile } from "@/hooks/use-media-query";

// Desktop components
import { OverviewView } from "@/components/theater/overview-view";
import { Predictor } from "@/components/theater/predictor";
import { MovieView } from "@/components/theater/movie-view";
import { CohortView } from "@/components/theater/cohort-view";
import { SankeyView } from "@/components/theater/sankey-view";
import { FunnelAnalysisView } from "@/components/theater/funnel-analysis-view";
import { StoreExperienceView } from "@/components/theater/store-experience-view";

// Mobile components
import { OverviewMobile } from "@/components/theater/mobile/overview-mobile";
import { SankeyMobile } from "@/components/theater/mobile/sankey-mobile";
import { CohortMobile } from "@/components/theater/mobile/cohort-mobile";
import { FunnelMobile } from "@/components/theater/mobile/funnel-mobile";
import { StoreMobile } from "@/components/theater/mobile/store-mobile";

const TABS = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "sankey", label: "Sankey", icon: "🔀" },
  { id: "cohort", label: "Cohort", icon: "👥" },
  { id: "funnel", label: "Funnel", icon: "📉" },
  { id: "store", label: "Store", icon: "🏪" },
  { id: "predict", label: "Predict", icon: "🔮" },
  { id: "movie", label: "Movie", icon: "🎬" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    const activeIndex = TABS.findIndex((t) => t.id === activeTab);
    const activeRef = tabRefs.current[activeIndex];
    if (activeRef) {
      setIndicatorStyle({
        left: activeRef.offsetLeft,
        width: activeRef.offsetWidth,
      });
    }
  }, [activeTab]);

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
  };

  // --- Mobile Layout ---
  if (isMobile) {
    return (
      <main className="min-h-screen relative overflow-x-hidden bg-black">
        <div className="px-3 py-2">
          {/* Mobile Tab Navigation */}
          <div className="mb-2 overflow-x-auto scrollbar-hide">
            <div className="relative flex items-center gap-1 p-1 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 w-max min-w-full">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative z-10 flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? "text-white bg-white/15 border border-white/20 shadow-lg"
                      : "text-white/40 active:text-white/70"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Content */}
          <div className={`rounded-xl min-h-[calc(100vh-60px)] overflow-y-auto border border-white/5 ${
            activeTab === "overview"
              ? "bg-black/20 backdrop-blur-[0.5px]"
              : "bg-black/30 backdrop-blur-sm"
          }`}>
            {activeTab === "overview" && <OverviewMobile onNavigate={handleNavigate} />}
            {activeTab === "cohort" && <CohortMobile />}
            {activeTab === "sankey" && <SankeyMobile />}
            {activeTab === "funnel" && <FunnelMobile />}
            {activeTab === "store" && <StoreMobile />}
            {activeTab === "predict" && <Predictor />}
            {activeTab === "movie" && <MovieView />}
          </div>
        </div>
      </main>
    );
  }

  // --- Desktop Layout (unchanged) ---
  return (
    <main className="min-h-screen relative overflow-x-hidden bg-black">
      <div className="container mx-auto px-6 py-3 max-w-[1920px]">
        {/* iOS 스타일 Glass Tab Navigation */}
        <div className="flex items-center justify-between mb-3">
          {/* 왼쪽: Glass 컨테이너 */}
          <div className="relative flex items-center gap-0.5 p-1 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
            {/* 움직이는 인디케이터 (유리 효과) */}
            <motion.div
              className="absolute top-1 bottom-1 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 shadow-lg"
              initial={false}
              animate={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
              }}
              style={{
                boxShadow: "0 0 20px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            />

            {/* 탭 버튼들 */}
            {TABS.map((tab, i) => (
              <button
                key={tab.id}
                ref={(el) => { tabRefs.current[i] = el; }}
                onClick={() => setActiveTab(tab.id)}
                className={`relative z-10 px-4 py-1.5 text-xs font-medium transition-colors duration-200 ${
                  activeTab === tab.id
                    ? "text-white"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 오른쪽: 타이틀 */}
          <div className="text-right">
            <span className="text-sm font-medium text-white/70">INNER CIRCLE</span>
            <span className="text-white/30 mx-2">:</span>
            <span className="text-sm text-white/50">데이터 분석 Course 4기</span>
          </div>
        </div>

        {/* Visualization Content */}
        <div
          className="rounded-2xl p-6 flex flex-col bg-black/30 backdrop-blur-sm border border-white/5 overflow-y-auto"
          style={{ height: "calc(100vh - 80px)", minHeight: "600px" }}
        >
          {activeTab === "overview" && <OverviewView onNavigate={handleNavigate} />}
          {activeTab === "cohort" && <CohortView />}
          {activeTab === "sankey" && <SankeyView />}
          {activeTab === "funnel" && <FunnelAnalysisView onStateSelect={setSelectedState} />}
          {activeTab === "store" && <StoreExperienceView onStateSelect={setSelectedState} />}
          {activeTab === "predict" && <Predictor />}
          {activeTab === "movie" && <MovieView />}
        </div>
      </div>
    </main>
  );
}
