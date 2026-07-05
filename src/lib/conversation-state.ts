// V3 对话 Agent 架构：状态层 + 规划层
// 核心：状态外置 + 每轮重规划 + 表达强约束

import type { Evidence, SelfAssessmentSignal, BehaviorSignal } from "./scoring";

// ===== 硬技能维度 =====
export type HardSkillDimension =
  | "market_analysis"
  | "product_thinking"
  | "technical"
  | "business_finance"
  | "design";

export const HARD_SKILL_DIMENSIONS: HardSkillDimension[] = [
  "market_analysis",
  "product_thinking",
  "technical",
  "business_finance",
  "design",
];

export const HARD_SKILL_LABELS: Record<HardSkillDimension, string> = {
  market_analysis: "市场分析",
  product_thinking: "产品思维",
  technical: "技术能力",
  business_finance: "商业/财务",
  design: "设计能力",
};

// ===== 证据等级 =====
export type EvidenceLevel = "L0" | "L1" | "L2" | "L3" | "L4" | "L5";

const LEVEL_WEIGHT: Record<string, number> = {
  L0: 0,
  L1: 0,
  L2: 0.4,
  L3: 0.7,
  L4: 1.0,
  L5: 1.2,
};

// ===== 对话阶段 =====
export type Phase = "icebreaking" | "core" | "cross_validate" | "closing";

// ===== 维度覆盖信息 =====
export interface DimensionCoverage {
  evidenceCount: number;
  highestLevel: EvidenceLevel;
  roundsSpent: number;
  lastMentionedRound: number;
}

// ===== 对话状态对象 =====
export interface ConversationState {
  round: number;
  maxRounds: number;
  phase: Phase;
  dimensionCoverage: Record<HardSkillDimension, DimensionCoverage>;
  softSkillSignals: BehaviorSignal[];
  anchorTopic: string | null;
  lastDimension: HardSkillDimension | null;
  selfAssessments: SelfAssessmentSignal[];
  consecutiveNoInfo: number; // 连续无新信息的轮数
}

// ===== 本轮规划决策 =====
export interface RoundPlan {
  targetDimension: HardSkillDimension;
  questionType: "intro" | "follow_up" | "challenge" | "transition";
  transitionStyle: "extend" | "contrast" | "curious" | "borrow" | "honest";
  phase: Phase;
  shouldWrap: boolean;
}

// ===== 轮次记录（从历史 ROUND_DATA 解析）=====
interface RoundRecord {
  new_evidence?: Evidence[];
  self_assessment_signals?: SelfAssessmentSignal[];
  behavior_signals?: BehaviorSignal[];
  has_new_info?: boolean;
  dimensions_touched_this_round?: string[];
}

// 创建初始状态
function createInitialState(): ConversationState {
  const coverage = {} as Record<HardSkillDimension, DimensionCoverage>;
  for (const dim of HARD_SKILL_DIMENSIONS) {
    coverage[dim] = {
      evidenceCount: 0,
      highestLevel: "L0",
      roundsSpent: 0,
      lastMentionedRound: 0,
    };
  }
  return {
    round: 0,
    maxRounds: 12,
    phase: "icebreaking",
    dimensionCoverage: coverage,
    softSkillSignals: [],
    anchorTopic: null,
    lastDimension: null,
    selfAssessments: [],
    consecutiveNoInfo: 0,
  };
}

// 从历史消息解析每轮 ROUND_DATA
function parseRoundRecords(cleanedMessages: Array<{ role: string; content: string }>): RoundRecord[] {
  const records: RoundRecord[] = [];
  for (const msg of cleanedMessages) {
    if (msg.role !== "assistant") continue;
    const startTag = msg.content.indexOf("[ROUND_DATA]");
    if (startTag === -1) continue;
    const endTag = msg.content.indexOf("[/ROUND_DATA]", startTag);
    if (endTag === -1) continue;
    const jsonStr = msg.content.slice(startTag + "[ROUND_DATA]".length, endTag).trim();
    try {
      records.push(JSON.parse(jsonStr) as RoundRecord);
    } catch {
      const match = jsonStr.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          records.push(JSON.parse(match[0]) as RoundRecord);
        } catch {
          // skip
        }
      }
    }
  }
  return records;
}

