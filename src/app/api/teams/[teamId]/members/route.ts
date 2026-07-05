import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUserId } from "@/lib/session";

// POST: 加入团队（写入 team_members）
export async function POST(
  req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await req.json();
    const { user_name } = body;

    const db = getDb();

    // 查团队是否存在 + 是否队长
    const teamRes = await db.execute({
      sql: `SELECT owner_user_id FROM teams WHERE team_id = ?`,
      args: [teamId],
    });
    if (teamRes.rows.length === 0) {
      return NextResponse.json({ error: "团队不存在" }, { status: 404 });
    }

    const ownerId = teamRes.rows[0].owner_user_id as string | null;
    const role = ownerId === userId ? "leader" : "member";

    // 写入 team_members（INSERT OR IGNORE 避免重复）
    await db.execute({
      sql: `INSERT OR IGNORE INTO team_members (team_id, user_id, role, position, joined_at)
            VALUES (?, ?, ?, '', ?)`,
      args: [teamId, userId, role, new Date().toISOString()],
    });

    return NextResponse.json({ ok: true, role });
  } catch (error: any) {
    console.error("Add member error:", error);
    return NextResponse.json(
      { error: "加入团队失败", details: error?.message },
      { status: 500 }
    );
  }
}
