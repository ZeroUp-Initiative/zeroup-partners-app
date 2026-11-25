'use client'

import Link from 'next/link'
import { ArrowRight, Search, Share2, Sprout, BarChart3 } from 'lucide-react'

const CARDS = [
  { icon: Search, title: 'Discover', description: 'We surface impactful education initiatives ready for support.', image: '/images/home/what-we-do-discover.jpg', accent: false },
  { icon: Share2, title: 'Connect', description: 'We match initiatives with funders, partners and organizations.', image: '/images/home/what-we-do-connect.jpg', accent: false },
  { icon: Sprout, title: 'Support', description: 'We enable funding, expertise and long-term partnerships.', image: '/images/home/what-we-do-support.jpg', accent: true },
  { icon: BarChart3, title: 'Grow Impact', description: 'We track progress and share real, measurable change.', image: '/images/home/what-we-do-grow-impact.jpg', accent: false },
]

export function WhatWeDoSection() {
  return (
    <section id="what-we-do" className="relative bg-editorial-navy-deep pt-20 pb-16 md:pt-28 md:pb-24 overflow-hidden">
      {/* Wave divider — the cream from the Challenge section above dips into this
          section instead of a hard straight edge, matching the source design. */}
      <svg
        className="absolute top-0 left-0 w-full h-14 md:h-20 -translate-y-px"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path d="M0,0 L0,45 C240,75 480,20 720,40 C960,60 1200,15 1440,35 L1440,0 Z" fill="var(--editorial-cream)" />
      </svg>

      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-10 lg:gap-8">
          {/* Text column — left, ~28% */}
          <div className="lg:w-[300px] lg:flex-shrink-0">
            <p className="text-xs font-semibold tracking-[0.15em] text-white/50 uppercase mb-4">What We Do</p>
            <h2 className="font-display text-3xl lg:text-[2rem] font-bold leading-[1.15] tracking-tight text-white text-balance mb-6">
              We connect education initiatives with the people and resources that help them grow.
            </h2>
            <Link
              href="/#what-we-do"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 text-white text-sm font-semibold px-6 h-11 hover:bg-white/10 transition-colors"
            >
              Explore How It Works
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card row — right, fills remaining width */}
          <div className="relative flex-1 min-w-0">
            <p
              className="hidden lg:block font-script text-xl text-white/70 text-right absolute -top-7 right-2 max-w-[200px] z-10"
              style={{ textShadow: '0 1px 10px rgba(0,0,0,0.55)' }}
            >
              Real people.<br />Real progress.
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
              {CARDS.map((card) => {
                const Icon = card.icon
                return (
                  <div
                    key={card.title}
                    className="relative rounded-2xl overflow-hidden aspect-[4/5] p-5 flex flex-col justify-end bg-editorial-navy"
                  >
                    <img src={card.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <div
                      className={`relative w-11 h-11 rounded-full border flex items-center justify-center mb-4 ${
                        card.accent ? 'border-amber-400/80' : 'border-white/70'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${card.accent ? 'text-amber-400' : 'text-white'}`} />
                    </div>
                    <h3 className="relative text-white font-semibold mb-1.5">{card.title}</h3>
                    <p className="relative text-white/60 text-sm leading-snug">{card.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
