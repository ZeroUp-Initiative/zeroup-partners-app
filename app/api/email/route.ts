import { NextRequest, NextResponse } from 'next/server'
import { sendMail } from '@/lib/mailer'
import { getAdminDb } from '@/lib/firebase/admin'

const BASE_URL = 'https://zeroup-partners-app.vercel.app'

const sharedStyles = `
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f5; }
  .wrapper { padding: 32px 16px; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #8d44d1, #7030b0); color: white; padding: 36px 32px; text-align: center; }
  .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
  .header p { margin: 8px 0 0; opacity: 0.85; font-size: 15px; }
  .body { padding: 32px; }
  .body p { margin: 0 0 16px; color: #444; }
  .highlight { background: #f5ecff; border-left: 4px solid #8d44d1; border-radius: 4px; padding: 16px; margin: 20px 0; }
  .highlight strong { color: #7030b0; display: block; margin-bottom: 4px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
  .btn { display: inline-block; background: linear-gradient(135deg, #8d44d1, #7030b0); color: #ffffff !important; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin-top: 8px; }
  .footer { text-align: center; padding: 24px 32px; color: #888; font-size: 13px; border-top: 1px solid #f0f0f0; }
  .receipt { border: 1px solid #e5d6f5; border-radius: 10px; padding: 18px 22px; margin: 24px 0; background: #faf7ff; }
  .receipt-title { font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #8d44d1; font-weight: 700; margin-bottom: 12px; text-align: center; }
  .receipt table { width: 100%; border-collapse: collapse; }
  .receipt td { padding: 7px 0; font-size: 14px; color: #444; vertical-align: middle; border-bottom: 1px solid #efe6fb; }
  .receipt tr:last-child td { border-bottom: none; }
  .receipt td.label { color: #999; }
  .receipt td.value { text-align: right; font-weight: 600; color: #333; }
  .receipt .amount-row td { font-size: 19px; color: #7030b0; font-weight: 700; }
  .receipt .status { color: #16a34a; font-weight: 700; }
  .signoff { margin-top: 24px; color: #444; }
`

type EmailData = Record<string, string | undefined>

// Format a value as Naira without ever producing "NaN". Accepts numbers,
// numeric strings, comma-formatted strings ("1,000"), or "₦1,000" — anything
// non-numeric falls back to 0.
function formatNaira(value: unknown): string {
  const n =
    typeof value === 'number'
      ? value
      : parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''))
  return `₦${(Number.isFinite(n) ? n : 0).toLocaleString()}`
}

