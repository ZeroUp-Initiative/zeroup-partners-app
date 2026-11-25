import { NextRequest, NextResponse } from 'next/server'
import { sendMail } from '@/lib/mailer'
import { getAdminDb } from '@/lib/firebase/admin'
import { APP_URL } from '@/lib/app-url'
import { verifyAdmin } from '@/lib/auth/verify-admin'

const BASE_URL = APP_URL

const sharedStyles = `
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f5; }
  .wrapper { padding: 32px 16px; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .header { background: #1b2540; color: #f4f0e5; padding: 36px 32px; text-align: center; }
  .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
  .header p { margin: 8px 0 0; opacity: 0.85; font-size: 15px; }
  .body { padding: 32px; }
  .body p { margin: 0 0 16px; color: #444; }
  .highlight { background: #faf8f2; border-left: 4px solid #1b2540; border-radius: 4px; padding: 16px; margin: 20px 0; }
  .highlight strong { color: #1b2540; display: block; margin-bottom: 4px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
  .btn { display: inline-block; background: #1b2540; color: #f4f0e5 !important; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin-top: 8px; }
  .footer { text-align: center; padding: 24px 32px; color: #888; font-size: 13px; border-top: 1px solid #f0f0f0; }
`

type BroadcastData = { title?: string; projectId?: string; phaseName?: string; remaining?: number }

const templates: Record<string, (name: string, data: BroadcastData) => { subject: string; html: string }> = {
  new_project_announcement: (name, { title, projectId }) => ({
    subject: `🚀 New Project: "${title}"`,
    html: `
      <!DOCTYPE html><html><head><style>${sharedStyles}</style></head>
      <body><div class="wrapper"><div class="container">
        <div class="header">
          <h1>🚀 New Project Just Launched!</h1>
          <p>A new project is live and open for partnership.</p>
        </div>
        <div class="body">
          <p>Hi ${name},</p>
          <p>A new project just went live on ZeroUp Partners — take a look and see how you can get involved.</p>
          <div class="highlight">
            <strong>Project</strong>
            ${title}
          </div>
          <a href="${BASE_URL}/projects/${projectId}" class="btn">View Project</a>
        </div>
        <div class="footer"><p>ZeroUp Partners · Building Dreams Together</p></div>
      </div></div></body></html>
    `,
  }),

  project_phase_unlocked: (name, { title, projectId, phaseName }) => ({
    subject: `🔓 New Phase Unlocked: "${title}"`,
    html: `
      <!DOCTYPE html><html><head><style>${sharedStyles}</style></head>
      <body><div class="wrapper"><div class="container">
        <div class="header">
          <h1>🔓 A New Phase Has Been Unlocked!</h1>
          <p>Funding has crossed into the next phase of this project.</p>
        </div>
        <div class="body">
          <p>Hi ${name},</p>
          <p>Thanks to everyone's partnership, this project has reached its next milestone.</p>
          <div class="highlight">
            <strong>Project</strong>
            ${title}
          </div>
          <div class="highlight">
            <strong>Phase Unlocked</strong>
            ${phaseName}
          </div>
          <a href="${BASE_URL}/projects/${projectId}" class="btn">See the Progress</a>
        </div>
        <div class="footer"><p>ZeroUp Partners · Building Dreams Together</p></div>
      </div></div></body></html>
    `,
  }),

  almost_funded: (name, { title, projectId, remaining }) => ({
    subject: `🔥 Almost There: "${title}"`,
    html: `
      <!DOCTYPE html><html><head><style>${sharedStyles}</style></head>
      <body><div class="wrapper"><div class="container">
        <div class="header">
          <h1>🔥 Almost Fully Funded!</h1>
          <p>A project you've supported is nearly at its goal.</p>
        </div>
        <div class="body">
          <p>Hi ${name},</p>
          <p>Thanks to your earlier support, this project is nearly there — just a little more to close it out completely.</p>
          <div class="highlight">
            <strong>Project</strong>
            ${title}
          </div>
          <div class="highlight">
            <strong>Remaining to Close</strong>
            ₦${Number(remaining || 0).toLocaleString()}
          </div>
          <a href="${BASE_URL}/projects/${projectId}" class="btn">Help Close It Out</a>
        </div>
        <div class="footer"><p>ZeroUp Partners · Building Dreams Together</p></div>
      </div></div></body></html>
    `,
  }),
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Admins only.' }, { status: 401 })
  try {
    const { type, data } = (await req.json()) as { type: string; data: BroadcastData }

    if (!type || !templates[type]) {
      return NextResponse.json({ error: 'Invalid request: unrecognised template type' }, { status: 400 })
    }

    const adminDb = getAdminDb()
    if (!adminDb) {
      return NextResponse.json({ error: 'Server-side Firestore access is not configured' }, { status: 503 })
    }

    const recipients: { uid?: string; email: string; name: string }[] = []

    if (type === 'almost_funded' && data?.projectId) {
      // Targeted, not a broadcast: only partners who've actually funded this
      // project before — a blanket "almost there" email to everyone would be
      // noise for partners who've never even seen this project.
      const paymentsSnap = await adminDb.collection('payments')
        .where('projectId', '==', data.projectId)
        .where('status', '==', 'approved')
        .get()
      const uids = new Set<string>()
      paymentsSnap.forEach((doc) => {
        const uid = (doc.data() as any)?.userId
        if (uid) uids.add(uid)
      })
      for (const uid of uids) {
        const userSnap = await adminDb.collection('users').doc(uid).get()
        if (!userSnap.exists) continue
        const u = userSnap.data() as any
        if (u?.email) recipients.push({ uid, email: u.email, name: u.firstName || 'Partner' })
      }
    } else {
      const snap = await adminDb.collection('users').get()
      snap.forEach((doc) => {
        const u = doc.data() || {}
        const email = (u as any).email
        if (email) recipients.push({ email, name: (u as any).firstName || 'Partner' })
      })
    }

    let sent = 0
    let failed = 0
    for (const { uid, email, name } of recipients) {
      try {
        const { subject, html } = templates[type](name, data ?? {})
        await sendMail({ to: email, subject, html })
        sent++
        if (type === 'almost_funded' && uid) {
          // In-app notification too — the email alone would be missed by
          // anyone who doesn't check that inbox regularly.
          await adminDb.collection('notifications').add({
            userId: uid,
            type: 'almost_funded',
            title: 'Almost There! 🔥',
            message: `"${data.title}" is nearly fully funded — just ₦${Number(data.remaining || 0).toLocaleString()} left to close it.`,
            read: false,
            createdAt: new Date(),
            link: `/projects/${data.projectId}`,
          }).catch(() => {})
        }
      } catch (err) {
        console.error(`[notify-project] Failed to send to ${email}:`, err)
        failed++
      }
    }

    return NextResponse.json({ sent, failed })
  } catch (error) {
    console.error('[notify-project] Unexpected error:', error)
    return NextResponse.json({ error: 'Failed to send project notification' }, { status: 500 })
  }
}
