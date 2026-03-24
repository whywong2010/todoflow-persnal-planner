export type DiagnosisTypeKey = "sprinter" | "steady" | "recovery" | "restart";

export interface DiagnosisOption {
  id: string;
  label: string;
  score: Record<DiagnosisTypeKey, number>;
}

export interface DiagnosisQuestion {
  id: string;
  title: string;
  options: DiagnosisOption[];
}

export interface DiagnosisTypeResult {
  key: DiagnosisTypeKey;
  title: string;
  diagnosis: string;
  steps: string[];
  avoid: string;
  quote: string;
  shareTitle: string;
  shareSubtitle: string;
  shareAction: string;
}

export const TYPE_PRIORITY: DiagnosisTypeKey[] = [
  "restart",
  "recovery",
  "steady",
  "sprinter",
];

export const DIAGNOSIS_QUESTIONS: DiagnosisQuestion[] = [
  {
    id: "q1",
    title: "你今天一打開待辦清單，第一反應是？",
    options: [
      {
        id: "A",
        label: "先挑最難的做掉",
        score: { sprinter: 2, steady: 0, recovery: 0, restart: 0 },
      },
      {
        id: "B",
        label: "先做幾件小事暖機",
        score: { sprinter: 0, steady: 2, recovery: 0, restart: 0 },
      },
      {
        id: "C",
        label: "想先休息一下再開始",
        score: { sprinter: 0, steady: 0, recovery: 2, restart: 0 },
      },
      {
        id: "D",
        label: "先重排一次清單",
        score: { sprinter: 0, steady: 0, recovery: 0, restart: 2 },
      },
    ],
  },
  {
    id: "q2",
    title: "你最常卡住的原因是？",
    options: [
      {
        id: "A",
        label: "目標太大，一下子衝過頭",
        score: { sprinter: 2, steady: 0, recovery: 0, restart: 0 },
      },
      {
        id: "B",
        label: "事情太碎，容易被打斷",
        score: { sprinter: 0, steady: 2, recovery: 0, restart: 0 },
      },
      {
        id: "C",
        label: "精力不足，提不起勁",
        score: { sprinter: 0, steady: 0, recovery: 2, restart: 0 },
      },
      {
        id: "D",
        label: "想太多，遲遲不開始",
        score: { sprinter: 0, steady: 0, recovery: 0, restart: 2 },
      },
    ],
  },
  {
    id: "q3",
    title: "面對臨時任務，你通常會？",
    options: [
      {
        id: "A",
        label: "立刻接，快速處理",
        score: { sprinter: 2, steady: 0, recovery: 0, restart: 0 },
      },
      {
        id: "B",
        label: "排進時段，按節奏做",
        score: { sprinter: 0, steady: 2, recovery: 0, restart: 0 },
      },
      {
        id: "C",
        label: "先確認是否真的有必要",
        score: { sprinter: 0, steady: 0, recovery: 2, restart: 0 },
      },
      {
        id: "D",
        label: "重新整理優先級再決定",
        score: { sprinter: 0, steady: 0, recovery: 0, restart: 2 },
      },
    ],
  },
  {
    id: "q4",
    title: "你理想的一天節奏是？",
    options: [
      {
        id: "A",
        label: "高強度衝刺 + 快速收尾",
        score: { sprinter: 2, steady: 0, recovery: 0, restart: 0 },
      },
      {
        id: "B",
        label: "穩定推進，少波動",
        score: { sprinter: 0, steady: 2, recovery: 0, restart: 0 },
      },
      {
        id: "C",
        label: "留白足夠，保留能量",
        score: { sprinter: 0, steady: 0, recovery: 2, restart: 0 },
      },
      {
        id: "D",
        label: "先校準方向，再集中發力",
        score: { sprinter: 0, steady: 0, recovery: 0, restart: 2 },
      },
    ],
  },
  {
    id: "q5",
    title: "如果今天只能完成 1 件事，你希望是？",
    options: [
      {
        id: "A",
        label: "最難最關鍵的那件",
        score: { sprinter: 2, steady: 0, recovery: 0, restart: 0 },
      },
      {
        id: "B",
        label: "最容易形成連續性的那件",
        score: { sprinter: 0, steady: 2, recovery: 0, restart: 0 },
      },
      {
        id: "C",
        label: "最能減壓的那件",
        score: { sprinter: 0, steady: 0, recovery: 2, restart: 0 },
      },
      {
        id: "D",
        label: "最能打開局面的那件",
        score: { sprinter: 0, steady: 0, recovery: 0, restart: 2 },
      },
    ],
  },
  {
    id: "q6",
    title: "你希望系統給你的第一個提醒是？",
    options: [
      {
        id: "A",
        label: "直接開幹，別拖",
        score: { sprinter: 2, steady: 0, recovery: 0, restart: 0 },
      },
      {
        id: "B",
        label: "先做 25 分鐘，穩住節奏",
        score: { sprinter: 0, steady: 2, recovery: 0, restart: 0 },
      },
      {
        id: "C",
        label: "先恢復能量，再做重點",
        score: { sprinter: 0, steady: 0, recovery: 2, restart: 0 },
      },
      {
        id: "D",
        label: "先定 1 個最小起步動作",
        score: { sprinter: 0, steady: 0, recovery: 0, restart: 2 },
      },
    ],
  },
];

