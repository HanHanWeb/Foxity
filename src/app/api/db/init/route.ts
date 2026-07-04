import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";

export async function POST() {
  try {
    await initDb();
    return NextResponse.json({ success: true, message: "Database initialized" });
  } catch (error: any) {
    console.error("DB init error:", error);
    return NextResponse.json(
      { error: "数据库初始化失败", details: error?.message },
      { status: 500 }
    );
  }
}
