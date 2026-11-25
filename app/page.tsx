'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { db } from '@/lib/firebase/client'
import { collection, query, onSnapshot } from 'firebase/firestore'
import { SiteHeader } from '@/components/home/site-header'
import { HeroCarousel } from '@/components/home/hero-carousel'
import { ProcessStrip } from '@/components/home/process-strip'
import { ChallengeSection } from '@/components/home/challenge-section'
import { WhatWeDoSection } from '@/components/home/what-we-do-section'
import { FeaturedInitiativesSection } from '@/components/home/featured-initiatives-section'
import { PartnersStripSection } from '@/components/home/partners-strip-section'
import { CTASection } from '@/components/home/cta-section'
import { FooterSection } from '@/components/home/footer-section'
import type { Project } from '@/lib/types'

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'projects')), (snapshot) => {
      const data: Project[] = []
      snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() } as Project))
      setProjects(data)
    })
    return () => unsubscribe()
  }, [])

  const isLoggedIn = !!user && !authLoading

  return (
    <div className="bg-editorial-cream">
      <SiteHeader isLoggedIn={isLoggedIn} />
      <HeroCarousel />
      <ProcessStrip />
      <ChallengeSection />
      <WhatWeDoSection />
      <FeaturedInitiativesSection projects={projects} />
      <PartnersStripSection />
      <CTASection />
      <FooterSection />
    </div>
  )
}