// 根据 round number 判断阶段
function determinePhase(round: number): Phase {
  if (round <= 2) return "icebreaking";
  if (round <= 9) return "core";
  if (round <= 11) return "cross_validate";
  return "closing";
}

// 根据历史轮次记录构建状态
export function buildConversationState(
  cleanedMessages: Array<{ role: string; content: string }>,
  anchorTopic?: string | null
): ConversationState {
  const state = createInitialState();
  const records = parseRoundRecords(cleanedMessages);

  // 用户消息数量 = 当前轮次（一轮 = 用户一次 + AI 一次）
  const userMsgCount = cleanedMessages.filter((m) => m.role === "user").length;
  state.round = userMsgCount + 1; // 即将进行的轮次
  state.phase = determinePhase(state.round);

  // 推断锚定话题：从第 1-2 轮用户消息提取关键词（简化版）
  if (anchorTopic) {
    state.anchorTopic = anchorTopic;
  } else {
    // 取前两条用户消息的前 50 字作为锚点候选
    const earlyUserMsgs = cleanedMessages
      .filter((m) => m.role === "user")
      .slice(0, 2)
      .map((m) => m.content.slice(0, 50));
    if (earlyUserMsgs.length > 0) {
      state.anchorTopic = earlyUserMsgs[0] || null;
    }
  }

  // 从历史 ROUND_DATA 累计维度覆盖
  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    const touchedDims = rec.dimensions_touched_this_round || [];

    for (const dimStr of touchedDims) {
      const dim = dimStr as HardSkillDimension;
      if (!HARD_SKILL_DIMENSIONS.includes(dim)) continue;
      state.dimensionCoverage[dim].roundsSpent++;
      state.dimensionCoverage[dim].lastMentionedRound = i + 1;
    }

    if (rec.new_evidence) {
      for (const ev of rec.new_evidence) {
        const dim = ev.dimension as HardSkillDimension;
        if (!HARD_SKILL_DIMENSIONS.includes(dim)) continue;
        state.dimensionCoverage[dim].evidenceCount++;
        // 更新最高证据等级
        const lvl = ev.level as EvidenceLevel;
        if (LEVEL_WEIGHT[lvl] > LEVEL_WEIGHT[state.dimensionCoverage[dim].highestLevel]) {
          state.dimensionCoverage[dim].highestLevel = lvl;
        }
      }
    }

    if (rec.self_assessment_signals) {
      state.selfAssessments.push(...rec.self_assessment_signals);
    }

    if (rec.behavior_signals) {
      state.softSkillSignals.push(...rec.behavior_signals);
    }
  }

  // 上一轮维度 = 最近一条记录 touched 的最后一个维度
  if (records.length > 0) {
    const lastTouched = records[records.length - 1].dimensions_touched_this_round;
    if (lastTouched && lastTouched.length > 0) {
      state.lastDimension = lastTouched[lastTouched.length - 1] as HardSkillDimension;
    }
  }

  // 计算连续无新信息的轮数（从最新记录倒推）
  let noInfoCount = 0;
  for (let i = records.length - 1; i >= 0; i--) {
    if (records[i].has_new_info === false) {
      noInfoCount++;
    } else {
      break; // 遇到有新信息的就停
    }
  }
  state.consecutiveNoInfo = noInfoCount;

  return state;
}

// ===== Planner 规划层：本轮决策 =====

