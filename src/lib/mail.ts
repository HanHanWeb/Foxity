import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT) || 465;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || user;

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!_transporter) {
    if (!host || !user || !pass) {
      throw new Error("SMTP 环境变量未配置，请检查 SMTP_HOST/SMTP_USER/SMTP_PASS");
    }
    _transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return _transporter;
}

export interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendMail({ to, subject, text, html }: SendMailOptions) {
  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
  return info;
}
