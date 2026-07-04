import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { user_id, team_id, role, content, emotion } = await req.json();

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