export function planRound(state: ConversationState): RoundPlan {
  const { round, dimensionCoverage } = state;

  // 判断是否应该收尾
  const shouldWrap = checkShouldWrap(state);

  // 决定本轮主攻维度
  const targetDimension = selectTargetDimension(state);

  // 决定问题类型
  const questionType = selectQuestionType(dimensionCoverage[targetDimension]);

  // 决定转场方式
  const transitionStyle = selectTransitionStyle(state, targetDimension);

  return {
    targetDimension,
    questionType,
    transitionStyle,
    phase: state.phase,
    shouldWrap,
  };
}

// 是否应该收尾
function checkShouldWrap(state: ConversationState): boolean {
  // 第 12 轮强制收尾
  if (state.round >= state.maxRounds) return true;

  // 连续 3 轮没获得任何有效新信息 → 再聊就是尬聊了
  if (state.consecutiveNoInfo >= 3) return true;

  // 全部 5 维都有至少 1 条 L3+ 证据（真实经历/深度），且已进入交叉验证阶段
  const allDeepCovered = HARD_SKILL_DIMENSIONS.every(
    (dim) => {
      const c = state.dimensionCoverage[dim];
      return c.evidenceCount >= 1 && LEVEL_WEIGHT[c.highestLevel] >= LEVEL_WEIGHT["L3"];
    }
  );
  if (allDeepCovered && state.round >= 11) return true;

  return false;
}

// 选择本轮主攻维度
function selectTargetDimension(state: ConversationState): HardSkillDimension {
  const { dimensionCoverage, lastDimension } = state;

  // 0. 连续2轮无新信息 → 强制切换到完全不同的维度（避免钻牛角尖）
  if (state.consecutiveNoInfo >= 2 && lastDimension) {
    // 选一个和上一轮不同的、0证据优先的维度
    const otherZeroDims = HARD_SKILL_DIMENSIONS.filter(
      (dim) => dim !== lastDimension && dimensionCoverage[dim].evidenceCount === 0
    );
    if (otherZeroDims.length > 0) return otherZeroDims[0];
  }

  // 1. 0 证据的维度优先
  const zeroEvidenceDims = HARD_SKILL_DIMENSIONS.filter(
    (dim) => dimensionCoverage[dim].evidenceCount === 0
  );

  if (zeroEvidenceDims.length > 0) {
    // 2. 同样 0 证据时，选与上一轮话题最接近的维度
    if (lastDimension) {
      const adjacent = getAdjacentDimension(lastDimension);
      if (zeroEvidenceDims.includes(adjacent)) return adjacent;
    }
    return zeroEvidenceDims[0];
  }

  // 1.5. 所有维度都有过证据，但可能有些维度证据被清空后仍在问——这里其实不会发生
  // 2. 所有维度都有证据了，选证据最弱的维度补漏
  const sorted = [...HARD_SKILL_DIMENSIONS].sort((a, b) => {
    const aLevel = LEVEL_WEIGHT[dimensionCoverage[a].highestLevel];
    const bLevel = LEVEL_WEIGHT[dimensionCoverage[b].highestLevel];
    if (aLevel !== bLevel) return aLevel - bLevel; // 低等级优先
    return dimensionCoverage[a].evidenceCount - dimensionCoverage[b].evidenceCount; // 证据少的优先
  });

  // 3. 每个维度最多 3 轮，超过强制换
  const notExhausted = sorted.filter((dim) => dimensionCoverage[dim].roundsSpent < 3);
  if (notExhausted.length > 0) return notExhausted[0];

  // 都 exhausted 了，返回最弱的
  return sorted[0];
}

// 相邻维度（用于自然转场）
function getAdjacentDimension(dim: HardSkillDimension): HardSkillDimension {
  const adjacency: Record<HardSkillDimension, HardSkillDimension> = {
    market_analysis: "product_thinking",
    product_thinking: "technical",
    technical: "design",
    business_finance: "market_analysis",
    design: "product_thinking",
  };
  return adjacency[dim];
}

