import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth-server";

export async function POST(req: Request) {
  try {
    const userId = await requireUser();
    if (userId instanceof NextResponse) return userId;

    const { user_id, team_id, role, content, emotion } = await req.json();

    // 鉴权：只能保存自己的聊天记录
    if (user_id !== userId) {
      return NextResponse.json({ error: "无权保存他人聊天记录" }, { status: 403 });
    }

    if (!user_id || !team_id || !role || !content) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    const created_at = new Date().toISOString();

    const db = getDb();
    await db.execute({
      sql: `INSERT INTO chat_history (user_id, team_id, role, content, emotion, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [user_id, team_id, role, content, emotion ?? null, created_at],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Save chat history error:", error);
    return NextResponse.json(
      { error: "保存聊天记录失败", details: error?.message },
      { status: 500 }
    );
  }
}
