import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { verifyCodeToken } from "@/lib/email-code";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const { name, email, code, password, token } = await req.json();

    if (
      !name ||
      !email ||
      !code ||
      !password ||
      !token ||
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof code !== "string" ||
      typeof password !== "string" ||
      typeof token !== "string"
    ) {
      return NextResponse.json(
        { error: "姓名、邮箱、验证码和密码不能为空" },
        { status: 400 }
      );
    }

    if (name.trim().length < 1) {
      return NextResponse.json(
        { error: "请输入姓名" },
        { status: 400 }
      );
    }

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "邮箱格式不正确" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码至少需要 6 个字符" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 校验验证码 token（无状态 HMAC 签名）
    if (!verifyCodeToken(token, normalizedEmail, code.trim())) {
      console.error("verifyCodeToken failed:", { token, email: normalizedEmail, code: code.trim() });
      return NextResponse.json(
        { error: "验证码错误或已过期，请重新获取验证码" },
        { status: 400 }
      );
    }

    const db = getDb();

    // 校验邮箱唯一（邮箱作为唯一识别符）
    const existingEmail = await db.execute({
      sql: `SELECT user_id FROM users WHERE email = ?`,
      args: [normalizedEmail],
    });
    if (existingEmail.rows.length > 0) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 409 }
      );
    }

    const user_id = crypto.randomUUID();
    const password_hash = await bcrypt.hash(password, 10);
    const created_at = new Date().toISOString();
    const trimmedName = name.trim();

    // 先检查表有哪些列，动态拼接 INSERT
    const colsRes = await db.execute({ sql: `PRAGMA table_info(users)` });
    const colNames = (colsRes.rows as unknown as { name: string }[]).map((r) => r.name);
    const insertCols: string[] = ["user_id", "password_hash", "email", "created_at"];
    const insertArgs: (string | undefined)[] = [user_id, password_hash, normalizedEmail, created_at];
    if (colNames.includes("username")) {
      insertCols.push("username");
      insertArgs.push(trimmedName);
    }
    if (colNames.includes("display_name")) {
      insertCols.push("display_name");
      insertArgs.push(trimmedName);
    }

    const placeholders = insertCols.map(() => "?").join(", ");
    await db.execute({
      sql: `INSERT INTO users (${insertCols.join(", ")}) VALUES (${placeholders})`,
      args: insertArgs as string[],
    });

    await createSession(user_id);

    return NextResponse.json({
      user_id,
      name: name.trim(),
      email: normalizedEmail,
    });
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "注册失败", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
