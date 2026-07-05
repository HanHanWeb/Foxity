import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth-server";

// GET /api/profiles/[userId]?team_id=xxx
// 获取指定用户在指定团队的画像
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
      sql: `SELECT user_id, user_name, team_id, timestamp, data
            FROM profiles WHERE user_id = ? AND team_id = ?`,
      args: [userId, teamId],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "用户画像不存在" }, { status: 404 });
    }

    const row = result.rows[0];
    let parsedData: any = null;
    try {
      parsedData = row.data ? JSON.parse(row.data as string) : null;
    } catch (e) {
      console.error("Failed to parse profile data for user", userId, e);
    }

    return NextResponse.json({
      user_id: row.user_id,
      user_name: row.user_name,
      team_id: row.team_id,
      timestamp: row.timestamp,
      data: parsedData,
    });
  } catch (error: any) {
    console.error("Fetch profile error:", error);
    return NextResponse.json(
      { error: "获取画像失败", details: error?.message },
      { status: 500 }
    );
  }
}

// PUT /api/profiles/[userId]?team_id=xxx
// 更新指定用户在指定团队的画像
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const authUserId = await requireUser();
    if (authUserId instanceof NextResponse) return authUserId;

    const { userId } = await params;
    const url = new URL(req.url);
    const teamId = url.searchParams.get("team_id");

    if (!teamId) {
      return NextResponse.json({ error: "缺少 team_id 参数" }, { status: 400 });
    }

    // 鉴权：只能更新自己的画像
    if (userId !== authUserId) {
      return NextResponse.json({ error: "无权修改他人画像" }, { status: 403 });
    }

    const { user_name, data } = await req.json();
    const timestamp = new Date().toISOString();
    const dataString = JSON.stringify(data);

    const db = getDb();
    await db.execute({
      sql: `INSERT OR REPLACE INTO profiles (user_id, user_name, team_id, timestamp, data)
            VALUES (?, ?, ?, ?, ?)`,
      args: [userId, user_name, teamId, timestamp, dataString],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "更新画像失败", details: error?.message },
      { status: 500 }
    );
  }
}
