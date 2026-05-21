import * as nodemailer from 'nodemailer'
import type { SentMessageInfo, Transporter } from 'nodemailer'

export interface SmtpConfig {
  host: string
  port: number
  user: string
  pass: string
  secure: boolean
  from: string
  bankName?: string
  accountNumber?: string
  accountName?: string
  bankDetails?: string
}

// In-memory cache for SMTP config (re-fetched every 5 minutes)
let cachedConfig: SmtpConfig | null = null
let configCachedAt = 0
const CONFIG_TTL = 5 * 60 * 1000

let transporter: Transporter | null = null
let transporterHash: string | null = null

export function invalidateMailerCache() {
  cachedConfig = null
  configCachedAt = 0
  transporter = null
  transporterHash = null
}

async function getConfig(): Promise<SmtpConfig | null> {
  if (cachedConfig && Date.now() - configCachedAt < CONFIG_TTL) {
    return cachedConfig
  }

  // Try Firestore first
  try {
    const { getAdminDb } = await import('./firebase/admin')
    const db = getAdminDb()
    if (db) {
      const snap = await db.collection('settings').doc('emailConfig').get()
      if (snap.exists) {
        const data = snap.data() as SmtpConfig
        if (data.host && data.user && data.pass) {
          cachedConfig = data
          configCachedAt = Date.now()
          return cachedConfig
        }
      }
    }
  } catch {
    // Firebase admin not available — fall through to env vars
  }

  // Fall back to environment variables
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, EMAIL_FROM } = process.env
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    cachedConfig = {
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      user: SMTP_USER,
      pass: SMTP_PASS,
      secure: SMTP_SECURE === 'true',
      from: EMAIL_FROM || 'ZeroUp Partners <onboarding@zeroup.dev>',
    }
    configCachedAt = Date.now()
    return cachedConfig
  }

  return null
}

function configHash(c: SmtpConfig) {
  return `${c.host}:${c.port}:${c.user}:${c.secure}`
}

function htmlToText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function getTransporter(): Promise<{ transport: Transporter; config: SmtpConfig } | null> {
  const config = await getConfig()

  if (!config) return null

  const hash = configHash(config)
  if (transporter && transporterHash === hash) {
    return { transport: transporter, config }
  }

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  })
  transporterHash = hash

  console.log(`[mailer] Transporter ready: ${config.host}:${config.port} as ${config.user}`)
  return { transport: transporter, config }
}

export async function sendMail(options: {
  from?: string
  to: string | string[]
  subject: string
  html: string
  text?: string
  cc?: string | string[]
  bcc?: string | string[]
  attachments?: Array<{ filename: string; content: string | Buffer; contentType?: string }>
}): Promise<SentMessageInfo> {
  const result = await getTransporter()

  if (!result) {
    // No SMTP configured — fall back to Ethereal test account
    const missing = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'].filter(k => !process.env[k])
    console.warn(`[mailer] No SMTP config found (missing env vars: ${missing.join(', ')}) — using Ethereal test account.`)
    const testAccount = await nodemailer.createTestAccount()
    const testTransport = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    })
    const info = await testTransport.sendMail({
      from: options.from || 'ZeroUp Partners <test@example.com>',
      ...options,
      text: options.text || htmlToText(options.html),
    })
    const previewUrl = nodemailer.getTestMessageUrl(info)
    if (previewUrl) console.log('[mailer] Ethereal preview URL:', previewUrl)
    return info
  }

  const { transport, config } = result

  let info: SentMessageInfo
  try {
    info = await transport.sendMail({
      from: options.from || config.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || htmlToText(options.html),
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments,
    })
  } catch (err: unknown) {
    transporter = null
    transporterHash = null
    const e = err as { code?: string; responseCode?: number; response?: string; message?: string }
    if (e.code === 'EAUTH' || e.responseCode === 535) {
      console.error('[mailer] SMTP authentication failed.')
      console.error(`  User:  ${config.user}`)
      console.error(`  Host:  ${config.host}:${config.port}`)
      console.error('  Fix:   For Gmail, use an App Password (not your account password).')
      console.error('         Go to Google Account → Security → 2-Step Verification → App passwords.')
      console.error(`  SMTP response: ${e.response}`)
    } else if (e.code === 'ECONNECTION' || e.code === 'ESOCKET') {
      console.error('[mailer] Could not connect to SMTP server.')
      console.error(`  Check that host (${config.host}) and port (${config.port}) are correct.`)
    } else {
      console.error('[mailer] Failed to send email:', e.message || err)
    }
    throw err
  }

  return info
}
