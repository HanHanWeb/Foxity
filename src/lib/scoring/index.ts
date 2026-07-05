// 评分引擎统一出口

export * from "./types";
export * from "./engine";
export * from "./credibility";
export * from "./twelve-types";
export * from "./soft-skills";

import type { Evidence, SelfAssessmentSignal, BehaviorSignal, ScoreData } from "./types";
import { calculateDimensionScores } from "./engine";
import { calculateCredibility } from "./credibility";
import { determineType } from "./twelve-types";
import { calculateSoftSkillScores } from "./soft-skills";

/**
 * 汇总所有评分数据
 */
export function aggregateScores(
  evidences: Evidence[],
  signals: SelfAssessmentSignal[],
  behaviorSignals: BehaviorSignal[]
): {
  score_data: ScoreData;
  credibility: ReturnType<typeof calculateCredibility>;
  type_result: ReturnType<typeof determineType>;
  soft_skill_scores: ReturnType<typeof calculateSoftSkillScores>;
} {
  // 维度评分
  const dimensionScores = calculateDimensionScores(evidences, signals);

  // 构建 verified_scores / self_scores / evidence_levels
  const verified_scores: Record<string, number> = {};
  const self_scores: Record<string, number> = {};
  const evidence_levels: Record<string, string> = {};
  for (const [dim, ds] of Object.entries(dimensionScores)) {
    verified_scores[dim] = ds.verified_score;
    self_scores[dim] = ds.self_score;
    evidence_levels[dim] = ds.evidence_level;
  }

  const score_data: ScoreData = {
    verified_scores,
    self_scores,
    evidence_levels: evidence_levels as ScoreData["evidence_levels"],
    dimension_scores: dimensionScores,
  };

  return {
    score_data,
    credibility: calculateCredibility(score_data),
    type_result: determineType(score_data),
    soft_skill_scores: calculateSoftSkillScores(behaviorSignals),
  };
}
