'use client'

import { CheckCircle2, Circle, Loader2 } from 'lucide-react'
import type { ProjectTimelineItem } from '@/lib/types'

const STATUS_STYLE: Record<ProjectTimelineItem['status'], { dot: string; icon: any; label: string }> = {
  completed: { dot: 'bg-[#8d44d1] border-[#8d44d1]', icon: CheckCircle2, label: 'Completed' },
  'in-progress': { dot: 'bg-white border-[#8d44d1]', icon: Loader2, label: 'In Progress' },
  upcoming: { dot: 'bg-white border-muted-foreground/40', icon: Circle, label: 'Upcoming' },
}

export function ProjectTimeline({ items }: { items: ProjectTimelineItem[] }) {
  if (!items || items.length === 0) return null

  return (
    <div className="space-y-0">
      {items.map((item, i) => {
        const style = STATUS_STYLE[item.status] || STATUS_STYLE.upcoming
        const Icon = style.icon
        const isLast = i === items.length - 1
        return (
          <div key={item.id} className={`relative pl-8 ${isLast ? '' : 'pb-6'}`}>
            {!isLast && <div className="absolute left-[9px] top-5 bottom-0 w-px bg-border" />}
            <div className={`absolute left-0 top-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${style.dot}`}>
              <Icon className={`w-3 h-3 ${item.status === 'completed' ? 'text-white' : item.status === 'in-progress' ? 'text-[#8d44d1] animate-spin' : 'text-muted-foreground'}`} />
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h4 className="font-semibold text-sm">{item.title}</h4>
              {item.date && <span className="text-xs text-muted-foreground">{item.date}</span>}
            </div>
            {item.description && (
              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
