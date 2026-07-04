import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;

    const db = getDb();

    const teamResult = await db.execute({
      sql: `SELECT team_id, team_name, competition_type, organizer_name, created_at
            FROM teams WHERE team_id = ?`,
      args: [teamId],
    });

    if (teamResult.rows.length === 0) {
      return NextResponse.json({ error: "团队不存在" }, { status: 404 });
    }

    const teamRow = teamResult.rows[0];
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
