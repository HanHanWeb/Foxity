import type { AIResponse, ChatMessage, Expression } from "@/types";

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
    const emotion = (data.emotion || "thinking") as Expression;

    return {
      reply: data.reply,
      emotion,
      content: data.content || data.reply,
      expression: emotion,
      is_final: data.is_final || false,
      assessment_data: data.assessment_data || undefined,
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
