import { cookies } from "next/headers";
import { getDb } from "@/lib/db";

const COOKIE_NAME = "fox_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 天

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// 创建 session 并写入 httpOnly cookie
export async function createSession(userId: string): Promise<string> {
  const db = getDb();
  const token = generateToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + MAX_AGE_SECONDS * 1000);

  await db.execute({
    sql: `INSERT INTO sessions (token, user_id, expires_at, created_at)
          VALUES (?, ?, ?, ?)`,
    args: [token, userId, expiresAt.toISOString(), now.toISOString()],
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });

  return token;
}

// 从 cookie 读取 token，校验有效性，返回 user_id
export async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const db = getDb();
  const res = await db.execute({
    sql: `SELECT user_id, expires_at FROM sessions WHERE token = ?`,
    args: [token],
  });

  if (res.rows.length === 0) return null;

  const row = res.rows[0];
  const expiresAt = new Date(row.expires_at as string);
  if (expiresAt.getTime() < Date.now()) {
    // 过期，清理
    await db.execute({ sql: `DELETE FROM sessions WHERE token = ?`, args: [token] });
    return null;
  }

  return row.user_id as string;
}

// 清除当前 session（登出）
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    const db = getDb();
    await db.execute({ sql: `DELETE FROM sessions WHERE token = ?`, args: [token] });
  }
  cookieStore.delete(COOKIE_NAME);
}
