// 评分引擎统一出口
export { ScoringEngine, computeScoreFromRounds } from './engine';
export { calculateCredibility, getCredibilityLevel, getCredibilityLabel, getCredibilityWarning, generateTaskRecommendations } from './credibility';
export { determineTwelveType, getTypeInfo, analyzeTeamTypeDistribution } from './twelve-types';
export { calculateSoftSkillFromBehavior, fuseSoftSkillScores, generatePersonalityNarrative } from './soft-skills';

// 类型导出
export type {
  EvidenceLevel,
  Evidence,
  SelfAssessmentSignal,
  BehaviorSignal,
  BehaviorIndicator,
  RoundData,
  DimensionScore,
  ScoreData,
  CredibilityResult,
  CredibilityLevel,
  TwelveTypeResult,
  SkillOrientation,
  BehaviorPattern,
  HardSkillDimension,
  SoftSkillDimension,
  SkillDimension,
  V3Profile,
} from './types';

export {
  HARD_SKILL_DIMENSIONS,
  SOFT_SKILL_DIMENSIONS,
  ALL_DIMENSIONS,
  DIMENSION_LABELS,
} from './types';
