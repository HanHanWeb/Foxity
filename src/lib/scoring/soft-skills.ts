import type {
  BehaviorSignal,
  SoftSkillDimension,
  DimensionScore,
} from './types';
import { SOFT_SKILL_DIMENSIONS } from './types';

// ========== 行为指标 → 维度映射 ==========
// 每个行为指标对应哪个软实力维度，以及正负向和基准分影响
interface IndicatorConfig {
  dimension: SoftSkillDimension;
  weight: number; // 该指标在维度中的权重 0-1
}

const INDICATOR_CONFIG: Record<string, IndicatorConfig> = {
  // communication
  structured_response: { dimension: 'communication', weight: 0.3 },
  clarity: { dimension: 'communication', weight: 0.3 },
  other_awareness: { dimension: 'communication', weight: 0.2 },
  interaction_quality: { dimension: 'communication', weight: 0.2 },
  // work_style
  answer_structure: { dimension: 'work_style', weight: 0.35 },
  time_awareness: { dimension: 'work_style', weight: 0.25 },
  detail_focus: { dimension: 'work_style', weight: 0.25 },
  risk_awareness: { dimension: 'work_style', weight: 0.15 },
  // leadership
  decision_mode: { dimension: 'leadership', weight: 0.3 },
  responsibility: { dimension: 'leadership', weight: 0.3 },
  initiative: { dimension: 'leadership', weight: 0.2 },
  influence: { dimension: 'leadership', weight: 0.2 },
  // learning
  reflection: { dimension: 'learning', weight: 0.35 },
  curiosity: { dimension: 'learning', weight: 0.25 },
  transfer_ability: { dimension: 'learning', weight: 0.2 },
  facing_unknown: { dimension: 'learning', weight: 0.2 },
  // personality（用于补充性格描述，也影响打分）
  answer_length: { dimension: 'personality', weight: 0.2 },
  tone: { dimension: 'personality', weight: 0.25 },
  self_exposure: { dimension: 'personality', weight: 0.3 },
  emotional_expression: { dimension: 'personality', weight: 0.25 },
};

// ========== 软实力行为评分计算 ==========
/**
 * 基于行为信号计算软实力评分
 * 基线5分（普通人水平），正信号加分，负信号减分
 * 信号数量越少，越接近基线（避免一两句话就武断判断）
 */
export function calculateSoftSkillFromBehavior(
  behaviorSignals: BehaviorSignal[],
): Record<SoftSkillDimension, { score: number; signal_count: number; signals: BehaviorSignal[] }> {
  const result = {} as Record<SoftSkillDimension, {
    score: number;
    signal_count: number;
    signals: BehaviorSignal[];
  }>;

  for (const dim of SOFT_SKILL_DIMENSIONS) {
    const dimSignals = behaviorSignals.filter(s => s.dimension === dim);

    if (dimSignals.length === 0) {
      result[dim] = { score: 5, signal_count: 0, signals: [] }; // 基线5分
      continue;
    }

    // 计算加权分数偏移
    let totalDelta = 0;
    let totalWeight = 0;

    for (const signal of dimSignals) {
      const config = INDICATOR_CONFIG[signal.indicator];
      if (!config) continue;

      const weight = config.weight;
      const direction = signal.polarity === 'positive' ? 1 : signal.polarity === 'negative' ? -1 : 0;
      const strength = signal.strength;

      // 每个信号最多贡献 ±1.5 分（乘以权重）
      const delta = direction * strength * 1.5 * weight;
      totalDelta += delta;
      totalWeight += weight;
    }

    // 基线5分 + 加权偏移
    const rawScore = 5 + totalDelta;
    const clampedScore = Math.max(0, Math.min(10, rawScore));

    // 证据数量修正：信号越少越接近基线
    // 1条→0.2, 2条→0.4, 3条→0.6, 4条→0.8, 5条以上→1.0
    const countFactor = Math.min(1, dimSignals.length * 0.2);
    const finalScore = 5 + (clampedScore - 5) * countFactor;

    result[dim] = {
      score: Math.round(finalScore * 10) / 10,
      signal_count: dimSignals.length,
      signals: dimSignals,
    };
  }

  return result;
}

// ========== 融合：内容证据分 + 行为信号分 ==========
/**
 * 将内容证据得到的评分和行为信号得到的评分融合
 * 内容证据权重 70%，行为信号权重 30%
 * （因为行为信号是间接推断，可信度低于内容证据）
 */
export function fuseSoftSkillScores(
  contentScore: DimensionScore,        // 从对话内容证据得到的分
  behaviorScore: { score: number; signal_count: number }, // 从行为信号得到的分
): DimensionScore {
  if (contentScore.evidence_count === 0 && behaviorScore.signal_count === 0) {
    return { ...contentScore, verified_score: 0, evidence_level: 'L0' };
  }

  if (contentScore.evidence_count === 0) {
    // 只有行为信号，打折
    return {
      ...contentScore,
      verified_score: Math.round(behaviorScore.score * 0.6 * 10) / 10, // 行为信号单独给分打6折
      behavior_signal_count: behaviorScore.signal_count,
    };
  }

  if (behaviorScore.signal_count === 0) {
    // 只有内容证据
    return { ...contentScore, behavior_signal_count: 0 };
  }

  // 两者都有，加权融合
  const contentWeight = 0.7;
  const behaviorWeight = 0.3;
  const fused = contentScore.verified_score * contentWeight + behaviorScore.score * behaviorWeight;

  return {
    ...contentScore,
    verified_score: Math.round(fused * 10) / 10,
    behavior_signal_count: behaviorScore.signal_count,
  };
}

// ========== 性格画像描述生成（基于行为信号） ==========
export function generatePersonalityNarrative(
  behaviorSignals: BehaviorSignal[],
): string {
  const traits: string[] = [];

  // 从行为信号中提取性格特征
  const extroversionSignals = behaviorSignals.filter(
    s => s.dimension === 'personality' && s.indicator === 'emotional_expression'
  );
  const reflectionSignals = behaviorSignals.filter(
    s => s.dimension === 'learning' && s.indicator === 'reflection'
  );
  const structureSignals = behaviorSignals.filter(
    s => s.dimension === 'work_style' && s.indicator === 'answer_structure'
  );
  const communicationSignals = behaviorSignals.filter(
    s => s.dimension === 'communication'
  );

  // 外向/内向判断
  const avgExtro = extroversionSignals.reduce((s, x) => s + (x.polarity === 'positive' ? x.strength : -x.strength), 0)
    / (extroversionSignals.length || 1);

  if (avgExtro > 0.3) {
    traits.push('你是个外向型的人，表达力强，情绪外放，团队里有你气氛不会冷');
  } else if (avgExtro < -0.3) {
    traits.push('你偏内向型，习惯先想再说，思考有深度，但在团队讨论中可能需要被主动邀请才发言');
  }

  // 反思能力
  const hasReflection = reflectionSignals.some(s => s.polarity === 'positive');
  if (hasReflection) {
    traits.push('你有反思习惯，会从经历中总结经验，这是成长最快的特质');
  }

  // 结构性思维
  const structured = structureSignals.some(s => s.polarity === 'positive' && s.indicator === 'answer_structure');
  if (structured) {
    traits.push('思维有条理，习惯先搭框架再填内容，做事情章法清晰');
  }

  // 如果特征太少，给个通用描述
  if (traits.length === 0) {
    traits.push('你是个比较均衡的人，没有特别突出的性格棱角，适应力强，在各种团队里都能融入');
  }

  return traits.join('。') + '。';
}
