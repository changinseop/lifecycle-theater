"use client";

import { StoreTrafficView } from "./store/store-traffic-view";

interface StoreExperienceViewProps {
  onStateSelect?: (state: string | null) => void;
}

export function StoreExperienceView({ onStateSelect }: StoreExperienceViewProps) {
  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 mb-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🏪</span>
            매장 분석
          </h1>
          <p className="text-xs text-white/50 mt-0.5">
            569개 매장 · 2,500명 고객 · 18개월 추적
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        <StoreTrafficView />
      </div>
    </div>
  );
}
