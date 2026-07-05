// 可信度评分（吹牛指数）

import type { ScoreData, CredibilityResult } from "./types";

export function getCredibilityLevel(cred: number): string {
  if (cred >= 1.0) return "S";
  if (cred >= 0.8) return "A";
  if (cred >= 0.6) return "B";
  if (cred >= 0.4) return "C";
  return "D";
}

export function getCredibilityLabel(level: string): string {
  const labels: Record<string, string> = {
    S: "低调实力派",
    A: "诚实靠谱",
    B: "略有美化",
    C: "明显夸大",
    D: "严重注水",
    "未评估": "数据不足",
  };
  return labels[level] || "数据不足";
}

export function getCredibilityLeaderTip(level: string): string {
  const tips: Record<string, string> = {
    S: "实际能力超出自评，可放心加码",
    A: "自评准确，可信度高",
    B: "正常范围，多数人在此区间",
    C: "谨慎任用，关键任务需验证",
    D: "能力存疑，核心角色勿分配",
    "未评估": "对话中未采集到自述信号",
  };
  return tips[level] || "对话中未采集到自述信号";
}

/**
 * 计算可信度
 * 可信度 = 验证分 / 自述分
 */
export function calculateCredibility(scores: ScoreData): CredibilityResult {
  const dims = Object.keys(scores.verified_scores);
  let totalCred = 0;
  let count = 0;
  const result: CredibilityResult = {
    overall: null,
    overall_level: "未评估",
    dimensions: {},
  };

  for (const dim of dims) {
    const v = scores.verified_scores[dim] || 0;
    const s = scores.self_scores[dim] || 0;
    if (s > 0 && v > 0) {
      const cred = v / s;
      result.dimensions[dim] = {
        credibility: Math.round(cred * 100) / 100,
        level: getCredibilityLevel(cred),
        verified_score: v,
        self_score: s,
      };
      totalCred += cred;
      count++;
    } else {
      result.dimensions[dim] = {
        credibility: null,
        level: "未评估",
        verified_score: v,
        self_score: s,
      };
    }
  }

  if (count > 0) {
    result.overall = Math.round((totalCred / count) * 100) / 100;
    result.overall_level = getCredibilityLevel(result.overall);
  }

  return result;
}
