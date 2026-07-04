import type { AIResponse, ChatMessage } from "@/types";

export async function sendToAI(messages: ChatMessage[], userName?: string): Promise<AIResponse> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
        user_name: userName,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      reply: data.reply,
      emotion: data.emotion,
      content: data.reply,
      expression: data.emotion,
      phase: data.phase,
      scores_delta: data.scores_delta,
      event: data.event,
      profile_data: data.profile_data,
      is_final: data.phase === "summary",
    };
  } catch (error) {
    console.error("sendToAI error:", error);
    return {
      reply: "哎呀，Foxity 刚刚走神了，再说一遍好不好？🦊",
      emotion: "curious",
      content: "",
      expression: "curious",
    };
  }
}
