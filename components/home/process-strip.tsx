'use client'

import { Lightbulb, Users, Sprout, BarChart3, ArrowRight } from 'lucide-react'

const STEPS = [
  { icon: Lightbulb, title: 'The Idea', description: 'A need is identified', badge: null, iconColor: 'text-amber-500' },
  { icon: Users, title: 'The Connection', description: 'We bring the right people together', badge: 'bg-[#E7E3F7]', iconColor: 'text-editorial-navy' },
  { icon: Sprout, title: 'The Support', description: 'Resources turn plans into action', badge: 'bg-[#E7E3F7]', iconColor: 'text-editorial-navy' },
  { icon: BarChart3, title: 'The Impact', description: 'Stronger learning communities', badge: 'bg-[#DCEEF7]', iconColor: 'text-editorial-navy' },
]

export function ProcessStrip() {
  return (
    <section className="bg-[#F3E8E6] border-y border-editorial-border">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-2">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.title} className="flex items-center gap-2 w-full md:w-auto">
                <div className="flex items-center gap-3">
                  <div className={`relative w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${step.badge ?? ''}`}>
                    {!step.badge && (
                      <div className="absolute inset-0 rounded-full bg-amber-200/25 blur-md" aria-hidden />
                    )}
                    <Icon className={`relative w-5 h-5 ${step.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-editorial-navy">{step.title}</p>
                    <p className="text-xs text-editorial-muted">{step.description}</p>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="hidden md:block w-4 h-4 text-editorial-border mx-4 flex-shrink-0" />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
