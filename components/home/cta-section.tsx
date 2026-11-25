'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function CTASection() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative py-24 md:py-36 bg-editorial-navy">
        <img src="/images/home/cta.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-editorial-navy-deep via-editorial-navy-deep/60 to-black/20" />

        <div className="relative mx-auto max-w-7xl px-4 md:px-6">
          <p className="font-script text-2xl text-white/50 text-right mb-6 hidden md:block">Education connects us all.</p>
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.15em] text-white/50 uppercase mb-4">A Brighter Tomorrow</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold leading-[1.1] tracking-tight text-white text-balance mb-5">
              What could your support make possible?
            </h2>
            <p className="text-white/70 text-base md:text-lg leading-relaxed mb-8">
              Partner with us to fund, scale and sustain impactful education initiatives.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-editorial-cream text-editorial-navy text-sm font-semibold px-7 h-12 hover:bg-white transition-colors"
              >
                Partner With Us
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/projects"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 text-white text-sm font-semibold px-7 h-12 hover:bg-white/10 transition-colors"
              >
                Explore Initiatives
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
