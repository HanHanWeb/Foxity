import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUserId } from "@/lib/session";

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

    const result = await db.execute({
      sql: `SELECT user_id, display_name, email
            FROM users WHERE user_id = ?`,
      args: [userId],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    const row = result.rows[0];
    return NextResponse.json({
      user_id: row.user_id,
      name: row.display_name,
      email: row.email,
    });
  } catch (error: any) {
    console.error("Fetch me error:", error);
    return NextResponse.json(
      { error: "获取用户信息失败", details: error?.message },
      { status: 500 }
    );
  }
}
