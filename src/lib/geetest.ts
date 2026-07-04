import crypto from "crypto";

const CAPTCHA_ID = process.env.GEETEST_CAPTCHA_ID || "163a936b1a0e329ff04d7e33eb74a019";
const CAPTCHA_KEY = process.env.GEETEST_CAPTCHA_KEY || "88a92cda147a52d399929bb56318e7e1";
const VALIDATE_URL = "https://gcaptcha4.geetest.com/validate";

export const GEETEST_CAPTCHA_ID = CAPTCHA_ID;

export interface GeetestResult {
  success: boolean;
  message: string;
}

/**
 * 极验行为验证第四代 - 二次校验
 * 文档：https://docs.geetest.com/gt4/deploy/server/
 */
export async function verifyGeetest(params: {
  lot_number: string;
  captcha_output: string;
  pass_token: string;
  gen_time: string;
}): Promise<GeetestResult> {
  const { lot_number, captcha_output, pass_token, gen_time } = params;

  if (!lot_number || !captcha_output || !pass_token || !gen_time) {
    return { success: false, message: "验证参数缺失" };
  }

  // 生成签名：HMAC-SHA256(key=captcha_key, message=lot_number)
  const sign_token = crypto
    .createHmac("sha256", CAPTCHA_KEY)
    .update(lot_number)
    .digest("hex");

  const body = new URLSearchParams({
    lot_number,
    captcha_output,
    pass_token,
    gen_time,
    sign_token,
    captcha_id: CAPTCHA_ID,
  });

  try {
    const res = await fetch(VALIDATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const data = await res.json();

    if (data.status === "error") {
      return { success: false, message: data.msg || "极验校验异常" };
    }
    if (data.result === "success") {
      return { success: true, message: "" };
    }
    return { success: false, message: data.reason || "验证失败" };
  } catch (err: any) {
    console.error("Geetest verify error:", err);
    return { success: false, message: "验证服务不可用" };
  }
}
