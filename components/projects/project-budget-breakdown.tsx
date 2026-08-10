'use client'

import { CheckCircle2 } from 'lucide-react'
import type { ProjectBudgetPhase } from '@/lib/types'

export function ProjectBudgetBreakdown({ phases, fundingGoal }: { phases: ProjectBudgetPhase[]; fundingGoal: number }) {
  if (!phases || phases.length === 0) return null

  const total = phases.reduce((sum, p) => sum + (p.amount || 0), 0)

  return (
    <div className="space-y-5">
      {phases.map((phase) => {
        const raised = phase.currentAmount || 0
        const goal = phase.amount || 0
        const pct = goal > 0 ? Math.min(100, (raised / goal) * 100) : 0
        const isFunded = goal > 0 && raised >= goal
        return (
          <div key={phase.id}>
            <div className="flex justify-between items-baseline mb-1">
              <span className="font-medium text-sm flex items-center gap-1.5">
                {phase.name}
                {isFunded && <CheckCircle2 className="w-3.5 h-3.5 text-[#8d44d1]" />}
              </span>
              <span className="text-sm text-muted-foreground">
                ₦{raised.toLocaleString()} of ₦{goal.toLocaleString()}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full rounded-full ${isFunded ? 'bg-[#8d44d1]' : 'bg-gradient-to-r from-[#8d44d1] to-[#7030b0]'}`}
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
        <span className="text-muted-foreground">Total budget</span>
        <span className="font-semibold">
          ₦{total.toLocaleString()} of ₦{fundingGoal.toLocaleString()} goal
        </span>
      </div>
    </div>
  )
}
