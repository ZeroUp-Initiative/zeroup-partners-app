import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/verify-admin'
import { fsQuery, fsAdd } from '@/lib/firebase/firestore-rest'

function extractToken(req: NextRequest): string {
  return req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '').trim() ?? ''
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const token = extractToken(req)
    const docs = await fsQuery('emailTemplates', token, {
      orderBy: { field: 'createdAt', dir: 'DESCENDING' },
    })
    const templates = docs.map((d) => ({ id: d.id, ...d.data }))
    return NextResponse.json({ templates })
  } catch (err) {
    console.error('[email-templates] GET failed:', err)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const { name, subject, htmlContent, type } = body
    if (!name?.trim() || !subject?.trim() || !htmlContent?.trim()) {
      return NextResponse.json(
        { error: 'name, subject and htmlContent are required' },
        { status: 400 }
      )
    }
    const token = extractToken(req)
    const existing = await fsQuery('emailTemplates', token)
    if (existing.length >= 4) {
      return NextResponse.json(
        { error: 'Maximum of 4 templates allowed. Delete one to add a new template.' },
        { status: 400 }
      )
    }
    const now = new Date().toISOString()
    const id = await fsAdd(
      'emailTemplates',
      {
        name: name.trim(),
        subject: subject.trim(),
        htmlContent: htmlContent.trim(),
        type: type || 'general',
        isActive: false,
        createdAt: now,
        updatedAt: now,
      },
      token
    )
    return NextResponse.json({ id, ok: true })
  } catch (err) {
    console.error('[email-templates] POST failed:', err)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
