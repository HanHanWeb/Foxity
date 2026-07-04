import { NextResponse } from "next/server";

const BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://aiping.cn/api/v1";
const API_KEY = process.env.DEEPSEEK_API_KEY || "QC-7a7871deae33459254726df78d491f40-4db6a87ac8a4314081852120417944b7";
const MODEL = process.env.DEEPSEEK_MODEL || "DeepSeek-V4-Flash";

const SYSTEM_PROMPT = `你是「狐狸学长」，一个可爱但专业的 AI 测评助手，专门帮助大学生团队做能力测评。

## 你的人设
- 名字：狐狸学长
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

export async function POST(req: Request) {
  try {
    const { messages, user_name } = await req.json();

    const formattedMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((msg: any) => ({
        role: msg.role === "fox" ? "assistant" : "user",
        content: msg.content,
      })),
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
        temperature: 0.8,
        max_tokens: 1024,
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
    const content = data.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error("JSON parse error:", content);
      parsed = {
        reply: content,
        emotion: "thinking",
        phase: "background",
        scores_delta: {},
        event: null,
        profile_data: null,
      };
    }

    return NextResponse.json({
      reply: parsed.reply || "嗯？我好像没听清，再说一遍？",
      emotion: parsed.emotion || "smile",
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
