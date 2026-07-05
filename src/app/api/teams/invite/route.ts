import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";
import { getUserId } from "@/lib/session";
import { getDb } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await req.json();
    const { team_id, emails, inviterName } = body as {
      team_id: string;
      emails: string[];
      inviterName?: string;
    };

    if (!team_id || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    // 校验并清洗邮箱
    const validEmails = emails
      .map((e: string) => (e || "").trim().toLowerCase())
      .filter((e: string) => EMAIL_RE.test(e));

    if (validEmails.length === 0) {
      return NextResponse.json({ error: "请输入有效的邮箱地址" }, { status: 400 });
    }

    if (validEmails.length > 50) {
      return NextResponse.json({ error: "单次最多邀请 50 人" }, { status: 400 });
    }

    // 获取团队信息
    const db = getDb();
    const teamRes = await db.execute({
      sql: `SELECT team_name FROM teams WHERE team_id = ?`,
      args: [team_id],
    });

    if (teamRes.rows.length === 0) {
      return NextResponse.json({ error: "团队不存在" }, { status: 404 });
    }

    const teamName = (teamRes.rows[0] as unknown as { team_name: string }).team_name;
    const inviter = inviterName || "你的队友";
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://foxity.900004.xyz/"}/team/${team_id}/join`;

    const subject = `${inviter} 邀请你加入「${teamName}」团队 · Foxity`;
    const html = `
      <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <h2 style="color:#425a7a;">Foxity 团队邀请</h2>
        <p>你好！</p>
        <p><strong style="color:#f2aa72;">${inviter}</strong> 邀请你加入团队「<strong>${teamName}</strong>」，一起完成能力测评。</p>
        <p>点击下方链接即可加入团队并开始你的测评：</p>
        <p style="text-align:center;padding:20px 0;">
          <a href="${inviteLink}" style="display:inline-block;padding:12px 32px;background:#f2aa72;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">加入团队</a>
        </p>
        <p style="color:#9ca7b7;font-size:13px;">或复制此链接到浏览器：${inviteLink}</p>
        <p style="color:#9ca7b7;font-size:13px;">如果这不是你认识的邀请，请忽略此邮件。</p>
      </div>
    `;

    const text = `${inviter} 邀请你加入「${teamName}」团队。点击链接加入：${inviteLink}`;

    // 发送邮件（逗号分隔批量发送）
    await sendMail({
      to: validEmails.join(","),
      subject,
      text,
      html,
    });

    return NextResponse.json({
      success: true,
      sent: validEmails.length,
    });
  } catch (error: any) {
    console.error("Invite error:", error);
    return NextResponse.json(
      { error: "发送邀请邮件失败", details: error?.message },
      { status: 500 }
    );
  }
}
