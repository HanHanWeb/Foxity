// 团队分析引擎（最小版）
// 只从已有 V3 数据直接计算：均分 + 最强/最弱维度 + 12型分布 + 成员亮点

import type { UserProfile } from "@/types";
import { hardSkillLabels, hardSkillMeta, type HardSkillKey } from "@/types";
import { TYPE_MATRIX } from "@/lib/scoring/twelve-types";

// 5 个硬技能维度 key
const HARD_SKILL_KEYS = hardSkillMeta.map((d) => d.key as HardSkillKey);

// 等级称号：精通(≥8.5) / 熟练(≥7) / 掌握(≥5.5) / 入门(≥4)
function levelOf(score: number): string {
  if (score >= 8.5) return "精通";
  if (score >= 7) return "熟练";
  if (score >= 5.5) return "掌握";
  if (score >= 4) return "入门";
  return "待提升";
}

// 取成员的验证分（v3_score_data.verified_scores 优先，否则回退 abilities.score）
function getVerifiedScores(p: UserProfile): Record<string, number> {
  if (p.v3_score_data?.verified_scores) {
    return p.v3_score_data.verified_scores;
  }
  // 回退到 abilities（兼容旧数据）
  const out: Record<string, number> = {};
  HARD_SKILL_KEYS.forEach((k) => {
    const ab = p.abilities?.[k];
    if (ab && ab.verification_status !== "untested") {
      out[k] = ab.score;
    }
  });
  return out;
}

// 取成员的 12型主类型
function getTwelveType(p: UserProfile): string | null {
  const t = p.v3_type?.primary_type;
  if (!t) return null;
  return t;
}

export interface MemberHighlight {
  topDimension: string; // 维度中文名
  topDimensionKey: string;
  score: number;
  level: string; // 精通/熟练/掌握/入门
  description: string; // 一句话亮点
}

export interface TeamAnalysis {
  memberCount: number;
  completedCount: number;
  dimensionAverages: Record<string, number>; // 5 个维度的均分
  strongestDimensions: { dimension: string; dimensionKey: string; avg: number; topMembers: string[] }[];
  weakestDimensions: { dimension: string; dimensionKey: string; avg: number; topMember: string | null; topMemberScore: number }[];
  twelveTypeDistribution: Record<string, { count: number; name: string; icon: string }>;
  memberHighlights: Record<string, MemberHighlight>;
}

// 判断是否完成测评：v3_score_data 存在且至少 3 个维度有验证分，或 abilities 至少 3 个非 untested
export function isAssessmentCompleted(p: UserProfile): boolean {
  if (p.v3_score_data?.verified_scores) {
    const vals = Object.values(p.v3_score_data.verified_scores).filter((v) => v > 0);
    if (vals.length >= 3) return true;
  }
  const validAbilities = HARD_SKILL_KEYS.filter((k) => {
    const ab = p.abilities?.[k];
    return ab && ab.verification_status !== "untested";
  });
  return validAbilities.length >= 3;
}

// 从 verified_scores + evidence_levels 提取亮点描述
function buildHighlight(p: UserProfile, topKey: string, topScore: number): MemberHighlight {
  const dimLabel = hardSkillLabels[topKey as HardSkillKey] || topKey;
  const level = levelOf(topScore);

  // 尝试从 evidence_levels 提炼描述
  const evidenceLevels = p.v3_score_data?.evidence_levels || {};
  const evLevel = evidenceLevels[topKey];
  let description = "";
  if (evLevel === "L5" || evLevel === "L4") {
    // 从 keyword_tags 找该维度相关标签
    const tags = (p.keyword_tags || []).filter((t) => t.confidence === "high");
    if (tags.length > 0) {
      description = tags[0].tag;
    } else {
      description = `有突出的${dimLabel}实战经历`;
    }
  } else if (evLevel === "L3" || evLevel === "L2") {
    description = `在${dimLabel}方面有实际经验`;
  } else {
    description = `具备${dimLabel}基础`;
  }

  return {
    topDimension: dimLabel,
    topDimensionKey: topKey,
    score: topScore,
    level,
    description,
  };
}

