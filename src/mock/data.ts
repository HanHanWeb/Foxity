import type {
  AssessmentState,
  ChatMessage,
  DimensionMeta,
  UserProfile,
  Team,
  HardSkillKey,
  SoftSkillKey,
} from "@/types";
import { hardSkillMeta } from "@/types";

export const dimensions: DimensionMeta[] = hardSkillMeta.map((m) => ({
  key: m.key,
  icon: m.icon,
  name: m.name,
  shortName: m.shortName,
}));

export const expressionText = {
  smile: "认真倾听中...",
  thinking: "让我想想...",
  curious: "诶？这个有意思！",
  challenge: "嗯...我有不同看法",
  nod: "说得对！",
  surprised: "哦？没想到！",
  encourage: "没关系，慢慢来",
  serious: "认真总结中...",
};

export const competitionTypes = ["挑战杯", "互联网+", "创青春", "其他"];

function makeAbility(score: number, status: "verified" | "unverified" | "untested", insights: string[], events: string[] = [], selfScore?: number) {
  return {
    score,
    verification_status: status,
    insights,
    evidence_events: events,
    self_score: selfScore,
  };
}

// V2 硬技能初始 abilities
function makeInitialAbilities() {
  const abilities: Record<HardSkillKey, ReturnType<typeof makeAbility>> = {
    market_analysis: makeAbility(0, "untested", []),
    product_thinking: makeAbility(0, "untested", []),
    technical: makeAbility(0, "untested", []),
    business_finance: makeAbility(0, "untested", []),
    design: makeAbility(0, "untested", []),
  };
  return abilities;
}

