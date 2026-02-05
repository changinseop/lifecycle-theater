"use client";

import { Card } from "@/components/ui/card";

interface InsightPanelProps {
  activeTab: string;
}

const INSIGHTS: Record<string, { title: string; insights: string[] }> = {
  racing: {
    title: "Racing Bar",
    insights: [
      "각 상태별 고객 수 변화를 실시간으로 봅니다",
      "막대 길이가 해당 상태의 고객 수입니다",
      "시간이 지남에 따른 역전을 관찰하세요",
      "최종: 활성 990명, 이탈 534명",
    ],
  },
  sankey: {
    title: "Sankey Flow",
    insights: [
      "왼쪽에서 오른쪽으로 시간이 흐릅니다",
      "흐름의 두께가 전환 고객 수입니다",
      "이모지가 실제 고객의 이동을 보여줍니다",
      "신규→충성 전환이 가장 많습니다",
    ],
  },
  cohort: {
    title: "Cohort Analysis",
    insights: [
      "첫 방문 시기별로 고객을 그룹화합니다",
      "색상이 진할수록 리텐션이 높습니다",
      "초기 코호트(1~30일)가 가장 큽니다",
      "+6개월이 핵심 분기점입니다",
    ],
  },
  universe: {
    title: "Universe View",
    insights: [
      "각 점은 한 명의 고객을 나타냅니다",
      "색상은 현재 상태를 의미합니다",
      "클러스터 크기는 해당 상태의 고객 수입니다",
      "시간 슬라이더로 변화를 관찰하세요",
    ],
  },
  survival: {
    title: "Survival Curve",
    insights: [
      "Y축은 이탈하지 않은 고객 비율입니다",
      "3~6개월이 위험 구간입니다 (-23.6%p)",
      "이탈 경로 고객은 6개월에 60%만 생존",
      "최종 생존율: 전체 78.6%, VIP 100%",
    ],
  },
  transition: {
    title: "Transition Matrix",
    insights: [
      "행(From)에서 열(To)로의 전환 확률입니다",
      "붉은색은 위험한 전환을 의미합니다",
      "위험→이탈 전환율이 35%로 가장 위험합니다",
      "VIP 유지율은 83%로 매우 높습니다",
    ],
  },
  path: {
    title: "Path Explorer",
    insights: [
      "VIP와 이탈 고객의 경로를 비교합니다",
      "VIP는 단 한 번도 위험을 경험하지 않았습니다",
      "이탈 고객은 3개월 내 위험 신호가 있었습니다",
      "경로가 운명을 결정합니다",
    ],
  },
  predict: {
    title: "Predictor",
    insights: [
      "6개월 시퀀스로 다음 상태를 예측합니다",
      "Attention은 어떤 시점이 중요한지 보여줍니다",
      "최근 2개월이 가장 결정적입니다",
      "경로를 바꾸면 예측 결과도 달라집니다",
    ],
  },
};

export function InsightPanel({ activeTab }: InsightPanelProps) {
  const tabInsight = INSIGHTS[activeTab] || INSIGHTS.racing;

  return (
    <Card className="glass p-4 flex-1">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        💡 {tabInsight.title}
      </h3>

      <ul className="space-y-2">
        {tabInsight.insights.map((insight, i) => (
          <li key={i} className="text-sm text-white/80 flex gap-2">
            <span className="text-white/40">•</span>
            {insight}
          </li>
        ))}
      </ul>
    </Card>
  );
}
