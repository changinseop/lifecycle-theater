"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { motion } from "motion/react";
import {
  TIME_POINTS,
  TIME_LABELS,
  TimePoint,
  STATE_CONFIG,
  STATES,
} from "@/lib/data/constants";

// Real data calculated from racing-data-v2.json
const SURVIVAL_DATA = {
  // Overall survival rate (% not in churn state at each time point)
  overall: [
    { time: 0 as TimePoint, rate: 1.0 },
    { time: 1 as TimePoint, rate: 0.992 },
    { time: 3 as TimePoint, rate: 0.901 },
    { time: 6 as TimePoint, rate: 0.781 },
    { time: 12 as TimePoint, rate: 0.776 },
    { time: 18 as TimePoint, rate: 0.785 },
    { time: 24 as TimePoint, rate: 0.786 },
  ],
  // VIP path: 70 customers who end up VIP - they never churn
  vipPath: [
    { time: 0 as TimePoint, rate: 1.0 },
    { time: 1 as TimePoint, rate: 1.0 },
    { time: 3 as TimePoint, rate: 1.0 },
    { time: 6 as TimePoint, rate: 1.0 },
    { time: 12 as TimePoint, rate: 1.0 },
    { time: 18 as TimePoint, rate: 1.0 },
    { time: 24 as TimePoint, rate: 1.0 },
  ],
  // Churn path: 534 customers who eventually churn - tracking when they fall
  churnPath: [
    { time: 0 as TimePoint, rate: 1.0 },
    { time: 1 as TimePoint, rate: 0.993 },
    { time: 3 as TimePoint, rate: 0.841 },
    { time: 6 as TimePoint, rate: 0.605 },
    { time: 12 as TimePoint, rate: 0.521 },
    { time: 18 as TimePoint, rate: 0.511 },
    { time: 24 as TimePoint, rate: 0.0 },
  ],
};

// Key annotations for the chart
const ANNOTATIONS = [
  {
    time: 3,
    rate: 0.841,
    label: "이탈 시작",
    description: "이탈 고객의 16%가 이미 떠남",
    color: "#f97316",
  },
  {
    time: 6,
    rate: 0.605,
    label: "위험 구간",
    description: "3→6개월: -23.6%p 급락",
    color: "#ef4444",
  },
  {
    time: 24,
    rate: 0.786,
    label: "최종 생존",
    description: "전체의 78.6%가 유지됨",
    color: "#22c55e",
  },
];