const templates: Record<string, (data: EmailData) => { subject: string; html: string }> = {
  custom: ({ name, subject: _subject, body }) => ({
    subject: _subject ?? 'A message from ZeroUp Partners',
    html: `
      <!DOCTYPE html><html><head><style>${sharedStyles}</style></head>
      <body><div class="wrapper"><div class="container">
        <div class="header"><h1>ZeroUp Partners</h1></div>
        <div class="body">
          <p>Hi ${name ?? 'Partner'},</p>
          ${(body ?? '').split('\n').map((line: string) => `<p>${line}</p>`).join('')}
          <a href="${BASE_URL}/dashboard" class="btn">Go to Dashboard</a>
        </div>
        <div class="footer"><p>ZeroUp Partners · Building Dreams Together</p></div>
      </div></div></body></html>
    `,
  }),

  project_submitted: ({ name, title }) => ({
    subject: `📋 Project Received: "${title}"`,
    html: `
      <!DOCTYPE html><html><head><style>${sharedStyles}</style></head>
      <body><div class="wrapper"><div class="container">
        <div class="header">
          <h1>📋 Submission Received!</h1>
          <p>Thank you for submitting your project.</p>
        </div>
        <div class="body">
          <p>Hi ${name},</p>
          <p>We've received your project submission and it's now pending review by our team.</p>
          <div class="highlight">
            <strong>Project</strong>
            ${title}
          </div>
          <p>Our team will review your submission within <strong>3–5 business days</strong>. You'll receive an email as soon as a decision is made.</p>
          <p>In the meantime, feel free to explore the platform and contribute to existing projects.</p>
          <a href="${BASE_URL}/projects" class="btn">View Live Projects</a>
        </div>
        <div class="footer"><p>ZeroUp Partners · Building Dreams Together</p></div>
      </div></div></body></html>
    `,
  }),

  project_approved: ({ name, title, notes }) => ({
    subject: `🎉 Your Project Has Been Approved — "${title}"`,
    html: `
      <!DOCTYPE html><html><head><style>${sharedStyles}</style></head>
      <body><div class="wrapper"><div class="container">
        <div class="header">
          <h1>🎉 Project Approved!</h1>
          <p>Your project is now live on the platform.</p>
        </div>
        <div class="body">
          <p>Hi ${name},</p>
          <p>Congratulations! Your project has been reviewed and <strong>approved</strong>. It's now publicly visible and open for contributions.</p>
          <div class="highlight">
            <strong>Project</strong>
            ${title}
          </div>
          ${notes ? `<div class="highlight"><strong>Note from our team</strong>${notes}</div>` : ''}
          <p>Partners can now discover and contribute to your project. Share the link to spread the word!</p>
          <a href="${BASE_URL}/projects" class="btn">View Your Project</a>
        </div>
        <div class="footer"><p>ZeroUp Partners · Building Dreams Together</p></div>
      </div></div></body></html>
    `,
  }),

  contribution_submitted: ({ name, amount, description, date }) => ({
    subject: `📬 Contribution Received — ${formatNaira(amount)}`,
    html: `
      <!DOCTYPE html><html><head><style>${sharedStyles}</style></head>
      <body><div class="wrapper"><div class="container">
        <div class="header">
          <h1>📬 Contribution Received!</h1>
          <p>We've received your contribution and it's under review.</p>
        </div>
        <div class="body">
          <p>Hi ${name},</p>
          <p>Thank you! Your contribution has been logged and is now pending verification by our team. You'll receive another email once it's approved.</p>
          <div class="highlight">
            <strong>Amount</strong>
            ${formatNaira(amount)}
          </div>
          ${description ? `<div class="highlight"><strong>Description</strong>${description}</div>` : ''}
          ${date ? `<div class="highlight"><strong>Date</strong>${date}</div>` : ''}
          <p>If you have any questions about your contribution, please don't hesitate to reach out.</p>
          <a href="${BASE_URL}/contributions" class="btn">View My Contributions</a>
        </div>
        <div class="footer"><p>ZeroUp Partners · Building Dreams Together</p></div>
      </div></div></body></html>
    `,
  }),

  welcome: ({ name }) => ({
    subject: '🎉 Welcome to ZeroUp Partners!',
    html: `
      <!DOCTYPE html><html><head><style>${sharedStyles}</style></head>
      <body><div class="wrapper"><div class="container">
        <div class="header">
          <h1>Welcome to ZeroUp Partners! 🌟</h1>
          <p>We're thrilled to have you on board.</p>
        </div>
        <div class="body">
          <p>Hi ${name},</p>
          <p>Thank you for joining the ZeroUp Initiative! You're now part of a community of change-makers making a real difference.</p>
          <div class="highlight"><strong>What you can do</strong>Log contributions, track your impact, earn Dreamers Coins, and unlock achievements.</div>
          <p>Ready to make your first contribution?</p>
          <a href="${BASE_URL}/dashboard" class="btn">Go to Dashboard</a>
        </div>
        <div class="footer"><p>ZeroUp Partners · Building Dreams Together</p></div>
      </div></div></body></html>
    `,
  }),

  contribution_approved: ({ name, amount, projectTitle, date, receiptNo }) => ({
    subject: `✅ Your ${formatNaira(amount)} contribution to education is confirmed`,
    html: `
      <!DOCTYPE html><html><head><style>${sharedStyles}</style></head>
      <body><div class="wrapper"><div class="container">
        <div class="header">
          <h1>Thank you for investing in education</h1>
          <p>Your contribution has been verified and confirmed.</p>
        </div>
        <div class="body">
          <p>Hi ${name},</p>
          <p>Your contribution has been verified and <strong>confirmed</strong>. On behalf of every learner whose future you're helping build — thank you.</p>
          <p>You haven't simply made a donation; you've made an <strong>investment in education</strong> — and in the belief that opportunity should reach further than circumstance allows. That conviction is exactly what moves this mission forward, and we're honoured to have you as a partner in it.</p>
          <div class="receipt">
            <div class="receipt-title">Receipt</div>
            <table>
              ${receiptNo ? `<tr><td class="label">Receipt No.</td><td class="value">${receiptNo}</td></tr>` : ''}
              <tr class="amount-row"><td class="label">Amount</td><td class="value">${formatNaira(amount)}</td></tr>
              ${projectTitle ? `<tr><td class="label">Project</td><td class="value">${projectTitle}</td></tr>` : ''}
              ${date ? `<tr><td class="label">Date</td><td class="value">${date}</td></tr>` : ''}
              <tr><td class="label">Status</td><td class="value status">Confirmed &#10003;</td></tr>
            </table>
          </div>
          <p>Every naira you entrust to us is held and disbursed <strong>custodially through PACSDA</strong>, so your funds reach the cause exactly as intended — fully accounted for, every step of the way.</p>
          <p>You can track your impact, watch your partnership grow, and earn Dreamers rewards anytime from your dashboard.</p>
          <a href="${BASE_URL}/dashboard" class="btn">View My Dashboard</a>
          <p class="signoff">With gratitude,<br /><strong>The ZeroUp Partners Team</strong></p>
        </div>
        <div class="footer"><p>ZeroUp Partners · Investing in Education, Together</p></div>
      </div></div></body></html>
    `,
  }),

  admin_project_submitted: ({ submitterName, submitterEmail, title, category, location, fundingGoal }) => ({
    subject: `📋 New Project Submission: "${title}"`,
    html: `
      <!DOCTYPE html><html><head><style>${sharedStyles}</style></head>
      <body><div class="wrapper"><div class="container">
        <div class="header">
          <h1>📋 New Project Submitted</h1>
          <p>A partner has submitted a project for review.</p>
        </div>
        <div class="body">
          <p>A new project has been submitted and is awaiting your review.</p>
          <div class="highlight">
            <strong>Project Title</strong>
            ${title}
          </div>
          ${category ? `<div class="highlight"><strong>Category</strong>${category}</div>` : ''}
          ${location ? `<div class="highlight"><strong>Location</strong>${location}</div>` : ''}
          ${fundingGoal ? `<div class="highlight"><strong>Funding Goal</strong>₦${Number(fundingGoal).toLocaleString()}</div>` : ''}
          <div class="highlight">
            <strong>Submitted By</strong>
            ${submitterName || 'Unknown'} ${submitterEmail ? `(${submitterEmail})` : ''}
          </div>
          <a href="${BASE_URL}/admin/projects" class="btn">Review in Admin Panel</a>
        </div>
        <div class="footer"><p>ZeroUp Partners · Admin Notification</p></div>
      </div></div></body></html>
    `,
  }),

  admin_contribution_submitted: ({ partnerName, partnerEmail, amount, projectTitle, date }) => ({
    subject: `💰 New Contribution Logged — ${formatNaira(amount)}`,
    html: `
      <!DOCTYPE html><html><head><style>${sharedStyles}</style></head>
      <body><div class="wrapper"><div class="container">
        <div class="header">
          <h1>💰 New Contribution Logged</h1>
          <p>A partner has logged a new contribution for review.</p>
        </div>
        <div class="body">
          <p>A new contribution has been submitted and is pending your approval.</p>
          <div class="highlight">
            <strong>Amount</strong>
            ${formatNaira(amount)}
          </div>
          ${projectTitle ? `<div class="highlight"><strong>Project</strong>${projectTitle}</div>` : ''}
          ${date ? `<div class="highlight"><strong>Date</strong>${date}</div>` : ''}
          <div class="highlight">
            <strong>Partner</strong>
            ${partnerName || 'Unknown'} ${partnerEmail ? `(${partnerEmail})` : ''}
          </div>
          <a href="${BASE_URL}/admin/transactions" class="btn">Review in Admin Panel</a>
        </div>
        <div class="footer"><p>ZeroUp Partners · Admin Notification</p></div>
      </div></div></body></html>
    `,
  }),

  project_rejected: ({ name, title, notes }) => ({
    subject: `Update on Your Project Submission — "${title}"`,
    html: `
      <!DOCTYPE html><html><head><style>${sharedStyles}</style></head>
      <body><div class="wrapper"><div class="container">
        <div class="header" style="background: linear-gradient(135deg, #64748b, #475569);">
          <h1>Project Submission Update</h1>
          <p>We've reviewed your project submission.</p>
        </div>
        <div class="body">
          <p>Hi ${name},</p>
          <p>Thank you for submitting your project. After careful review, we were unable to approve it at this time.</p>
          <div class="highlight">
            <strong>Project</strong>
            ${title}
          </div>
          ${notes ? `<div class="highlight"><strong>Feedback from our team</strong>${notes}</div>` : `<p>If you'd like more information about this decision, please reach out to our team directly.</p>`}
          <p>You're welcome to address any concerns and resubmit your project in the future. We encourage you to keep making an impact!</p>
          <a href="${BASE_URL}/dashboard" class="btn">Go to Dashboard</a>
        </div>
        <div class="footer"><p>ZeroUp Partners · Building Dreams Together</p></div>
      </div></div></body></html>
    `,
  }),

  contribution_rejected: ({ name, amount, projectTitle, rejectionReason }) => ({
    subject: `Update on Your Contribution — ${formatNaira(amount)}`,
    html: `
      <!DOCTYPE html><html><head><style>${sharedStyles}</style></head>
      <body><div class="wrapper"><div class="container">
        <div class="header" style="background: linear-gradient(135deg, #64748b, #475569);">
          <h1>Contribution Review Update</h1>
          <p>We've reviewed your contribution.</p>
        </div>
        <div class="body">
          <p>Hi ${name},</p>
          <p>Thank you for your contribution. After careful review, we were unable to approve it at this time.</p>
          <div class="highlight">
            <strong>Amount</strong>
            ${formatNaira(amount)}
          </div>
          ${projectTitle ? `<div class="highlight"><strong>Project</strong>${projectTitle}</div>` : ''}
          ${rejectionReason ? `<div class="highlight"><strong>Reason</strong>${rejectionReason}</div>` : `<p>If you'd like more information about this decision, please reach out to our team directly.</p>`}
          <p>We appreciate your support and encourage you to try contributing again or explore other ways to make an impact!</p>
          <a href="${BASE_URL}/projects" class="btn">View More Projects</a>
        </div>
        <div class="footer"><p>ZeroUp Partners · Building Dreams Together</p></div>
      </div></div></body></html>
    `,
  }),

  milestone_reached: ({ name, milestoneLabel, contributorCount, isDreamer, drAmount, claimUrl }) => ({
    subject: `🎉 Milestone Hit: ${milestoneLabel}!`,
    html: `
      <!DOCTYPE html><html><head><style>${sharedStyles}</style></head>
      <body><div class="wrapper"><div class="container">
        <div class="header">
          <h1>🎉 We Just Hit ${milestoneLabel}!</h1>
          <p>And you're one of the partners who made it happen.</p>
        </div>
        <div class="body">
          <p>Hi ${name},</p>
          <p>Thanks to ${contributorCount ? `<strong>${contributorCount} partners</strong> like you` : 'partners like you'}, ZeroUp Partners just crossed <strong>${milestoneLabel}</strong>. This wouldn't have happened without your support.</p>
          <div class="highlight">
            <strong>Your reward</strong>
            ${isDreamer === 'true' ? `A milestone badge + ${Number(drAmount || 0).toLocaleString()} DR in your Dreamer Dash wallet` : 'A milestone badge'}
          </div>
          <p>Head over and claim it — it only takes a second.</p>
          <a href="${claimUrl ?? `${BASE_URL}/badges`}" class="btn">Claim Your Badge</a>
        </div>
        <div class="footer"><p>ZeroUp Partners · Building Dreams Together</p></div>
      </div></div></body></html>
    `,
  }),
}

async function getActiveCustomTemplate(): Promise<{ subject: string; htmlContent: string } | null> {
  try {
    const adminDb = getAdminDb()
    if (!adminDb) return null
    const snap = await adminDb.collection('emailTemplates').where('isActive', '==', true).limit(1).get()
    if (snap.empty) return null
    const data = snap.docs[0].data()
    return { subject: data.subject, htmlContent: data.htmlContent }
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const { to, type, data } = await req.json()

    if (!to || !type || !templates[type]) {
      return NextResponse.json({ error: 'Invalid request: missing to, type, or unrecognised template' }, { status: 400 })
    }

    // Check for an active custom template in Firestore; fall back to built-in if none
    const customTemplate = await getActiveCustomTemplate()
    let subject: string
    let html: string

    if (customTemplate) {
      const builtIn = templates[type](data ?? {})
      subject = customTemplate.subject || builtIn.subject
      // Inject {{name}} placeholder replacement into the custom HTML
      const name = (data as any)?.name ?? 'Partner'
      html = customTemplate.htmlContent.replace(/\{\{name\}\}/g, name)
    } else {
      const builtIn = templates[type](data ?? {})
      subject = builtIn.subject
      html = builtIn.html
    }

    const result = await sendMail({ to, subject, html })
    return NextResponse.json({ success: true, messageId: result.messageId || null })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