export const DIAGNOSIS_RESULTS: Record<DiagnosisTypeKey, DiagnosisTypeResult> = {
  sprinter: {
    key: "sprinter",
    title: "衝刺型",
    diagnosis: "你不是拖延，而是太容易一次想做太多。",
    steps: ["只定 1 個硬任務", "90 分鐘深度衝刺", "其餘任務全部降級"],
    avoid: "不要同時開 5 個戰場",
    quote: "猛可以，但要把猛用在刀口上。",
    shareTitle: "我是【衝刺型】行動者",
    shareSubtitle: "今天先攻下最難的一件事",
    shareAction: "我的策略：單點突破 + 降級次要任務",
  },
  steady: {
    key: "steady",
    title: "穩進型",
    diagnosis: "你靠節奏取勝，一亂就掉效率。",
    steps: ["先排 3 段專注時段", "每段只做 1 類事", "完成後立刻勾選回饋"],
    avoid: "不要邊做邊改計畫",
    quote: "你最大的武器是穩定推進。",
    shareTitle: "我是【穩進型】行動者",
    shareSubtitle: "穩穩往前，比爆衝更持久",
    shareAction: "我的策略：分段專注 + 即時回饋",
  },
  recovery: {
    key: "recovery",
    title: "恢復型",
    diagnosis: "你不是懶，是電量告急。",
    steps: ["先做 15 分鐘恢復", "完成 1 件低阻力任務", "再進主任務"],
    avoid: "低電量硬拼高難度",
    quote: "先回電，再爆發。",
    shareTitle: "我是【恢復型】行動者",
    shareSubtitle: "今天先回電，再進攻",
    shareAction: "我的策略：先低阻力啟動，再切重點任務",
  },
  restart: {
    key: "restart",
    title: "重啟型",
    diagnosis: "你卡在想清楚，不是做不到。",
    steps: ["先刪掉 50% 待辦", "只定 1 個 5 分鐘起步動作", "做完立刻續 20 分鐘"],
    avoid: "開始前追求完美計畫",
    quote: "先啟動，再優化。",
    shareTitle: "我是【重啟型】行動者",
    shareSubtitle: "今天先做對一件事",
    shareAction: "我的策略：刪清單 + 最小起步",
  },
};

export function resolveDiagnosisType(
  answerByQuestion: Record<string, string>,
): DiagnosisTypeResult {
  const score: Record<DiagnosisTypeKey, number> = {
    sprinter: 0,
    steady: 0,
    recovery: 0,
    restart: 0,
  };

  for (const question of DIAGNOSIS_QUESTIONS) {
    const optionId = answerByQuestion[question.id];
    const option = question.options.find((item) => item.id === optionId);
    if (!option) {
      continue;
    }

    for (const typeKey of Object.keys(score) as DiagnosisTypeKey[]) {
      score[typeKey] += option.score[typeKey];
    }
  }

  const sortedKeys = (Object.keys(score) as DiagnosisTypeKey[]).sort((left, right) => {
    const gap = score[right] - score[left];
    if (gap !== 0) {
      return gap;
    }

    return TYPE_PRIORITY.indexOf(left) - TYPE_PRIORITY.indexOf(right);
  });

  return DIAGNOSIS_RESULTS[sortedKeys[0]];
}
