import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth-server";

export async function POST(req: Request) {
  try {
    const userId = await requireUser();
    if (userId instanceof NextResponse) return userId;

    const { user_id, user_name, team_id, data } = await req.json();

    // 鉴权：只能保存自己的画像
    if (user_id !== userId) {
      return NextResponse.json({ error: "无权保存他人画像" }, { status: 403 });
    }

    if (!user_id || !user_name || !team_id || !data) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    const dataString = JSON.stringify(data);

    const db = getDb();
    // 复合主键 (user_id, team_id)：同一用户在不同团队可有不同画像
    await db.execute({
      sql: `INSERT OR REPLACE INTO profiles (user_id, user_name, team_id, timestamp, data)
            VALUES (?, ?, ?, ?, ?)`,
      args: [user_id, user_name, team_id, timestamp, dataString],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Upsert profile error:", error);
    return NextResponse.json(
      { error: "保存画像失败", details: error?.message },
      { status: 500 }
    );
  }
}
