import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const db = getDb();
    const result = await db.execute({
      sql: `SELECT role, content, emotion, created_at
            FROM chat_history WHERE user_id = ?
            ORDER BY id ASC`,
      args: [userId],
    });

    const history = result.rows.map((row) => ({
      role: row.role,
      content: row.content,
      emotion: row.emotion,
      created_at: row.created_at,
    }));

    return NextResponse.json(history);
  } catch (error: any) {
    console.error("Fetch chat history error:", error);
    return NextResponse.json(
      { error: "获取聊天记录失败", details: error?.message },
      { status: 500 }
    );
  }
}
