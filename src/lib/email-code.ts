// 邮件验证码内存存储（单进程有效，适用于开发/小流量场景）
// 生产环境建议改用 Redis 等共享存储

interface CodeRecord {
  code: string;
  expiresAt: number;
  verified: boolean; // GEETEST 校验通过后置为 true，发送验证码时使用
}

const store = new Map<string, CodeRecord>();

const CODE_TTL_MS = 10 * 60 * 1000; // 10 分钟有效
const VERIFIED_TTL_MS = 10 * 60 * 1000; // GEETEST 验证通过态保留 10 分钟

function cleanup() {
  const now = Date.now();
  for (const [key, rec] of store) {
    if (now > rec.expiresAt) store.delete(key);
  }
}

export function generateCode(): string {
  // 6 位数字验证码
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** 为某邮箱生成验证码并存储，返回验证码 */
export function createCode(email: string): string {
  cleanup();
  const code = generateCode();
  store.set(email, {
    code,
    expiresAt: Date.now() + CODE_TTL_MS,
    verified: false,
  });
  return code;
}

/** 校验验证码：匹配且未过期则通过并清除记录 */
export function verifyCode(email: string, code: string): boolean {
  cleanup();
  const rec = store.get(email);
  if (!rec) return false;
  if (Date.now() > rec.expiresAt) {
    store.delete(email);
    return false;
  }
  if (rec.code !== code) return false;
  store.delete(email);
  return true;
}

/** 记录 GEETEST 校验已通过，允许该邮箱在窗口期内请求发送验证码 */
export function markGeetestVerified(email: string): void {
  cleanup();
  const existing = store.get(email);
  store.set(email, {
    code: existing?.code || "",
    expiresAt: Date.now() + VERIFIED_TTL_MS,
    verified: true,
  });
}

/** 检查该邮箱是否已通过 GEETEST 校验且在有效窗口内 */
export function isGeetestVerified(email: string): boolean {
  cleanup();
  const rec = store.get(email);
  if (!rec || !rec.verified) return false;
  if (Date.now() > rec.expiresAt) {
    store.delete(email);
    return false;
  }
  return true;
}

/** 消费 GEETEST 验证态（发送验证码后清除，防止重复发送） */
export function consumeGeetestVerified(email: string): boolean {
  const ok = isGeetestVerified(email);
  if (!ok) return false;
  // 保留验证码记录但清除 verified 标记，避免重复发送
  const rec = store.get(email);
  if (rec) rec.verified = false;
  return true;
}
