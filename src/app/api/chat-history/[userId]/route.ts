import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// GET /api/chat-history/[userId]?team_id=xxx
// 获取指定用户在指定团队的聊天记录
// 队长查看成员记录时，需先通过 team owner 校验（由调用方页面保证）
export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const url = new URL(req.url);
    const teamId = url.searchParams.get("team_id");

    if (!teamId) {
      return NextResponse.json({ error: "缺少 team_id 参数" }, { status: 400 });
    }

    const db = getDb();
    const result = await db.execute({
      sql: `SELECT role, content, emotion, created_at
            FROM chat_history WHERE user_id = ? AND team_id = ?
            ORDER BY id ASC`,
      args: [userId, teamId],
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
