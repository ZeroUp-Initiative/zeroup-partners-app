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
    console.log(`[mailer] Connecting to SMTP: ${SMTP_HOST}:${port} (secure=${secure}) as ${SMTP_USER}`);
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
    const missing = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'].filter(k => !process.env[k]);
    console.warn(`[mailer] Missing env vars: ${missing.join(', ')} — falling back to Ethereal test account`);
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

  let info: SentMessageInfo;
  try {
    info = await transport.sendMail(sendOptions);
  } catch (err: unknown) {
    const e = err as { code?: string; responseCode?: number; response?: string; message?: string };
    transporter = null; // reset so next request retries with fresh config
    if (e.code === 'EAUTH' || e.responseCode === 535) {
      console.error('[mailer] SMTP authentication failed.');
      console.error(`  User:  ${SMTP_USER}`);
      console.error(`  Host:  ${SMTP_HOST}:${SMTP_PORT}`);
      console.error('  Fix:   For Gmail, use an App Password (not your account password).');
      console.error('         Go to Google Account → Security → 2-Step Verification → App passwords.');
      console.error(`  SMTP response: ${e.response}`);
    } else if (e.code === 'ECONNECTION' || e.code === 'ESOCKET') {
      console.error('[mailer] Could not connect to SMTP server.');
      console.error(`  Check that SMTP_HOST (${SMTP_HOST}) and SMTP_PORT (${SMTP_PORT}) are correct.`);
      console.error(`  Error: ${e.message}`);
    } else {
      console.error('[mailer] Failed to send email:', e.message || err);
    }
    throw err;
  }

  if (!SMTP_HOST) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('[mailer] Ethereal preview URL:', previewUrl);
    }
  }

  return info;
}
