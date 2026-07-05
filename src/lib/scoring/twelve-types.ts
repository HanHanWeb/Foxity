import type {
  TwelveTypeResult,
  SkillOrientation,
  BehaviorPattern,
  ScoreData,
} from './types';

// ========== 12型角色矩阵定义 ==========
interface TypeInfo {
  name: string;
  icon: string;
  description: string;
  team_fit: string; // 团队中的定位
}

const TYPE_MATRIX: Record<string, TypeInfo> = {
  // 分析型
  'analytical-dominant': {
    name: '战略操盘手',
    icon: '🎯',
    description: '擅长从0到1搭框架、定方向，有宏观视野又能落地执行，是团队里的大脑和掌舵人。',
    team_fit: '适合做项目负责人、战略规划、方案设计',
  },
  'analytical-collaborative': {
    name: '洞察协调者',
    icon: '🤝',
    description: '既能深入分析问题，又善于协调大家达成共识，是理性与共情的完美结合。',
    team_fit: '适合做产品经理、用户研究、跨部门协调',
  },
  'analytical-independent': {
    name: '深度研究员',
    icon: '🔍',
    description: '钻得深、耐得住，给一块时间和一个方向，能挖出别人看不到的金矿。',
    team_fit: '适合做深度调研、数据分析、技术研究',
  },
  'analytical-growing': {
    name: '思路萌芽者',
    icon: '🌱',
    description: '思维活跃有想法，对分析和调研有兴趣，但缺实战经验，有人带就能快速成长。',
    team_fit: '适合做分析助理、数据整理、竞品调研辅助',
  },
  // 执行型
  'execution-dominant': {
    name: '技术推动者',
    icon: '⚙️',
    description: '用技术能力驱动团队前进，能啃硬骨头，遇到技术难题大家第一个想到你。',
    team_fit: '适合做技术负责人、核心开发、技术方案设计',
  },
  'execution-collaborative': {
    name: '落地搭档',
    icon: '🛠️',
    description: '执行力强又善于配合，给什么任务都能稳稳接住，是团队里最靠谱的落地担当。',
    team_fit: '适合做开发实现、设计落地、项目执行',
  },
  'execution-independent': {
    name: '极客工匠',
    icon: '💻',
    description: '喜欢一个人安静地啃难题，对代码/设计有追求，交出去的活质量有保障。',
    team_fit: '适合做独立模块开发、技术攻关、精细设计',
  },
  'execution-growing': {
    name: '快速成长者',
    icon: '🔧',
    description: '学习能力强上手快，虽然目前深度不够，但成长速度快，边做边学潜力大。',
    team_fit: '适合做开发助理、设计辅助、技术学习任务',
  },
  // 商业型
  'business-dominant': {
    name: '商业掌舵人',
    icon: '💰',
    description: '对商业模式和机会有天然敏感度，能算清账、找资源、谈合作，天生的生意人。',
    team_fit: '适合做商业负责人、融资对接、合作伙伴拓展',
  },
  'business-collaborative': {
    name: '资源联结者',
    icon: '📣',
    description: '擅长链接资源、对外沟通、搞定人，团队有什么需要外部资源的事找你就对了。',
    team_fit: '适合做商务合作、市场推广、资源对接',
  },
  'business-independent': {
    name: '精算分析师',
    icon: '📊',
    description: '对数字极其敏感，算得细看得远，财务模型和数据测算交给你最放心。',
    team_fit: '适合做财务分析、数据建模、成本核算',
  },
  'business-growing': {
    name: '商业感知者',
    icon: '💡',
    description: '对商业有直觉有热情，但缺系统方法和实战经验，培养潜力很大。',
    team_fit: '适合做商业分析助理、市场调研辅助',
  },
};

// ========== 辅助函数 ==========
function avg(...nums: number[]): number {
  const valid = nums.filter(n => typeof n === 'number' && !isNaN(n));
  if (valid.length === 0) return 0;
  return valid.reduce((s, n) => s + n, 0) / valid.length;
}

function maxKey<T extends string>(obj: Record<T, number>): T {
  let maxK = '' as T;
  let maxV = -Infinity;
  for (const k of Object.keys(obj) as T[]) {
    if (obj[k] > maxV) {
      maxV = obj[k];
      maxK = k;
    }
  }
  return maxK;
}

// ========== 硬技能取向判定 ==========
function getSkillOrientation(scoreData: ScoreData): {
  orientation: SkillOrientation;
  scores: Record<SkillOrientation, number>;
} {
  const h = scoreData.hard_skills;

  const scores: Record<SkillOrientation, number> = {
    analytical: avg(h.market_analysis?.verified_score || 0, h.product_thinking?.verified_score || 0),
    execution: avg(h.technical?.verified_score || 0, h.design?.verified_score || 0),
    business: h.business_finance?.verified_score || 0,
  };

  return {
    orientation: maxKey(scores),
    scores,
  };
}

