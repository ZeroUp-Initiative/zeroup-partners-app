'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2, School, Sparkles } from 'lucide-react'
import html2canvas from 'html2canvas'

export interface SchoolImpactReportProps {
  schoolName: string
  casesSubmitted: number
  casesPublished: number
  totalEstimatedNeed: number
  memberSince?: { toDate?: () => Date } | Date | string | null
}

function formatMemberSince(value: SchoolImpactReportProps['memberSince']): string {
  try {
    if (!value) return ''
    const date = typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function'
      ? value.toDate()
      : new Date(value as any)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  } catch {
    return ''
  }
}

export function SchoolImpactReport({ schoolName, casesSubmitted, casesPublished, totalEstimatedNeed, memberSince }: SchoolImpactReportProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (!cardRef.current) return
    setIsDownloading(true)
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 3, backgroundColor: null, useCORS: true, allowTaint: true, logging: false })
      const link = document.createElement('a')
      link.download = `zeroup-impact-report-${schoolName.toLowerCase().replace(/\s+/g, '-')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Error downloading impact report:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  const memberSinceLabel = formatMemberSince(memberSince)

  return (
    <div className="space-y-4">
      <div ref={cardRef} className="relative overflow-hidden rounded-2xl border-0 shadow-2xl bg-gradient-to-br from-editorial-navy via-editorial-navy to-editorial-navy-deep p-8 text-editorial-cream font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-editorial-cream/10 via-transparent to-transparent" />
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
              <School className="w-6 h-6 text-editorial-cream" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-editorial-cream/50">ZeroUp Partner School</p>
              <p className="font-display text-lg font-bold leading-tight">{schoolName}</p>
            </div>
          </div>

          {memberSinceLabel && <p className="text-xs text-editorial-cream/40">Partner since {memberSinceLabel}</p>}

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-2xl font-bold">{casesSubmitted}</p>
              <p className="text-xs text-editorial-cream/50 mt-1">Cases Submitted</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-2xl font-bold">{casesPublished}</p>
              <p className="text-xs text-editorial-cream/50 mt-1">Published for Partnership</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4 col-span-2">
              <p className="text-2xl font-bold">₦{totalEstimatedNeed.toLocaleString()}</p>
              <p className="text-xs text-editorial-cream/50 mt-1">Total Need Represented</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 text-xs text-editorial-cream/40">
            <Sparkles className="w-3.5 h-3.5 text-editorial-cream" />
            zeroup.org/partners
          </div>
        </div>
      </div>

      <Button className="w-full" onClick={handleDownload} disabled={isDownloading}>
        {isDownloading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Preparing…</> : <><Download className="w-4 h-4 mr-2" /> Download Report</>}
      </Button>
    </div>
  )
}
