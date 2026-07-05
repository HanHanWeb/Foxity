import type {
  Evidence,
  EvidenceLevel,
  DimensionScore,
  ScoreData,
  SkillDimension,
  HardSkillDimension,
  SoftSkillDimension,
  SelfAssessmentSignal,
  HARD_SKILL_DIMENSIONS,
  SOFT_SKILL_DIMENSIONS,
} from './types';
import { ALL_DIMENSIONS, HARD_SKILL_DIMENSIONS, SOFT_SKILL_DIMENSIONS } from './types';

// ========== 证据等级权重 ==========
const EVIDENCE_WEIGHTS: Record<EvidenceLevel, number> = {
  L0: 0,
  L1: 0, // 自称不计入验证分
  L2: 0.4,
  L3: 0.7,
  L4: 1.0,
  L5: 1.2,
};

// ========== 工具函数 ==========
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function getHighestEvidenceLevel(evidences: Evidence[]): EvidenceLevel {
  if (evidences.length === 0) return 'L0';
  const levels: EvidenceLevel[] = ['L5', 'L4', 'L3', 'L2', 'L1', 'L0'];
  for (const lvl of levels) {
    if (evidences.some(e => e.level === lvl)) return lvl;
  }
  return 'L0';
}

// ========== 单维度验证分计算 ==========
function calcVerifiedScore(evidences: Evidence[]): { score: number; count: number } {
  // 只取 L2 及以上的有效证据（L1自称不算）
  const valid = evidences.filter(e => {
    const weight = EVIDENCE_WEIGHTS[e.level];
    return weight > 0 && e.quality_score > 0;
  });

  if (valid.length === 0) {
    return { score: 0, count: 0 };
  }

  // 按证据等级加权求和
  let weightedSum = 0;
  let totalWeight = 0;

  for (const e of valid) {
    const w = EVIDENCE_WEIGHTS[e.level];
    weightedSum += e.quality_score * w;
    totalWeight += w;
  }

  const baseScore = weightedSum / totalWeight;

  // 证据数量修正：单条证据打折扣，多条独立证据互相验证后趋于稳定
  // 1条→0.7, 2条→0.8, 3条→0.9, 4条及以上→1.0
  const countFactor = Math.min(1, 0.6 + 0.1 * valid.length);
  const finalScore = baseScore * countFactor;

  // L5 可以超分上限（10分上限放宽到12）
  const hasL5 = valid.some(e => e.level === 'L5');
  const cap = hasL5 ? 12 : 10;

  return {
    score: round1(Math.min(cap, Math.max(0, finalScore))),
    count: valid.length,
  };
}

// ========== 自述分计算 ==========
function calcSelfScore(signals: SelfAssessmentSignal[]): number {
  if (signals.length === 0) return 0;
  // 简单平均，后续可加时间衰减
  const sum = signals.reduce((s, sig) => s + sig.estimated_self_score, 0);
  return round1(sum / signals.length);
}

// ========== 证据去重 ==========
// 同一维度的相似证据（同一轮、同一主题）只保留最高质量的
function dedupeEvidences(evidences: Evidence[]): Evidence[] {
  const byDimension: Record<string, Evidence[]> = {};
  for (const e of evidences) {
    if (!byDimension[e.dimension]) byDimension[e.dimension] = [];
    byDimension[e.dimension].push(e);
  }

  const result: Evidence[] = [];
  for (const dim of Object.keys(byDimension)) {
    const list = byDimension[dim];
    // 按质量分降序，去重相似摘要（简单起见保留所有不同轮次的）
    list.sort((a, b) => b.quality_score - a.quality_score);
    result.push(...list);
  }
  return result;
}

// ========== 主评分引擎 ==========
export class ScoringEngine {
  private evidences: Evidence[] = [];
  private selfSignals: SelfAssessmentSignal[] = [];
  private totalRounds: number = 0;