export function SurvivalCurve() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Use pre-computed data (instant - no computation)
  const data = SURVIVAL_DATA;

  // ResizeObserver for responsive chart
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0) return;

    const svg = d3.select(svgRef.current);
    const margin = { top: 60, right: 30, bottom: 50, left: 55 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    if (width <= 0 || height <= 0) return;

    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([0, 24])
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([height, 0]);

    // Grid lines
    g.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(yScale.ticks(5))
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", "rgba(255,255,255,0.1)")
      .attr("stroke-dasharray", "4,4");

    // X Axis
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3.axisBottom(xScale).tickValues(TIME_POINTS).tickFormat((d) => TIME_LABELS[d as TimePoint])
      )
      .attr("color", "rgba(255,255,255,0.5)")
      .selectAll("text")
      .attr("fill", "rgba(255,255,255,0.7)")
      .attr("font-size", "11px");

    // Y Axis
    g.append("g")
      .call(
        d3.axisLeft(yScale).tickFormat((d) => `${(d as number * 100).toFixed(0)}%`)
      )
      .attr("color", "rgba(255,255,255,0.5)")
      .selectAll("text")
      .attr("fill", "rgba(255,255,255,0.7)")
      .attr("font-size", "11px");

    // Axis labels
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + 45)
      .attr("fill", "rgba(255,255,255,0.6)")
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text("시간 (개월)");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -45)
      .attr("fill", "rgba(255,255,255,0.6)")
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text("생존율 (이탈하지 않은 비율)");

    // Line generator
    const line = d3
      .line<{ time: TimePoint; rate: number }>()
      .x((d) => xScale(d.time))
      .y((d) => yScale(d.rate))
      .curve(d3.curveMonotoneX);

    // Area generator (for overall)
    const area = d3
      .area<{ time: TimePoint; rate: number }>()
      .x((d) => xScale(d.time))
      .y0(height)
      .y1((d) => yScale(d.rate))
      .curve(d3.curveMonotoneX);

    // Draw area for overall
    g.append("path")
      .datum(data.overall)
      .attr("fill", "rgba(255,255,255,0.05)")
      .attr("d", area);

    // Draw lines
    const lines = [
      { data: data.overall, color: "#ffffff", label: "전체", width: 2 },
      { data: data.vipPath, color: STATE_CONFIG[STATES.VIP].colorHex, label: "VIP 경로", width: 2.5 },
      { data: data.churnPath, color: STATE_CONFIG[STATES.CHURN].colorHex, label: "이탈 경로", width: 2 },
    ];

    lines.forEach(({ data: lineData, color, width: strokeWidth }) => {
      const path = g
        .append("path")
        .datum(lineData)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", strokeWidth)
        .attr("d", line);

      // Animate line drawing
      const totalLength = path.node()?.getTotalLength() || 0;
      path
        .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(1500)
        .ease(d3.easeQuadOut)
        .attr("stroke-dashoffset", 0);
    });

    // Highlight danger zone (3-6 months)
    const dangerStartX = xScale(3);
    const dangerEndX = xScale(6);
    g.append("rect")
      .attr("x", dangerStartX)
      .attr("y", 0)
      .attr("width", dangerEndX - dangerStartX)
      .attr("height", height)
      .attr("fill", "rgba(239, 68, 68, 0.08)");

    // Add annotations
    ANNOTATIONS.forEach((annotation) => {
      const x = xScale(annotation.time);
      const y = yScale(annotation.rate);

      // Dot on the line
      g.append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 6)
        .attr("fill", annotation.color)
        .attr("stroke", "#fff")
        .attr("stroke-width", 2);

      // Label box
      const labelY = annotation.time === 24 ? y - 60 : y - 45;
      const textAnchor = annotation.time === 24 ? "end" : "start";
      const labelX = annotation.time === 24 ? x - 10 : x + 10;

      g.append("rect")
        .attr("x", labelX - (textAnchor === "end" ? 95 : 5))
        .attr("y", labelY - 12)
        .attr("width", 100)
        .attr("height", 38)
        .attr("fill", "rgba(0,0,0,0.7)")
        .attr("rx", 4);

      g.append("text")
        .attr("x", labelX)
        .attr("y", labelY)
        .attr("text-anchor", textAnchor)
        .attr("fill", annotation.color)
        .attr("font-size", "11px")
        .attr("font-weight", "bold")
        .text(annotation.label);

      g.append("text")
        .attr("x", labelX)
        .attr("y", labelY + 14)
        .attr("text-anchor", textAnchor)
        .attr("fill", "rgba(255,255,255,0.7)")
        .attr("font-size", "10px")
        .text(annotation.description);
    });

    // Legend
    const legend = g.append("g").attr("transform", `translate(${width - 120}, 10)`);

    lines.forEach(({ color, label }, i) => {
      const legendRow = legend.append("g").attr("transform", `translate(0, ${i * 22})`);

      legendRow
        .append("line")
        .attr("x1", 0)
        .attr("x2", 20)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", color)
        .attr("stroke-width", 2);

      legendRow
        .append("text")
        .attr("x", 28)
        .attr("y", 4)
        .attr("fill", "rgba(255,255,255,0.8)")
        .attr("font-size", "11px")
        .text(label);
    });

  }, [data, dimensions]);

  return (
    <div ref={containerRef} className="w-full h-full relative" style={{ minHeight: "100%" }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute top-0 left-0 z-10"
      >
        <h3 className="text-lg font-semibold text-white mb-1">생존 곡선 (Survival Curve)</h3>
        <p className="text-sm text-muted-foreground">
          시간에 따른 이탈하지 않은 고객 비율
        </p>
      </motion.div>

      <svg ref={svgRef} className="w-full h-full" style={{ minHeight: "500px" }} />
    </div>
  );
}