export const mockProfiles: UserProfile[] = [
  {
    user_id: "u_chenyu",
    user_name: "陈雨",
    team_id: "FOX3A7",
    team_name: "挑战杯-智慧农业项目组",
    timestamp: new Date().toISOString(),
    core_positioning: "市场分析担当",
    overview_summary:
      "你擅长用结构化框架拆解复杂问题，数据敏感度高，是团队里的「理性锚点」。你习惯先给结论再补证据，表达清晰，但有时会低估自己的市场分析能力。",
    abilities: {
      market_analysis: makeAbility(8, "verified", [
        "能用 PEST 拆解行业，并对竞品建立清晰对比维度",
        "会主动说明数据来源、样本和结论边界",
        "市场分析框架感强，不只是罗列资料",
      ], ["描述过完整市场调研项目", "给出过竞品对比框架"], 6),
      product_thinking: makeAbility(6, "unverified", [
        "在描述 dashboard 时体现出用户路径意识",
        "能区分功能和需求，但深度待验证",
      ], [], 7),
      technical: makeAbility(3, "untested", ["技术相关信息较少，待进一步探索"], []),
      business_finance: makeAbility(5, "unverified", [
        "能理解成本和收入假设，但缺少完整模型经验",
      ], [], 5),
      design: makeAbility(4, "unverified", [
        "PPT 表达结构清楚，视觉细节仍需验证",
      ], [], 6),
    },
    behavior_patterns: {
      stress_response: "行动型",
      decision_style: "理性型",
      collaboration_style: "互补型",
      learning_style: "实践型",
    },
    growth_suggestions: [
      {
        area: "市场分析的影响力",
        suggestion:
          "你有不错的市场分析能力，但容易把它当「基本功」而不是「差异化优势」。建议主动在团队中承担竞品和行业分析输出，让更多人看到你的价值。",
        priority: "high",
      },
      {
        area: "产品思维深化",
        suggestion:
          "你已经有用户路径意识，可以进一步练习：每次看到一个功能，先想「用户在什么场景下用」，再想「怎么实现」。",
        priority: "medium",
      },
    ],
  },
  {
    user_id: "u_lina",
    user_name: "李娜",
    team_id: "FOX3A7",
    team_name: "挑战杯-智慧农业项目组",
    timestamp: new Date().toISOString(),
    core_positioning: "产品推进者",
    overview_summary:
      "你擅长把模糊需求变成可执行方案，推进意识强，是团队里的「发动机」。你能区分用户想要和真实痛点，但有时会为了团队和谐过早让步。",
    abilities: {
      market_analysis: makeAbility(5, "unverified", ["能读懂调研结论，但独立完成深度分析经验不足"], [], 5),
      product_thinking: makeAbility(8, "verified", [
        "原型和用户路径描述完整",
        "能区分用户想要和真实痛点",
        "方案表达清楚，能把功能拆成用户路径",
      ], ["描述过完整产品设计思路", "给出过用户旅程地图"], 8),
      technical: makeAbility(3, "untested", ["技术实现细节参与较少"], []),
      business_finance: makeAbility(5, "unverified", ["理解商业模式但模型细节不足"], [], 6),
      design: makeAbility(6, "unverified", ["有基础页面审美，能给出合理的布局建议"], [], 7),
    },
    behavior_patterns: {
      stress_response: "求助型",
      decision_style: "直觉型",
      collaboration_style: "主导型",
      learning_style: "实践型",
    },
    growth_suggestions: [
      {
        area: "方案的锋利度",
        suggestion:
          "你善于妥协和推进，但有时会牺牲方案的锋利度。建议练习在「不影响关系」的前提下坚持核心判断。",
        priority: "high",
      },
    ],
  },
  {
    user_id: "u_haoran",
    user_name: "周浩然",
    team_id: "FOX3A7",
    team_name: "挑战杯-智慧农业项目组",
    timestamp: new Date().toISOString(),
    core_positioning: "技术骨干",
    overview_summary:
      "你工程实现能力强，问题定位快，是团队里的「落地保障」。你能把技术方案讲清楚给非技术同学听，这是很珍贵的能力。",
    abilities: {
      market_analysis: makeAbility(3, "untested", ["市场和商业背景接触较少"], []),
      product_thinking: makeAbility(5, "unverified", ["能理解核心需求，但产品思维深度待提升"], [], 4),
      technical: makeAbility(9, "verified", [
        "提供过完整架构图和代码实现",
        "能拆模块、估复杂度并给出技术路径",
        "问题定位快，描述 bug 时能定位边界条件",
      ], ["描述过系统架构设计", "解决过复杂技术难题"], 9),
      business_finance: makeAbility(3, "untested", ["财务和商业模型接触较少"], []),
      design: makeAbility(4, "unverified", ["能还原基础 UI，但设计创意不是强项"], [], 3),
    },
    behavior_patterns: {
      stress_response: "行动型",
      decision_style: "理性型",
      collaboration_style: "被动响应型",
      learning_style: "实践型",
    },
    growth_suggestions: [
      {
        area: "主动参与产品讨论",
        suggestion:
          "你倾向于等需求明确后再动手，但如果能更早参与产品讨论，可以从技术角度帮助团队避开很多坑。",
        priority: "medium",
      },
    ],
  },
  {
    user_id: "u_mengyao",
    user_name: "王梦瑶",
    team_id: "FOX3A7",
    team_name: "挑战杯-智慧农业项目组",
    timestamp: new Date().toISOString(),
    core_positioning: "商业表达者",
    overview_summary:
      "你兼顾财务逻辑和路演呈现，风险意识强，是团队里的「商业门面」。你做财务预测时有风险管理思维，很适合参与答辩问答。",
    abilities: {
      market_analysis: makeAbility(6, "verified", [
        "能把市场数据转成规模假设",
        "会主动列出关键不确定性",
      ], ["做过市场规模测算"], 6),
      product_thinking: makeAbility(4, "unverified", ["产品细节参与较少"], []),
      technical: makeAbility(3, "untested", ["技术理解较浅"], []),
      business_finance: makeAbility(8, "verified", [
        "能解释收入、成本和增长率假设",
        "财务逻辑自洽，能说明收入模型和成本结构的关系",
      ], ["建立过完整财务模型", "做过敏感性分析"], 7),
      design: makeAbility(7, "verified", [
        "PPT 结构和视觉一致性较好",
        "信息层级清楚，适合答辩场景",
      ], ["设计过完整路演 PPT"], 8),
    },
    behavior_patterns: {
      stress_response: "情绪型",
      decision_style: "理性型",
      collaboration_style: "主动同步型",
      learning_style: "理论型",
    },
    growth_suggestions: [
      {
        area: "压力下的情绪管理",
        suggestion:
          "你面对压力时容易焦虑，但能靠清单恢复。建议提前准备「压力应对清单」，把大任务拆成可执行的小步骤。",
        priority: "high",
      },
    ],
  },
];

export const mockTeam: Team = {
  team_id: "FOX3A7",
  team_name: "挑战杯-智慧农业项目组",
  competition_type: "挑战杯",
  organizer_name: "陈雨",
  members: mockProfiles,
  created_at: new Date().toISOString(),
};

export const initialAssessmentState: AssessmentState = {
  current_expression: "smile",
  covered_dimensions: {
    market_analysis: "untested",
    product_thinking: "untested",
    technical: "untested",
    business_finance: "untested",
    design: "untested",
  },
  key_events: { stress: false, conflict: false },
  elapsed_minutes: 0,
  insights: [],
};

export const mockMessages: ChatMessage[] = [
  {
    id: "m_1",
    role: "fox",
    content: "嘿！我是 Foxity 🦊，一只专门帮人发现自己有多厉害的小狐狸。别紧张，这不是什么正经面试——就是聊聊天。先说说，你最近在忙什么？有没有什么东西让你觉得'这个我在行'？",
    emotion: "smile",
    timestamp: Date.now() - 60000,
  },
];
