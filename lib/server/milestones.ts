import 'server-only'
import type { FirestoreRestDb } from '@/lib/firebase/firestore-admin-rest'
import type { MilestoneType } from '@/lib/types'

export interface MilestoneRecipient {
  userId: string
  email: string
  name: string
  isDreamer: boolean
}

const DR_AWARD = 3000

/**
 * Records a newly-crossed milestone, creates a pending badge for every
 * qualifying recipient, sends each an in-app notification, and emails each
 * one individually (personalized: DR mention only shown to linked Dreamers).
 * Does NOT award DR itself — that happens on claim, via /api/badges/claim.
 */
export async function fireMilestone(params: {
  fdb: FirestoreRestDb
  requestOrigin: string
  type: MilestoneType
  threshold: number
  label: string
  recipients: MilestoneRecipient[]
}): Promise<{ milestoneId: string; badgesCreated: number }> {
  const { fdb, requestOrigin, type, threshold, label, recipients } = params

  const milestoneRef = await fdb.collection('milestones').add({
    type,
    threshold,
    label,
    recipientCount: recipients.length,
    reachedAt: new Date(),
  })

  const claimUrl = `${requestOrigin}/badges`

  await Promise.allSettled(
    recipients.map(async (r) => {
      // Badge doc
      await fdb.collection('badges').add({
        userId: r.userId,
        milestoneId: milestoneRef.id,
        type,
        threshold,
        label,
        status: 'pending',
        isDreamerEligible: r.isDreamer,
        drAmount: r.isDreamer ? DR_AWARD : 0,
        createdAt: new Date(),
      })

      // In-app notification (server-side write — mirrors NotificationHelpers.badgeEarned
      // in lib/notifications.ts, which is client-only and can't be used from a route).
      await fdb.collection('notifications').add({
        userId: r.userId,
        type: 'badge_earned',
        title: 'Badge Earned! 🏆',
        message: `We just hit ${label} — and you're one of the partners who made it happen. Claim your badge!`,
        read: false,
        createdAt: new Date(),
        link: '/badges',
        metadata: null,
      })

      // Personalized email via the existing /api/email template.
      try {
        await fetch(new URL('/api/email', requestOrigin).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: r.email,
            type: 'milestone_reached',
            data: {
              name: r.name,
              milestoneLabel: label,
              contributorCount: String(recipients.length),
              isDreamer: r.isDreamer ? 'true' : 'false',
              drAmount: String(DR_AWARD),
              claimUrl,
            },
          }),
        })
      } catch (err) {
        console.error(`[milestones] Failed to email ${r.email}:`, err)
      }
    })
  )

  return { milestoneId: milestoneRef.id, badgesCreated: recipients.length }
}

export { DR_AWARD }
