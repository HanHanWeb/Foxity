import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { team_id, team_name, competition_type, organizer_name } = await req.json();

    const created_at = new Date().toISOString();

    const db = getDb();
    await db.execute({
      sql: `INSERT INTO teams (team_id, team_name, competition_type, organizer_name, created_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [team_id, team_name, competition_type, organizer_name, created_at],
    });

    return NextResponse.json({
      team_id,
      team_name,
      competition_type,
      organizer_name,
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
