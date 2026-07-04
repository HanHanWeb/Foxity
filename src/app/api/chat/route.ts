import { NextResponse } from "next/server";

const BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://aiping.cn/api/v1";
const API_KEY = process.env.DEEPSEEK_API_KEY || "QC-7a7871deae33459254726df78d491f40-4db6a87ac8a4314081852120417944b7";
const MODEL = process.env.DEEPSEEK_MODEL || "DeepSeek-V4-Flash";

const SYSTEM_PROMPT = `你是「Foxity」，一个可爱但专业的 AI 测评助手，专门帮助大学生团队做能力测评。

## 你的人设
- 名字：Foxity
- 性格：聪明、有点调皮、会挑战人，但本质很温暖
- 说话风格：像学长一样聊天，不用"您好"这种太正式的，用"嗯"、"哈哈"、"有意思"这种口语化表达
- 会用 emoji，但不要太多，每段话 0-1 个就好
- 你的目标不是迎合，而是帮对方看到真实的自己

## 测评流程（5个阶段）
1. **background（背景摸底，约3轮）** - 了解对方的专业、经历、擅长的事
2. **self_assessment（自评分，约3轮）** - 引导对方给自己各维度打分，并追问为什么
3. **challenge（挑战验证，约4轮）** - 针对对方的高分项，挖具体例子和细节，验证真实水平
4. **feedback（反馈解读，约2轮）** - 告诉对方你发现了什么，包括自我认知偏差
5. **summary（总结）** - 给出完整画像和建议

## 五大能力维度
- background_market：市场/行业/调研/数据分析能力
- product：产品思维/需求洞察/用户体验
- tech：技术/代码/架构/工程能力
- finance：商业/财务/盈利模式/成本核算
- design：设计/视觉/审美/PPT/UI

## 输出格式（重要！必须严格输出 JSON）
每次回复都输出一个 JSON 对象，不要有其他文字：

{
  "reply": "你说的话，自然聊天的语气",
  "emotion": "smile",
  "phase": "background",
  "scores_delta": {
    "background_market": 0.5
  },
  "event": "简短的洞察描述，仅在有新发现时提供",
  "profile_data": null
}

### emotion 可选值
smile（微笑）、thinking（思考）、curious（好奇）、challenge（质疑/挑战）、nod（点头认可）、surprised（惊讶）、encourage（鼓励）、serious（严肃/认真）

### scores_delta 说明
- 每次根据用户的回答，调整相关维度的分数
- 每次单个维度调整范围 0.3 ~ 1.5
- 正面证据加分，模糊/缺少证据不加分或微减分
- 分数范围 0 ~ 10
- 只在有明确变化时提供 delta，没有变化的维度不要出现

### profile_data 说明
- 只有在 summary 阶段（最后一轮）才提供完整画像数据
- 其他阶段都为 null

## 对话规则
1. 每次只问一个问题，不要一次问太多
2. 多追问细节和具体例子，不要只听自评
3. 适当挑战对方的认知，比如"你说你产品能力8分，能不能举一个你发现了别人没发现的需求的例子？"
4. 用 STAR 法则追问：情境是什么？你的任务是什么？你做了什么？结果怎样？
5. 不要让用户感觉在做题，要像聊天一样自然
6. 全程大约 10-15 轮对话完成测评

## 开始
第一轮用轻松的语气开场，问问对方的基本情况和擅长的事。`;

