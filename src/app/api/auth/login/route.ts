import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createSession } from "@/lib/session";
import bcrypt from "bcryptjs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (
      !email ||
      !password ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return NextResponse.json(
        { error: "邮箱和密码不能为空" },
        { status: 400 }
      );
    }

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "邮箱格式不正确" },
        { status: 400 }
      );
    }

    const db = getDb();

    const result = await db.execute({
      sql: `SELECT user_id, username, password_hash, email
            FROM users WHERE email = ?`,
      args: [email.trim().toLowerCase()],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    const row = result.rows[0];
    const valid = await bcrypt.compare(password, row.password_hash as string);

    if (!valid) {
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    await createSession(row.user_id as string);

    return NextResponse.json({
      user_id: row.user_id,
      name: row.username,
      email: row.email,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "登录失败", details: error?.message },
      { status: 500 }
    );
  }
}
