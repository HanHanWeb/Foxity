import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUserId } from "@/lib/session";
import { analyzeTeam, isAssessmentCompleted, getMemberStatus } from "@/lib/team-analysis";
import type { UserProfile } from "@/types";

// GET /api/teams/[teamId]/analysis — 分布分析数据（队长/队员返回不同字段）
export async function GET(
  req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const db = getDb();

    // 权限校验：必须是队长或团队成员
    const teamRes = await db.execute({
      sql: `SELECT owner_user_id FROM teams WHERE team_id = ?`,
      args: [teamId],
    });
    if (teamRes.rows.length === 0) {
      return NextResponse.json({ error: "团队不存在" }, { status: 404 });
    }
    const ownerId = teamRes.rows[0].owner_user_id as string | null;
    const isLeader = ownerId === userId || ownerId === null;

    // 非队长需要检查是否为团队成员
    if (!isLeader) {
      const memberRes = await db.execute({
        sql: `SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?`,
        args: [teamId, userId],
      });
      if (memberRes.rows.length === 0) {
        return NextResponse.json({ error: "无权访问" }, { status: 403 });
      }
    }

    // 查所有成员的画像
    const profilesResult = await db.execute({
      sql: `SELECT user_id, user_name, data FROM profiles WHERE team_id = ?`,
      args: [teamId],
    });

    const members: UserProfile[] = profilesResult.rows.map((row) => {
      let parsedData: any = {};
      try {
        parsedData = row.data ? JSON.parse(row.data as string) : {};
      } catch {}
      return {
        user_id: row.user_id as string,
        user_name: row.user_name as string,
        team_id: teamId,
        timestamp: "",
        ...parsedData,
      };
    });

    const analysis = analyzeTeam(members);

    // 队员看不到团队短板（正向导向）
    if (!isLeader) {
      analysis.weakestDimensions = [];
    }

    // 成员状态列表
    const memberStatuses = members.map((m) => ({
      user_id: m.user_id,
      user_name: m.user_name,
      status: getMemberStatus(m),
      completed: isAssessmentCompleted(m),
    }));

    return NextResponse.json({
      ...analysis,
      isLeader,
      memberStatuses,
    });
  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "获取分布分析失败", details: error?.message },
      { status: 500 }
    );
  }
}
