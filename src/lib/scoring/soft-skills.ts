// 软实力行为锚点评分

import type { BehaviorSignal, SoftSkillScores } from "./types";

const SOFT_SKILL_DIMENSIONS = [
  "communication",
  "work_style",
  "leadership",
  "learning",
  "personality",
];

/**
 * 计算软实力评分
 * - 基线5分（普通人水平）
 * - 正信号加分，负信号减分
 * - 信号越多，偏离基线越远（避免一两句话就武断判断）
 */
export function calculateSoftSkillScores(
  behaviorSignals: BehaviorSignal[]
): SoftSkillScores {
  const scores: SoftSkillScores["scores"] = {};

  for (const dim of SOFT_SKILL_DIMENSIONS) {
    const dimSignals = behaviorSignals.filter((s) => s.dimension === dim);
    if (dimSignals.length === 0) {
      scores[dim] = { score: 0, evidence_count: 0, signals: [] };
      continue;
    }

    // 正信号加分，负信号减分
    let total = 5; // 基线5分
    for (const signal of dimSignals) {
      const delta = signal.polarity === "positive" ? signal.strength : -signal.strength;
      total += delta * 1.5; // 放大系数
    }

    // 钳位到 0-10
    const score = Math.max(0, Math.min(10, total));

    // 证据数量修正：信号越少越接近基线，信号越多越可信
    const countFactor = Math.min(1, dimSignals.length * 0.2); // 5条以上100%置信
    const finalScore = 5 + (score - 5) * countFactor;

    scores[dim] = {
      score: Math.round(finalScore * 10) / 10,
      evidence_count: dimSignals.length,
      signals: dimSignals,
    };
  }

  return { scores };
}
