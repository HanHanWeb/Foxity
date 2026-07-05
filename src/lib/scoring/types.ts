// ========== 证据等级 ==========
export type EvidenceLevel = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5';

// ========== 维度定义 ==========
export type HardSkillDimension =
  | 'market_analysis'
  | 'product_thinking'
  | 'technical'
  | 'business_finance'
  | 'design';

export type SoftSkillDimension =
  | 'personality'
  | 'communication'
  | 'work_style'
  | 'leadership'
  | 'learning';

export type SkillDimension = HardSkillDimension | SoftSkillDimension;

export const HARD_SKILL_DIMENSIONS: HardSkillDimension[] = [
  'market_analysis',
  'product_thinking',
  'technical',
  'business_finance',
  'design',
];

export const SOFT_SKILL_DIMENSIONS: SoftSkillDimension[] = [
  'personality',
  'communication',
  'work_style',
  'leadership',
  'learning',
];

export const ALL_DIMENSIONS: SkillDimension[] = [
  ...HARD_SKILL_DIMENSIONS,
  ...SOFT_SKILL_DIMENSIONS,
];

export const DIMENSION_LABELS: Record<SkillDimension, string> = {
  market_analysis: '市场分析',
  product_thinking: '产品思维',
  technical: '技术能力',
  business_finance: '商业/财务',
  design: '设计能力',
  personality: '性格特质',
  communication: '沟通协作',
  work_style: '做事风格',
  leadership: '领导力',
  learning: '学习适应',
};

// ========== 证据 ==========
export interface Evidence {
  dimension: SkillDimension;
  level: EvidenceLevel;
  quality_score: number; // 0-10，AI对回答质量的打分
  summary: string; // 证据摘要
  quote: string; // 用户原话
  chat_round: number; // 第几轮产生
  created_at?: string;
}

// ========== 自述信号 ==========
export interface SelfAssessmentSignal {
  dimension: SkillDimension;
  signal: string; // 用户原话中的自述表达
  estimated_self_score: number; // 估算的自述分 0-10
  chat_round: number;
}

// ========== 行为信号（软实力） ==========
export type BehaviorIndicator =
  // communication
  | 'structured_response'
  | 'clarity'
  | 'other_awareness'
  | 'interaction_quality'
  // work_style
  | 'answer_structure'
  | 'time_awareness'
  | 'detail_focus'
  | 'risk_awareness'
  // leadership
  | 'decision_mode'
  | 'responsibility'
  | 'initiative'
  | 'influence'
  // learning
  | 'reflection'
  | 'curiosity'
  | 'transfer_ability'
  | 'facing_unknown'
  // personality
  | 'answer_length'
  | 'tone'
  | 'self_exposure'
  | 'emotional_expression';

export interface BehaviorSignal {
  dimension: SoftSkillDimension;
  indicator: BehaviorIndicator;
  polarity: 'positive' | 'negative' | 'neutral';
  strength: number; // 0-1
  description: string;
  chat_round: number;
}

// ========== 每轮AI返回的结构化数据 ==========
export interface RoundData {
  round: number;
  phase: 'icebreaking' | 'deep_dive' | 'cross_validate' | 'closing';
  new_evidence: Evidence[];
  self_assessment_signals: SelfAssessmentSignal[];
  behavior_signals: BehaviorSignal[];
  has_new_info: boolean;
  dimensions_touched_this_round: SkillDimension[];
}

// ========== 维度评分结果 ==========
export interface DimensionScore {
  verified_score: number; // 验证分 0-10
  self_score: number; // 自述分 0-10
  evidence_level: EvidenceLevel; // 最高证据等级
  evidence_count: number; // 有效证据条数（L2及以上）
  evidence_list: Evidence[];
  behavior_signal_count: number; // 行为信号数量（仅软实力）
}

// ========== 完整评分结果 ==========
export interface ScoreData {
  hard_skills: Record<HardSkillDimension, DimensionScore>;
  soft_skills: Record<SoftSkillDimension, DimensionScore>;
  overall_verified: number; // 综合验证分
  overall_self: number; // 综合自述分
  total_rounds: number;
  evidence_total: number;
}

// ========== 可信度结果 ==========
export type CredibilityLevel = 'S' | 'A' | 'B' | 'C' | 'D' | 'unrated';

export interface CredibilityResult {
  overall: number | null;
  overall_level: CredibilityLevel;
  overall_label: string;
  dimensions: Record<SkillDimension, {
    credibility: number | null;
    level: CredibilityLevel;
    verified_score: number;
    self_score: number;
  }>;
}

// ========== 12型角色结果 ==========
export type SkillOrientation = 'analytical' | 'execution' | 'business';
export type BehaviorPattern = 'dominant' | 'collaborative' | 'independent' | 'growing';

export interface TwelveTypeResult {
  primary_type: string;
  primary_icon: string;
  primary_description: string;
  skill_orientation: SkillOrientation;
  behavior_pattern: BehaviorPattern;
  secondary_types: Array<{ name: string; icon: string; match_score: number }>;
  confidence: number; // 0-1 分型置信度
}

// ========== 画像输出 ==========
export interface V3Profile {
  summary: string;
  hard_skills: Record<HardSkillDimension, DimensionScore>;
  soft_skills: Record<SoftSkillDimension, DimensionScore>;
  twelve_type: TwelveTypeResult;
  credibility: CredibilityResult;
  keyword_tags: Array<{
    tag: string;
    confidence: 'high' | 'medium' | 'low';
    evidence: string;
    category: string;
  }>;
  soft_skill_narrative: string;
  highlights: string[];
  areas_for_growth: Array<{ priority: '高' | '中' | '低'; title: string; detail: string }>;
  untested_dimensions: SkillDimension[];
  task_recommendations: {
    suitable: string[];
    caution: string[];
  };
}
