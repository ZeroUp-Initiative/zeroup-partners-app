'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import useEmblaCarousel from 'embla-carousel-react'
import { ArrowRight, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import type { Project } from '@/lib/types'

interface FeaturedInitiativesSectionProps {
  projects: Project[]
}

interface DisplayCard {
  id: string
  title: string
  location?: string
  category?: string
  description: string
  imageUrl?: string
  href: string
}

// Placeholder cards — filling out the row until more real initiatives are
// live. Not real projects: no imageUrl (uses the same gradient fallback as a
// real project without a photo yet) and they link to the general listing
// rather than a nonexistent project id, so nothing 404s.
const PLACEHOLDER_CARDS: DisplayCard[] = [
  {
    id: 'placeholder-back-to-school',
    title: 'Back to School for 50 Students',
    location: 'Nigeria',
    category: 'Education',
    description: 'Covering fees, uniforms and supplies so 50 students can start the term ready to learn.',
    href: '/projects',
  },
  {
    id: 'placeholder-fees-scholarship',
    title: 'School Fees Scholarship for 100 Students',
    location: 'Nigeria',
    category: 'Education',
    description: 'A scholarship fund keeping 100 students enrolled through a full academic year.',
    href: '/projects',
  },
]

export function FeaturedInitiativesSection({ projects }: FeaturedInitiativesSectionProps) {
  const realCards: DisplayCard[] = projects
    .filter((p) => ['open', 'fully-funded', 'closed'].includes(p.status))
    .slice(0, 8)
    .map((p) => ({
      id: p.id,
      title: p.title,
      location: p.location,
      category: p.category,
      description: p.description,
      imageUrl: p.imageUrl,
      href: `/projects/${p.id}`,
    }))

  const visible: DisplayCard[] = [...realCards, ...PLACEHOLDER_CARDS]

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: visible.length > 1, align: 'start' })
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => { emblaApi.off('select', onSelect) }
  }, [emblaApi, onSelect])

  if (visible.length === 0) return null

  return (
    <section className="bg-editorial-cream pt-12 pb-6 md:pt-16 md:pb-8">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-10 lg:gap-8">
          {/* Text column — left, matches What We Do's proportions */}
          <div className="lg:w-[280px] lg:flex-shrink-0">
            <p className="text-xs font-semibold tracking-[0.15em] text-editorial-muted uppercase mb-4">Featured Initiatives</p>
            <h2 className="font-display text-3xl lg:text-[2rem] font-bold leading-[1.15] tracking-tight text-editorial-navy text-balance mb-3">
              Ideas in Action
            </h2>
            <p className="text-editorial-ink/70 text-sm mb-6">Explore education initiatives making a difference in communities across Africa.</p>
            {visible.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => emblaApi?.scrollPrev()}
                  disabled={!canScrollPrev}
                  aria-label="Previous"
                  className="w-11 h-11 rounded-full border border-editorial-border flex items-center justify-center text-editorial-navy disabled:opacity-30 hover:bg-editorial-cream-soft transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => emblaApi?.scrollNext()}
                  disabled={!canScrollNext}
                  aria-label="Next"
                  className="w-11 h-11 rounded-full border border-editorial-border flex items-center justify-center text-editorial-navy disabled:opacity-30 hover:bg-editorial-cream-soft transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Card row — right, fills remaining width */}
          <div className="flex-1 min-w-0 overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4">
              {visible.map((project) => (
                <div key={project.id} className="flex-[0_0_88%] sm:flex-[0_0_60%] lg:flex-[0_0_320px] min-w-0">
                  <div className="rounded-2xl overflow-hidden border border-editorial-border bg-editorial-cream-soft h-full flex flex-col">
                    <div className="relative aspect-[4/3] bg-editorial-navy flex-shrink-0">
                      {project.imageUrl ? (
                        <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full" style={{ background: 'linear-gradient(160deg, #2a3660 0%, #1b2540 100%)' }} />
                      )}
                      {project.category && (
                        <span className="absolute bottom-3 left-3 text-[10px] font-semibold tracking-wide uppercase bg-editorial-cream text-amber-600 px-2.5 py-1 rounded-full">
                          {project.category}
                        </span>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-display text-lg font-bold text-editorial-navy mb-1.5 leading-snug">{project.title}</h3>
                      {project.location && (
                        <p className="flex items-center gap-1 text-xs text-editorial-muted mb-2.5">
                          <MapPin className="w-3 h-3" /> {project.location}
                        </p>
                      )}
                      <p className="text-sm text-editorial-ink/70 leading-snug line-clamp-3 mb-4 flex-1">{project.description}</p>
                      <Link
                        href={project.href}
                        className="inline-flex items-center justify-center gap-1.5 rounded-full border border-editorial-border text-editorial-navy text-sm font-medium px-4 h-10 hover:bg-editorial-navy hover:text-white hover:border-editorial-navy transition-colors w-fit"
                      >
                        View Initiative <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
