import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createTeamCode } from "@/lib/utils";
import { getUserId } from "@/lib/session";

// 获取当前登录用户的团队：我创建的 + 我加入的
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "未登录" },
        { status: 401 }
      );
    }

    const db = getDb();

    // 我创建的团队（含成员数）
    const ownedRes = await db.execute({
      sql: `SELECT t.team_id, t.team_name, t.team_emoji, t.competition_type, t.organizer_name, t.created_at,
                   (SELECT COUNT(*) FROM profiles p WHERE p.team_id = t.team_id) AS member_count
            FROM teams t WHERE t.owner_user_id = ?
            ORDER BY t.created_at DESC`,
      args: [userId],
    });
    const owned = ownedRes.rows.map((row) => ({
      team_id: row.team_id,
      team_name: row.team_name,
      team_emoji: row.team_emoji,
      competition_type: row.competition_type,
      organizer_name: row.organizer_name,
      created_at: row.created_at,
      member_count: row.member_count,
    }));

    // 我加入的团队（通过 profiles 表关联，排除自己创建的）
    const joinedRes = await db.execute({
      sql: `SELECT t.team_id, t.team_name, t.team_emoji, t.competition_type, t.organizer_name, t.created_at, p.timestamp AS joined_at,
                   (SELECT COUNT(*) FROM profiles p2 WHERE p2.team_id = t.team_id) AS member_count
            FROM profiles p
            JOIN teams t ON p.team_id = t.team_id
            WHERE p.user_id = ? AND (t.owner_user_id IS NULL OR t.owner_user_id != ?)
            ORDER BY t.created_at DESC`,
      args: [userId, userId],
    });
    const joined = joinedRes.rows.map((row) => ({
      team_id: row.team_id,
      team_name: row.team_name,
      team_emoji: row.team_emoji,
      competition_type: row.competition_type,
      organizer_name: row.organizer_name,
      created_at: row.created_at,
      joined_at: row.joined_at,
      member_count: row.member_count,
    }));

    return NextResponse.json({ owned, joined });
  } catch (error: any) {
    console.error("List teams error:", error);
    return NextResponse.json(
      { error: "获取团队列表失败", details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "请先登录再创建团队" }, { status: 401 });
    }
    const body = await req.json();
    let { team_name, competition_type, organizer_name, team_emoji } = body;
    // 允许调用方传入 team_id（兼容前端 store 的查重流程），但优先服务端生成
    let team_id = typeof body.team_id === "string" ? body.team_id : "";
    competition_type = competition_type || "默认";
    organizer_name = organizer_name || "";
    team_emoji = team_emoji || "";
    const owner_user_id = userId; // 一定是登录用户
    const created_at = new Date().toISOString();

    const db = getDb();

    // 服务端查重 + 重试，最多 5 次
    if (team_id) {
      const existing = await db.execute({
        sql: `SELECT team_id FROM teams WHERE team_id = ?`,
        args: [team_id],
      });
      if (existing.rows.length > 0) {
        // 传入的 id 已存在，重新生成
        team_id = "";
      }
    }

    let attempts = 0;
    while (!team_id) {
      attempts++;
      if (attempts > 5) {
        return NextResponse.json(
          { error: "团队码生成失败，请重试" },
          { status: 500 }
        );
      }
      team_id = createTeamCode();
      const check = await db.execute({
        sql: `SELECT team_id FROM teams WHERE team_id = ?`,
        args: [team_id],
      });
      if (check.rows.length > 0) {
        team_id = "";
        continue;
      }
    }

    await db.execute({
      sql: `INSERT INTO teams (team_id, team_name, team_emoji, competition_type, organizer_name, owner_user_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [team_id, team_name, team_emoji, competition_type, organizer_name, owner_user_id, created_at],
    });

    return NextResponse.json({
      team_id,
      team_name,
      team_emoji,
      competition_type,
      organizer_name,
      owner_user_id,
      created_at,
    });
  } catch (error: any) {
    console.error("Create team error:", error);
    return NextResponse.json(
      { error: "创建团队失败", details: error?.message },
      { status: 500 }
    );
  }
}
