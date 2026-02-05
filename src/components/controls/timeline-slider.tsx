"use client";

import { TIME_POINTS, TIME_LABELS, TimePoint } from "@/lib/data/constants";
import { cn } from "@/lib/utils";

interface TimelineSliderProps {
  value: TimePoint;
  onChange: (value: TimePoint) => void;
  disabled?: boolean;
}

export function TimelineSlider({ value, onChange, disabled }: TimelineSliderProps) {
  return (
    <div className={cn("glass rounded-xl p-4", disabled && "opacity-50 pointer-events-none")}>
      <div className="flex items-center justify-between gap-2">
        {TIME_POINTS.map((tp, i) => {
          const isActive = value === tp;
          const isPast = TIME_POINTS.indexOf(value) > i;

          return (
            <button
              key={tp}
              onClick={() => onChange(tp)}
              disabled={disabled}
              className={cn(
                "flex-1 py-3 px-2 rounded-lg transition-all duration-200 relative",
                "border-2 font-semibold text-sm",
                isActive
                  ? "bg-white text-black border-white scale-105 shadow-lg shadow-white/20"
                  : isPast
                  ? "bg-white/20 text-white border-white/30 hover:bg-white/30"
                  : "bg-white/5 text-white/60 border-white/10 hover:bg-white/15 hover:border-white/20"
              )}
            >
              <span className="block text-lg">{TIME_LABELS[tp]}</span>
              <span className={cn(
                "block text-[10px] mt-0.5",
                isActive ? "text-black/60" : "text-white/40"
              )}>
                {tp === 0 ? "시작" : `${tp}개월`}
              </span>

              {/* Progress connector */}
              {i < TIME_POINTS.length - 1 && (
                <div className={cn(
                  "absolute top-1/2 -right-2 w-4 h-0.5 -translate-y-1/2 z-10",
                  isPast ? "bg-white/40" : "bg-white/10"
                )} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
