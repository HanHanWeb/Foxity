import { NextResponse } from "next/server";
import { getUserId } from "./session";

/**
 * 要求登录，返回 user_id 或 401 NextResponse
 * 用法：
 *   const userId = await requireUser();
 *   if (userId instanceof NextResponse) return userId;
 */
export async function requireUser(): Promise<string | NextResponse> {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  return userId;
}
