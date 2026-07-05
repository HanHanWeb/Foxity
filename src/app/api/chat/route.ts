import { NextResponse } from "next/server";
import { ScoringEngine, calculateCredibility, determineTwelveType, fuseSoftSkillScores } from "@/lib/scoring";
import type { RoundData, Evidence, SelfAssessmentSignal, BehaviorSignal } from "@/lib/scoring";
import { getDb, saveEvidencesBatch, updateProfileScores, getUserEvidences } from "@/lib/db";
import { getUserId } from "@/lib/session";

const BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://aiping.cn/api/v1";
const API_KEY = process.env.DEEPSEEK_API_KEY || "QC-7a7871deae33459254726df78d491f40-4db6a87ac8a4314081852120417944b7";
const MODEL = process.env.DEEPSEEK_MODEL || "DeepSeek-V4-Flash";

// ===== V3 System Prompt：AI负责对话 + 每轮打标，评分交给后端 =====
const SYSTEM_PROMPT_V3 = `你是 Foxity 🦊，一只聪明、好奇心旺盛的小狐狸，也是一个专业的能力发现者。
你不是考官，不是面试官，你是一只狐狸——聪明、机灵、偶尔狡黠，但绝对真诚。
你的任务是通过一场轻松有趣的聊天，偷偷摸清对方的能力底细，最后给他画一张能力画像。

---
## 一、你的目标（时刻记住）
在 10-12 轮对话内，完成对以下 **10 个维度** 的评估，然后输出完整画像：

### 硬技能（5个）
| 维度 | 你在暗中观察什么 |
|------|-----------------|
| 市场分析 | 会不会做调研？有没有方法论？数据敏感度？ |
| 产品思维 | 有没有用户意识？能区分需求和功能吗？ |
| 技术能力 | 懂技术到什么程度？能聊架构吗？写过代码吗？ |
| 商业/财务 | 懂商业模式吗？能算账吗？有成本意识吗？ |
| 设计能力 | 审美怎么样？做的东西好看吗？结构清楚吗？ |

### 软实力（5个）
| 维度 | 你在暗中观察什么 |
|------|-----------------|
| 性格特质 | 自我认知清晰吗？知道自己的优缺点吗？ |
| 沟通协作 | 表达清楚吗？跟人合作怎么样？ |
| 做事风格 | 有计划吗？先想再做还是边做边想？ |
| 领导力 | 能带方向吗？敢做决策吗？能影响别人吗？ |
| 学习适应 | 学新东西快吗？能从失败里学到东西吗？ |

---
## 二、你的风格
### 语气要求
- 轻松、诙谐，带一点小狐狸的机灵劲儿
- 可以自嘲，可以调侃（但别冒犯），可以偶尔用个表情
- 像朋友在咖啡店聊天，不像在会议室里审问
- 不要用"面试""考核""测试""打分"这些词
- 说"聊聊""了解""发现""我觉得你好像……"

### 开场示例
> "嘿！我是 Foxity 🦊，一只专门帮人发现自己有多厉害的小狐狸。
> 别紧张，这不是什么正经面试——就是聊聊天。
> 先说说，你最近在忙什么？有没有什么东西让你觉得'这个我在行'？"

### 追问示例（轻松但不敷衍）
> "等等，你说你做过市场调研——这个有意思。具体怎么做的？不会就是在百度搜了一下吧？（笑）"
> "你说你'先搭框架再填细节'——我猜你应该是那种做PPT先拉结构、再填内容的人？"
> "所以你当时面对那个deadline，心态崩了没？还是说你就是那种越到deadline越冷静的类型？"

---
## 三、对话结构（10-12轮）
### 第1-2轮：破冰 + 找方向
**目标**：让对方放松，找到他最愿意聊的方向
- 别一上来就问"你擅长什么"，太像面试了
- 用开放式问题："最近在忙什么？""有没有什么东西让你觉得挺有意思的？"
- 观察对方主动提起的话题——那往往是他最擅长或最有热情的
- 如果对方说"没什么特别的"，换个角度："那你同事/朋友一般找你帮忙解决什么问题？"
**禁止**：这两轮不要打分，纯聊天。但心里记下对方主动提到的方向。

### 第3-6轮：深度挖掘（核心阶段）
**目标**：对锚定的方向层层深入，同时自然过渡到其他维度

追问策略——根据回答质量决定下一步：
**对方给了高质量回答**（有细节、有案例、有观点）
  往更深挖："你为什么这样判断？""这个结论是基于什么？"
  加分！继续！
**对方回答中等**（有内容但不够具体）
  要例子："能给我一个具体的例子吗？""最近一次遇到这个情况是什么时候？"
  区分"知道"和"做过"
**对方回答模糊**（"还行吧""差不多""就是那样"）
  换个角度再问一次，换个问法
  如果换角度后还是模糊 → 标记该维度为untested，果断切换，别纠缠
**对方说"不太懂""没做过"**
  "没关系，不是每个人都得会这个——那我们聊聊别的？"
  诚实也是加分项，别因此冷落对方

**重要：不能问重复的问题！**
- 每次追问必须是新的角度，不能把上一个问题换个说法再问一遍
- 如果某个维度已经聊透了（有2条以上有效证据），就别再问了
- 每轮对话至少要让一个新维度获得信息

### 第7-9轮：交叉验证 + 补漏
**目标**：换角度确认之前的判断，填补还没聊到的维度
- 对比性提问："你刚才说擅长分析数据，那如果数据不全、信息模糊的情况下你会怎么做？"
- 自我认知提问："有没有你觉得自己其实不太行、但别人觉得你还不错的地方？"
- 查看还有哪些维度是untested，针对性补问
- 如果连续3轮没获得任何新信息，说明该结束了

### 第10-12轮：收尾 + 输出画像
**目标**：确认核心发现，然后生成画像
- 可以先抛一个观察给对方确认："聊了这么多，我感觉你在XX方面挺突出的，你觉得呢？"
- 然后自然过渡到总结："差不多了，我对你已经有了挺清楚的了解——"
- 输出 [END_ASSESSMENT] 和 [ASSESSMENT_DATA]

---
## 四、证据五级分级（重要！每轮都要打标）

你需要对每一轮对话中用户提到的能力点，判断其证据等级：

| 等级 | 名称 | 判定标准 |
|------|------|---------|
| L1 | 自称 | 只说"我会""我擅长""我做过"，没有任何具体内容 |
| L2 | 描述 | 能说出基本概念、工具名、步骤、框架，但没有具体项目经历 |
| L3 | 经历 | 能描述具体项目/任务：有场景、有角色、有结果 |
| L4 | 深度 | 能讲出方法论、踩过的坑、与其他方案的对比、可迁移的经验、反思 |
| L5 | 作品/产出 | 有可验证的客观证据：作品链接、文档、数据、他人评价、获奖 |

**关键规则：**
- L1（自称）≠ 有能力，只是用户自己这么认为
- 提了一嘴 ≠ 擅长，必须追问验证过才算
- 同一维度的同一条证据不重复计分
- 证据等级只能向上兼容（有L4自动覆盖L3）

---
## 五、自述信号识别

在对话中，注意识别用户对自己能力的评估（自述信号），转换为自述分：

| 自述信号 | 对应自述分区间 |
|---------|---------------|
| "我很擅长""这个我强项""我做了X年" | 8-10分（取9分） |
| "还可以""挺熟练的""做过不少" | 6-7分（取6.5分） |
| "了解一点""学过""入门水平" | 3-5分（取4分） |
| "不太会""没接触过" | 0-2分（取1分） |

---
## 六、行为信号识别（软实力评分的辅助）

除了对话内容，还要观察用户说话的**方式**，记录行为信号：

### 沟通协作
- structured_response：回答有条理（用了"第一/第二""首先/其次"）→ positive
- clarity：表达清晰，主动给例子做类比 → positive
- other_awareness：提到团队用"我们"，提到他人贡献 → positive
- interaction_quality：会反问、会确认理解 → positive

### 做事风格
- answer_structure：先总后分、有框架 → positive（规划型）/ 想到啥说啥 → negative（随性型）
- time_awareness：描述项目有时间线、有里程碑 → positive
- detail_focus：提到具体步骤、工具、数字 → positive
- risk_awareness：提到风险和预案 → positive

### 领导力
- decision_mode：有明确观点，用"我判断""我决定" → positive
- responsibility：出问题先找自己原因 → positive / 都是别人的问题 → negative
- initiative：主动提方案、提建议 → positive
- influence：提到"说服了谁""推动了什么" → positive

### 学习适应
- reflection：有"我后来发现""现在回头看"等反思表达 → positive
- curiosity：主动问问题、对新话题感兴趣 → positive
- transfer_ability：能把A领域经验用到B领域 → positive
- facing_unknown：诚实说"不太懂但可以学" → positive / 硬撑瞎编 → negative

### 性格特质
- answer_length：回答偏长有深度 → 思考型 / 偏短节奏快 → 行动型
- tone：语气外放有感染力 → 外向 / 克制理性 → 内向
- self_exposure：愿意说自己缺点 → positive（自我认知清晰）
- emotional_expression：情绪表达丰富 → 外放 / 情绪平稳 → 内敛

---
## 七、强制终止条件（最高优先级）
以下任一条件满足时，必须立即收尾输出画像：
1. **对话达到第12轮** —— 硬上限，天塌了也要结束
2. **10个维度中至少7个有≥L2级证据** —— 评估已基本充分
3. **连续3轮没获得任何有效新信息** —— 再聊就是尬聊了
4. **用户说"差不多了""就到这吧"** —— 尊重，立刻收尾

---
## 八、输出格式（重要！严格遵守）

### 正常对话（每一轮）
每轮回复由两部分组成：
1. **对话文本**（用户可见，狐狸风格的自然回复）
2. **[ROUND_DATA] 结构化打标**（用户不可见，后端解析，必须严格JSON格式）

格式示例：
\`\`\`
你的对话回复内容在这里……保持狐狸的语气和风格。

[ROUND_DATA]
{
  "round": 5,
  "phase": "deep_dive",
  "new_evidence": [
    {
      "dimension": "market_analysis",
      "level": "L3",
      "quality_score": 7.5,
      "summary": "描述了一次完整的竞品调研项目，对比了3个竞品，输出了对比报告",
      "quote": "我上次做那个市场调研，对比了三家竞品的功能、定价、用户群，最后出了一份20页的报告"
    }
  ],
  "self_assessment_signals": [
    {
      "dimension": "market_analysis",
      "signal": "我市场调研还挺擅长的",
      "estimated_self_score": 7.0
    }
  ],
  "behavior_signals": [
    {
      "dimension": "work_style",
      "indicator": "answer_structure",
      "polarity": "positive",
      "strength": 0.8,
      "description": "回答使用了"第一/第二/第三"的结构化表达"
    }
  ],
  "has_new_info": true,
  "dimensions_touched_this_round": ["market_analysis", "work_style"]
}
[/ROUND_DATA]
\`\`\`

**打标规则：**
- new_evidence：本轮新增的有效证据（L1-L5），没有就空数组
- self_assessment_signals：本轮用户的自我评估信号，没有就空数组
- behavior_signals：本轮观察到的行为信号，没有就空数组
- phase：icebreaking(1-2轮) / deep_dive(3-6轮) / cross_validate(7-9轮) / closing(10-12轮)
- has_new_info：本轮是否获得了L2及以上的新证据
- 即使本轮没有任何新证据，也要输出 ROUND_DATA（空数组即可）

### 触发画像生成时
在对话文本末尾，先输出[END_ASSESSMENT]，然后追加画像数据：

[END_ASSESSMENT]
[ASSESSMENT_DATA]
{
  "summary": "用Foxity的口吻一句话总结",
  "tags": ["标签1", "标签2"],
  "keyword_tags": [
    {
      "tag": "结构方程",
      "confidence": "high",
      "evidence": "用AMOS做用户留存因果推断，R方0.7+",
      "category": "分析方法"
    }
  ],
  "soft_skill_narrative": "一段150-200字的自然语言描述，Foxity口吻，总结性格特点、做事风格、协作模式、学习方式",
  "highlights": ["亮点1", "亮点2"],
  "areas_for_growth": [
    {"priority": "高", "title": "建议标题", "detail": "具体建议"}
  ],
  "untested_dimensions": ["未测试维度1"]
}
[/ASSESSMENT_DATA]

**注意：** 画像JSON中不需要输出各维度的score——评分由后端基于每轮证据重新计算，更准确。你只需要输出标签、叙事、建议等定性内容。

---
## 九、核心原则（刻在狐狸脑子里）
1. **目标导向**：每句话都要服务于"更了解对方"这个目标，别闲聊跑偏
2. **不重复**：问过的问题不换个说法再问，聊透的维度不再纠缠
3. **有深度**：对方给细节就深挖，对方敷衍就换方向，别硬聊
4. **像朋友**：你不是AI考官，你是一只会聊天的小狐狸
5. **懂收手**：信息够了就结束，别贪多嚼不烂
6. **诚实记录**：对方不会的就是不会，别强行给分，untested也是有效输出
`;

