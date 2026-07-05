// 12型组合角色标签判定

import type { ScoreData, TypeResult } from "./types";

const TYPE_MATRIX: Record<string, { name: string; icon: string }> = {
  "analytical-dominant": { name: "战略操盘手", icon: "🎯" },
  "analytical-collaborative": { name: "洞察协调者", icon: "🤝" },
  "analytical-independent": { name: "深度研究员", icon: "🔍" },
  "analytical-growing": { name: "思路萌芽者", icon: "🌱" },
  "execution-dominant": { name: "技术推动者", icon: "⚙️" },
  "execution-collaborative": { name: "落地搭档", icon: "🛠️" },
  "execution-independent": { name: "极客工匠", icon: "💻" },
  "execution-growing": { name: "快速成长者", icon: "🔧" },
  "business-dominant": { name: "商业掌舵人", icon: "💰" },
  "business-collaborative": { name: "资源联结者", icon: "📣" },
  "business-independent": { name: "精算分析师", icon: "📊" },
  "business-growing": { name: "商业感知者", icon: "💡" },
};

function avg(...nums: number[]): number {
  const valid = nums.filter((n) => typeof n === "number" && !isNaN(n));
  if (valid.length === 0) return 0;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function maxKey(obj: Record<string, number>): string {
  let max = -Infinity;
  let key = "";
  for (const k in obj) {
    if (obj[k] > max) {
      max = obj[k];
      key = k;
    }
  }
  return key;
}

/**
 * 计算 12 型组合角色
 */
export function determineType(scores: ScoreData): TypeResult {
  const v = scores.verified_scores;

  // Step 1: 计算三个硬技能群得分
  const groups = {
    analytical: avg(v.market_analysis || 0, v.product_thinking || 0),
    execution: avg(v.technical || 0, v.design || 0),
    business: v.business_finance || 0,
  };
  let skillOrientation = maxKey(groups);

  // Step 2: 计算四种行为模式得分
  const patterns = {
    dominant: avg(v.leadership || 0, (v.work_style || 0) * 0.5),
    collaborative: avg(v.communication || 0, (v.personality || 0) * 0.3),
    independent: (v.work_style || 0) * 0.6 + (v.personality || 0) * 0.4,
    growing: v.learning || 0,
  };
  let behaviorPattern = maxKey(patterns);

  // Step 3: 判断是否为成长型（经验少但学习力强）
  const hardSkillValues = [
    v.market_analysis,
    v.product_thinking,
    v.technical,
    v.business_finance,
    v.design,
  ].filter((val) => typeof val === "number" && val > 0) as number[];
  const avgHardSkill = hardSkillValues.length > 0 ? avg(...hardSkillValues) : 0;
  if (avgHardSkill > 0 && avgHardSkill < 5 && (v.learning || 0) > 7) {
    behaviorPattern = "growing";
  }

  // Step 4: 查表得类型
  const key = `${skillOrientation}-${behaviorPattern}`;
  const typeInfo = TYPE_MATRIX[key] || TYPE_MATRIX["analytical-collaborative"];

  // Step 5: 计算置信度
  const sortedSkills = Object.values(groups).sort((a, b) => b - a);
  const skillGap = sortedSkills[0] - (sortedSkills[1] || 0);
  const sortedPatterns = Object.values(patterns).sort((a, b) => b - a);
  const patternGap = sortedPatterns[0] - (sortedPatterns[1] || 0);
  const confidence = Math.min(1, (skillGap / 3 + patternGap / 3) / 2);

  // Step 6: 备选类型（前3个）
  const secondaryTypes: string[] = [];
  const allScores: { key: string; score: number }[] = [];
  for (const sk of ["analytical", "execution", "business"]) {
    for (const bp of ["dominant", "collaborative", "independent", "growing"]) {
      const k = `${sk}-${bp}`;
      if (k === key) continue;
      // 估算匹配度
      const matchScore =
        groups[sk as keyof typeof groups] * 0.5 + patterns[bp as keyof typeof patterns] * 0.5;
      allScores.push({ key: k, score: matchScore });
    }
  }
  allScores.sort((a, b) => b.score - a.score);
  for (let i = 0; i < Math.min(2, allScores.length); i++) {
    const info = TYPE_MATRIX[allScores[i].key];
    if (info) secondaryTypes.push(info.name);
  }

  return {
    primary_type: typeInfo.name,
    primary_icon: typeInfo.icon,
    skill_orientation: skillOrientation,
    behavior_pattern: behaviorPattern,
    secondary_types: secondaryTypes,
    confidence: Math.round(confidence * 100) / 100,
  };
}
