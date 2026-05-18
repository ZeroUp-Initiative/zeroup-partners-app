'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/contexts/auth-context'
import { db } from '@/lib/firebase/client'
import { collection, query, onSnapshot, where } from 'firebase/firestore'
import { useTheme } from 'next-themes'
import { Navbar } from '@/components/navbar'
import { HeroSection } from '@/components/home/hero-section'
import { FooterSection } from '@/components/home/footer-section'

const EcosystemSection = dynamic(() => import('@/components/home/ecosystem-section').then(m => m.EcosystemSection), { ssr: false })
const ImpactFlowSection = dynamic(() => import('@/components/home/impact-flow-section').then(m => m.ImpactFlowSection), { ssr: false })
const ActiveImpactSection = dynamic(() => import('@/components/home/active-impact-section').then(m => m.ActiveImpactSection), { ssr: false })
const ContributionTypesSection = dynamic(() => import('@/components/home/contribution-types-section').then(m => m.ContributionTypesSection), { ssr: false })
const TestimonialsSection = dynamic(() => import('@/components/home/testimonials-section').then(m => m.TestimonialsSection), { ssr: false })
const PartnersSection = dynamic(() => import('@/components/home/partners-section').then(m => m.PartnersSection), { ssr: false })
const TransparencySection = dynamic(() => import('@/components/home/transparency-section').then(m => m.TransparencySection), { ssr: false })
const InvitationSection = dynamic(() => import('@/components/home/invitation-section').then(m => m.InvitationSection), { ssr: false })

interface Project {
  id: string
  title: string
  description: string
  targetAmount: number
  currentAmount: number
  status: string
  category?: string
  imageUrl?: string
  location?: string
  phase?: string
}

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth()
  const { resolvedTheme } = useTheme()
  const [projects, setProjects] = useState<Project[]>([])
  const [mounted, setMounted] = useState(false)

  const isDark = mounted && resolvedTheme === 'dark'

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'projects')), (snapshot) => {
      const data: Project[] = []
      snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() } as Project))
      setProjects(data)
    })
    return () => unsubscribe()
  }, [])

  // Load user contributions (only needed for sections that display them)
  const [userContributions, setUserContributions] = useState(0)
  useEffect(() => {
    if (!user) return
    const unsubscribe = onSnapshot(
      query(collection(db, 'payments'), where('userId', '==', user.uid), where('status', '==', 'approved')),
      (snapshot) => {
        let total = 0
        snapshot.forEach((doc) => { total += doc.data().amount })
        setUserContributions(total)
      }
    )
    return () => unsubscribe()
  }, [user])

  const isLoggedIn = !!user && !authLoading

  return (
    <div style={isDark ? { backgroundColor: '#130927' } : undefined} className={isDark ? '' : 'bg-background'}>

      <Navbar isDark={isDark} isLoggedIn={isLoggedIn} user={user} />

      <HeroSection isDark={isDark} />

      <main className={isDark ? '' : 'bg-gradient-to-b from-slate-50 via-white to-slate-50'}>
        <div id="ecosystem-section">
          <EcosystemSection isDark={isDark} />
        </div>

        {!isDark && <div className="h-px bg-gradient-to-r from-transparent via-[#c084f5] to-transparent mx-auto max-w-4xl" />}
        <ImpactFlowSection isDark={isDark} />

        {!isDark && <div className="h-px bg-gradient-to-r from-transparent via-[#c084f5] to-transparent mx-auto max-w-4xl" />}
        <ActiveImpactSection projects={projects} isDark={isDark} />

        {!isDark && <div className="h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent mx-auto max-w-4xl" />}
        <ContributionTypesSection isDark={isDark} />

        {!isDark && <div className="h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent mx-auto max-w-4xl" />}
        <TestimonialsSection isDark={isDark} />

        {!isDark && <div className="h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent mx-auto max-w-4xl" />}
        <PartnersSection isDark={isDark} />

        {!isDark && <div className="h-px bg-gradient-to-r from-transparent via-[#c084f5] to-transparent mx-auto max-w-4xl" />}
        <TransparencySection isDark={isDark} />

        {!isDark && <div className="h-px bg-gradient-to-r from-transparent via-[#c084f5] to-transparent mx-auto max-w-4xl" />}
        <InvitationSection isDark={isDark} />
      </main>

      <FooterSection isDark={isDark} />

    </div>
  )
}