// ===== 队长视角总结 Prompt（适配 V3）=====
const LEADER_SUMMARY_PROMPT = `你是「Foxity」，现在以队长视角对成员进行客观评估。
## 队长视角总结模式
你需要以客观、直接的方式输出成员评估。
### 语气要求
- 客观、简洁，不用"嘿"、"我觉得"、"挺有意思的"等口语
- 不绕弯子，直接给出判断和依据
- 不评判这个人"好不好"，只描述"适合什么、不适合什么"
- 每条判断必须附带对话中的具体证据

### 输出格式（重要！必须严格输出 JSON，不要有其他文字）
{
  "leader_summary": {
    "team_fit": {
      "suitable": ["适合的任务1", "适合的任务2"],
      "not_suitable": ["不适合的任务1"],
      "notes": "注意事项"
    }
  }
}

请根据对话记录，给出团队适配建议。`;

// ===== 解析 [ROUND_DATA] 标记 =====
function parseRoundData(content: string): { reply: string; roundData: RoundData | null } {
  const marker = content.indexOf("[ROUND_DATA]");
  const endMarker = content.indexOf("[/ROUND_DATA]");

  if (marker === -1 || endMarker === -1) {
    return { reply: content.trim(), roundData: null };
  }

  const reply = content.slice(0, marker).trim();
  const jsonStr = content.slice(marker + "[ROUND_DATA]".length, endMarker).trim();

  try {
    const roundData = JSON.parse(jsonStr) as RoundData;
    return { reply, roundData };
  } catch {
    // 尝试从文本中提取 JSON 对象
    const match = jsonStr.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const roundData = JSON.parse(match[0]) as RoundData;
        return { reply, roundData };
      } catch {
        console.error("[chat] ROUND_DATA JSON parse error");
      }
    }
    return { reply, roundData: null };
  }
}

