// 评分引擎核心 - 证据五级分级 + 验证分/自述分双轨

import type { Evidence, SelfAssessmentSignal, DimensionScore } from "./types";

// 证据等级权重
const LEVEL_WEIGHTS: Record<string, number> = {
  L0: 0,
  L1: 0,
  L2: 0.4,
  L3: 0.7,
  L4: 1.0,
  L5: 1.2,
};

export function getWeight(level: string): number {
  return LEVEL_WEIGHTS[level] || 0;
}

/**
 * 计算验证分（加权平均 + 证据数量修正）
 */
export function calculateVerifiedScore(evidences: Evidence[]): number {
  // 过滤掉 L1（自称），只统计 L2-L5
  const validEvidences = evidences.filter((e) => getWeight(e.level) > 0);
  if (validEvidences.length === 0) return 0;

  // 按证据等级加权
  const weightedScores = validEvidences.map((e) => e.quality_score * getWeight(e.level));
  const totalWeight = validEvidences.reduce((sum, e) => sum + getWeight(e.level), 0);

  if (totalWeight === 0) return 0;

  // 加权平均
  const baseScore = weightedScores.reduce((a, b) => a + b, 0) / totalWeight;

  // 证据数量修正：单条证据打折扣，多条独立证据互相验证后趋于稳定
  const countFactor = Math.min(1, 0.6 + 0.1 * validEvidences.length);
  // 1条→0.7，2条→0.8，3条→0.9，4条以上→1.0

  return Math.round(baseScore * countFactor * 10) / 10;
}

/**
 * 计算自述分（加权平均）
 */
export function calculateSelfScore(signals: SelfAssessmentSignal[]): number {
  if (signals.length === 0) return 0;
  return (
    Math.round(
      (signals.reduce((sum, s) => sum + s.estimated_self_score, 0) / signals.length) * 10
    ) / 10
  );
}

/**
 * 获取某维度的最高证据等级
 */
export function getMaxEvidenceLevel(evidences: Evidence[]): string {
  if (evidences.length === 0) return "L0";
  const order = ["L0", "L1", "L2", "L3", "L4", "L5"];
  let maxIdx = 0;
  for (const e of evidences) {
    const idx = order.indexOf(e.level);
    if (idx > maxIdx) maxIdx = idx;
  }
  return order[maxIdx];
}

/**
 * 证据去重：同一维度的同一条证据不重复计分
 * 去重策略：相同 summary 视为重复
 */
export function deduplicateEvidences(evidences: Evidence[]): Evidence[] {
  const seen = new Set<string>();
  return evidences.filter((e) => {
    const key = `${e.dimension}:${e.summary}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * 计算所有维度的评分
 */
export function calculateDimensionScores(
  evidences: Evidence[],
  signals: SelfAssessmentSignal[]
): Record<string, DimensionScore> {
  const dimensions = new Set<string>([
    ...evidences.map((e) => e.dimension),
    ...signals.map((s) => s.dimension),
  ]);

  const result: Record<string, DimensionScore> = {};

  for (const dim of dimensions) {
    const dimEvidences = deduplicateEvidences(
      evidences.filter((e) => e.dimension === dim)
    );
    const dimSignals = signals.filter((s) => s.dimension === dim);

    result[dim] = {
      verified_score: calculateVerifiedScore(dimEvidences),
      self_score: calculateSelfScore(dimSignals),
      evidence_level: getMaxEvidenceLevel(dimEvidences) as DimensionScore["evidence_level"],
      evidence_count: dimEvidences.length,
      evidence_list: dimEvidences,
    };
  }

  return result;
}

/**
 * 计算维度覆盖度
 */
export function calculateCoverage(
  dimensionScores: Record<string, DimensionScore>,
  totalDimensions: number
): number {
  const covered = Object.values(dimensionScores).filter(
    (d) => d.evidence_level !== "L0" && d.evidence_count > 0
  ).length;
  return totalDimensions > 0 ? Math.round((covered / totalDimensions) * 100) / 100 : 0;
}
