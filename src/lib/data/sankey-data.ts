// Sankey Flow Data - Customer Lifecycle Journey
// Original: /final/html/sankey_flow.html

export interface SankeyNode {
  name: string;
  value: number;
  color: string;
  state: string;
  emoji: string;
  monthIndex: number;
  monthLabel: string;
  isFinal: boolean;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
  color: string;
  fromEmoji: string;
  toEmoji: string;
}

export interface CardDetail {
  state: string;
  emoji: string;
  value: number;
  pct: string;
  cumPct: number;
  label: string;
  color: string;
  ltv: string;
  avgVisitDays: string;
  criteria: string;
  insight: string;
}

export const TIME_LABELS = [
  { label: "시작", isStart: true },
  { label: "1개월" },
  { label: "3개월" },
  { label: "6개월" },
  { label: "12개월" },
  { label: "18개월" },
  { label: "24개월 (최종)", isEnd: true },
];

export const nodes: SankeyNode[] = [
  { name: "신규", value: 2500, color: "#ec4899", state: "신규", emoji: "👶", monthIndex: 0, monthLabel: "시작", isFinal: false },
  { name: "충성", value: 528, color: "#22c55e", state: "충성", emoji: "🥰", monthIndex: 1, monthLabel: "1개월", isFinal: false },
  { name: "신규", value: 1971, color: "#ec4899", state: "신규", emoji: "👶", monthIndex: 1, monthLabel: "1개월", isFinal: false },
  { name: "VIP", value: 6, color: "#fbbf24", state: "VIP", emoji: "👑", monthIndex: 2, monthLabel: "3개월", isFinal: false },
  { name: "충성", value: 1511, color: "#22c55e", state: "충성", emoji: "🥰", monthIndex: 2, monthLabel: "3개월", isFinal: false },
  { name: "활성", value: 136, color: "#3b82f6", state: "활성", emoji: "🙂", monthIndex: 2, monthLabel: "3개월", isFinal: false },
  { name: "위험", value: 84, color: "#f97316", state: "위험", emoji: "😰", monthIndex: 2, monthLabel: "3개월", isFinal: false },
  { name: "이탈", value: 25, color: "#6b7280", state: "이탈", emoji: "👻", monthIndex: 2, monthLabel: "3개월", isFinal: false },
  { name: "신규", value: 738, color: "#ec4899", state: "신규", emoji: "👶", monthIndex: 2, monthLabel: "3개월", isFinal: false },
  { name: "VIP", value: 12, color: "#fbbf24", state: "VIP", emoji: "👑", monthIndex: 3, monthLabel: "6개월", isFinal: false },
  { name: "충성", value: 1403, color: "#22c55e", state: "충성", emoji: "🥰", monthIndex: 3, monthLabel: "6개월", isFinal: false },
  { name: "활성", value: 488, color: "#3b82f6", state: "활성", emoji: "🙂", monthIndex: 3, monthLabel: "6개월", isFinal: false },
  { name: "위험", value: 345, color: "#f97316", state: "위험", emoji: "😰", monthIndex: 3, monthLabel: "6개월", isFinal: false },
  { name: "이탈", value: 252, color: "#6b7280", state: "이탈", emoji: "👻", monthIndex: 3, monthLabel: "6개월", isFinal: false },
  { name: "VIP", value: 22, color: "#fbbf24", state: "VIP", emoji: "👑", monthIndex: 4, monthLabel: "12개월", isFinal: false },
  { name: "충성", value: 782, color: "#22c55e", state: "충성", emoji: "🥰", monthIndex: 4, monthLabel: "12개월", isFinal: false },
  { name: "활성", value: 774, color: "#3b82f6", state: "활성", emoji: "🙂", monthIndex: 4, monthLabel: "12개월", isFinal: false },
  { name: "위험", value: 460, color: "#f97316", state: "위험", emoji: "😰", monthIndex: 4, monthLabel: "12개월", isFinal: false },
  { name: "이탈", value: 462, color: "#6b7280", state: "이탈", emoji: "👻", monthIndex: 4, monthLabel: "12개월", isFinal: false },
  { name: "VIP", value: 25, color: "#fbbf24", state: "VIP", emoji: "👑", monthIndex: 5, monthLabel: "18개월", isFinal: false },
  { name: "충성", value: 565, color: "#22c55e", state: "충성", emoji: "🥰", monthIndex: 5, monthLabel: "18개월", isFinal: false },
  { name: "활성", value: 878, color: "#3b82f6", state: "활성", emoji: "🙂", monthIndex: 5, monthLabel: "18개월", isFinal: false },
  { name: "위험", value: 540, color: "#f97316", state: "위험", emoji: "😰", monthIndex: 5, monthLabel: "18개월", isFinal: false },
  { name: "이탈", value: 492, color: "#6b7280", state: "이탈", emoji: "👻", monthIndex: 5, monthLabel: "18개월", isFinal: false },
  { name: "VIP", value: 70, color: "#fbbf24", state: "VIP", emoji: "👑", monthIndex: 6, monthLabel: "24개월", isFinal: true },
  { name: "충성", value: 393, color: "#22c55e", state: "충성", emoji: "🥰", monthIndex: 6, monthLabel: "24개월", isFinal: true },
  { name: "활성", value: 990, color: "#3b82f6", state: "활성", emoji: "🙂", monthIndex: 6, monthLabel: "24개월", isFinal: true },
  { name: "위험", value: 513, color: "#f97316", state: "위험", emoji: "😰", monthIndex: 6, monthLabel: "24개월", isFinal: true },
  { name: "이탈", value: 534, color: "#6b7280", state: "이탈", emoji: "👻", monthIndex: 6, monthLabel: "24개월", isFinal: true },
];

