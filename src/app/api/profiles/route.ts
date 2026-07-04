import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { user_id, user_name, team_id, data } = await req.json();

    const timestamp = new Date().toISOString();
    const dataString = JSON.stringify(data);

    const db = getDb();
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