  addRoundData(
    roundEvidences: Evidence[],
    roundSelfSignals: SelfAssessmentSignal[],
    roundNumber: number,
  ): void {
    this.totalRounds = Math.max(this.totalRounds, roundNumber);
    this.evidences.push(...roundEvidences.map(e => ({ ...e, chat_round: roundNumber })));
    this.selfSignals.push(...roundSelfSignals.map(s => ({ ...s, chat_round: roundNumber })));
  }

  // 获取单个维度的评分
  getDimensionScore(dimension: SkillDimension): DimensionScore {
    const dimEvidences = this.evidences.filter(e => e.dimension === dimension);
    const deduped = dedupeEvidences(dimEvidences);
    const { score, count } = calcVerifiedScore(deduped);
    const dimSelfSignals = this.selfSignals.filter(s => s.dimension === dimension);
    const selfScore = calcSelfScore(dimSelfSignals);

    return {
      verified_score: score,
      self_score: selfScore,
      evidence_level: getHighestEvidenceLevel(deduped),
      evidence_count: count,
      evidence_list: deduped,
      behavior_signal_count: 0, // 由 soft-skills 模块补充
    };
  }

  // 获取完整评分数据
  getScoreData(): ScoreData {
    const hardSkills = {} as Record<HardSkillDimension, DimensionScore>;
    const softSkills = {} as Record<SoftSkillDimension, DimensionScore>;

    for (const dim of HARD_SKILL_DIMENSIONS) {
      hardSkills[dim] = this.getDimensionScore(dim);
    }
    for (const dim of SOFT_SKILL_DIMENSIONS) {
      softSkills[dim] = this.getDimensionScore(dim);
    }

    // 综合分：所有有分的维度取平均
    const allScores = [...Object.values(hardSkills), ...Object.values(softSkills)];
    const scored = allScores.filter(s => s.verified_score > 0);
    const selfScored = allScores.filter(s => s.self_score > 0);

    const overallVerified = scored.length > 0
      ? round1(scored.reduce((s, d) => s + d.verified_score, 0) / scored.length)
      : 0;

    const overallSelf = selfScored.length > 0
      ? round1(selfScored.reduce((s, d) => s + d.self_score, 0) / selfScored.length)
      : 0;

    const evidenceTotal = allScores.reduce((s, d) => s + d.evidence_count, 0);

    return {
      hard_skills: hardSkills,
      soft_skills: softSkills,
      overall_verified: overallVerified,
      overall_self: overallSelf,
      total_rounds: this.totalRounds,
      evidence_total: evidenceTotal,
    };
  }

  // 获取所有证据（调试用）
  getAllEvidences(): Evidence[] {
    return [...this.evidences];
  }

  // 获取维度覆盖度（有有效证据的维度数 / 总维度数）
  getCoverage(): { covered: number; total: number; ratio: number } {
    let covered = 0;
    for (const dim of ALL_DIMENSIONS) {
      const score = this.getDimensionScore(dim);
      if (score.evidence_count > 0) covered++;
    }
    return {
      covered,
      total: ALL_DIMENSIONS.length,
      ratio: round1(covered / ALL_DIMENSIONS.length),
    };
  }

  // 判断是否可以终止测评
  shouldEndAssessment(): boolean {
    const { covered } = this.getCoverage();
    // 至少7个维度有有效证据
    if (covered >= 7) return true;
    // 超过12轮
    if (this.totalRounds >= 12) return true;
    return false;
  }

  // 重置
  reset(): void {
    this.evidences = [];
    this.selfSignals = [];
    this.totalRounds = 0;
  }
}

// ========== 便捷函数：从对话历史一次性计算 ==========
export function computeScoreFromRounds(
  rounds: Array<{
    round: number;
    evidences: Evidence[];
    selfSignals: SelfAssessmentSignal[];
  }>,
): ScoreData {
  const engine = new ScoringEngine();
  for (const r of rounds) {
    engine.addRoundData(r.evidences, r.selfSignals, r.round);
  }
  return engine.getScoreData();
}