export const links: SankeyLink[] = [
  { source: 0, target: 2, value: 1971, color: "#ec4899", fromEmoji: "👶", toEmoji: "👶" },
  { source: 0, target: 1, value: 528, color: "#ec4899", fromEmoji: "👶", toEmoji: "🥰" },
  { source: 2, target: 8, value: 738, color: "#ec4899", fromEmoji: "👶", toEmoji: "👶" },
  { source: 2, target: 6, value: 28, color: "#ec4899", fromEmoji: "👶", toEmoji: "😰" },
  { source: 2, target: 4, value: 1152, color: "#ec4899", fromEmoji: "👶", toEmoji: "🥰" },
  { source: 2, target: 5, value: 52, color: "#ec4899", fromEmoji: "👶", toEmoji: "🙂" },
  { source: 1, target: 3, value: 6, color: "#22c55e", fromEmoji: "🥰", toEmoji: "👑" },
  { source: 1, target: 6, value: 55, color: "#22c55e", fromEmoji: "🥰", toEmoji: "😰" },
  { source: 1, target: 7, value: 24, color: "#22c55e", fromEmoji: "🥰", toEmoji: "👻" },
  { source: 1, target: 4, value: 359, color: "#22c55e", fromEmoji: "🥰", toEmoji: "🥰" },
  { source: 1, target: 5, value: 84, color: "#22c55e", fromEmoji: "🥰", toEmoji: "🙂" },
  { source: 3, target: 9, value: 6, color: "#fbbf24", fromEmoji: "👑", toEmoji: "👑" },
  { source: 8, target: 12, value: 75, color: "#ec4899", fromEmoji: "👶", toEmoji: "😰" },
  { source: 8, target: 13, value: 28, color: "#ec4899", fromEmoji: "👶", toEmoji: "👻" },
  { source: 8, target: 10, value: 529, color: "#ec4899", fromEmoji: "👶", toEmoji: "🥰" },
  { source: 8, target: 11, value: 106, color: "#ec4899", fromEmoji: "👶", toEmoji: "🙂" },
  { source: 6, target: 12, value: 25, color: "#f97316", fromEmoji: "😰", toEmoji: "😰" },
  { source: 6, target: 13, value: 39, color: "#f97316", fromEmoji: "😰", toEmoji: "👻" },
  { source: 6, target: 11, value: 20, color: "#f97316", fromEmoji: "😰", toEmoji: "🙂" },
  { source: 7, target: 12, value: 7, color: "#6b7280", fromEmoji: "👻", toEmoji: "😰" },
  { source: 7, target: 13, value: 8, color: "#6b7280", fromEmoji: "👻", toEmoji: "👻" },
  { source: 7, target: 11, value: 10, color: "#6b7280", fromEmoji: "👻", toEmoji: "🙂" },
  { source: 4, target: 9, value: 6, color: "#22c55e", fromEmoji: "🥰", toEmoji: "👑" },
  { source: 4, target: 12, value: 197, color: "#22c55e", fromEmoji: "🥰", toEmoji: "😰" },
  { source: 4, target: 13, value: 147, color: "#22c55e", fromEmoji: "🥰", toEmoji: "👻" },
  { source: 4, target: 10, value: 874, color: "#22c55e", fromEmoji: "🥰", toEmoji: "🥰" },
  { source: 4, target: 11, value: 287, color: "#22c55e", fromEmoji: "🥰", toEmoji: "🙂" },
  { source: 5, target: 12, value: 41, color: "#3b82f6", fromEmoji: "🙂", toEmoji: "😰" },
  { source: 5, target: 13, value: 30, color: "#3b82f6", fromEmoji: "🙂", toEmoji: "👻" },
  { source: 5, target: 11, value: 65, color: "#3b82f6", fromEmoji: "🙂", toEmoji: "🙂" },
  { source: 9, target: 14, value: 9, color: "#fbbf24", fromEmoji: "👑", toEmoji: "👑" },
  { source: 12, target: 17, value: 99, color: "#f97316", fromEmoji: "😰", toEmoji: "😰" },
  { source: 12, target: 18, value: 101, color: "#f97316", fromEmoji: "😰", toEmoji: "👻" },
  { source: 12, target: 16, value: 145, color: "#f97316", fromEmoji: "😰", toEmoji: "🙂" },
  { source: 13, target: 17, value: 57, color: "#6b7280", fromEmoji: "👻", toEmoji: "😰" },
  { source: 13, target: 18, value: 115, color: "#6b7280", fromEmoji: "👻", toEmoji: "👻" },
  { source: 13, target: 16, value: 80, color: "#6b7280", fromEmoji: "👻", toEmoji: "🙂" },
  { source: 10, target: 14, value: 13, color: "#22c55e", fromEmoji: "🥰", toEmoji: "👑" },
  { source: 10, target: 17, value: 165, color: "#22c55e", fromEmoji: "🥰", toEmoji: "😰" },
  { source: 10, target: 18, value: 146, color: "#22c55e", fromEmoji: "🥰", toEmoji: "👻" },
  { source: 10, target: 15, value: 779, color: "#22c55e", fromEmoji: "🥰", toEmoji: "🥰" },
  { source: 10, target: 16, value: 300, color: "#22c55e", fromEmoji: "🥰", toEmoji: "🙂" },
  { source: 11, target: 17, value: 139, color: "#3b82f6", fromEmoji: "🙂", toEmoji: "😰" },
  { source: 11, target: 18, value: 100, color: "#3b82f6", fromEmoji: "🙂", toEmoji: "👻" },
  { source: 11, target: 16, value: 249, color: "#3b82f6", fromEmoji: "🙂", toEmoji: "🙂" },
  { source: 14, target: 19, value: 18, color: "#fbbf24", fromEmoji: "👑", toEmoji: "👑" },
  { source: 17, target: 22, value: 149, color: "#f97316", fromEmoji: "😰", toEmoji: "😰" },
  { source: 17, target: 23, value: 122, color: "#f97316", fromEmoji: "😰", toEmoji: "👻" },
  { source: 17, target: 21, value: 189, color: "#f97316", fromEmoji: "😰", toEmoji: "🙂" },
  { source: 18, target: 22, value: 137, color: "#6b7280", fromEmoji: "👻", toEmoji: "😰" },
  { source: 18, target: 23, value: 207, color: "#6b7280", fromEmoji: "👻", toEmoji: "👻" },
  { source: 18, target: 21, value: 118, color: "#6b7280", fromEmoji: "👻", toEmoji: "🙂" },
  { source: 15, target: 19, value: 7, color: "#22c55e", fromEmoji: "🥰", toEmoji: "👑" },
  { source: 15, target: 22, value: 49, color: "#22c55e", fromEmoji: "🥰", toEmoji: "😰" },
  { source: 15, target: 23, value: 42, color: "#22c55e", fromEmoji: "🥰", toEmoji: "👻" },
  { source: 15, target: 20, value: 563, color: "#22c55e", fromEmoji: "🥰", toEmoji: "🥰" },
  { source: 15, target: 21, value: 121, color: "#22c55e", fromEmoji: "🥰", toEmoji: "🙂" },
  { source: 16, target: 22, value: 205, color: "#3b82f6", fromEmoji: "🙂", toEmoji: "😰" },
  { source: 16, target: 23, value: 120, color: "#3b82f6", fromEmoji: "🙂", toEmoji: "👻" },
  { source: 16, target: 21, value: 449, color: "#3b82f6", fromEmoji: "🙂", toEmoji: "🙂" },
  { source: 19, target: 24, value: 22, color: "#fbbf24", fromEmoji: "👑", toEmoji: "👑" },
  { source: 22, target: 27, value: 160, color: "#f97316", fromEmoji: "😰", toEmoji: "😰" },
  { source: 22, target: 28, value: 122, color: "#f97316", fromEmoji: "😰", toEmoji: "👻" },
  { source: 22, target: 26, value: 258, color: "#f97316", fromEmoji: "😰", toEmoji: "🙂" },
  { source: 23, target: 27, value: 117, color: "#6b7280", fromEmoji: "👻", toEmoji: "😰" },
  { source: 23, target: 28, value: 237, color: "#6b7280", fromEmoji: "👻", toEmoji: "👻" },
  { source: 23, target: 26, value: 138, color: "#6b7280", fromEmoji: "👻", toEmoji: "🙂" },
  { source: 20, target: 24, value: 6, color: "#22c55e", fromEmoji: "🥰", toEmoji: "👑" },
  { source: 20, target: 27, value: 35, color: "#22c55e", fromEmoji: "🥰", toEmoji: "😰" },
  { source: 20, target: 28, value: 14, color: "#22c55e", fromEmoji: "🥰", toEmoji: "👻" },
  { source: 20, target: 25, value: 455, color: "#22c55e", fromEmoji: "🥰", toEmoji: "🥰" },
  { source: 20, target: 26, value: 55, color: "#22c55e", fromEmoji: "🥰", toEmoji: "🙂" },
  { source: 21, target: 27, value: 201, color: "#3b82f6", fromEmoji: "🙂", toEmoji: "😰" },
  { source: 21, target: 28, value: 139, color: "#3b82f6", fromEmoji: "🙂", toEmoji: "👻" },
  { source: 21, target: 26, value: 538, color: "#3b82f6", fromEmoji: "🙂", toEmoji: "🙂" },
];

