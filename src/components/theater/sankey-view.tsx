"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as d3 from "d3";
import { sankey as d3Sankey, sankeyLinkHorizontal, sankeyLeft, SankeyNode, SankeyLink } from "d3-sankey";
import {
  nodes as rawNodes,
  links as rawLinks,
  cardDetails,
  TIME_LABELS,
  type SankeyNode as NodeType,
  type CardDetail,
} from "@/lib/data/sankey-data";

// Extended types for D3 Sankey
interface ExtendedNode extends NodeType {
  index: number;
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
}

interface ExtendedLink {
  source: ExtendedNode;
  target: ExtendedNode;
  value: number;
  color: string;
  fromEmoji: string;
  toEmoji: string;
  y0?: number;
  y1?: number;
  width?: number;
}

interface Particle {
  link: ExtendedLink;
  progress: number;
  speed: number;
  emoji: string;
  size: number;
  laneOffset: number;
  wobble: number;
  wobbleSpeed: number;
}

// Distribution chart component for expanded cards
function DistributionChart({ cumPct, color }: { cumPct: number; color: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const w = 180, h = 90, pad = 12;
    const chartW = w - pad * 2, chartH = h - pad * 2;
    const mean = w / 2, stdDev = chartW / 5;

    const gaussian = (x: number) => Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
    const yScale = (y: number) => pad + (1 - y) * chartH;

    // Grid lines (horizontal)
    for (let i = 0; i <= 4; i++) {
      const y = pad + (chartH / 4) * i;
      svg.append("line")
        .attr("x1", pad).attr("y1", y)
        .attr("x2", w - pad).attr("y2", y)
        .attr("stroke", "rgba(255,255,255,0.08)")
        .attr("stroke-dasharray", "4,4");
    }

    // Grid lines (vertical)
    for (let i = 0; i <= 4; i++) {
      const x = pad + (chartW / 4) * i;
      svg.append("line")
        .attr("x1", x).attr("y1", pad)
        .attr("x2", x).attr("y2", h - pad)
        .attr("stroke", "rgba(255,255,255,0.08)")
        .attr("stroke-dasharray", "4,4");
    }

    // Axis line
    svg.append("line")
      .attr("x1", pad).attr("y1", h - pad)
      .attr("x2", w - pad).attr("y2", h - pad)
      .attr("stroke", "rgba(255,255,255,0.15)");

    // Bell curve paths
    let curvePath = "";
    let fillPath = "";
    for (let x = pad; x <= w - pad; x += 1) {
      const gVal = gaussian(x);
      const y = yScale(gVal);
      curvePath += (x === pad ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1);
      fillPath += (x === pad ? `M${pad},${h - pad}L` : "L") + x.toFixed(1) + "," + y.toFixed(1);
    }
    fillPath += `L${w - pad},${h - pad}Z`;

    // Full distribution fill
    svg.append("path")
      .attr("d", fillPath)
      .attr("fill", "rgba(255,255,255,0.08)");

    // Highlighted area
    const markerX = pad + chartW * (1 - cumPct / 100);
    let highlightPath = `M${markerX},${h - pad}`;
    for (let x = markerX; x <= w - pad; x += 1) {
      const gVal = gaussian(x);
      const y = yScale(gVal);
      highlightPath += "L" + x.toFixed(1) + "," + y.toFixed(1);
    }
    highlightPath += `L${w - pad},${h - pad}Z`;

    svg.append("path")
      .attr("d", highlightPath)
      .attr("fill", color)
      .attr("opacity", 0.3);

    // Bell curve line
    svg.append("path")
      .attr("d", curvePath)
      .attr("fill", "none")
      .attr("stroke", "rgba(255,255,255,0.5)")
      .attr("stroke-width", 2);

    // Marker
    const markerY = yScale(gaussian(markerX));
    svg.append("line")
      .attr("x1", markerX).attr("y1", markerY)
      .attr("x2", markerX).attr("y2", h - pad)
      .attr("stroke", color)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "6,3");

    svg.append("circle")
      .attr("cx", markerX).attr("cy", markerY)
      .attr("r", 6)
      .attr("fill", color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // Label
    const labelX = Math.min(Math.max(markerX, pad + 30), w - pad - 30);
    svg.append("text")
      .attr("x", labelX)
      .attr("y", Math.max(markerY - 10, pad + 12))
      .attr("text-anchor", "middle")
      .attr("fill", "#fff")
      .attr("font-size", "11px")
      .attr("font-weight", "700")
      .text(cumPct <= 50 ? `상위 ${cumPct.toFixed(1)}%` : `하위 ${(100 - cumPct).toFixed(1)}%`);

    // X-axis labels
    const labels = ["하위", "", "중간", "", "상위"];
    labels.forEach((txt, i) => {
      if (!txt) return;
      svg.append("text")
        .attr("x", pad + (chartW / 4) * i)
        .attr("y", h - 3)
        .attr("text-anchor", "middle")
        .attr("fill", "rgba(255,255,255,0.4)")
        .attr("font-size", "8px")
        .text(txt);
    });
  }, [cumPct, color]);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 180 90"
      className="w-full h-full"
    />
  );
}

