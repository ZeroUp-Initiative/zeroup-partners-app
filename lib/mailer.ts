import * as nodemailer from 'nodemailer';
import type { SentMessageInfo, Transporter } from 'nodemailer';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  EMAIL_FROM,
} = process.env;

const DEFAULT_FROM = EMAIL_FROM || 'ZeroUp Partners <onboarding@zeroup.dev>';

let transporter: Transporter | null = null;
let etherealAccount: { user: string; pass: string; smtp: { host: string; port: number; secure: boolean } } | null = null;

function htmlToText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function createTransporter(): Promise<Transporter> {
  if (transporter) {
    return transporter;
  }

  const hasSmtpCredentials = SMTP_HOST && SMTP_USER && SMTP_PASS;
  const port = Number(SMTP_PORT || 587);
  const secure = SMTP_SECURE === 'true';

  if (hasSmtpCredentials) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    etherealAccount = {
      user: testAccount.user,
      pass: testAccount.pass,
      smtp: testAccount.smtp,
    };

    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.log('Using Ethereal SMTP test account for email delivery.');
    console.log(`Ethereal credentials: ${testAccount.user} / ${testAccount.pass}`);
  }

  return transporter;
}

export async function sendMail(options: {
  from?: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}): Promise<SentMessageInfo> {
  const transport = await createTransporter();
  const sendOptions = {
    from: options.from || DEFAULT_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || htmlToText(options.html),
    cc: options.cc,
    bcc: options.bcc,
    attachments: options.attachments,
  };

  const info = await transport.sendMail(sendOptions);

  if (!SMTP_HOST) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('Preview URL:', previewUrl);
    }
  }

  return info;
}