export const cardDetails: CardDetail[] = [
  {
    state: "VIP",
    emoji: "👑",
    value: 70,
    pct: "2.8%",
    cumPct: 1.4,
    label: "VIP",
    color: "#fbbf24",
    ltv: "$10,688",
    avgVisitDays: "341일",
    criteria: "이탈 0회 + 방문일 362일+",
    insight: "거의 매일 방문. 2년 중 48% 방문.",
  },
  {
    state: "충성",
    emoji: "🥰",
    value: 393,
    pct: "15.7%",
    cumPct: 10.7,
    label: "충성",
    color: "#22c55e",
    ltv: "$6,712",
    avgVisitDays: "168일",
    criteria: "이탈 0회 + 방문일 362일 미만",
    insight: "VIP 승급 가능성 높음.",
  },
  {
    state: "활성",
    emoji: "🙂",
    value: 990,
    pct: "39.6%",
    cumPct: 38.3,
    label: "활성",
    color: "#3b82f6",
    ltv: "$2,962",
    avgVisitDays: "89일",
    criteria: "이탈 경험 + 8일 내 재방문",
    insight: "가장 큰 그룹. 충성 전환 유도.",
  },
  {
    state: "위험",
    emoji: "😰",
    value: 513,
    pct: "20.5%",
    cumPct: 68.4,
    label: "위험",
    color: "#f97316",
    ltv: "$2,014",
    avgVisitDays: "62일",
    criteria: "최근 방문 8~24일 전",
    insight: "긴급 개입 필요.",
  },
  {
    state: "이탈",
    emoji: "👻",
    value: 534,
    pct: "21.4%",
    cumPct: 89.3,
    label: "이탈",
    color: "#6b7280",
    ltv: "$1,322",
    avgVisitDays: "38일",
    criteria: "최근 방문 25일+ 전",
    insight: "약 49% 윈백 가능.",
  },
];
