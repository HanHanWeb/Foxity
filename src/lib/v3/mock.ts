// V3 测评体系前端工具函数 & Mock 数据
// 用于在后端 API 尚未返回 V3 字段时，提供完整的 V3 数据用于 UI 渲染

import type {
  V3Profile,
  ScoreData,
  CredibilityResult,
  TwelveTypeResult,
  DimensionScore,
  Evidence,
  BehaviorSignal,
  HardSkillDimension,
  SoftSkillDimension,
  CredibilityLevel,
} from '@/lib/scoring/types';
import {
  HARD_SKILL_DIMENSIONS,
  SOFT_SKILL_DIMENSIONS,
  DIMENSION_LABELS,
} from '@/lib/scoring/types';
import type { UserProfile } from '@/types';

// ========== 12型配色方案 ==========
// 3种硬技能取向 × 4种行为模式 = 12种渐变色
export const TYPE_COLORS: Record<string, { from: string; to: string; text: string; border: string }> = {
  'analytical-dominant': { from: 'from-indigo-500', to: 'to-blue-500', text: 'text-white', border: 'border-indigo-300' },
  'analytical-collaborative': { from: 'from-blue-500', to: 'to-cyan-500', text: 'text-white', border: 'border-blue-300' },
  'analytical-independent': { from: 'from-violet-500', to: 'to-indigo-500', text: 'text-white', border: 'border-violet-300' },
  'analytical-growing': { from: 'from-sky-400', to: 'to-blue-400', text: 'text-white', border: 'border-sky-300' },
  'execution-dominant': { from: 'from-orange-500', to: 'to-amber-500', text: 'text-white', border: 'border-orange-300' },
  'execution-collaborative': { from: 'from-emerald-500', to: 'to-teal-500', text: 'text-white', border: 'border-emerald-300' },
  'execution-independent': { from: 'from-slate-600', to: 'to-gray-700', text: 'text-white', border: 'border-slate-400' },
  'execution-growing': { from: 'from-lime-500', to: 'to-green-500', text: 'text-white', border: 'border-lime-300' },
  'business-dominant': { from: 'from-rose-500', to: 'to-red-500', text: 'text-white', border: 'border-rose-300' },
  'business-collaborative': { from: 'from-pink-500', to: 'to-rose-500', text: 'text-white', border: 'border-pink-300' },
  'business-independent': { from: 'from-amber-600', to: 'to-yellow-500', text: 'text-white', border: 'border-amber-400' },
  'business-growing': { from: 'from-orange-400', to: 'to-yellow-400', text: 'text-white', border: 'border-orange-300' },
};

