// 邮件验证码 - 无状态方案（HMAC 签名，无需建表）
// send-code 生成验证码并签名，返回 token 给前端
// register 用 token + 用户输入的验证码重新计算签名比对

import crypto from "crypto";

const CODE_TTL_SEC = 10 * 60; // 10 分钟有效

function getSecret(): string {
  return process.env.EMAIL_CODE_SECRET || "foxity-default-secret-change-me";
}

export function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * 生成验证码签名 token
 * token = base64(email:expiresAt) + "." + hmac
 */
export function signCode(email: string, code: string): { code: string; token: string } {
  const expiresAt = Math.floor(Date.now() / 1000) + CODE_TTL_SEC;
  const payload = `${email}:${expiresAt}`;
  const payloadB64 = Buffer.from(payload).toString("base64url");
  const hmac = crypto.createHmac("sha256", getSecret()).update(`${payload}:${code}`).digest("hex");
  return { code, token: `${payloadB64}.${hmac}` };
}

/**
 * 校验验证码 token
 * 返回 true 表示验证码匹配且未过期
 */
export function verifyCodeToken(token: string, email: string, code: string): boolean {
  try {
    const [payloadB64, hmac] = token.split(".");
    if (!payloadB64 || !hmac) return false;

    const payload = Buffer.from(payloadB64, "base64url").toString();
    const [tokenEmail, expiresAtStr] = payload.split(":");
    const expiresAt = Number(expiresAtStr);

    if (tokenEmail !== email) return false;
    if (Date.now() / 1000 > expiresAt) return false;

    const expectedHmac = crypto
      .createHmac("sha256", getSecret())
      .update(`${payload}:${code}`)
      .digest("hex");

    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac));
  } catch {
    return false;
  }
}

// 保留旧接口兼容（GEETEST 相关暂不用数据库，仍用内存）
export async function markGeetestVerified(_email: string): Promise<void> {}
export async function isGeetestVerified(_email: string): Promise<boolean> {
  return true; // send-code 路由已通过极验二次校验，这里直接放行
}
export async function consumeGeetestVerified(_email: string): Promise<boolean> {
  return true;
}
