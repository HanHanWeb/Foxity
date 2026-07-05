import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUserId } from "@/lib/session";

// PATCH: 编辑成员职位（队长专属）
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ teamId: string; userId: string }> }
) {
  try {
    const { teamId, userId } = await params;
    const currentUserId = await getUserId();
    if (!currentUserId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const db = getDb();

    // 权限校验：只有队长能编辑职位
    const teamRes = await db.execute({
      sql: `SELECT owner_user_id FROM teams WHERE team_id = ?`,
      args: [teamId],
    });
    if (teamRes.rows.length === 0) {
      return NextResponse.json({ error: "团队不存在" }, { status: 404 });
    }
    const ownerId = teamRes.rows[0].owner_user_id as string | null;
    if (ownerId !== currentUserId && ownerId !== null) {
      return NextResponse.json({ error: "只有队长可以编辑职位" }, { status: 403 });
    }

    const body = await req.json();
    const { position } = body;

    await db.execute({
      sql: `UPDATE team_members SET position = ? WHERE team_id = ? AND user_id = ?`,
      args: [position || "", teamId, userId],
    });

    return NextResponse.json({ ok: true, position: position || "" });
  } catch (error: any) {
    console.error("Update member position error:", error);
    return NextResponse.json(
      { error: "更新职位失败", details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE: 移除成员（队长专属）
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ teamId: string; userId: string }> }
) {
  try {
    const { teamId, userId } = await params;
    const currentUserId = await getUserId();
    if (!currentUserId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const db = getDb();

    // 权限校验：只有队长能移除成员
    const teamRes = await db.execute({
      sql: `SELECT owner_user_id FROM teams WHERE team_id = ?`,
      args: [teamId],
    });
    if (teamRes.rows.length === 0) {
      return NextResponse.json({ error: "团队不存在" }, { status: 404 });
    }
    const ownerId = teamRes.rows[0].owner_user_id as string | null;
    if (ownerId !== currentUserId && ownerId !== null) {
      return NextResponse.json({ error: "只有队长可以移除成员" }, { status: 403 });
    }

    // 不能移除自己（队长）
    if (userId === currentUserId) {
      return NextResponse.json({ error: "不能移除自己，请使用删除团队功能" }, { status: 400 });
    }

    // 删除该成员的所有数据
    try { await db.execute({ sql: `DELETE FROM chat_history WHERE user_id = ? AND team_id = ?`, args: [userId, teamId] }); } catch {}
    try { await db.execute({ sql: `DELETE FROM dimension_evidence WHERE user_id = ? AND team_id = ?`, args: [userId, teamId] }); } catch {}
    try { await db.execute({ sql: `DELETE FROM profiles WHERE user_id = ? AND team_id = ?`, args: [userId, teamId] }); } catch {}
    try { await db.execute({ sql: `DELETE FROM team_members WHERE user_id = ? AND team_id = ?`, args: [userId, teamId] }); } catch {}

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Remove member error:", error);
    return NextResponse.json(
      { error: "移除成员失败", details: error?.message },
      { status: 500 }
    );
  }
}