// 选择问题类型
function selectQuestionType(coverage: DimensionCoverage): RoundPlan["questionType"] {
  if (coverage.evidenceCount === 0) return "intro";
  if (coverage.evidenceCount === 1 && LEVEL_WEIGHT[coverage.highestLevel] <= LEVEL_WEIGHT["L2"]) {
    return "follow_up";
  }
  if (coverage.evidenceCount === 1 && LEVEL_WEIGHT[coverage.highestLevel] >= LEVEL_WEIGHT["L3"]) {
    return "challenge";
  }
  // >= 2 条证据
  if (LEVEL_WEIGHT[coverage.highestLevel] < LEVEL_WEIGHT["L3"]) {
    // 证据等级还不够高，继续追问深挖
    return "follow_up";
  }
  // 证据足够，顺带提一下就走
  return "transition";
}

// 选择转场方式
function selectTransitionStyle(
  state: ConversationState,
  target: HardSkillDimension
): RoundPlan["transitionStyle"] {
  if (!state.lastDimension) return "extend";

  // 相邻维度用延伸
  if (getAdjacentDimension(state.lastDimension) === target) return "extend";
  // 有对比关系的用对比
  if (
    (state.lastDimension === "market_analysis" && target === "business_finance") ||
    (state.lastDimension === "business_finance" && target === "market_analysis") ||
    (state.lastDimension === "product_thinking" && target === "technical") ||
    (state.lastDimension === "technical" && target === "product_thinking")
  ) {
    return "contrast";
  }
  // 跨度大用好奇式
  return "curious";
}

// ===== 状态展示文本（注入 System Prompt）=====

export function formatStateForPrompt(state: ConversationState, plan: RoundPlan): string {
  const dimStatus = HARD_SKILL_DIMENSIONS.map((dim) => {
    const c = state.dimensionCoverage[dim];
    const icon = c.evidenceCount > 0 ? "✅" : "⬜";
    return `  ${HARD_SKILL_LABELS[dim]}：${c.evidenceCount}条证据（${c.highestLevel}），花了${c.roundsSpent}轮 ${icon}`;
  }).join("\n");

  const phaseLabel: Record<Phase, string> = {
    icebreaking: "破冰",
    core: "核心评估",
    cross_validate: "交叉验证",
    closing: "收尾",
  };

  const qTypeLabel: Record<RoundPlan["questionType"], string> = {
    intro: "引入型（从锚定话题自然切入）",
    follow_up: "追问型（要具体例子）",
    challenge: "挑战型（换角度验证）",
    transition: "转场型（顺带提一下就走）",
  };

  const transLabel: Record<RoundPlan["transitionStyle"], string> = {
    extend: "顺着话题延伸",
    contrast: "对比式转场",
    curious: "好奇式跳转",
    borrow: "借用对方的话",
    honest: "坦白式转场",
  };

  return `【当前状态】
- 第 ${state.round} / ${state.maxRounds} 轮
- 当前阶段：${phaseLabel[state.phase]}
- 已覆盖维度：
${dimStatus}
- 上一轮维度：${state.lastDimension ? HARD_SKILL_LABELS[state.lastDimension] : "无"}
- 锚定话题：${state.anchorTopic || "尚未确定"}
${state.consecutiveNoInfo >= 2 ? `- ⚠️ 连续${state.consecutiveNoInfo}轮无新信息，本轮强制切换维度\n` : ""}【本轮任务】
主攻维度：${HARD_SKILL_LABELS[plan.targetDimension]}（${state.dimensionCoverage[plan.targetDimension].evidenceCount}条证据，${state.dimensionCoverage[plan.targetDimension].highestLevel}）
转场方式：${transLabel[plan.transitionStyle]}
问题类型：${qTypeLabel[plan.questionType]}
${plan.shouldWrap ? "⚠️ 本轮需收尾输出画像。" : ""}

请用狐狸的语气，先回应用户上一条消息，然后自然地转到${HARD_SKILL_LABELS[plan.targetDimension]}维度，问1个开放式问题。`;
}