// ========== 可信度徽章配色 ==========
export const CREDIBILITY_COLORS: Record<CredibilityLevel, { bg: string; text: string; border: string; glow: string; label: string }> = {
  S: { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-400', glow: 'shadow-emerald-200', label: 'S · 低调实力派' },
  A: { bg: 'bg-green-500', text: 'text-white', border: 'border-green-300', glow: 'shadow-green-200', label: 'A · 诚实靠谱' },
  B: { bg: 'bg-yellow-500', text: 'text-white', border: 'border-yellow-300', glow: 'shadow-yellow-200', label: 'B · 略有美化' },
  C: { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-300', glow: 'shadow-orange-200', label: 'C · 明显夸大' },
  D: { bg: 'bg-red-500', text: 'text-white', border: 'border-red-300', glow: 'shadow-red-200', label: 'D · 严重注水' },
  unrated: { bg: 'bg-gray-400', text: 'text-white', border: 'border-gray-300', glow: 'shadow-gray-200', label: '数据不足' },
};

// ========== 验证分温暖化等级（队员侧用，避免精确数字打击自信）==========
export function getWarmLevel(score: number): { level: string; stars: number; label: string } {
  if (score >= 8.5) return { level: '精通', stars: 5, label: '⭐⭐⭐⭐⭐ 精通级' };
  if (score >= 7) return { level: '熟练', stars: 4, label: '⭐⭐⭐⭐ 熟练级' };
  if (score >= 5.5) return { level: '掌握', stars: 3, label: '⭐⭐⭐ 掌握级' };
  if (score >= 4) return { level: '入门', stars: 2, label: '⭐⭐ 入门级' };
  if (score >= 2) return { level: '了解', stars: 1, label: '⭐ 了解级' };
  return { level: '待探索', stars: 0, label: '待探索' };
}

// ========== 软实力行为锚点描述（故事化语言）==========
export const SOFT_SKILL_NARRATIVES: Record<SoftSkillDimension, (score: number, signals: BehaviorSignal[]) => string> = {
  communication: (score, signals) => {
    const structured = signals.some(s => s.indicator === 'structured_response' && s.polarity === 'positive');
    if (score >= 7) {
      if (structured) return '你习惯在发言前先梳理逻辑框架，团队讨论中经常扮演总结者角色，大家都喜欢听你把复杂的事情讲清楚。';
      return '你表达清晰有条理，善于倾听和回应，是团队里的沟通桥梁。';
    }
    if (score >= 5) {
      return '你有基本的沟通能力，能准确表达自己的想法，但在主动协调和推动共识方面还有提升空间。';
    }
    return '你更倾向于独立思考，表达时有时需要更多时间组织语言，试着在团队讨论中更主动地分享想法会更好。';
  },
  work_style: (score, signals) => {
    const detailOriented = signals.some(s => s.indicator === 'detail_focus' && s.polarity === 'positive');
    const planned = signals.some(s => s.indicator === 'answer_structure' && s.polarity === 'positive');
    if (score >= 7) {
      if (planned && detailOriented) return '你做事有规划、重细节，喜欢提前搭好框架再一步步推进，交给你的任务总是让人放心。';
      return '你做事有条理，追求质量，是团队里最靠谱的执行者之一。';
    }
    if (score >= 5) {
      return '你做事节奏比较灵活，既能按计划推进，也能随机应变，适合在变化多的环境中工作。';
    }
    return '你偏向灵感驱动型，想到哪做到哪，试着在开始前花5分钟列个小清单，效率会提升很多。';
  },
  leadership: (score, signals) => {
    const decisive = signals.some(s => s.indicator === 'decision_mode' && s.polarity === 'positive');
    const responsible = signals.some(s => s.indicator === 'responsibility' && s.polarity === 'positive');
    if (score >= 7) {
      if (decisive && responsible) return '你有明确的观点和决断力，遇到问题先从自己找原因，天然具有领导者气质，大家愿意跟着你干。';
      return '你有主动性和责任感，能在关键时刻站出来推动事情往前走。';
    }
    if (score >= 5) {
      return '你在熟悉的领域能发挥带头作用，但在不熟悉的场景中可能需要更多底气，随着经验积累领导力会逐渐显现。';
    }
    return '你更习惯做执行者而非决策者，先把自己的事做到最好，领导力会自然生长出来。';
  },
  learning: (score, signals) => {
    const reflective = signals.some(s => s.indicator === 'reflection' && s.polarity === 'positive');
    if (score >= 7) {
      if (reflective) return '你有很强的反思习惯，善于从经历中提炼经验，这是成长最快的特质。你不怕承认不懂，反而让你学得比谁都快。';
      return '你的学习能力很强，对新事物充满好奇，上手速度快，是团队里的「快速电池」。';
    }
    if (score >= 5) {
      return '你有不错的学习意愿，遇到感兴趣的东西会主动去了解，在自己的赛道上稳步前进。';
    }
    return '你更倾向于在熟悉的领域深耕，偶尔跳出舒适区尝试新东西，会打开新的成长空间。';
  },
  personality: (score, signals) => {
    const extrovert = signals.filter(s => s.dimension === 'personality' && s.indicator === 'emotional_expression' && s.polarity === 'positive').length;
    const introvert = signals.filter(s => s.dimension === 'personality' && s.indicator === 'emotional_expression' && s.polarity === 'negative').length;
    if (extrovert > introvert) {
      return '你是个外向型的人，表达力强，情绪外放，团队里有你气氛不会冷。';
    }
    if (introvert > extrovert) {
      return '你偏内向型，习惯先想再说，思考有深度，但在团队讨论中可能需要被主动邀请才发言。';
    }
    return '你是个比较均衡的人，既能安静思考也能积极参与，在各种环境中都能适应。';
  },
};

// ========== 生成 Mock V3 画像数据 ==========
export function generateMockV3Profile(baseProfile?: Partial<UserProfile>): V3Profile {
  const hardSkills: Record<HardSkillDimension, DimensionScore> = {
    market_analysis: createDimensionScore(7.8, 6.5, 'L4', [
      createEvidence('market_analysis', 'L4', 8.5, '能独立完成竞品分析并输出有洞见的报告', '我上次做那个市场调研，对比了三家竞品的功能、定价、用户群，最后出了一份20页的报告', 3),
      createEvidence('market_analysis', 'L3', 7.0, '了解PEST分析框架并能实际运用', '我一般会用PEST框架来分析行业，政治经济社会技术四个维度都过一遍', 5),
    ]),
    product_thinking: createDimensionScore(6.2, 7.0, 'L3', [
      createEvidence('product_thinking', 'L3', 6.5, '有用户需求意识，能区分功能和需求', '做产品的时候我会先想用户真正需要什么，而不是上来就堆功能', 4),
    ]),
    technical: createDimensionScore(4.5, 6.0, 'L2', [
      createEvidence('technical', 'L2', 5.0, '了解前端基础技术栈', '我学过React和Vue，能写一些简单的页面', 6),
    ]),
    business_finance: createDimensionScore(5.0, 5.5, 'L3', [
      createEvidence('business_finance', 'L3', 5.5, '能做基础的成本和收入测算', '我们做过一个简单的财务模型，算过成本和回本周期', 7),
    ]),
    design: createDimensionScore(3.8, 6.0, 'L2', [
      createEvidence('design', 'L2', 4.0, '会用Figma做基础设计', '我会用Figma画一些简单的原型，美观度一般但功能都有', 8),
    ]),
  };

  const softSkills: Record<SoftSkillDimension, DimensionScore> = {
    personality: createDimensionScore(5.5, 0, 'L3', [], 8),
    communication: createDimensionScore(7.2, 7.0, 'L4', [], 12),
    work_style: createDimensionScore(6.8, 6.5, 'L3', [], 10),
    leadership: createDimensionScore(5.5, 6.0, 'L2', [], 6),
    learning: createDimensionScore(8.0, 7.5, 'L4', [], 14),
  };

  const allScores = [...Object.values(hardSkills), ...Object.values(softSkills)];
  const overallVerified = allScores.reduce((s, d) => s + d.verified_score, 0) / allScores.length;
  const overallSelf = allScores.filter(d => d.self_score > 0).reduce((s, d) => s + d.self_score, 0) / allScores.filter(d => d.self_score > 0).length;

  const twelveType: TwelveTypeResult = {
    primary_type: '洞察协调者',
    primary_icon: '🤝',
    primary_description: '既能深入分析问题，又善于协调大家达成共识，是理性与共情的完美结合。',
    skill_orientation: 'analytical',
    behavior_pattern: 'collaborative',
    secondary_types: [
      { name: '战略操盘手', icon: '🎯', match_score: 0.82 },
      { name: '深度研究员', icon: '🔍', match_score: 0.78 },
      { name: '资源联结者', icon: '📣', match_score: 0.72 },
    ],
    confidence: 0.78,
  };

  const credibility: CredibilityResult = calculateMockCredibility(hardSkills, softSkills);

  const mockBehaviorSignals: BehaviorSignal[] = [
    { dimension: 'communication', indicator: 'structured_response', polarity: 'positive', strength: 0.8, description: '回答使用了"第一/第二/第三"的结构化表达', chat_round: 3 },
    { dimension: 'communication', indicator: 'clarity', polarity: 'positive', strength: 0.7, description: '主动举例说明，避免模糊表述', chat_round: 5 },
    { dimension: 'work_style', indicator: 'detail_focus', polarity: 'positive', strength: 0.6, description: '提到了具体工具和步骤', chat_round: 4 },
    { dimension: 'leadership', indicator: 'decision_mode', polarity: 'neutral', strength: 0.5, description: '决策语气偏谨慎，使用"我觉得可以试试"而非绝对化表达', chat_round: 6 },
    { dimension: 'learning', indicator: 'reflection', polarity: 'positive', strength: 0.8, description: '主动反思过去的不足，提到"现在回头看当时考虑不周"', chat_round: 8 },
    { dimension: 'learning', indicator: 'facing_unknown', polarity: 'positive', strength: 0.7, description: '诚实承认不懂的领域，表示"这个我不太熟，但可以学"', chat_round: 9 },
    { dimension: 'personality', indicator: 'emotional_expression', polarity: 'negative', strength: 0.4, description: '情绪表达偏克制，较少使用语气词和感叹句', chat_round: 7 },
  ];

  return {
    summary: baseProfile?.overview_summary || '你擅长用结构化框架拆解复杂问题，数据敏感度高，是团队里的「理性锚点」。',
    hard_skills: hardSkills,
    soft_skills: softSkills,
    twelve_type: twelveType,
    credibility: credibility,
    keyword_tags: [
      { tag: '结构化思维', confidence: 'high', evidence: '多次使用框架化表达', category: '思维方式' },
      { tag: '市场调研', confidence: 'high', evidence: '有完整调研项目经历', category: '硬技能' },
      { tag: '用户思维', confidence: 'medium', evidence: '提到过用户需求分析', category: '产品能力' },
      { tag: '快速学习', confidence: 'high', evidence: '反思能力强，主动承认不懂', category: '软实力' },
      { tag: '沟通协调', confidence: 'high', evidence: '表达清晰，善于总结', category: '软实力' },
      { tag: '数据分析', confidence: 'medium', evidence: '有数据对比意识', category: '硬技能' },
    ],
    soft_skill_narrative: '你习惯在发言前先梳理逻辑框架，团队讨论中经常扮演总结者角色。你有很强的反思习惯，善于从经历中提炼经验，这是成长最快的特质。你做事有规划、重细节，交给你的任务总是让人放心。',
    highlights: [
      '结构化思维能力突出，擅长用框架拆解复杂问题',
      '学习能力强，反思习惯好，成长速度快',
      '沟通表达清晰，是团队里的「理性锚点」',
    ],
    areas_for_growth: [
      { priority: '高', title: '技术能力提升', detail: '建议系统学习一门主流前端框架（React/Vue），从实现一个小项目开始，把技术能力从"了解级"提升到"掌握级"。可以从复刻一个你喜欢的网站开始。' },
      { priority: '中', title: '设计审美培养', detail: '可以多关注设计社区（Dribbble、站酷），每天花10分钟看好的设计，培养审美直觉。同时学习Figma的高级功能，提升原型设计的完成度。' },
      { priority: '低', title: '领导力锻炼', detail: '尝试在小组项目中主动承担更多协调和决策的角色，从带领一个小任务开始，锻炼自己的决断力和影响力。' },
    ],
    untested_dimensions: [],
    task_recommendations: {
      suitable: [
        '竞品分析、市场调研、行业研究',
        '需求分析、产品设计、用户调研',
        '对外沟通、协调资源、用户访谈',
        '需要条理性和计划性的任务',
      ],
      caution: [
        '核心技术开发（技术能力尚未验证）',
        '高保真UI设计（设计能力较弱）',
      ],
    },
  };
}

function createDimensionScore(
  verified: number,
  self: number,
  level: 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5',
  evidenceList: Evidence[],
  behaviorSignalCount = 0,
): DimensionScore {
  return {
    verified_score: verified,
    self_score: self,
    evidence_level: level,
    evidence_count: evidenceList.length,
    evidence_list: evidenceList,
    behavior_signal_count: behaviorSignalCount,
  };
}

function createEvidence(
  dimension: HardSkillDimension | SoftSkillDimension,
  level: 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5',
  quality: number,
  summary: string,
  quote: string,
  round: number,
): Evidence {
  return {
    dimension,
    level,
    quality_score: quality,
    summary,
    quote,
    chat_round: round,
    created_at: new Date().toISOString(),
  };
}

function calculateMockCredibility(
  hardSkills: Record<HardSkillDimension, DimensionScore>,
  softSkills: Record<SoftSkillDimension, DimensionScore>,
): CredibilityResult {
  const dimensions: CredibilityResult['dimensions'] = {} as any;
  let totalCred = 0;
  let count = 0;

  const allDims = [...Object.entries(hardSkills), ...Object.entries(softSkills)];
  for (const [dim, score] of allDims) {
    const v = score.verified_score;
    const s = score.self_score;
    if (s > 0 && v > 0) {
      const cred = Math.round((v / s) * 100) / 100;
      const level = getLevelFromCred(cred);
      dimensions[dim as keyof typeof dimensions] = {
        credibility: cred,
        level,
        verified_score: v,
        self_score: s,
      };
      totalCred += cred;
      count++;
    } else {
      dimensions[dim as keyof typeof dimensions] = {
        credibility: null,
        level: 'unrated',
        verified_score: v,
        self_score: s,
      };
    }
  }

  const overall = count > 0 ? Math.round((totalCred / count) * 100) / 100 : null;
  const overallLevel = overall !== null ? getLevelFromCred(overall) : 'unrated';

  const levelLabels: Record<CredibilityLevel, string> = {
    S: '低调实力派',
    A: '诚实靠谱',
    B: '略有美化',
    C: '明显夸大',
    D: '严重注水',
    unrated: '数据不足',
  };

  return {
    overall,
    overall_level: overallLevel,
    overall_label: levelLabels[overallLevel],
    dimensions,
  };
}

function getLevelFromCred(cred: number): CredibilityLevel {
  if (cred >= 1.0) return 'S';
  if (cred >= 0.8) return 'A';
  if (cred >= 0.6) return 'B';
  if (cred >= 0.4) return 'C';
  return 'D';
}

// ========== 生成团队 Mock V3 数据 ==========
export function generateMockTeamV3Profiles(count: number): Array<{ user_id: string; user_name: string; v3: V3Profile }> {
  const typeConfigs = [
    { type: '洞察协调者', icon: '🤝', orientation: 'analytical', pattern: 'collaborative', desc: '既能深入分析问题，又善于协调大家达成共识。' },
    { type: '技术推动者', icon: '⚙️', orientation: 'execution', pattern: 'dominant', desc: '用技术能力驱动团队前进，能啃硬骨头。' },
    { type: '极客工匠', icon: '💻', orientation: 'execution', pattern: 'independent', desc: '喜欢一个人安静地啃难题，质量有保障。' },
    { type: '资源联结者', icon: '📣', orientation: 'business', pattern: 'collaborative', desc: '擅长链接资源、对外沟通、搞定人。' },
    { type: '快速成长者', icon: '🔧', orientation: 'execution', pattern: 'growing', desc: '学习能力强上手快，成长速度快潜力大。' },
    { type: '精算分析师', icon: '📊', orientation: 'business', pattern: 'independent', desc: '对数字极其敏感，算得细看得远。' },
  ];

  const names = ['陈雨', '李明轩', '王思远', '张雨晴', '刘子涵', '赵晓峰'];
  const credLevels: CredibilityLevel[] = ['S', 'A', 'B', 'B', 'C', 'A'];
  const credValues: Record<CredibilityLevel, number> = { S: 1.1, A: 0.88, B: 0.72, C: 0.52, D: 0.35, unrated: 0 };
  const credLabels: Record<CredibilityLevel, string> = {
    S: '低调实力派', A: '诚实靠谱', B: '略有美化', C: '明显夸大', D: '严重注水', unrated: '数据不足',
  };

  return names.slice(0, count).map((name, idx) => {
    const base = generateMockV3Profile();
    const typeInfo = typeConfigs[idx % typeConfigs.length];
    const level = credLevels[idx];
    return {
      user_id: `user_${idx + 1}`,
      user_name: name,
      v3: {
        ...base,
        twelve_type: {
          ...base.twelve_type,
          primary_type: typeInfo.type,
          primary_icon: typeInfo.icon,
          primary_description: typeInfo.desc,
          skill_orientation: typeInfo.orientation as any,
          behavior_pattern: typeInfo.pattern as any,
        },
        credibility: {
          ...base.credibility,
          overall_level: level,
          overall: credValues[level],
          overall_label: credLabels[level],
        },
      },
    };
  });
}
