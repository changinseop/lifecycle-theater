"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  nodes,
  links,
  cardDetails,
  TIME_LABELS,
  type CardDetail,
} from "@/lib/data/sankey-data";

// ── 상수 ──────────────────────────────────────────────
const STATE_ORDER = ["VIP", "충성", "활성", "위험", "이탈", "신규"] as const;
const STATE_COLORS: Record<string, string> = {
  VIP: "#fbbf24",
  충성: "#22c55e",
  활성: "#3b82f6",
  위험: "#f97316",
  이탈: "#6b7280",
  신규: "#ec4899",
};
const STATE_EMOJIS: Record<string, string> = {
  VIP: "👑",
  충성: "🥰",
  활성: "🙂",
  위험: "😰",
  이탈: "👻",
  신규: "👶",
};

const DAY_LABELS = ["Day 0", "Day 30", "Day 90", "Day 180", "Day 365", "Day 548", "Day 730"];

// ── Layout 상수 ────────────────────────────────────────
const NODE_H = 22;
const LEVEL_GAP = 70;
const MARGIN = { top: 24, bottom: 16, left: 4, right: 4 };
const NODE_PAD = 1.5;

// ── Layout 타입 ────────────────────────────────────────
interface LNode {
  idx: number;
  x: number;
  w: number;
  y: number;
  state: string;
  value: number;
  color: string;
  emoji: string;
  mi: number;
  srcOff: number;
  tgtOff: number;
}

interface LLink {
  sx: number;
  sw: number;
  sy: number;
  tx: number;
  tw: number;
  ty: number;
  value: number;
  color: string;
}

// ── Layout 계산 ────────────────────────────────────────
function computeLayout(svgW: number) {
  const usable = svgW - MARGIN.left - MARGIN.right;

  // 레벨별 노드 그룹핑
  const levels = new Map<number, { idx: number; state: string; value: number; color: string; emoji: string }[]>();
  nodes.forEach((n, i) => {
    if (!levels.has(n.monthIndex)) levels.set(n.monthIndex, []);
    levels.get(n.monthIndex)!.push({ idx: i, state: n.state, value: n.value, color: n.color, emoji: n.emoji });
  });

  const sortedLevels = [...levels.entries()].sort((a, b) => a[0] - b[0]);
  const layoutNodes: LNode[] = [];
  const nodeMap = new Map<number, LNode>();

  // 각 레벨 노드 배치
  sortedLevels.forEach(([mi, lvNodes], li) => {
    // STATE_ORDER 순서로 정렬
    const sorted = [...lvNodes].sort(
      (a, b) => STATE_ORDER.indexOf(a.state as typeof STATE_ORDER[number]) - STATE_ORDER.indexOf(b.state as typeof STATE_ORDER[number])
    );
    const total = sorted.reduce((s, n) => s + n.value, 0);
    const gaps = Math.max(0, sorted.length - 1) * NODE_PAD;
    const barW = usable - gaps;
    const y = MARGIN.top + li * (NODE_H + LEVEL_GAP);
    let x = MARGIN.left;

    sorted.forEach((n) => {
      const w = Math.max(1, (n.value / total) * barW);
      const ln: LNode = {
        idx: n.idx, x, w, y,
        state: n.state, value: n.value, color: n.color, emoji: n.emoji,
        mi, srcOff: 0, tgtOff: 0,
      };
      layoutNodes.push(ln);
      nodeMap.set(n.idx, ln);
      x += w + NODE_PAD;
    });
  });

  // 링크 배치
  const layoutLinks: LLink[] = [];
  const sortedLinks = [...links].sort((a, b) => a.source !== b.source ? a.source - b.source : a.target - b.target);

  sortedLinks.forEach((link) => {
    const sn = nodeMap.get(link.source);
    const tn = nodeMap.get(link.target);
    if (!sn || !tn) return;

    const sw = (link.value / sn.value) * sn.w;
    const tw = (link.value / tn.value) * tn.w;
    const sx = sn.x + sn.srcOff;
    const tx = tn.x + tn.tgtOff;

    sn.srcOff += sw;
    tn.tgtOff += tw;

    layoutLinks.push({
      sx, sw, sy: sn.y + NODE_H,
      tx, tw, ty: tn.y,
      value: link.value, color: link.color,
    });
  });

  const totalH = MARGIN.top + sortedLevels.length * NODE_H + (sortedLevels.length - 1) * LEVEL_GAP + MARGIN.bottom;
  return { layoutNodes, layoutLinks, totalH, sortedLevels };
}

