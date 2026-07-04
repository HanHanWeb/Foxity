export type AbilityKey = "background_market" | "product" | "tech" | "finance" | "design";
export type VerifyStatus = "verified" | "unverified" | "untested";
export type Expression = "smile" | "thinking" | "curious" | "challenge" | "nod" | "surprised" | "encourage" | "serious";
export type DimensionStatus = "untested" | "in_progress" | "done";

export const abilityLabels: Record<AbilityKey, string> = {
  background_market: "市场分析",
  product: "产品思维",
  tech: "技术能力",
  finance: "商业/财务",
  design: "设计能力",
};

export interface Ability {
  score: number;
  verification_status: VerifyStatus;
  insights: string[];
  evidence_events: string[];
  self_score?: number;
}

export interface BehaviorPatterns {
  stress_response: string;
  decision_style: string;
  collaboration_style: string;
  learning_style: string;
}

export interface GrowthSuggestion {
  area: string;
  suggestion: string;
  priority: "high" | "medium" | "low";
}

export interface UserProfile {
  user_id: string;
  user_name: string;
  team_id: string;
  team_name?: string;
  timestamp: string;
  core_positioning: string;
  overview_summary: string;
  abilities: Record<AbilityKey, Ability>;
  behavior_patterns?: BehaviorPatterns;
  growth_suggestions: GrowthSuggestion[];
}

export interface Team {
  team_id: string;
  team_name: string;
  competition_type: string;
  organizer_name: string;
  members: UserProfile[];
  created_at: string;
}

export interface ChatMessage {
  id?: string;
  role: "fox" | "user" | "ai";
  content: string;
  emotion?: Expression;
  expression?: Expression;
  timestamp: number | string;
  isTyping?: boolean;
  file?: { name: string; size: number; url: string };
  insights?: string[];
}

export interface AssessmentState {
  current_expression: Expression;
  covered_dimensions: Record<AbilityKey, DimensionStatus>;
  key_events: { stress: boolean; conflict: boolean };
  elapsed_minutes: number;
  insights: { icon: string; text: string }[];
}

export interface AIResponse {
  reply: string;
  emotion: Expression;
  phase?: string;
  scores_delta?: Partial<Record<AbilityKey, number>>;
  event?: string;
  profile_data?: Partial<UserProfile>;
  content: string;
  expression: Expression;
  is_final?: boolean;
  profile?: UserProfile;
  dimension_update?: { dimension: AbilityKey; status: "in_progress" | "done" }[];
  key_event?: "stress" | "conflict";
}

export interface DimensionMeta {
  key: AbilityKey;
  icon: string;
  name: string;
  shortName: string;
}