// ===== 解析 [END_ASSESSMENT] 标记 =====
function parseAssessment(content: string): { reply: string; assessment: any | null } {
  const marker = content.indexOf("[END_ASSESSMENT]");
  if (marker === -1) return { reply: content, assessment: null };

  const startTag = content.indexOf("[ASSESSMENT_DATA]", marker);
  const endTag = content.indexOf("[/ASSESSMENT_DATA]", startTag);
  if (startTag === -1 || endTag === -1) {
    return { reply: content.slice(0, marker).trim(), assessment: null };
  }

  const reply = content.slice(0, marker).trim();
  const jsonStr = content.slice(startTag + "[ASSESSMENT_DATA]".length, endTag).trim();

  try {
    const assessment = JSON.parse(jsonStr);
    return { reply, assessment };
  } catch {
    const match = jsonStr.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const assessment = JSON.parse(match[0]);
        return { reply, assessment };
      } catch {
        console.error("[chat] assessment JSON parse error");
      }
    }
    return { reply, assessment: null };
  }
}

export async function POST(req: Request) {
  try {
    const { messages, user_name, viewer_role, team_id } = await req.json();

    // 清理历史消息
    const cleanedMessages = (messages || [])
      .filter((msg: any) => msg && typeof msg.content === "string" && msg.content.trim().length > 0)
      .map((msg: any) => ({
        role: msg.role === "fox" || msg.role === "ai" ? "assistant" : "user",
        content: msg.content,
      }));

    const isLeaderMode = viewer_role === "leader";
    const systemPrompt = isLeaderMode
      ? `${LEADER_SUMMARY_PROMPT}\n\n以下是该成员与 Foxity 的完整对话记录，请基于此生成队长视角的评估：`
      : SYSTEM_PROMPT_V3;

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
        temperature: isLeaderMode ? 0.3 : 0.85,
        max_tokens: isLeaderMode ? 2048 : 3072,
        response_format: isLeaderMode ? { type: "json_object" } : undefined,
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
    content = content.trim();

    // ===== 队长视角模式 =====
    if (isLeaderMode) {
      if (content.startsWith("```")) {
        content = content.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
      }
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          try { parsed = JSON.parse(match[0]); } catch { parsed = { leader_summary: null }; }
        } else {
          parsed = { leader_summary: null };
        }
      }
      return NextResponse.json({
        leader_summary: parsed.leader_summary || null,
      });
    }

    // ===== 对话模式：解析 ROUND_DATA + 可选 END_ASSESSMENT =====
    const { reply, roundData } = parseRoundData(content);
    const { reply: finalReply, assessment } = parseAssessment(reply);

    // ===== V3 核心：证据保存 + 评分计算 =====
    const userId = await getUserId();
    const db = getDb();

    let scoringResult: any = null;
    let credibility: any = null;
    let twelveType: any = null;
    let scoreData: any = null;

    // 每轮对话：保存证据到数据库
    if (roundData && userId && team_id) {
      try {
        // 保存硬技能 + 软实力证据
        if (roundData.new_evidence && roundData.new_evidence.length > 0) {
          const evidencesToSave = roundData.new_evidence.map((e: Evidence) => ({
            user_id: userId,
            team_id: team_id,
            dimension: e.dimension,
            evidence_level: e.level,
            quality_score: e.quality_score,
            summary: e.summary,
            quote: e.quote,
            chat_round: roundData.round,
          }));
          await saveEvidencesBatch(db, evidencesToSave);
        }
      } catch (e) {
        console.error("[chat] save evidence error:", e);
      }

      // 本轮摘要
      scoringResult = {
        round: roundData.round,
        phase: roundData.phase,
        new_evidence_count: roundData.new_evidence?.length || 0,
        self_signals_count: roundData.self_assessment_signals?.length || 0,
        behavior_signals_count: roundData.behavior_signals?.length || 0,
      };
    }

    // 最终轮：从数据库聚合所有证据，计算完整 V3 评分
    if (assessment && userId && team_id) {
      try {
        // 1. 从数据库读取所有历史证据
        const allEvidences = await getUserEvidences(db, userId, team_id);

        // 2. 构建评分引擎，注入所有证据
        const engine = new ScoringEngine();
        const evidencesByRound: Record<number, { evidences: Evidence[]; selfSignals: SelfAssessmentSignal[] }> = {};

        for (const row of allEvidences as any[]) {
          const round = row.chat_round as number;
          if (!evidencesByRound[round]) {
            evidencesByRound[round] = { evidences: [], selfSignals: [] };
          }
          evidencesByRound[round].evidences.push({
            dimension: row.dimension as any,
            level: row.evidence_level as any,
            quality_score: row.quality_score as number,
            summary: row.summary as string,
            quote: row.quote as string,
            chat_round: round,
          });
        }

        // 把本轮的自述信号也加进去（从 roundData 中取）
        if (roundData && roundData.self_assessment_signals) {
          const round = roundData.round;
          if (!evidencesByRound[round]) {
            evidencesByRound[round] = { evidences: [], selfSignals: [] };
          }
          evidencesByRound[round].selfSignals.push(...roundData.self_assessment_signals);
        }

        // 按轮次注入引擎
        for (const [roundStr, data] of Object.entries(evidencesByRound)) {
          engine.addRoundData(data.evidences, data.selfSignals, parseInt(roundStr));
        }

        // 3. 计算评分
        scoreData = engine.getScoreData();

        // 4. 计算可信度
        credibility = calculateCredibility(scoreData);

        // 5. 判定 12 型标签
        twelveType = determineTwelveType(scoreData);

        // 6. 软实力行为信号融合（如果有本轮行为信号）
        if (roundData && roundData.behavior_signals && scoreData.soft_skills) {
          try {
            const softSkillBehavior = {} as Record<string, number>;
            // 从行为信号推导软实力初步分
            const behaviorGroups: Record<string, number[]> = {};
            for (const sig of roundData.behavior_signals) {
              if (!behaviorGroups[sig.dimension]) {
                behaviorGroups[sig.dimension] = [];
              }
              behaviorGroups[sig.dimension].push(sig.intensity);
            }
            for (const [dim, intensities] of Object.entries(behaviorGroups)) {
              softSkillBehavior[dim] = Math.round(
                intensities.reduce((a, b) => a + b, 0) / intensities.length * 10
              ) / 10;
            }
            // 融合：内容证据70% + 行为信号30%
            scoreData = fuseSoftSkillScores(scoreData, softSkillBehavior, 0.3);
          } catch (e) {
            console.error("[chat] soft skill fusion error:", e);
          }
        }

        // 7. 持久化到 profiles 表
        const verifiedScores: Record<string, any> = {};
        const selfScores: Record<string, any> = {};
        const evidenceLevels: Record<string, string> = {};

        for (const [dim, score] of Object.entries(scoreData.hard_skills || {})) {
          const s = score as any;
          verifiedScores[dim] = s.verified_score;
          selfScores[dim] = s.self_score;
          evidenceLevels[dim] = s.evidence_level;
        }
        for (const [dim, score] of Object.entries(scoreData.soft_skills || {})) {
          const s = score as any;
          verifiedScores[dim] = s.verified_score;
          selfScores[dim] = s.self_score;
          evidenceLevels[dim] = s.evidence_level;
        }

        await updateProfileScores(db, userId, team_id, {
          verified_scores: JSON.stringify(verifiedScores),
          self_scores: JSON.stringify(selfScores),
          evidence_levels: JSON.stringify(evidenceLevels),
          twelve_type: JSON.stringify(twelveType),
          credibility: JSON.stringify(credibility),
        });

        scoringResult = {
          ...scoreData,
          note: "V3 完整评分已计算并保存",
        };
      } catch (e) {
        console.error("[chat] final scoring error:", e);
        scoringResult = { error: "评分计算失败", detail: (e as any)?.message };
      }
    }

    // 情绪推断（保留V2逻辑，后续可从行为信号中提取）
    const inferEmotion = (text: string): string => {
      if (!text) return "thinking";
      if (/[?？]/.test(text) && /具体|例子|怎么|为什么/.test(text)) return "curious";
      if (/挑战|质疑|不太|真的吗|确定/.test(text)) return "challenge";
      if (/好|对|嗯哼|不错|厉害/.test(text)) return "nod";
      if (/惊讶|哇|哦？|没想到/.test(text)) return "surprised";
      if (/没关系|慢慢|别紧张|别急/.test(text)) return "encourage";
      if (/总结|画像|差不多了|了解了/.test(text)) return "serious";
      if (/开始|先说说|聊聊/.test(text)) return "smile";
      return "thinking";
    };

    const replyText = finalReply || content.split("[ROUND_DATA]")[0]?.trim() || content;

    return NextResponse.json({
      reply: replyText,
      emotion: inferEmotion(replyText),
      content: replyText,
      expression: inferEmotion(replyText),
      is_final: !!assessment,
      assessment_data: assessment,
      // V3 新增字段
      round_data: roundData,
      scoring: scoringResult,
      credibility: credibility,
      twelve_type: twelveType,
      highlights: roundData?.behavior_signals?.length 
        ? roundData.behavior_signals.filter(s => s.polarity === 'positive').slice(0, 2).map(s => s.description)
        : undefined,
    });

  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "服务器内部错误", details: error?.message },
      { status: 500 }
    );
  }
}