// ── Link SVG path ──────────────────────────────────────
function linkPath(l: LLink): string {
  const midY = (l.sy + l.ty) / 2;
  return [
    `M ${l.sx} ${l.sy}`,
    `C ${l.sx} ${midY}, ${l.tx} ${midY}, ${l.tx} ${l.ty}`,
    `L ${l.tx + l.tw} ${l.ty}`,
    `C ${l.tx + l.tw} ${midY}, ${l.sx + l.sw} ${midY}, ${l.sx + l.sw} ${l.sy}`,
    `Z`,
  ].join(" ");
}

// ── 파티클 타입 ────────────────────────────────────────
interface Dot {
  linkIdx: number;
  t: number;       // progress 0→1
  speed: number;
  lane: number;    // 0~1 (링크 폭 내 위치)
  r: number;       // radius
  alpha: number;
}

// ── 베지어 보간 ────────────────────────────────────────
function cubicBez(p0: number, p1: number, p2: number, p3: number, t: number) {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

function dotPos(l: LLink, t: number, lane: number) {
  const midY = (l.sy + l.ty) / 2;
  const lx = cubicBez(l.sx, l.sx, l.tx, l.tx, t);
  const rx = cubicBez(l.sx + l.sw, l.sx + l.sw, l.tx + l.tw, l.tx + l.tw, t);
  const y = cubicBez(l.sy, midY, midY, l.ty, t);
  const x = lx + (rx - lx) * lane;
  return { x, y };
}

// ── Sankey SVG 컴포넌트 ────────────────────────────────
function VerticalSankey() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const animRef = useRef<number>(0);
  const [width, setWidth] = useState(360);
  // 선택된 노드 — 원본 nodes[] 인덱스 (단일 선택)
  const [tappedIdx, setTappedIdx] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (w > 0) setWidth(w);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const { layoutNodes, layoutLinks, totalH, sortedLevels } = useMemo(
    () => computeLayout(width),
    [width]
  );

  // 선택 노드 정보
  const tappedNodeData = tappedIdx !== null ? nodes[tappedIdx] : null;

  // sortedLinks 순서 매핑 (layoutLinks와 동일 순서)
  const sortedLinksRef = useMemo(
    () => [...links].sort((a, b) => a.source !== b.source ? a.source - b.source : a.target - b.target),
    []
  );

  // 탭한 노드의 직접 연결 링크만 하이라이트
  const highlightedLinks = useMemo(() => {
    if (tappedIdx === null) return new Set<number>();
    const result = new Set<number>();
    sortedLinksRef.forEach((link, i) => {
      if (link.source === tappedIdx || link.target === tappedIdx) result.add(i);
    });
    return result;
  }, [tappedIdx, sortedLinksRef]);

  // 연결된 노드 인덱스들 (dim 처리용)
  const connectedNodes = useMemo(() => {
    if (tappedIdx === null) return new Set<number>();
    const result = new Set<number>([tappedIdx]);
    sortedLinksRef.forEach((link) => {
      if (link.source === tappedIdx) result.add(link.target);
      if (link.target === tappedIdx) result.add(link.source);
    });
    return result;
  }, [tappedIdx, sortedLinksRef]);

  // 파티클용 (highlightedLinks와 동일)
  const activeIndices = highlightedLinks;

  // Canvas 파티클 — 탭된 노드 연결 링크에만 흐름
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = totalH * dpr;
    ctx.scale(dpr, dpr);

    // 노드 미선택 시 캔버스 클리어 후 종료
    if (tappedIdx === null || activeIndices.size === 0) {
      ctx.clearRect(0, 0, width, totalH);
      dotsRef.current = [];
      return;
    }

    // 노드 변경 시 파티클 초기화
    dotsRef.current = [];

    const MAX_DOTS = 60;
    const idxArr = [...activeIndices];
    // 가중치 배열
    const weights = idxArr.map((i) => layoutLinks[i]?.value ?? 1);
    const totalW = weights.reduce((s, w) => s + w, 0);

    const spawnDot = () => {
      if (dotsRef.current.length >= MAX_DOTS) return;
      // 가중치 랜덤
      let r = Math.random() * totalW;
      let pick = idxArr[0];
      for (let i = 0; i < idxArr.length; i++) {
        r -= weights[i];
        if (r <= 0) { pick = idxArr[i]; break; }
      }
      dotsRef.current.push({
        linkIdx: pick,
        t: 0,
        speed: 0.005 + Math.random() * 0.007,
        lane: 0.1 + Math.random() * 0.8,
        r: 1.5 + Math.random() * 1.5,
        alpha: 0.6 + Math.random() * 0.4,
      });
    };

    // 시드 — 즉시 보이도록
    for (let i = 0; i < 15; i++) {
      spawnDot();
      const d = dotsRef.current[dotsRef.current.length - 1];
      if (d) d.t = Math.random() * 0.85;
    }

    let frame = 0;
    const render = () => {
      ctx.clearRect(0, 0, width, totalH);
      frame++;

      if (frame % 2 === 0) spawnDot();

      for (let i = dotsRef.current.length - 1; i >= 0; i--) {
        const d = dotsRef.current[i];
        d.t += d.speed;
        if (d.t > 1) { dotsRef.current.splice(i, 1); continue; }

        const l = layoutLinks[d.linkIdx];
        if (!l) { dotsRef.current.splice(i, 1); continue; }

        const { x, y } = dotPos(l, d.t, d.lane);
        const fade = Math.sin(d.t * Math.PI);

        // 점
        ctx.beginPath();
        ctx.arc(x, y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = l.color;
        ctx.globalAlpha = fade * d.alpha;
        ctx.fill();

        // 글로우
        ctx.beginPath();
        ctx.arc(x, y, d.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = l.color;
        ctx.globalAlpha = fade * d.alpha * 0.12;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [tappedIdx, activeIndices, layoutLinks, width, totalH]);

  return (
    <div ref={containerRef} className="w-full relative">
      <svg
        width={width}
        height={totalH}
        viewBox={`0 0 ${width} ${totalH}`}
        className="w-full"
      >
        <defs>
          {layoutLinks.map((l, i) => (
            <linearGradient
              key={i}
              id={`mg-${i}`}
              x1="0" y1={l.sy}
              x2="0" y2={l.ty}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor={l.color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={l.color} stopOpacity={0.15} />
            </linearGradient>
          ))}
        </defs>

        {/* Links */}
        <g>
          {layoutLinks.map((l, i) => {
            const dimmed = tappedIdx !== null && !highlightedLinks.has(i);
            return (
              <path
                key={i}
                d={linkPath(l)}
                fill={`url(#mg-${i})`}
                opacity={dimmed ? 0.06 : 1}
                style={{ transition: "opacity 0.4s ease" }}
              />
            );
          })}
        </g>

        {/* Nodes */}
        {layoutNodes.map((n, i) => {
          const isSelected = tappedIdx === n.idx;
          const dimmed = tappedIdx !== null && !connectedNodes.has(n.idx);
          return (
            <g
              key={i}
              onClick={() => setTappedIdx(tappedIdx === n.idx ? null : n.idx)}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={n.x}
                y={n.y}
                width={n.w}
                height={NODE_H}
                rx={3}
                fill={n.color}
                opacity={dimmed ? 0.15 : 0.85}
                stroke={isSelected ? "#fff" : "none"}
                strokeWidth={isSelected ? 1.5 : 0}
                style={{ transition: "opacity 0.4s ease" }}
              />
              {/* 노드 안에 텍스트 (충분히 넓을 때만) */}
              {n.w > 28 && (
                <text
                  x={n.x + n.w / 2}
                  y={n.y + NODE_H / 2 + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={n.w > 50 ? 9 : 7}
                  fontWeight="700"
                  fill="white"
                  opacity={dimmed ? 0.2 : 0.95}
                  style={{ transition: "opacity 0.4s ease", pointerEvents: "none" }}
                >
                  {n.w > 50 ? `${n.state} ${n.value.toLocaleString()}` : n.value > 99 ? n.value.toLocaleString() : ""}
                </text>
              )}
            </g>
          );
        })}

        {/* 시점 라벨 */}
        {sortedLevels.map(([mi], li) => {
          const y = MARGIN.top + li * (NODE_H + LEVEL_GAP);
          return (
            <g key={mi}>
              <text
                x={width / 2}
                y={y - 6}
                textAnchor="middle"
                fontSize={9}
                fontWeight="600"
                fill="rgba(255,255,255,0.5)"
              >
                {TIME_LABELS[mi]?.label ?? ""} ({DAY_LABELS[mi]})
              </text>
            </g>
          );
        })}
      </svg>

      {/* Canvas 파티클 오버레이 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ width, height: totalH }}
      />

      {/* 안내 힌트 — 노드 미선택 시 */}
      <AnimatePresence>
        {tappedIdx === null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm"
            style={{ top: MARGIN.top + NODE_H + 8 }}
          >
            <span className="text-xs">👆</span>
            <span className="text-[10px] text-white/60 font-medium">노드를 탭하면 해당 흐름이 보입니다</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 탭한 노드 정보 */}
      <AnimatePresence>
        {tappedNodeData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className="mt-3 p-3 rounded-xl border bg-white/[0.03]"
            style={{ borderColor: tappedNodeData.color + "40" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{tappedNodeData.emoji}</span>
              <div>
                <span className="text-sm font-bold" style={{ color: tappedNodeData.color }}>
                  {tappedNodeData.state}
                </span>
                <span className="text-xs text-white/40 ml-2">
                  {tappedNodeData.monthLabel} · {tappedNodeData.value.toLocaleString()}명
                </span>
              </div>
              <button
                onClick={() => setTappedIdx(null)}
                className="ml-auto text-[10px] text-white/30 px-2 py-0.5 rounded bg-white/5"
              >
                닫기
              </button>
            </div>
            {/* 이 노드에서 나가는/들어오는 전환 */}
            <div className="space-y-1.5">
              {sortedLinksRef
                .filter((l) => l.source === tappedIdx || l.target === tappedIdx)
                .sort((a, b) => b.value - a.value)
                .slice(0, 6)
                .map((l, i) => {
                  const isOut = l.source === tappedIdx;
                  const other = isOut ? nodes[l.target] : nodes[l.source];
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-white/30">{isOut ? "→" : "←"}</span>
                      <span style={{ color: other.color }}>{other.emoji} {other.state}</span>
                      <span className="text-white/30">({other.monthLabel})</span>
                      <span className="ml-auto font-medium text-white/70">{l.value.toLocaleString()}명</span>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── 등급 상세 카드 ────────────────────────────────────
function StatDetailCard({ card, index }: { card: CardDetail; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 + index * 0.08 }}
    >
      <button
        className="w-full p-3.5 flex items-center gap-3 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="text-2xl">{card.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold" style={{ color: card.color }}>
              {card.label}
            </span>
            <span className="text-xs text-white/50">
              {card.value.toLocaleString()}명 ({card.pct})
            </span>
          </div>
          <div className="text-[11px] text-white/40 mt-0.5 truncate">
            {card.criteria}
          </div>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-white/30 text-xs shrink-0"
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
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5 space-y-2.5">
              <div className="flex gap-2.5">
                <div className="flex-1 rounded-lg bg-white/5 p-2.5">
                  <div className="text-[10px] text-white/40 uppercase mb-0.5">평균 LTV</div>
                  <div className="text-sm font-semibold text-white/90">{card.ltv}</div>
                </div>
                <div className="flex-1 rounded-lg bg-white/5 p-2.5">
                  <div className="text-[10px] text-white/40 uppercase mb-0.5">방문일</div>
                  <div className="text-sm font-semibold text-white/90">{card.avgVisitDays}</div>
                </div>
              </div>
              <div className="rounded-lg bg-white/5 p-2.5 border border-white/5">
                <div className="text-xs text-white/60 leading-relaxed">{card.insight}</div>
              </div>
              <div>
                <div className="text-[10px] text-white/40 uppercase mb-1.5">고객 분포 내 위치</div>
                <div className="relative h-3 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="absolute top-0 left-0 h-full rounded-full"
                    style={{ backgroundColor: card.color, opacity: 0.3 }}
                    initial={{ width: 0 }}
                    animate={{ width: `${100 - card.cumPct}%` }}
                    transition={{ duration: 0.6 }}
                  />
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white"
                    style={{ backgroundColor: card.color }}
                    initial={{ left: 0 }}
                    animate={{ left: `${100 - card.cumPct}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-white/30">하위</span>
                  <span className="text-[9px] text-white/50 font-medium">
                    {card.cumPct <= 50 ? `상위 ${card.cumPct.toFixed(1)}%` : `하위 ${(100 - card.cumPct).toFixed(1)}%`}
                  </span>
                  <span className="text-[9px] text-white/30">상위</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── 분석 기법 ─────────────────────────────────────────
function MethodInfoMobile() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="text-xs font-medium text-white/50">분석 기법 설명</span>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-white/30 text-xs">▼</motion.span>
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
              <p className="text-white/70 font-medium">상태 전환 추적 + Sankey Flow 시각화</p>
              <p>
                <span className="text-white/60">5등급 분류 (RFM 기반)</span> — 방문 빈도(Frequency)와 최근성(Recency)을 기준으로 VIP / 충성 / 활성 / 위험 / 이탈 5단계로 분류합니다.
              </p>
              <p>
                <span className="text-white/60">전환 카운팅</span> — 24개월간 월별 상태 변화를 집계합니다. 각 구간별 주요 전환 흐름을 곡선으로 표시합니다.
              </p>
              <p className="text-white/40 italic">등급 색상을 탭하면 해당 등급의 흐름이 강조됩니다.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── 최종 분포 요약 ────────────────────────────────────
function FinalDistribution() {
  const finalNodes = nodes.filter((n) => n.isFinal);
  const total = finalNodes.reduce((s, n) => s + n.value, 0);
  const sorted = [...finalNodes].sort(
    (a, b) => STATE_ORDER.indexOf(a.state as typeof STATE_ORDER[number]) - STATE_ORDER.indexOf(b.state as typeof STATE_ORDER[number])
  );

  return (
    <motion.div
      className="rounded-xl p-4 border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-white/[0.03] to-amber-500/5 shadow-[0_0_40px_rgba(251,191,36,0.08)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <h4 className="text-sm font-bold text-yellow-400 text-center mb-3">24개월 최종 분포</h4>
      <div className="space-y-2.5">
        {sorted.map((n, i) => {
          const pct = ((n.value / total) * 100).toFixed(1);
          return (
            <motion.div
              key={n.state}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{STATE_EMOJIS[n.state]}</span>
                  <span className="text-xs font-semibold" style={{ color: n.color }}>{n.state}</span>
                </div>
                <div className="text-xs">
                  <span className="font-bold text-white/90">{n.value.toLocaleString()}명</span>
                  <span className="text-white/40 ml-1">{pct}%</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: n.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, delay: 0.4 + i * 0.08 }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────
export function SankeyMobile() {
  return (
    <div className="w-full px-3 py-5 space-y-5">
      {/* 헤더 */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-lg font-bold text-white">고객 여정 Sankey Flow</h3>
        <p className="text-xs text-white/40 mt-1">2,500명 · 24개월 추적 · 등급 탭으로 하이라이트</p>
      </motion.div>

      {/* 범례 */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
        {(["VIP", "충성", "활성", "위험", "이탈", "신규"] as const).map((s) => (
          <div key={s} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STATE_COLORS[s] }} />
            <span className="text-[10px] text-white/50">{STATE_EMOJIS[s]} {s}</span>
          </div>
        ))}
      </div>

      {/* Sankey SVG */}
      <VerticalSankey />

      {/* 최종 분포 */}
      <FinalDistribution />

      {/* 등급 상세 */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-white/60">등급별 상세 정보</h4>
        {cardDetails.map((card, i) => (
          <StatDetailCard key={card.state} card={card} index={i} />
        ))}
      </div>

      {/* 분석 기법 */}
      <MethodInfoMobile />
    </div>
  );
}
