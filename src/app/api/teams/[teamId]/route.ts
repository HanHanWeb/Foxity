import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUserId } from "@/lib/session";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;

    const db = getDb();

    const teamResult = await db.execute({
      sql: `SELECT team_id, team_name, competition_type, organizer_name, owner_user_id, created_at
            FROM teams WHERE team_id = ?`,
      args: [teamId],
    });

    if (teamResult.rows.length === 0) {
      return NextResponse.json({ error: "团队不存在" }, { status: 404 });
    }

    const teamRow = teamResult.rows[0];

    // 权限校验：只有创建者（队长）能查看完整看板
    const userId = await getUserId();
    const ownerId = teamRow.owner_user_id as string | null;
    if (!ownerId || !userId || ownerId !== userId) {
      return NextResponse.json(
        { error: "无权查看，只有队长可以访问团队看板" },
        { status: 403 }
      );
    }

    const team = {
      team_id: teamRow.team_id,
      team_name: teamRow.team_name,
      competition_type: teamRow.competition_type,
      organizer_name: teamRow.organizer_name,
      created_at: teamRow.created_at,
    };

    const profilesResult = await db.execute({
      sql: `SELECT user_id, user_name, team_id, timestamp, data
            FROM profiles WHERE team_id = ?`,
      args: [teamId],
    });

    const members = profilesResult.rows.map((row) => {
      let parsedData: any = null;
      try {
        parsedData = row.data ? JSON.parse(row.data as string) : null;
      } catch (e) {
        console.error("Failed to parse profile data for user", row.user_id, e);
      }
      return {
        user_id: row.user_id,
        user_name: row.user_name,
        team_id: row.team_id,
        timestamp: row.timestamp,
        data: parsedData,
      };
    });

    return NextResponse.json({ ...team, members });
  } catch (error: any) {
    console.error("Fetch team error:", error);
    return NextResponse.json(
      { error: "获取团队失败", details: error?.message },
      { status: 500 }
    );
  }
}

// 删除团队（队长）或退出团队（成员）
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const db = getDb();

    // 查团队
    const teamRes = await db.execute({
      sql: `SELECT owner_user_id FROM teams WHERE team_id = ?`,
      args: [teamId],
    });
    if (teamRes.rows.length === 0) {
      return NextResponse.json({ error: "团队不存在" }, { status: 404 });
    }

    const ownerId = teamRes.rows[0].owner_user_id as string | null;

    if (ownerId === userId) {
      // 队长删除团队：删除所有关联数据
      await db.execute({ sql: `DELETE FROM chat_history WHERE team_id = ?`, args: [teamId] });
      await db.execute({ sql: `DELETE FROM profiles WHERE team_id = ?`, args: [teamId] });
      await db.execute({ sql: `DELETE FROM teams WHERE team_id = ?`, args: [teamId] });
      return NextResponse.json({ action: "deleted" });
    } else {
      // 成员退出团队：删除自己的 profile 和聊天记录
      await db.execute({ sql: `DELETE FROM chat_history WHERE user_id = ? AND team_id = ?`, args: [userId, teamId] });
      await db.execute({ sql: `DELETE FROM profiles WHERE user_id = ? AND team_id = ?`, args: [userId, teamId] });
      return NextResponse.json({ action: "left" });
    }
  } catch (error: any) {
    console.error("Delete/leave team error:", error);
    return NextResponse.json(
      { error: "操作失败", details: error?.message },
      { status: 500 }
    );
  }
}