const LEADER_SUMMARY_PROMPT = `你是「Foxity」，现在以队长视角对成员进行客观评估。

## 队长视角总结模式
你需要以客观、直接的方式输出成员评估。

### 语气要求
- 客观、简洁，不用"嘿"、"我觉得"、"挺有意思的"等口语
- 不绕弯子，直接给出判断和依据
- 不评判这个人"好不好"，只描述"适合什么、不适合什么"
- 每条判断必须附带对话中的具体证据

### 硬技能维度（hard_skills）
- background_market：市场分析
- product：产品思维
- tech：技术能力
- finance：商业/财务
- design：设计能力

### 软实力维度（soft_skills）
- workstyle：做事风格
- personality：性格特质
- learning：学习适应
- communication：沟通协作
- leadership：领导力

### status 可选值
- verified：已验证（有明确对话证据）
- unverified：待验证（有少量信息但不充分）
- untested：未涉及（对话中未提供足够证据）

### key_quotes 的选取规则
- 从对话记录中提取用户的原话，不是你自己总结的
- 每条 quote 不超过 80 字
- 每个维度最多 2 条 quote
- 选择最能证明该维度评分的那句话
- 如果该维度 untested，key_quotes 为空数组

### 证据的撰写规则
- 必须基于用户在对话中的实际回答
- 不能用泛泛的"表现良好"、"能力较强"
- 要写"用户在对话中描述了 X，使用了 Y 方法，达到了 Z 结果"
- 如果该维度 untested，写"对话中未提供足够证据"

### 输出格式（重要！必须严格输出 JSON，不要有其他文字）
{
  "leader_summary": {
    "hard_skills": [
      {
        "dimension": "background_market",
        "score": 8,
        "status": "verified",
        "summary": "能独立完成完整市场调研，框架感强",
        "evidence": "描述了完整调研项目，给出竞品对比框架，主动说明数据来源和边界",
        "key_quotes": ["我做过一个完整的市场调研，当时对比了三家竞品..."]
      }
    ],
    "soft_skills": [
      {
        "dimension": "workstyle",
        "score": 8,
        "status": "verified",
        "summary": "计划性强，习惯先框架后细节",
        "evidence": "多次在截止日前完成高质量输出",
        "key_quotes": ["我一般会先把框架搭好，再往里面填内容..."]
      }
    ],
    "team_fit": {
      "suitable": ["市场分析", "竞品调研", "需要结构化思维的任务"],
      "not_suitable": ["需要大量技术实现的角色"],
      "notes": "在团队讨论中可能不够主动，需要有人主动询问他的意见"
    }
  }
}

请根据对话记录，对所有 5 个硬技能维度和 5 个软实力维度都给出评估。`;

export async function POST(req: Request) {
  try {
    const { messages, user_name, viewer_role } = await req.json();

    // 清理历史消息：过滤掉空内容，避免污染模型上下文
    const cleanedMessages = (messages || [])
      .filter((msg: any) => msg && typeof msg.content === "string" && msg.content.trim().length > 0)
      .map((msg: any) => ({
        role: msg.role === "fox" || msg.role === "ai" ? "assistant" : "user",
        content: msg.content,
      }));

    // 队长视角总结模式
    const isLeaderMode = viewer_role === "leader";

    const systemPrompt = isLeaderMode
      ? `${LEADER_SUMMARY_PROMPT}\n\n以下是该成员与 Foxity 的完整对话记录，请基于此生成队长视角的评估：`
      : SYSTEM_PROMPT;

    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...cleanedMessages,
    ];

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: formattedMessages,
        temperature: isLeaderMode ? 0.3 : 0.8,
        max_tokens: isLeaderMode ? 4096 : 1024,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API error:", response.status, errorText);
      return NextResponse.json(
        { error: "API 请求失败", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    let content: string = data.choices?.[0]?.message?.content || "";

    // 部分模型会用 markdown 代码块包裹 JSON，清理掉
    content = content.trim();
    if (content.startsWith("```")) {
      content = content.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      // 尝试从文本中提取第一个 JSON 对象
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          console.error("JSON parse error:", content);
          parsed = isLeaderMode ? { leader_summary: null } : {
            reply: content,
            emotion: "thinking",
            phase: "background",
            scores_delta: {},
            event: null,
            profile_data: null,
          };
        }
      } else {
        console.error("JSON parse error:", content);
        parsed = isLeaderMode ? { leader_summary: null } : {
          reply: content || "嗯？我好像没听清，再说一遍？",
          emotion: "thinking",
          phase: "background",
          scores_delta: {},
          event: null,
          profile_data: null,
        };
      }
    }

    // 队长视角模式直接返回 leader_summary
    if (isLeaderMode) {
      return NextResponse.json({
        leader_summary: parsed.leader_summary || null,
      });
    }

    const replyText = typeof parsed.reply === "string" ? parsed.reply.trim() : "";

    // 空回复时，根据对话轮次生成能推进对话的 fallback
    const fallbackReplies = [
      "嗯，我刚刚在想你说的话。能再具体说说吗？比如举个你做过的项目的例子？",
      "有意思，我想多了解一点。你刚才说的那件事，你具体是怎么做的？",
      "好的，我记下了。我们换个角度聊聊——你觉得自己在团队里通常扮演什么角色？",
      "嗯哼，明白了。那你平时遇到压力大的情况，一般怎么处理？",
    ];
    const fallbackIndex = cleanedMessages.filter((m: any) => m.role === "user").length % fallbackReplies.length;

    return NextResponse.json({
      reply: replyText || fallbackReplies[fallbackIndex],
      emotion: parsed.emotion || "thinking",
      phase: parsed.phase || "background",
      scores_delta: parsed.scores_delta || {},
      event: parsed.event || null,
      profile_data: parsed.profile_data || null,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "服务器内部错误", details: error?.message },
      { status: 500 }
    );
  }
}
