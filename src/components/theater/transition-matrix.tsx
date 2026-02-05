"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import * as d3 from "d3";
import { motion, AnimatePresence } from "motion/react";
import {
  State,
  STATES,
  STATE_CONFIG,
  TimePoint,
  TIME_POINTS,
} from "@/lib/data/constants";
import {
  OVERALL_TRANSITION,
  TRANSITION_MATRICES,
  getTimePeriodKey,
  TRANSITION_INSIGHTS,
} from "@/lib/data/transitions";

interface TransitionMatrixProps {
  onCellSelect: (from: State, to: State) => void;
}

const DISPLAY_STATES: State[] = [
  STATES.VIP,
  STATES.LOYAL,
  STATES.ACTIVE,
  STATES.RISK,
  STATES.CHURN,
];

export function TransitionMatrix({ onCellSelect }: TransitionMatrixProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredCell, setHoveredCell] = useState<{ from: State; to: State } | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("overall");

  // Get the appropriate transition matrix
  const matrix = useMemo(() => {
    if (selectedPeriod === "overall") return OVERALL_TRANSITION;

    const periodKey = selectedPeriod;
    return TRANSITION_MATRICES[periodKey] || OVERALL_TRANSITION;
  }, [selectedPeriod]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const margin = { top: 80, right: 20, bottom: 20, left: 80 };
    const width = Math.min(svgRef.current.clientWidth - margin.left - margin.right, 450);
    const height = width;
    const cellSize = width / DISPLAY_STATES.length;

    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Color scale (red for dangerous, green for good)
    const colorScale = (value: number, from: State, to: State) => {
      if (value === 0) return "rgba(255,255,255,0.03)";

      // Self-retention is good (except for risk/churn)
      if (from === to) {
        if (from === STATES.RISK || from === STATES.CHURN) {
          return d3.interpolateReds(Math.min(value * 1.5, 1));
        }
        return d3.interpolateGreens(Math.min(value * 1.5, 1));
      }

      // Transitions to churn/risk are bad
      if (to === STATES.CHURN || to === STATES.RISK) {
        return d3.interpolateReds(Math.min(value * 2, 1));
      }

      // Transitions to VIP/loyal are good
      if (to === STATES.VIP || to === STATES.LOYAL) {
        return d3.interpolateGreens(Math.min(value * 2, 1));
      }

      return d3.interpolateBlues(Math.min(value * 1.5, 1));
    };

    // Row labels (From)
    g.selectAll(".row-label")
      .data(DISPLAY_STATES)
      .enter()
      .append("g")
      .attr("transform", (_, i) => `translate(-10, ${i * cellSize + cellSize / 2})`)
      .each(function (state) {
        const group = d3.select(this);
        group
          .append("text")
          .attr("text-anchor", "end")
          .attr("dominant-baseline", "middle")
          .attr("fill", STATE_CONFIG[state].colorHex)
          .attr("font-size", "20px")
          .text(STATE_CONFIG[state].emoji);

        group
          .append("text")
          .attr("x", -25)
          .attr("text-anchor", "end")
          .attr("dominant-baseline", "middle")
          .attr("fill", "rgba(255,255,255,0.7)")
          .attr("font-size", "11px")
          .text(STATE_CONFIG[state].labelKo);
      });

    // Column labels (To)
    g.selectAll(".col-label")
      .data(DISPLAY_STATES)
      .enter()
      .append("g")
      .attr("transform", (_, i) => `translate(${i * cellSize + cellSize / 2}, -10)`)
      .each(function (state) {
        const group = d3.select(this);
        group
          .append("text")
          .attr("text-anchor", "middle")
          .attr("fill", STATE_CONFIG[state].colorHex)
          .attr("font-size", "20px")
          .text(STATE_CONFIG[state].emoji);

        group
          .append("text")
          .attr("y", -25)
          .attr("text-anchor", "middle")
          .attr("fill", "rgba(255,255,255,0.7)")
          .attr("font-size", "11px")
          .text(STATE_CONFIG[state].labelKo);
      });

    // Axis labels
    g.append("text")
      .attr("x", -60)
      .attr("y", height / 2)
      .attr("transform", `rotate(-90, -60, ${height / 2})`)
      .attr("text-anchor", "middle")
      .attr("fill", "rgba(255,255,255,0.5)")
      .attr("font-size", "12px")
      .text("From (현재 상태)");

    g.append("text")
      .attr("x", width / 2)
      .attr("y", -55)
      .attr("text-anchor", "middle")
      .attr("fill", "rgba(255,255,255,0.5)")
      .attr("font-size", "12px")
      .text("To (다음 상태)");

    // Cells
    DISPLAY_STATES.forEach((fromState, i) => {
      DISPLAY_STATES.forEach((toState, j) => {
        const value = matrix[fromState]?.[toState] ?? 0;

        const cell = g
          .append("g")
          .attr("transform", `translate(${j * cellSize}, ${i * cellSize})`)
          .style("cursor", "pointer")
          .on("mouseenter", () => setHoveredCell({ from: fromState, to: toState }))
          .on("mouseleave", () => setHoveredCell(null))
          .on("click", () => onCellSelect(fromState, toState));

        cell
          .append("rect")
          .attr("width", cellSize - 2)
          .attr("height", cellSize - 2)
          .attr("rx", 4)
          .attr("fill", colorScale(value, fromState, toState))
          .attr("stroke", "rgba(255,255,255,0.1)")
          .attr("stroke-width", 1)
          .transition()
          .duration(500)
          .attr("fill", colorScale(value, fromState, toState));

        // Value text
        if (value > 0) {
          cell
            .append("text")
            .attr("x", cellSize / 2)
            .attr("y", cellSize / 2)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("fill", value > 0.3 ? "white" : "rgba(255,255,255,0.8)")
            .attr("font-size", value > 0.1 ? "14px" : "11px")
            .attr("font-weight", value > 0.2 ? "bold" : "normal")
            .text(`${(value * 100).toFixed(0)}%`);
        }
      });
    });

  }, [matrix, onCellSelect]);

  // Get period options
  const periodOptions = useMemo(() => {
    const options = [{ value: "overall", label: "전체 평균" }];

    for (let i = 0; i < TIME_POINTS.length - 1; i++) {
      const from = TIME_POINTS[i];
      const to = TIME_POINTS[i + 1];
      options.push({
        value: getTimePeriodKey(from, to),
        label: `${from}→${to}개월`,
      });
    }

    return options;
  }, []);

  return (
    <div className="w-full h-full min-h-[550px] relative">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute top-4 left-4"
      >
        <h3 className="text-lg font-semibold text-white mb-1">전이 확률 행렬</h3>
        <p className="text-sm text-muted-foreground">
          상태 간 전환 확률 (행: From, 열: To)
        </p>
      </motion.div>

      {/* Period selector */}
      <div className="absolute top-4 right-4 flex gap-2">
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white"
        >
          {periodOptions.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-zinc-900">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-center pt-16">
        <svg ref={svgRef} width={550} height={550} />
      </div>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hoveredCell && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-white/10"
          >
            <div className="flex items-center gap-2 mb-1">
              <span>{STATE_CONFIG[hoveredCell.from].emoji}</span>
              <span className="text-white/50">→</span>
              <span>{STATE_CONFIG[hoveredCell.to].emoji}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">
                {STATE_CONFIG[hoveredCell.from].labelKo} →{" "}
                {STATE_CONFIG[hoveredCell.to].labelKo}:
              </span>{" "}
              <span className="text-white font-semibold">
                {((matrix[hoveredCell.from]?.[hoveredCell.to] ?? 0) * 100).toFixed(1)}%
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Key insights */}
      <div className="absolute bottom-4 right-4 max-w-xs">
        <div className="bg-black/50 rounded-lg p-3 space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase">
            Key Insights
          </div>
          {TRANSITION_INSIGHTS.slice(0, 3).map((insight) => (
            <div key={insight.id} className="text-xs">
              <span
                className={
                  insight.severity === "high"
                    ? "text-red-400"
                    : insight.severity === "positive"
                    ? "text-green-400"
                    : "text-yellow-400"
                }
              >
                •
              </span>{" "}
              <span className="text-white/80">{insight.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
