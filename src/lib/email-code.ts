// 邮件验证码 - 数据库存储（适配 Vercel Serverless 多实例环境）

import { getDb } from "@/lib/db";

const CODE_TTL_MS = 10 * 60 * 1000; // 10 分钟有效
const VERIFIED_TTL_MS = 10 * 60 * 1000; // GEETEST 验证通过态保留 10 分钟

const CREATE_TABLE_SQL = `CREATE TABLE IF NOT EXISTS email_codes (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
)`;

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  const db = getDb();
  await db.execute(CREATE_TABLE_SQL);
  tableReady = true;
}

export function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** 为某邮箱生成验证码并存储到数据库，返回验证码 */
export async function createCode(email: string): Promise<string> {
  await ensureTable();
  const db = getDb();
  const code = generateCode();
  const now = Date.now();
  const expiresAt = new Date(now + CODE_TTL_MS).toISOString();

  await db.execute({
    sql: `INSERT INTO email_codes (email, code, expires_at, verified, created_at)
          VALUES (?, ?, ?, 0, ?)
          ON CONFLICT(email) DO UPDATE SET code = ?, expires_at = ?, verified = 0, created_at = ?`,
    args: [email, code, expiresAt, new Date(now).toISOString(), code, expiresAt, new Date(now).toISOString()],
  });

  return code;
}

/** 校验验证码：匹配且未过期则通过并清除记录 */
export async function verifyCode(email: string, code: string): Promise<boolean> {
  await ensureTable();
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT code, expires_at FROM email_codes WHERE email = ?`,
    args: [email],
  });

  if (result.rows.length === 0) return false;

  const row = result.rows[0] as { code: string; expires_at: string };
  if (Date.now() > new Date(row.expires_at).getTime()) {
    await db.execute({ sql: `DELETE FROM email_codes WHERE email = ?`, args: [email] });
    return false;
  }
  if (row.code !== code) return false;

  await db.execute({ sql: `DELETE FROM email_codes WHERE email = ?`, args: [email] });
  return true;
}

/** 记录 GEETEST 校验已通过，允许该邮箱在窗口期内请求发送验证码 */
export async function markGeetestVerified(email: string): Promise<void> {
  await ensureTable();
  const db = getDb();
  const now = Date.now();
  const expiresAt = new Date(now + VERIFIED_TTL_MS).toISOString();

  // 查是否已有记录
  const existing = await db.execute({
    sql: `SELECT code FROM email_codes WHERE email = ?`,
    args: [email],
  });
  const existingCode = existing.rows.length > 0 ? (existing.rows[0] as { code: string }).code : "";

  await db.execute({
    sql: `INSERT INTO email_codes (email, code, expires_at, verified, created_at)
          VALUES (?, ?, ?, 1, ?)
          ON CONFLICT(email) DO UPDATE SET verified = 1, expires_at = ?`,
    args: [email, existingCode, expiresAt, new Date(now).toISOString(), expiresAt],
  });
}

/** 检查该邮箱是否已通过 GEETEST 校验且在有效窗口内 */
export async function isGeetestVerified(email: string): Promise<boolean> {
  await ensureTable();
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT verified, expires_at FROM email_codes WHERE email = ?`,
    args: [email],
  });

  if (result.rows.length === 0) return false;

  const row = result.rows[0] as { verified: number; expires_at: string };
  if (row.verified !== 1) return false;
  if (Date.now() > new Date(row.expires_at).getTime()) {
    await db.execute({ sql: `DELETE FROM email_codes WHERE email = ?`, args: [email] });
    return false;
  }
  return true;
}

/** 消费 GEETEST 验证态（发送验证码后清除，防止重复发送） */
export async function consumeGeetestVerified(email: string): Promise<boolean> {
  const ok = await isGeetestVerified(email);
  if (!ok) return false;

  const db = getDb();
  await db.execute({
    sql: `UPDATE email_codes SET verified = 0 WHERE email = ?`,
    args: [email],
  });
  return true;
}
