import { NextResponse } from "next/server";
import { getDb, getUserEvidences } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("team_id");

    if (!teamId) {
      return NextResponse.json({ error: "缺少 team_id 参数" }, { status: 400 });
    }

    const db = getDb();
    const result = await db.execute({
      sql: `SELECT user_id, user_name, team_id, timestamp, data,
                   verified_scores, self_scores, evidence_levels, twelve_type, credibility
            FROM profiles WHERE user_id = ? AND team_id = ?`,
      args: [userId, teamId],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "用户画像不存在" }, { status: 404 });
    }

    const row = result.rows[0];

    // 解析旧版 data 字段
    let parsedData: any = null;
    try {
      parsedData = row.data ? JSON.parse(row.data as string) : null;
    } catch (e) {
      console.error("Failed to parse profile data for user", userId, e);
    }

    // 解析 V3 字段
    const parseJSON = (val: unknown) => {
      if (!val) return null;
      try { return JSON.parse(val as string); } catch { return null; }
    };

    const v3 = {
      verified_scores: parseJSON(row.verified_scores),
      self_scores: parseJSON(row.self_scores),
      evidence_levels: parseJSON(row.evidence_levels),
      twelve_type: parseJSON(row.twelve_type),
      credibility: parseJSON(row.credibility),
    };

    // 拉取证据列表
    const evidences = await getUserEvidences(db, userId, teamId);

    return NextResponse.json({
      user_id: row.user_id,
      user_name: row.user_name,
      team_id: row.team_id,
      timestamp: row.timestamp,
      data: parsedData,       // 旧版数据（兼容）
      v3,                     // V3 评分数据
      evidences,              // 证据列表
    });
  } catch (error: any) {
    console.error("Fetch profile error:", error);
    return NextResponse.json(
      { error: "获取画像失败", details: error?.message },
      { status: 500 }
    );
  }
}
