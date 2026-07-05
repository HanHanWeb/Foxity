import type {
  CredibilityResult,
  CredibilityLevel,
  ScoreData,
  SkillDimension,
} from './types';
import { ALL_DIMENSIONS } from './types';

// ========== 可信度等级判定 ==========
export function getCredibilityLevel(cred: number): CredibilityLevel {
  if (cred >= 1.0) return 'S';
  if (cred >= 0.8) return 'A';
  if (cred >= 0.6) return 'B';
  if (cred >= 0.4) return 'C';
  return 'D';
}

export function getCredibilityLabel(level: CredibilityLevel): string {
  const labels: Record<CredibilityLevel, string> = {
    S: '低调实力派',
    A: '诚实靠谱',
    B: '略有美化',
    C: '明显夸大',
    D: '严重注水',
    unrated: '数据不足',
  };
  return labels[level];
}

// ========== 可信度计算 ==========
export function calculateCredibility(scoreData: ScoreData): CredibilityResult {
  const allDims = ALL_DIMENSIONS;
  const dimResults: CredibilityResult['dimensions'] = {} as any;
  let totalCred = 0;
  let count = 0;

  // 遍历所有维度
  for (const dim of allDims) {
    const dimScore =
      scoreData.hard_skills[dim as keyof typeof scoreData.hard_skills] ||
      scoreData.soft_skills[dim as keyof typeof scoreData.soft_skills];

    if (!dimScore) {
      dimResults[dim] = {
        credibility: null,
        level: 'unrated',
        verified_score: 0,
        self_score: 0,
      };
      continue;
    }

    const v = dimScore.verified_score;
    const s = dimScore.self_score;

    if (s > 0 && v > 0) {
      const cred = v / s;
      dimResults[dim] = {
        credibility: Math.round(cred * 100) / 100,
        level: getCredibilityLevel(cred),
        verified_score: v,
        self_score: s,
      };
      totalCred += cred;
      count++;
    } else if (v > 0 && s === 0) {
      // 有验证分但没自述分 → 可能是用户低调没提
      dimResults[dim] = {
        credibility: null,
        level: 'unrated',
        verified_score: v,
        self_score: 0,
      };
    } else if (s > 0 && v === 0) {
      // 有自述但没验证 → 吹牛但没被拆穿？给个低可信度
      dimResults[dim] = {
        credibility: 0,
        level: 'D',
        verified_score: 0,
        self_score: s,
      };
      totalCred += 0;
      count++;
    } else {
      dimResults[dim] = {
        credibility: null,
        level: 'unrated',
        verified_score: 0,
        self_score: 0,
      };
    }
  }

  // 总体可信度
  let overall: number | null = null;
  let overallLevel: CredibilityLevel = 'unrated';

  if (count >= 3) {
    // 至少3个维度有数据才算总体可信度
    overall = Math.round((totalCred / count) * 100) / 100;
    overallLevel = getCredibilityLevel(overall);
  }

  return {
    overall,
    overall_level: overallLevel,
    overall_label: getCredibilityLabel(overallLevel),
    dimensions: dimResults,
  };
}

// ========== 队长侧提示语生成 ==========
export function getCredibilityWarning(level: CredibilityLevel): string {
  const warnings: Record<CredibilityLevel, string> = {
    S: '实际能力超出自评，可放心加码任务难度',
    A: '自评准确，可信度高，可按能力分配任务',
    B: '正常范围，多数人在此区间，分配任务正常即可',
    C: '自评偏乐观，关键任务需验证，建议先从小任务观察',
    D: '能力存疑，核心角色勿分配，需重点观察',
    unrated: '对话数据不足，无法判断可信度',
  };
  return warnings[level];
}

// ========== 任务适配推荐（基于可信度和能力分） ==========
export function generateTaskRecommendations(scoreData: ScoreData): {
  suitable: string[];
  caution: string[];
} {
  const suitable: string[] = [];
  const caution: string[] = [];

  // 硬技能适配
  const hardMap: Record<string, { task: string; evidence: string }> = {
    market_analysis: { task: '竞品分析、市场调研、行业研究', evidence: '市场分析能力' },
    product_thinking: { task: '需求分析、产品设计、用户调研', evidence: '产品思维' },
    technical: { task: '技术开发、系统架构、代码实现', evidence: '技术能力' },
    business_finance: { task: '商业模式设计、财务测算、成本分析', evidence: '商业/财务能力' },
    design: { task: 'UI设计、视觉设计、PPT美化', evidence: '设计能力' },
  };

  for (const [dim, info] of Object.entries(hardMap)) {
    const score = scoreData.hard_skills[dim as keyof typeof scoreData.hard_skills];
    if (score && score.verified_score >= 7) {
      suitable.push(info.task);
    } else if (score && score.verified_score > 0 && score.verified_score < 4) {
      caution.push(`${info.task}（${info.evidence}较弱）`);
    } else if (score && score.evidence_count === 0 && score.self_score > 0) {
      caution.push(`${info.task}（自称擅长但未验证）`);
    }
  }

  // 软实力适配
  if (scoreData.soft_skills.leadership?.verified_score >= 7) {
    suitable.push('团队负责人、项目管理、任务分配');
  }
  if (scoreData.soft_skills.communication?.verified_score >= 7) {
    suitable.push('对外沟通、协调资源、用户访谈');
  }
  if (scoreData.soft_skills.work_style?.verified_score >= 7) {
    suitable.push('需要条理性和计划性的任务');
  }

  return {
    suitable: suitable.slice(0, 5), // 最多5个推荐
    caution: caution.slice(0, 3),   // 最多3个警示
  };
}
