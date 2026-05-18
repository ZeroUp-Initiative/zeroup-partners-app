'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeroSectionProps {
  isDark: boolean
}

export function HeroSection({ isDark }: HeroSectionProps) {
  const scrollDown = () => {
    document.getElementById('ecosystem-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      className="relative overflow-hidden pt-24 pb-16 md:py-24 lg:py-28"
      style={isDark ? { backgroundColor: '#130927' } : undefined}
      data-theme-section="hero"
    >
      {!isDark && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-[#f5ecff]/40" />
      )}

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {isDark ? (
          <>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#8d44d1]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          </>
        ) : (
          <>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#ede9fe]/60 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#ede9fe]/60 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          </>
        )}
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Left: Copy */}
          <div className="space-y-6 max-w-xl mx-auto lg:mx-0">
            {/* Badge */}
            {/* <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${
                isDark
                  ? 'bg-[#8d44d1]/10 border-[#8d44d1]/20 text-[#a05cd4]'
                  : 'bg-[#f5ecff] border-[#d4aaff] text-[#7030b0]'
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#a05cd4] animate-pulse" />
              Pan African Social Impact Network
            </div> */}

            {/* Title */}
            <h1
              className={`text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Don&apos;t just donate.{' '}
              <span className="bg-gradient-to-r from-[#a05cd4] to-[#8d44d1] bg-clip-text text-transparent">
                Build something that lasts.
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className={`text-lg md:text-xl leading-relaxed ${
                isDark ? 'text-white/60' : 'text-slate-600'
              }`}
            >
              Don&apos;t send money into the void and wonder what happened. ZeroUp Partners lets
              you co-create impact with communities, track every contribution, and see your impact
              grow in real time.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#8d44d1] to-[#7030b0] hover:from-[#7030b0] hover:to-[#5e269a] text-white border-0 h-12 px-8 text-base font-semibold shadow-lg shadow-[#8d44d1]/25"
                >
                  Become a Partner
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/projects">
                <Button
                  variant="outline"
                  size="lg"
                  className={`w-full sm:w-auto h-12 px-8 text-base rounded-full ${
                    isDark
                      ? 'border-white/20 text-white hover:bg-white/10 hover:border-white/30'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Explore Projects
                </Button>
              </Link>
            </div>

            <p className={`text-sm ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
              Trusted by partners across Africa, Europe, and Asia
            </p>
          </div>

          {/* Right: hero.png – no decoration, just the image */}
          <div className="flex items-center justify-center lg:justify-end">
            <Image
              src="/hero.png"
              alt="ZeroUp Partners Platform"
              width={520}
              height={360}
              className="w-full h-auto max-w-sm md:max-w-md lg:max-w-[460px]"
              priority
            />
          </div>

        </div>
      </div>

      {/* Scroll hint */}
      <button
        onClick={scrollDown}
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 transition-colors cursor-pointer animate-bounce ${
          isDark ? 'text-white/30 hover:text-white/50' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <ChevronDown className="w-5 h-5" />
      </button>
    </section>
  )
}