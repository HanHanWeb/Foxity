// 评分引擎类型定义

import type { HardSkillKey, SoftSkillKey } from "@/types";

// 证据等级
export type EvidenceLevel = "L0" | "L1" | "L2" | "L3" | "L4" | "L5";

// 证据条目
export interface Evidence {
  dimension: string;
  level: EvidenceLevel;
  quality_score: number; // 0-10
  summary: string;
  quote?: string;
  chat_round?: number;
  created_at?: string;
}

// 自述信号
export interface SelfAssessmentSignal {
  dimension: string;
  signal: string;
  estimated_self_score: number; // 0-10
  chat_round?: number;
}

// 行为信号
export interface BehaviorSignal {
  dimension: SoftSkillKey;
  indicator: string;
  polarity: "positive" | "negative" | "neutral";
  strength: number; // 0-1
  description: string;
  chat_round?: number;
}

// 维度评分
export interface DimensionScore {
  verified_score: number;
  self_score: number;
  evidence_level: EvidenceLevel;
  evidence_count: number;
  evidence_list: Evidence[];
}

// 评分数据汇总
export interface ScoreData {
  verified_scores: Record<string, number>;
  self_scores: Record<string, number>;
  evidence_levels: Record<string, EvidenceLevel>;
  dimension_scores: Record<string, DimensionScore>;
}

// 可信度结果
export interface CredibilityResult {
  overall: number | null;
  overall_level: string; // S/A/B/C/D/未评估
  dimensions: Record<
    string,
    {
      credibility: number | null;
      level: string;
      verified_score: number;
      self_score: number;
    }
  >;
}

// 12型角色结果
export interface TypeResult {
  primary_type: string;
  primary_icon: string;
  skill_orientation: string; // analytical / execution / business
  behavior_pattern: string; // dominant / collaborative / independent / growing
  secondary_types: string[];
  confidence: number;
}

// 软实力评分
export interface SoftSkillScores {
  scores: Record<
    string,
    {
      score: number;
      evidence_count: number;
      signals: BehaviorSignal[];
    }
  >;
}

// 每轮 AI 返回的 JSON 结构
export interface RoundData {
  round: number;
  phase: string;
  new_evidence: Evidence[];
  self_assessment_signals: SelfAssessmentSignal[];
  behavior_signals: BehaviorSignal[];
  has_new_info: boolean;
  dimensions_touched_this_round: string[];
}

// 最终测评数据
export interface AssessmentResult {
  summary: string;
  score_data: ScoreData;
  credibility: CredibilityResult;
  type_result: TypeResult;
  soft_skill_scores: SoftSkillScores;
  highlights: string[];
  areas_for_growth: { priority: "high" | "medium" | "low"; title: string; detail: string }[];
  untested_dimensions: string[];
}