// ========== 行为模式判定 ==========
function getBehaviorPattern(scoreData: ScoreData): {
  pattern: BehaviorPattern;
  scores: Record<BehaviorPattern, number>;
} {
  const s = scoreData.soft_skills;

  const leadership = s.leadership?.verified_score || 0;
  const workStyle = s.work_style?.verified_score || 0;
  const communication = s.communication?.verified_score || 0;
  const personality = s.personality?.verified_score || 0;
  const learning = s.learning?.verified_score || 0;

  const scores: Record<BehaviorPattern, number> = {
    dominant: avg(leadership, workStyle * 0.6),
    collaborative: avg(communication, personality * 0.4),
    independent: avg(workStyle * 0.5, 10 - communication * 0.3 + personality * 0.2), // 独立型：做事专注 + 不太爱交际
    growing: learning,
  };

  // 成长型特殊判定：硬技能整体分低（<5）但学习力强（>7）
  const allHard = Object.values(scoreData.hard_skills).filter(d => d.verified_score > 0);
  const avgHard = allHard.length > 0
    ? allHard.reduce((s, d) => s + d.verified_score, 0) / allHard.length
    : 0;

  if (avgHard < 5 && learning >= 7) {
    scores.growing = Math.max(scores.growing, 8); // 提升成长型权重
  }

  return {
    pattern: maxKey(scores),
    scores,
  };
}

// ========== 主函数：判定12型 ==========
export function determineTwelveType(scoreData: ScoreData): TwelveTypeResult {
  const { orientation: skillOrient, scores: skillScores } = getSkillOrientation(scoreData);
  const { pattern: behaviorPat, scores: patternScores } = getBehaviorPattern(scoreData);

  const key = `${skillOrient}-${behaviorPat}` as keyof typeof TYPE_MATRIX;
  const primary = TYPE_MATRIX[key] || TYPE_MATRIX['analytical-independent'];

  // 计算置信度：第一和第二的差距越大，置信度越高
  const sortedSkill = Object.values(skillScores).sort((a, b) => b - a);
  const skillGap = sortedSkill[0] - (sortedSkill[1] || 0);
  const sortedPattern = Object.values(patternScores).sort((a, b) => b - a);
  const patternGap = sortedPattern[0] - (sortedPattern[1] || 0);

  // 置信度：0-1，差距3分以上视为高置信
  const confidence = Math.min(1, (skillGap / 3 + patternGap / 3) / 2);

  // 生成备选类型（按匹配度排序，取前3个非主类型）
  const secondary: TwelveTypeResult['secondary_types'] = [];
  for (const [typeKey, info] of Object.entries(TYPE_MATRIX)) {
    if (typeKey === key) continue;
    const [so, bp] = typeKey.split('-') as [SkillOrientation, BehaviorPattern];
    // 匹配度：技能取向相似度 + 行为模式相似度
    const skillMatch = 1 - Math.abs(skillScores[skillOrient] - skillScores[so]) / 10;
    const patternMatch = 1 - Math.abs(patternScores[behaviorPat] - patternScores[bp]) / 10;
    const matchScore = (skillMatch + patternMatch) / 2;
    secondary.push({
      name: info.name,
      icon: info.icon,
      match_score: Math.round(matchScore * 100) / 100,
    });
  }
  secondary.sort((a, b) => b.match_score - a.match_score);

  return {
    primary_type: primary.name,
    primary_icon: primary.icon,
    primary_description: primary.description,
    skill_orientation: skillOrient,
    behavior_pattern: behaviorPat,
    secondary_types: secondary.slice(0, 3),
    confidence: Math.round(confidence * 100) / 100,
  };
}

// ========== 获取类型详情 ==========
export function getTypeInfo(orientation: SkillOrientation, pattern: BehaviorPattern): TypeInfo | null {
  const key = `${orientation}-${pattern}` as keyof typeof TYPE_MATRIX;
  return TYPE_MATRIX[key] || null;
}

// ========== 团队类型分布分析（队长看板用） ==========
export function analyzeTeamTypeDistribution(
  members: Array<{ user_id: string; user_name: string; twelve_type: TwelveTypeResult }>,
): {
  orientation_counts: Record<SkillOrientation, number>;
  pattern_counts: Record<BehaviorPattern, number>;
  type_counts: Record<string, number>;
  gaps: string[]; // 团队缺少的类型
} {
  const orientation_counts: Record<SkillOrientation, number> = {
    analytical: 0,
    execution: 0,
    business: 0,
  };
  const pattern_counts: Record<BehaviorPattern, number> = {
    dominant: 0,
    collaborative: 0,
    independent: 0,
    growing: 0,
  };
  const type_counts: Record<string, number> = {};

  for (const m of members) {
    orientation_counts[m.twelve_type.skill_orientation]++;
    pattern_counts[m.twelve_type.behavior_pattern]++;
    type_counts[m.twelve_type.primary_type] = (type_counts[m.twelve_type.primary_type] || 0) + 1;
  }

  // 找团队短板
  const gaps: string[] = [];
  if (orientation_counts.execution === 0) gaps.push('缺少执行型人才（技术/设计实现）');
  if (orientation_counts.analytical === 0) gaps.push('缺少分析型人才（调研/方案）');
  if (orientation_counts.business === 0) gaps.push('缺少商业型人才（财务/资源）');
  if (pattern_counts.dominant === 0) gaps.push('缺少主导型角色（没人拍板）');
  if (members.length >= 5 && pattern_counts.collaborative === 0) gaps.push('缺少协调型角色（可能有沟通摩擦）');

  return { orientation_counts, pattern_counts, type_counts, gaps };
}