// Stat card component
function StatCard({
  card,
  isExpanded,
  onToggle,
  hasExpanded,
}: {
  card: CardDetail;
  isExpanded: boolean;
  onToggle: () => void;
  hasExpanded: boolean;
}) {
  return (
    <motion.div
      layout
      className="relative rounded-2xl cursor-pointer overflow-hidden border"
      style={{
        background: "rgba(255,255,255,0.03)",
      }}
      initial={false}
      animate={{
        width: isExpanded ? 620 : hasExpanded ? 60 : 140,
        height: isExpanded ? 160 : 130,
        borderColor: isExpanded ? card.color : "rgba(255,255,255,0.08)",
        boxShadow: isExpanded
          ? `0 15px 50px rgba(0,0,0,0.4), 0 0 30px ${card.color}40`
          : "0 0 0 rgba(0,0,0,0)",
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 1,
      }}
      onClick={onToggle}
      whileHover={!isExpanded ? { y: -3, scale: 1.02 } : undefined}
    >
      {/* Top accent bar */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ backgroundColor: card.color }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: isExpanded ? 1 : 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.3 }}
      />

      <motion.div layout className="p-4 h-full">
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            // Basic view
            <motion.div
              key="basic"
              initial={{ opacity: 0 }}
              animate={{ opacity: hasExpanded ? 0.5 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-center h-full flex flex-col justify-center"
            >
              <div className={`mb-1 transition-all duration-300 ${hasExpanded ? "text-2xl" : "text-3xl"}`}>
                {card.emoji}
              </div>
              {!hasExpanded && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="text-2xl font-extrabold" style={{ color: card.color }}>
                    {card.value.toLocaleString()}
                    <span className="text-sm ml-1" style={{ color: card.color }}>
                      {card.pct}
                    </span>
                  </div>
                  <div className="text-[10px] uppercase text-white/40 mt-1">{card.label}</div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            // Expanded view
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex gap-5 h-full"
            >
              {/* Left section */}
              <div className="flex-none w-[140px] flex flex-col justify-center border-r border-white/10 pr-4">
                <div className="text-4xl mb-2">{card.emoji}</div>
                <div className="text-lg font-bold">{card.label}</div>
                <div className="text-sm text-white/60">
                  {card.value.toLocaleString()}명 ({card.pct})
                </div>
              </div>

              {/* Center section */}
              <div className="flex-none w-[180px] flex flex-col justify-center gap-2 border-r border-white/10 pr-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="text-[10px] uppercase text-white/40 mb-1">평균 LTV</div>
                    <div className="text-sm font-semibold">{card.ltv}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] uppercase text-white/40 mb-1">방문일</div>
                    <div className="text-sm font-semibold">{card.avgVisitDays}</div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-white/40 mb-1">등급 기준</div>
                  <div className="text-xs">{card.criteria}</div>
                </div>
                <div className="bg-white/5 rounded p-2">
                  <div className="text-xs text-white/70">💡 {card.insight}</div>
                </div>
              </div>

              {/* Distribution chart */}
              <div className="flex-1 flex flex-col justify-center pl-4">
                <div className="text-[10px] uppercase text-white/40 mb-2">고객 분포 내 위치</div>
                <div className="h-[95px] bg-black/30 rounded-lg border border-white/5 overflow-hidden">
                  <DistributionChart cumPct={card.cumPct} color={card.color} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

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

export function SankeyView() {
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const activeNodeRef = useRef<ExtendedNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1700, height: 600 });

  // Prepare sankey data
  const sankeyData = useMemo(() => {
    const nodesWithIndex = rawNodes.map((n, i) => ({ ...n, index: i })) as ExtendedNode[];
    const linksWithRefs = rawLinks.map((l) => ({
      ...l,
      source: nodesWithIndex[l.source],
      target: nodesWithIndex[l.target],
    }));
    return { nodes: nodesWithIndex, links: linksWithRefs };
  }, []);

  // Sankey layout
  const { layoutNodes, layoutLinks } = useMemo(() => {
    const margin = { top: 20, right: 200, bottom: 20, left: 80 };
    const sankeyGenerator = d3Sankey<ExtendedNode, ExtendedLink>()
      .nodeId((d) => d.index)
      .nodeWidth(30)
      .nodePadding(12)
      .nodeAlign(sankeyLeft)
      .extent([
        [margin.left, margin.top],
        [dimensions.width - margin.right, dimensions.height - margin.bottom],
      ]);

    const data = {
      nodes: sankeyData.nodes.map((n) => ({ ...n })),
      links: sankeyData.links.map((l) => ({
        ...l,
        source: l.source.index,
        target: l.target.index,
      })),
    };

    const { nodes: sNodes, links: sLinks } = sankeyGenerator(data as never);

    return {
      layoutNodes: sNodes as ExtendedNode[],
      layoutLinks: sLinks as unknown as ExtendedLink[],
    };
  }, [sankeyData, dimensions]);

  // Particle animation
  const getPoint = useCallback((link: ExtendedLink, t: number) => {
    const x = (link.source.x1 || 0) + ((link.target.x0 || 0) - (link.source.x1 || 0)) * t;
    const mt = 1 - t;
    const y0 = link.y0 || 0;
    const y1 = link.y1 || 0;
    const y = mt * mt * mt * y0 + 3 * mt * mt * t * y0 + 3 * mt * t * t * y1 + t * t * t * y1;
    return { x, y };
  }, []);

  const spawnParticle = useCallback((link: ExtendedLink, emoji: string) => {
    if (particlesRef.current.length >= 80) return;
    particlesRef.current.push({
      link,
      progress: 0,
      speed: 0.012 + Math.random() * 0.008,
      emoji,
      size: 14, // Fixed size for consistency
      laneOffset: (Math.random() - 0.5) * 0.3, // Very small offset
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.05, // Minimal wobble
    });
  }, []);

  const spawnBatch = useCallback(() => {
    const activeNode = activeNodeRef.current;
    if (!activeNode || particlesRef.current.length >= 80) return;

    const outLinks = layoutLinks.filter((l) => l.source === activeNode);
    const inLinks = layoutLinks.filter((l) => l.target === activeNode);

    outLinks.forEach((link) => {
      const count = Math.min(2, Math.ceil((link.width || 1) / 40));
      for (let i = 0; i < count; i++) {
        spawnParticle(link, activeNode.emoji);
      }
    });

    inLinks.forEach((link) => {
      const count = Math.min(2, Math.ceil((link.width || 1) / 40));
      for (let i = 0; i < count; i++) {
        spawnParticle(link, link.source.emoji);
      }
    });
  }, [layoutLinks, spawnParticle]);

  // Animation loop with proper scaling (matches SVG viewBox + preserveAspectRatio)
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = 1;

    // Resize canvas to match actual display size
    const resizeCanvas = () => {
      const chartContainer = canvas.parentElement;
      if (!chartContainer) return;

      const rect = chartContainer.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let lastSpawnTime = 0;
    const SPAWN_INTERVAL = 150;

    const animate = (timestamp: number) => {
      const chartContainer = canvas.parentElement;
      if (!chartContainer) return;

      const rect = chartContainer.getBoundingClientRect();

      // Match SVG preserveAspectRatio="xMidYMid meet" calculation
      const containerRatio = rect.width / rect.height;
      const viewBoxRatio = dimensions.width / dimensions.height;

      let scale: number, offsetX: number, offsetY: number;
      if (containerRatio > viewBoxRatio) {
        // Container is wider - fit to height
        scale = rect.height / dimensions.height;
        offsetX = (rect.width - dimensions.width * scale) / 2;
        offsetY = 0;
      } else {
        // Container is taller - fit to width
        scale = rect.width / dimensions.width;
        offsetX = 0;
        offsetY = (rect.height - dimensions.height * scale) / 2;
      }

      // Clear and set up context with device pixel ratio
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Update and draw particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.progress += p.speed;
        p.wobble += p.wobbleSpeed;

        if (p.progress > 1) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        const pt = getPoint(p.link, p.progress);
        const hw = ((p.link.width || 1) / 2) * scale;
        // Keep particles strictly inside the link
        const maxOffset = Math.max(0, hw * 0.4);
        const rawOffset = p.laneOffset * maxOffset + Math.sin(p.wobble) * maxOffset * 0.15;
        const yOff = Math.max(-maxOffset, Math.min(maxOffset, rawOffset));

        // Scale coordinates to match SVG viewBox rendering
        const drawX = pt.x * scale + offsetX;
        const drawY = pt.y * scale + offsetY + yOff;
        const fontSize = Math.round(p.size * scale);

        ctx.font = `${fontSize}px serif`;
        ctx.globalAlpha = Math.sin(p.progress * Math.PI) * 0.9;
        ctx.fillText(p.emoji, drawX - fontSize / 2, drawY + fontSize / 3);
      }

      ctx.globalAlpha = 1;

      // Spawn new particles
      if (timestamp - lastSpawnTime > SPAWN_INTERVAL) {
        lastSpawnTime = timestamp;
        if (activeNodeRef.current) {
          spawnBatch();
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [getPoint, spawnBatch, dimensions]);

  // Draw sankey
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Gradients
    const defs = svg.append("defs");
    layoutLinks.forEach((link, i) => {
      const grad = defs
        .append("linearGradient")
        .attr("id", `sankey-grad-${i}`)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", link.source.x1 || 0)
        .attr("x2", link.target.x0 || 0);
      grad.append("stop").attr("offset", "0%").attr("stop-color", link.color).attr("stop-opacity", 0.5);
      grad.append("stop").attr("offset", "100%").attr("stop-color", link.color).attr("stop-opacity", 0.15);
    });

    // Links
    const linkPaths = svg
      .append("g")
      .selectAll("path")
      .data(layoutLinks)
      .join("path")
      .attr("d", sankeyLinkHorizontal() as never)
      .attr("fill", "none")
      .attr("stroke", (_, i) => `url(#sankey-grad-${i})`)
      .attr("stroke-width", (d) => Math.max(2, d.width || 1))
      .attr("opacity", 0.6)
      .attr("class", "sankey-link");

    // Nodes
    const nodeGroups = svg
      .append("g")
      .selectAll("g")
      .data(layoutNodes)
      .join("g")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`)
      .attr("class", "sankey-node")
      .style("cursor", "pointer");

    nodeGroups
      .append("rect")
      .attr("width", (d) => (d.x1 || 0) - (d.x0 || 0))
      .attr("height", (d) => Math.max(10, (d.y1 || 0) - (d.y0 || 0)))
      .attr("fill", (d) => d.color)
      .attr("rx", 6)
      .style("filter", (d) => `drop-shadow(0 0 6px ${d.color}50)`);

    nodeGroups
      .append("text")
      .attr("x", (d) => ((d.x1 || 0) - (d.x0 || 0)) / 2)
      .attr("y", (d) => ((d.y1 || 0) - (d.y0 || 0)) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("fill", "#fff")
      .attr("font-size", (d) => ((d.y1 || 0) - (d.y0 || 0) > 30 ? "11px" : "9px"))
      .attr("font-weight", "700")
      .text((d) => d.name);

    // Final state emojis
    nodeGroups
      .filter((d) => d.isFinal)
      .append("text")
      .attr("x", (d) => ((d.x1 || 0) - (d.x0 || 0)) + 15)
      .attr("y", (d) => ((d.y1 || 0) - (d.y0 || 0)) / 2)
      .attr("dy", "0.35em")
      .attr("font-size", "28px")
      .text((d) => d.emoji);

    // Event handlers (호버 시 파티클)
    nodeGroups
      .on("mouseenter", function (event, d) {
        activeNodeRef.current = d;
        particlesRef.current = [];
        spawnBatch();

        // Highlight connected links
        linkPaths.attr("opacity", (l) => (l.source === d || l.target === d ? 0.9 : 0.1));
        d3.select(this).select("rect").style("filter", `drop-shadow(0 0 15px ${d.color})`);
      })
      .on("mouseleave", function (_, d) {
        activeNodeRef.current = null;
        particlesRef.current = [];
        linkPaths.attr("opacity", 0.6);
        d3.select(this).select("rect").style("filter", `drop-shadow(0 0 6px ${d.color}50)`);
      });
  }, [layoutNodes, layoutLinks, spawnBatch]);

  return (
    <div className="w-full h-full min-h-[700px] flex flex-col" ref={containerRef}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">
          고객의 변화 - 어떻게 변하는가?
        </h3>
        <p className="text-sm text-muted-foreground">
          2,500명의 24개월 여정 · 상태 전환 흐름 시각화
        </p>
      </div>

      <MethodInfo title="Sankey 다이어그램 — 분석 기법 설명">
        <p className="text-white/70 font-medium">분석 기법: 상태 전환 추적 + Sankey Flow 시각화</p>
        <p>
          <span className="text-white/60">Sankey 다이어그램</span> — 노드(상태)와 링크(전환)로 구성된 흐름도입니다.
          링크의 두께가 해당 전환의 고객 수에 비례합니다. 왼쪽에서 오른쪽으로 시간이 흐릅니다.
        </p>
        <p>
          <span className="text-white/60">5등급 분류 (RFM 기반)</span> — 방문 빈도(Frequency)와 최근성(Recency)을 기준으로
          VIP / 충성 / 활성 / 위험 / 이탈 5단계로 분류합니다. 각 월말 시점의 고객 상태를 추적합니다.
        </p>
        <p>
          <span className="text-white/60">전환 카운팅</span> — 24개월간 월별 상태 변화를 집계합니다.
          &quot;활성→위험&quot; 전환이 몇 건 발생했는지, 어떤 경로가 가장 빈번한지를 시각적으로 파악합니다.
        </p>
        <p className="text-white/40 italic">
          읽는 법: 노드 위에 마우스를 올리면 해당 상태로 들어오고 나가는 흐름이 하이라이트됩니다.
          카드를 클릭하면 등급별 상세 정보를 확인할 수 있습니다.
        </p>
      </MethodInfo>

      {/* Stat Cards */}
      <motion.div layout className="flex gap-2 justify-center mb-4 items-stretch">
        {cardDetails.map((card) => (
          <StatCard
            key={card.state}
            card={card}
            isExpanded={expandedCard === card.state}
            onToggle={() => setExpandedCard(expandedCard === card.state ? null : card.state)}
            hasExpanded={expandedCard !== null}
          />
        ))}
      </motion.div>

      {/* Time Labels */}
      <div className="flex justify-between px-20 mb-2 pb-4 border-b border-white/5">
        {TIME_LABELS.map((t, i) => (
          <div
            key={i}
            className={`text-sm font-semibold min-w-[70px] text-center ${
              t.isStart ? "text-pink-400" : t.isEnd ? "text-yellow-400" : "text-white/40"
            }`}
          >
            {t.label}
          </div>
        ))}
      </div>

      {/* Sankey Chart */}
      <div className="flex-1 relative bg-black/20 rounded-lg overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full"
        />
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ zIndex: 10 }}
        />
      </div>

    </div>
  );
}
