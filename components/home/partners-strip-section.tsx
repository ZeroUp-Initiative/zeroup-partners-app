'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

// Generic placeholder wordmarks — intentionally not the specific real
// organization logos from the design mockup, since we can't verify an
// actual partnership with those named orgs. Swap for real partner logos
// once confirmed.
const PLACEHOLDER_PARTNERS = [
  'Foundation Partner',
  'Development Partner',
  'Global Partner',
  'Impact Partner',
  'Education Partner',
  'Community Partner',
]

export function PartnersStripSection() {
  return (
    <section id="partners" className="bg-editorial-cream-soft py-16 md:py-20 border-y border-editorial-border">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-x-12 gap-y-8">
          <div className="max-w-xs flex-shrink-0">
            <p className="text-xs font-semibold tracking-[0.15em] text-editorial-muted uppercase mb-4">Our Partners</p>
            <h2 className="font-display text-2xl md:text-3xl font-bold leading-[1.15] tracking-tight text-editorial-navy mb-3">
              Stronger Together
            </h2>
            <p className="text-editorial-ink/70 text-sm leading-relaxed mb-6">
              A growing network of funders, organizations and individuals committed to education and impact.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full border border-editorial-navy text-editorial-navy text-sm font-semibold px-6 h-11 hover:bg-editorial-navy hover:text-white transition-colors"
            >
              Become a Partner
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-x-10 gap-y-6">
            {PLACEHOLDER_PARTNERS.map((name) => (
              <span key={name} className="text-sm font-semibold text-editorial-muted tracking-wide">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
