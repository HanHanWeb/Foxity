import type { AssessmentState, DimensionMeta } from "@/types";
import { hardSkillMeta } from "@/types";

// 硬技能维度元信息（供图表/UI 使用）
export const dimensions: DimensionMeta[] = hardSkillMeta.map((m) => ({
  key: m.key,
  icon: m.icon,
  name: m.name,
  shortName: m.shortName,
}));

// Foxity 表情对应的口播文案
export const expressionText = {
  smile: "认真倾听中...",
  thinking: "让我想想...",
  curious: "诶？这个有意思！",
  challenge: "嗯...我有不同看法",
  nod: "说得对！",
  surprised: "哦？没想到！",
  encourage: "没关系，慢慢来",
  serious: "认真总结中...",
};

// 团队创建时可选的竞赛类型
export const competitionTypes = ["挑战杯", "互联网+", "创青春", "其他"];

// 会话/评估的初始状态
export const initialAssessmentState: AssessmentState = {
  current_expression: "smile",
  covered_dimensions: {
    market_analysis: "untested",
    product_thinking: "untested",
    technical: "untested",
    business_finance: "untested",
    design: "untested",
  },
  key_events: { stress: false, conflict: false },
  elapsed_minutes: 0,
  insights: [],
};
