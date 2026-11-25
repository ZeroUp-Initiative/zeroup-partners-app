'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const STATS = [
  { value: '60%', label: 'of education initiatives lack consistent funding' },
  {
    value: (
      <>
        1 <span className="text-base md:text-lg font-normal align-baseline">in</span> 3
      </>
    ),
    label: 'school programs fail to scale',
  },
  { value: 'Millions', label: 'of learners miss out on life-changing opportunities' },
]

export function ChallengeSection() {
  return (
    <section id="challenge" className="bg-editorial-cream pt-12 pb-6 md:pt-16 md:pb-8">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Three columns in one row, all vertically centered together —
            text | stats | photo. Fixed/capped widths, not fr/flex-grow — the
            row sizes to its actual content and stays put; it doesn't stretch
            to fill the viewport just because more space is available. */}
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-x-10 gap-y-10">
          {/* Text column */}
          <div className="max-w-md flex-shrink-0">
            <p className="text-xs font-semibold tracking-[0.15em] text-editorial-muted uppercase mb-4">The Challenge</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold leading-[1.15] tracking-tight text-editorial-navy text-balance mb-5">
              Too many promising education initiatives never reach their full potential.
            </h2>
            <p className="text-base md:text-lg text-editorial-ink/80 leading-relaxed mb-8 max-w-lg">
              Across Africa, innovative ideas struggle to find the right resources, partners and support.
            </p>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-full border border-editorial-navy text-editorial-navy text-sm font-semibold px-6 h-11 hover:bg-editorial-navy hover:text-white transition-colors"
            >
              About the Challenge
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Stats column — its own column, centered in the row */}
          <div className="flex gap-6 divide-x divide-editorial-border flex-shrink-0">
            {STATS.map((stat, i) => (
              <div key={i} className={i > 0 ? 'pl-6' : ''}>
                <p className="font-display text-2xl md:text-3xl font-bold text-editorial-navy mb-1 whitespace-nowrap">{stat.value}</p>
                <p className="text-xs text-editorial-muted leading-snug max-w-[120px]">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Photo column */}
          <div className="relative w-full max-w-xs lg:w-[300px] flex-shrink-0">
            <div className="relative aspect-[6/5] rounded-[2rem] overflow-hidden bg-editorial-navy">
              <img src="/images/home/challenge.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              <div className="absolute top-5 right-5 rounded-2xl bg-white/15 backdrop-blur-sm px-4 py-3 max-w-[170px] text-right">
                <p className="font-script text-white text-lg leading-snug">Potential shouldn't be limited by opportunity.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
