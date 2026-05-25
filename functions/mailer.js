const nodemailer = require("nodemailer");

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const DEFAULT_FROM = process.env.EMAIL_FROM || "ZeroUp Partners <onboarding@zeroup.org>";

let transporter = null;
let usingEthereal = false;

function htmlToText(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function createTransporter() {
  if (transporter) {
    return transporter;
  }

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    usingEthereal = true;
    console.log('Using Ethereal SMTP test account for email delivery.');
    console.log(`Ethereal credentials: ${testAccount.user} / ${testAccount.pass}`);
  }

  return transporter;
}

async function sendEmail({ from, to, subject, html, text }) {
  const transport = await createTransporter();
  const message = {
    from: from || DEFAULT_FROM,
    to,
    subject,
    html,
    text: text || htmlToText(html),
  };

  const info = await transport.sendMail(message);

  if (usingEthereal) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('Ethereal preview URL:', previewUrl);
    }
  }

  return info;
}

module.exports = {
  sendEmail,
};
