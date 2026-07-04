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
      sql: `SELECT user_id, user_name, team_id, timestamp, data
            FROM profiles WHERE user_id = ?`,
      args: [userId],
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
