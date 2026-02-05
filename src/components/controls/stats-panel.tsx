"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { BorderBeam } from "@/components/magicui/border-beam";
import {
  STATE_CONFIG,
  STATES,
  State,
  TimePoint,
  TOTAL_CUSTOMERS,
} from "@/lib/data/constants";
import { getStateDistribution } from "@/lib/data/customers";
import { cn } from "@/lib/utils";

interface StatsPanelProps {
  onStateClick: (state: string | null) => void;
  selectedState: string | null;
}

const DISPLAY_STATES: State[] = [
  STATES.VIP,
  STATES.LOYAL,
  STATES.ACTIVE,
  STATES.RISK,
  STATES.CHURN,
];

export function StatsPanel({
  onStateClick,
  selectedState,
}: StatsPanelProps) {
  // Use final time point (24 months) as default
  const distribution = useMemo(
    () => getStateDistribution(24),
    []
  );

  return (
    <Card className="glass p-4 space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        24개월 최종 분포
      </h3>

      {DISPLAY_STATES.map((state) => {
        const config = STATE_CONFIG[state];
        const count = distribution[state];
        const pct = ((count / TOTAL_CUSTOMERS) * 100).toFixed(1);
        const isSelected = selectedState === state;

        return (
          <button
            key={state}
            onClick={() => onStateClick(isSelected ? null : state)}
            className={cn(
              "relative w-full p-3 rounded-lg transition-all duration-300",
              "bg-white/5 hover:bg-white/10 border border-transparent",
              isSelected && "bg-white/10 border-white/20"
            )}
          >
            {isSelected && (
              <BorderBeam
                size={100}
                duration={8}
                colorFrom={config.colorHex}
                colorTo={config.colorHex}
              />
            )}

            <div className="flex items-center gap-3">
              <span className="text-2xl">{config.emoji}</span>
              <div className="flex-1 text-left">
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-xl font-bold"
                    style={{ color: config.colorHex }}
                  >
                    <NumberTicker value={count} className="text-inherit" />
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({pct}%)
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {config.labelKo}
                </div>
              </div>

              {/* Mini bar */}
              <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(count / TOTAL_CUSTOMERS) * 100}%`,
                    backgroundColor: config.colorHex,
                  }}
                />
              </div>
            </div>
          </button>
        );
      })}

      <div className="pt-2 border-t border-white/10">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">총 고객</span>
          <span className="font-semibold">
            <NumberTicker value={TOTAL_CUSTOMERS} />명
          </span>
        </div>
      </div>
    </Card>
  );
}
