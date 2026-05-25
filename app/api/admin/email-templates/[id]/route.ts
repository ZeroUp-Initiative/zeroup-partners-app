import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/verify-admin'
import { fsGet, fsPatch, fsQuery, fsDelete } from '@/lib/firebase/firestore-rest'

function extractToken(req: NextRequest): string {
  return req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '').trim() ?? ''
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const { name, subject, htmlContent, type, setActive } = body
    const token = extractToken(req)
    const doc = await fsGet('emailTemplates', params.id, token)
    if (!doc) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

    const now = new Date().toISOString()

    if (setActive === true) {
      const allActive = await fsQuery('emailTemplates', token, {
        where: { field: 'isActive', op: 'EQUAL', value: true },
      })
      for (const d of allActive) {
        await fsPatch('emailTemplates', d.id, { isActive: false, updatedAt: now }, token)
      }
      await fsPatch('emailTemplates', params.id, { isActive: true, updatedAt: now }, token)
      return NextResponse.json({ ok: true })
    }

    if (setActive === false) {
      await fsPatch('emailTemplates', params.id, { isActive: false, updatedAt: now }, token)
      return NextResponse.json({ ok: true })
    }

    const updates: Record<string, unknown> = { updatedAt: now }
    if (name !== undefined) updates.name = name
    if (subject !== undefined) updates.subject = subject
    if (htmlContent !== undefined) updates.htmlContent = htmlContent
    if (type !== undefined) updates.type = type
    await fsPatch('emailTemplates', params.id, updates, token)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[email-templates/id] PUT failed:', err)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const token = extractToken(req)
    await fsDelete('emailTemplates', params.id, token)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[email-templates/id] DELETE failed:', err)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