export function analyzeTeam(members: UserProfile[]): TeamAnalysis {
  const completed = members.filter(isAssessmentCompleted);

  // 维度均分
  const dimensionAverages: Record<string, number> = {};
  HARD_SKILL_KEYS.forEach((k) => {
    const scores: number[] = [];
    completed.forEach((p) => {
      const vs = getVerifiedScores(p);
      if (typeof vs[k] === "number" && vs[k] > 0) {
        scores.push(vs[k]);
      }
    });
    dimensionAverages[k] = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  });

  // 最强维度（前2）和最弱维度（后2），只考虑有数据的维度
  const dimEntries = HARD_SKILL_KEYS.map((k) => ({ key: k, avg: dimensionAverages[k] })).filter((e) => e.avg > 0);
  const sorted = [...dimEntries].sort((a, b) => b.avg - a.avg);
  const strongest = sorted.slice(0, 2);
  const weakest = sorted.length >= 4 ? sorted.slice(-2) : sorted.slice(Math.max(0, sorted.length - 2)).reverse();

  // 最强维度的代表成员（分数 >= 维度均分）
  const strongestDimensions = strongest.map((d) => {
    const topMembers: string[] = [];
    completed.forEach((p) => {
      const vs = getVerifiedScores(p);
      if (typeof vs[d.key] === "number" && vs[d.key] >= d.avg) {
        topMembers.push(p.user_name);
      }
    });
    return {
      dimension: hardSkillLabels[d.key as HardSkillKey] || d.key,
      dimensionKey: d.key,
      avg: Math.round(d.avg * 10) / 10,
      topMembers,
    };
  });

  // 最弱维度的队内最强者
  const weakestDimensions = weakest.map((d) => {
    let topMember: string | null = null;
    let topMemberScore = 0;
    completed.forEach((p) => {
      const vs = getVerifiedScores(p);
      if (typeof vs[d.key] === "number" && vs[d.key] > topMemberScore) {
        topMemberScore = vs[d.key];
        topMember = p.user_name;
      }
    });
    return {
      dimension: hardSkillLabels[d.key as HardSkillKey] || d.key,
      dimensionKey: d.key,
      avg: Math.round(d.avg * 10) / 10,
      topMember,
      topMemberScore: Math.round(topMemberScore * 10) / 10,
    };
  });

  // 12型分布
  const twelveTypeDistribution: Record<string, { count: number; name: string; icon: string }> = {};
  completed.forEach((p) => {
    const t = getTwelveType(p);
    if (!t) return;
    const meta = TYPE_MATRIX[t] || { name: t, icon: "❓" };
    if (!twelveTypeDistribution[t]) {
      twelveTypeDistribution[t] = { count: 0, name: meta.name, icon: meta.icon };
    }
    twelveTypeDistribution[t].count += 1;
  });

  // 成员亮点
  const memberHighlights: Record<string, MemberHighlight> = {};
  completed.forEach((p) => {
    const vs = getVerifiedScores(p);
    const entries = Object.entries(vs).filter(([, v]) => v > 0);
    if (entries.length === 0) return;
    entries.sort((a, b) => b[1] - a[1]);
    const [topKey, topScore] = entries[0];
    memberHighlights[p.user_id] = buildHighlight(p, topKey, topScore);
  });

  return {
    memberCount: members.length,
    completedCount: completed.length,
    dimensionAverages,
    strongestDimensions,
    weakestDimensions,
    twelveTypeDistribution,
    memberHighlights,
  };
}

// 取成员状态：completed / in_progress / not_started
export function getMemberStatus(p: UserProfile): "completed" | "in_progress" | "not_started" {
  if (isAssessmentCompleted(p)) return "completed";
  const anyProgress = HARD_SKILL_KEYS.some((k) => {
    const ab = p.abilities?.[k];
    return ab && ab.verification_status !== "untested";
  });
  return anyProgress ? "in_progress" : "not_started";
}
