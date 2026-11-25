'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import useEmblaCarousel from 'embla-carousel-react'
import { ArrowRight, ChevronRight, ChevronLeft } from 'lucide-react'

interface Slide {
  headline: string
  subtitle: string
  ctaLabel: string
  ctaHref: string
  script: string
  tag: string
  image: string
  /** CSS object-position for the background image — lets each photo's subject stay framed correctly. */
  focus: string
}

const SLIDES: Slide[] = [
  {
    headline: 'Every great education initiative starts with an idea.',
    subtitle: 'Across Africa, passionate educators, communities and organizations are creating solutions for brighter futures.',
    ctaLabel: 'See the Journey',
    ctaHref: '/#challenge',
    script: 'Ideas People Partnerships Change',
    tag: 'A simple idea today, a brighter tomorrow.',
    image: '/images/home/hero-1.jpg',
    focus: 'center 40%',
  },
  {
    headline: 'Real people are already doing the work.',
    subtitle: 'Teachers, school leaders and local organizers are closing gaps every day — often without the resources to go further.',
    ctaLabel: 'Meet Our Schools',
    ctaHref: '/schools',
    script: 'Educators. Organizers. Believers.',
    tag: 'The work is already happening.',
    image: '/images/home/hero-2.jpg',
    focus: 'center 30%',
  },
  {
    headline: 'The right partnership changes everything.',
    subtitle: 'We connect verified, on-the-ground initiatives with the partners who can actually move them forward.',
    ctaLabel: 'See How It Works',
    ctaHref: '/#what-we-do',
    script: 'Connection. Trust. Momentum.',
    tag: 'You bring the support, we bring the match.',
    image: '/images/home/hero-3.jpg',
    focus: 'center 25%',
  },
  {
    headline: 'Together, we turn potential into progress.',
    subtitle: 'Every naira is tracked from partnership to outcome — no black box, no guesswork.',
    ctaLabel: 'Explore Initiatives',
    ctaHref: '/projects',
    script: 'Tracked. Transparent. True.',
    tag: 'Progress you can actually see.',
    image: '/images/home/hero-4.jpg',
    focus: 'center 25%',
  },
  {
    headline: 'This is what lasting change looks like.',
    subtitle: 'Not a single donation — a relationship that keeps compounding, initiative after initiative.',
    ctaLabel: 'Partner With Us',
    ctaHref: '/signup',
    script: 'Education connects us all.',
    tag: 'Built to last, not just to launch.',
    image: '/images/home/hero-5.jpg',
    focus: 'center 30%',
  },
]

export function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    return () => { emblaApi.off('select', onSelect) }
  }, [emblaApi, onSelect])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi])

  return (
    <section className="relative w-full overflow-hidden bg-editorial-cream" ref={emblaRef}>
      <div className="flex">
        {SLIDES.map((slide, i) => (
          <div key={i} className="relative flex-[0_0_100%] min-w-0 min-h-[560px] sm:min-h-[480px] lg:min-h-[560px] flex items-center">
            {/* Full-bleed photo */}
            <img
              src={slide.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: slide.focus }}
            />
            {/* Legibility scrim — strongest at the left where the copy sits, fading out over the subject */}
            <div
              className="absolute inset-0 hidden sm:block"
              style={{ background: 'linear-gradient(100deg, var(--editorial-cream) 0%, rgba(244,240,229,0.85) 22%, rgba(244,240,229,0.35) 42%, rgba(244,240,229,0.05) 58%, transparent 72%)' }}
            />
            {/* Mobile: the text column runs full-width over the photo, so a flat wash keeps it legible regardless of what's behind it */}
            <div className="absolute inset-0 bg-editorial-cream/60 sm:hidden" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-editorial-cream/70 to-transparent sm:hidden" />

            {/* Script annotation, floating over the photo */}
            <p
              className="hidden md:block absolute top-[12%] left-[48%] font-script text-2xl lg:text-3xl text-editorial-navy/70 leading-none max-w-[220px]"
              aria-hidden
            >
              {slide.script}
            </p>

            {/* Tag bubble, top-right */}
            <div className="hidden sm:block absolute top-8 right-4 md:right-8 rounded-2xl bg-white/30 backdrop-blur-md px-4 py-3 max-w-[190px] border border-white/40">
              <p className="font-script text-editorial-navy text-lg leading-snug">{slide.tag}</p>
            </div>

            {/* Content */}
            <div className="relative z-10 w-full mx-auto max-w-7xl px-4 md:px-6 py-16">
              {/* Slide indicator */}
              <div className="flex items-center gap-3 mb-8">
                {SLIDES.map((_, dotIndex) => (
                  <button
                    key={dotIndex}
                    onClick={() => scrollTo(dotIndex)}
                    aria-label={`Go to slide ${dotIndex + 1}`}
                    className={`flex items-center justify-center text-xs font-semibold transition-all ${
                      dotIndex === selectedIndex
                        ? 'w-8 h-8 rounded-full border border-editorial-navy text-editorial-navy'
                        : 'text-editorial-navy/40 hover:text-editorial-navy px-1'
                    }`}
                  >
                    {String(dotIndex + 1).padStart(2, '0')}
                  </button>
                ))}
              </div>

              <div className="max-w-md lg:max-w-lg space-y-5">
                <h1 className="font-display text-3xl md:text-4xl lg:text-[2.6rem] font-bold leading-[1.1] tracking-tight text-editorial-navy text-balance">
                  {slide.headline}
                </h1>
                <p className="text-base md:text-lg leading-relaxed text-editorial-ink/80">
                  {slide.subtitle}
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    href={slide.ctaHref}
                    className="inline-flex items-center gap-2 rounded-full bg-editorial-navy text-white text-sm font-semibold px-6 h-12 hover:bg-editorial-navy-deep transition-colors"
                  >
                    {slide.ctaLabel}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={scrollPrev}
                      aria-label="Previous slide"
                      className="w-11 h-11 rounded-full border border-editorial-navy/25 flex items-center justify-center text-editorial-navy hover:bg-white/40 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={scrollNext}
                      aria-label="Next slide"
                      className="w-11 h-11 rounded-full border border-editorial-navy/25 flex items-center justify-center text-editorial-navy hover:bg-white/40 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
