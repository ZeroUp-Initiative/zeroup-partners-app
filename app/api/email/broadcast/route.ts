import { NextRequest, NextResponse } from 'next/server'
import { sendMail } from '@/lib/mailer'

const BASE_URL = 'https://zeroup-partners-app.vercel.app'

const styles = `
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f5; }
  .wrapper { padding: 32px 16px; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #8d44d1, #7030b0); color: white; padding: 36px 32px; text-align: center; }
  .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
  .body { padding: 32px; }
  .body p { margin: 0 0 16px; color: #444; }
  .btn { display: inline-block; background: linear-gradient(135deg, #8d44d1, #7030b0); color: #ffffff !important; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin-top: 8px; }
  .footer { text-align: center; padding: 24px 32px; color: #888; font-size: 13px; border-top: 1px solid #f0f0f0; }
`

function buildHtml(name: string, subject: string, body: string) {
  return `
    <!DOCTYPE html><html><head><style>${styles}</style></head>
    <body><div class="wrapper"><div class="container">
      <div class="header"><h1>ZeroUp Partners</h1></div>
      <div class="body">
        <p>Hi ${name},</p>
        ${body.split('\n').map(line => `<p>${line}</p>`).join('')}
        <a href="${BASE_URL}/dashboard" class="btn">Go to Dashboard</a>
      </div>
      <div class="footer"><p>ZeroUp Partners · Building Dreams Together</p></div>
    </div></div></body></html>
  `
}

function htmlToText(html: string) {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

export async function POST(req: NextRequest) {
  try {
    const { recipients, subject, body } = await req.json() as {
      recipients: { email: string; name: string }[]
      subject: string
      body: string
    }

    if (!recipients?.length || !subject?.trim() || !body?.trim()) {
      return NextResponse.json(
        { error: 'Missing recipients, subject, or body' },
        { status: 400 }
      )
    }

    let sent = 0
    let failed = 0
    const failedEmails: string[] = []

    for (const { email, name } of recipients) {
      try {
        const html = buildHtml(name || 'Partner', subject, body)
        await sendMail({ to: email, subject, html, text: htmlToText(html) })
        sent++
      } catch {
        failed++
        failedEmails.push(email)
      }
    }

    console.log(`[broadcast] Done — sent: ${sent}, failed: ${failed}`)
    if (failedEmails.length) {
      console.warn('[broadcast] Failed recipients:', failedEmails.join(', '))
    }

    return NextResponse.json({ sent, failed, failedEmails })
  } catch (error) {
    console.error('[broadcast] Unexpected error:', error)
    return NextResponse.json({ error: 'Broadcast failed' }, { status: 500 })
  }
}
