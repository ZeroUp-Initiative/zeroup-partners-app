'use client'

import type { ProjectBudgetPhase } from '@/lib/types'

export function ProjectBudgetBreakdown({ phases, fundingGoal }: { phases: ProjectBudgetPhase[]; fundingGoal: number }) {
  if (!phases || phases.length === 0) return null

  const total = phases.reduce((sum, p) => sum + (p.amount || 0), 0)

  return (
    <div className="space-y-5">
      {phases.map((phase) => {
        const pct = fundingGoal > 0 ? Math.min(100, ((phase.amount || 0) / fundingGoal) * 100) : 0
        return (
          <div key={phase.id}>
            <div className="flex justify-between items-baseline mb-1">
              <span className="font-medium text-sm">{phase.name}</span>
              <span className="text-sm text-muted-foreground">₦{(phase.amount || 0).toLocaleString()}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#8d44d1] to-[#7030b0]"
                style={{ width: `${pct}%` }}
              />
            </div>
            {phase.description && (
              <p className="text-xs text-muted-foreground mt-1">{phase.description}</p>
            )}
          </div>
        )
      })}
      <div className="pt-3 border-t flex justify-between text-sm">
        <span className="text-muted-foreground">Allocated</span>
        <span className="font-semibold">
          ₦{total.toLocaleString()} of ₦{fundingGoal.toLocaleString()} goal
        </span>
      </div>
    </div>
  )
}
