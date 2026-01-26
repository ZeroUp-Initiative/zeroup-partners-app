'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Menu, X, Sparkles, ArrowRight, Compass, ChevronDown } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { db } from '@/lib/firebase/client'
import { collection, query, onSnapshot, where } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { useTheme } from 'next-themes'

// Dynamic import to avoid SSR issues with canvas and framer-motion
const ConstellationCanvasV2 = dynamic(
  () => import('@/components/constellation/constellation-canvas-v2').then(mod => mod.ConstellationCanvasV2),
  { 
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin mx-auto" />
          <p className="text-white/60 text-sm">Loading constellation...</p>
        </div>
      </div>
    )
  }
)

// Dynamic imports for body sections
const EcosystemSection = dynamic(() => import('@/components/home/ecosystem-section').then(mod => mod.EcosystemSection), { ssr: false })
const ImpactFlowSection = dynamic(() => import('@/components/home/impact-flow-section').then(mod => mod.ImpactFlowSection), { ssr: false })
const ActiveImpactSection = dynamic(() => import('@/components/home/active-impact-section').then(mod => mod.ActiveImpactSection), { ssr: false })
const ContributionTypesSection = dynamic(() => import('@/components/home/contribution-types-section').then(mod => mod.ContributionTypesSection), { ssr: false })
const TestimonialsSection = dynamic(() => import('@/components/home/testimonials-section').then(mod => mod.TestimonialsSection), { ssr: false })
const PartnersSection = dynamic(() => import('@/components/home/partners-section').then(mod => mod.PartnersSection), { ssr: false })
const TransparencySection = dynamic(() => import('@/components/home/transparency-section').then(mod => mod.TransparencySection), { ssr: false })
const InvitationSection = dynamic(() => import('@/components/home/invitation-section').then(mod => mod.InvitationSection), { ssr: false })

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
  const { theme, resolvedTheme } = useTheme()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [userContributions, setUserContributions] = useState(0)
  const [mounted, setMounted] = useState(false)

  // Determine if dark mode
  const isDark = mounted && (resolvedTheme === 'dark')

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load projects
  useEffect(() => {
    const projectsQuery = query(collection(db, 'projects'))
    const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
      const projectsData: Project[] = []
      snapshot.forEach((doc) => {
        projectsData.push({ id: doc.id, ...doc.data() } as Project)
      })
      setProjects(projectsData)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Load user's total contributions
  useEffect(() => {
    if (!user) return

    const paymentsQuery = query(
      collection(db, 'payments'),
      where('userId', '==', user.uid),
      where('status', '==', 'approved')
    )
    
    const unsubscribe = onSnapshot(paymentsQuery, (snapshot) => {
      let total = 0
      snapshot.forEach((doc) => {
        total += doc.data().amount
      })
      setUserContributions(total)
    })

    return () => unsubscribe()
  }, [user])

  const isLoggedIn = !!user && !authLoading

  const scrollToContent = () => {
    const contentSection = document.getElementById('ecosystem-section')
    contentSection?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-background'}`}>
      {/* ========== HERO SECTION - Constellation ========== */}
      <section className="relative h-screen overflow-hidden">
      {/* Minimal Header */}
      <header className="absolute top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between p-4 md:p-6">
          {/* Logo - Top Left */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden">
              <Image
                src="/images/zeroup-partners-logo-dark-mode.png"
                alt="ZeroUp Partners Logo"
                fill
                className={`object-contain ${isDark ? 'block' : 'hidden'}`}
                priority
              />
              <Image
                src="/images/zeroup-partners-logo-light-mode.png"
                alt="ZeroUp Partners Logo"
                fill
                className={`object-contain ${isDark ? 'hidden' : 'block'}`}
                priority
              />
            </div>
            <div className="hidden sm:block">
              <h1 className={`text-lg font-bold leading-tight transition-colors ${isDark ? 'text-white group-hover:text-emerald-400' : 'text-foreground group-hover:text-primary'}`}>Zero Partners</h1>
              <p className={`text-xs ${isDark ? 'text-white/50' : 'text-muted-foreground'}`}>Impact Ecosystem</p>
            </div>
          </Link>

          {/* Navigation - Top Right */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                href="/projects" 
                className={`text-sm transition-colors ${isDark ? 'text-white/60 hover:text-white' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Projects
              </Link>
              {isLoggedIn ? (
                <>
                  <Link 
                    href="/dashboard" 
                    className={`text-sm transition-colors ${isDark ? 'text-white/60 hover:text-white' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/community" 
                    className={`text-sm transition-colors ${isDark ? 'text-white/60 hover:text-white' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Community
                  </Link>
                  <Link href="/dashboard/profile">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-medium ring-2 ring-white/20 hover:ring-white/40 transition-all">
                      {user?.firstName?.[0] || user?.displayName?.[0] || 'U'}
                    </div>
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className={`text-sm transition-colors ${isDark ? 'text-white/60 hover:text-white' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Login
                  </Link>
                  <Link href="/signup">
                    <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0">
                      Become a Partner
                    </Button>
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`md:hidden p-2 transition-colors ${isDark ? 'text-white/60 hover:text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu - Simple CSS animation */}
        {isMenuOpen && (
          <div
            className={`md:hidden absolute top-full left-0 right-0 backdrop-blur-xl border-b animate-fade-in ${isDark ? 'bg-slate-900/98 border-white/10' : 'bg-background/98 border-border'}`}
          >
            <nav className="flex flex-col p-4 gap-2">
                <Link 
                  href="/projects" 
                  className={`px-4 py-3 rounded-lg transition-colors ${isDark ? 'text-white/80 hover:text-white hover:bg-white/5' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Projects
                </Link>
                {isLoggedIn ? (
                  <>
                    <Link 
                      href="/dashboard" 
                      className={`px-4 py-3 rounded-lg transition-colors ${isDark ? 'text-white/80 hover:text-white hover:bg-white/5' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      href="/community" 
                      className={`px-4 py-3 rounded-lg transition-colors ${isDark ? 'text-white/80 hover:text-white hover:bg-white/5' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Community
                    </Link>
                    <Link 
                      href="/dashboard/profile" 
                      className={`px-4 py-3 rounded-lg transition-colors ${isDark ? 'text-white/80 hover:text-white hover:bg-white/5' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                  </>
                ) : (
                  <>
                    <Link 
                      href="/login" 
                      className={`px-4 py-3 rounded-lg transition-colors ${isDark ? 'text-white/80 hover:text-white hover:bg-white/5' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link 
                      href="/signup" 
                      className="px-4 py-3 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Become a Partner
                    </Link>
                  </>
                )}
              </nav>
            </div>
          )}
      </header>

      {/* Loading State */}
      {isLoading || authLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin mx-auto" />
            <p className={`text-sm ${isDark ? 'text-white/60' : 'text-muted-foreground'}`}>Loading the ecosystem...</p>
          </div>
        </div>
      ) : (
        /* Main Constellation - V2 handles its own empty state */
        <ConstellationCanvasV2
          projects={projects}
          user={user ? {
            uid: user.uid,
            displayName: user.displayName,
            firstName: user.firstName,
            lastName: user.lastName,
            photoURL: user.photoURL,
            totalContributions: userContributions
          } : null}
          isLoggedIn={isLoggedIn}
          isDark={isDark}
        />
      )}

      {/* Public view center text (when not logged in and has projects) */}
      {!isLoggedIn && !isLoading && projects.length > 0 && (
        <div className="absolute bottom-28 md:bottom-24 left-1/2 -translate-x-1/2 text-center z-40 animate-fade-in px-4 w-full max-w-md md:max-w-none md:w-auto">
          <p className={`text-xs md:text-sm mb-4 ${isDark ? 'text-white/40' : 'text-muted-foreground'}`}>A Living Map of Global Social Impact</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/signup">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                Join as a Zero Partner
              </Button>
            </Link>
            <Link href="/projects">
              <Button variant="outline" className={`w-full sm:w-auto ${isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-border'}`}>
                Explore the Ecosystem
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Scroll indicator */}
      <button 
        onClick={scrollToContent}
        className={`absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 transition-colors cursor-pointer animate-bounce ${isDark ? 'text-white/40 hover:text-white/60' : 'text-muted-foreground hover:text-foreground'}`}
      >
        <span className="text-[10px] md:text-xs uppercase tracking-wider">Explore</span>
        <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
      </button>
      </section>

      {/* ========== BODY SECTIONS ========== */}
      <main className={isDark ? '' : 'bg-gradient-to-b from-slate-50 via-white to-slate-50'}>
        {/* Section 2: What This Ecosystem Is */}
        <div id="ecosystem-section">
          <EcosystemSection isDark={isDark} />
        </div>

        {/* Section Divider */}
        {!isDark && <div className="h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent mx-auto max-w-4xl" />}

        {/* Section 3: How Impact Flows */}
        <ImpactFlowSection isDark={isDark} />

        {/* Section Divider */}
        {!isDark && <div className="h-px bg-gradient-to-r from-transparent via-teal-300 to-transparent mx-auto max-w-4xl" />}

        {/* Section 4: Active Impact Right Now */}
        <ActiveImpactSection projects={projects} isDark={isDark} />

        {/* Section Divider */}
        {!isDark && <div className="h-px bg-gradient-to-r from-transparent via-purple-300 to-transparent mx-auto max-w-4xl" />}

        {/* Section 5: What You Can Contribute */}
        <ContributionTypesSection isDark={isDark} />

        {/* Section Divider */}
        {!isDark && <div className="h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent mx-auto max-w-4xl" />}

        {/* Section 6: Human Proof (Testimonials) */}
        <TestimonialsSection isDark={isDark} />

        {/* Section Divider */}
        {!isDark && <div className="h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent mx-auto max-w-4xl" />}

        {/* Section 7: Partners, Not Sponsors */}
        <PartnersSection isDark={isDark} />

        {/* Section Divider */}
        {!isDark && <div className="h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent mx-auto max-w-4xl" />}

        {/* Section 8: Transparency & Trust */}
        <TransparencySection isDark={isDark} />

        {/* Section Divider */}
        {!isDark && <div className="h-px bg-gradient-to-r from-transparent via-teal-300 to-transparent mx-auto max-w-4xl" />}

        {/* Section 9: The Invitation (Final CTA) */}
        <InvitationSection isDark={isDark} />
      </main>

      {/* Footer */}
      <footer className={`border-t py-12 ${isDark ? 'bg-slate-950 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-4">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden">
                  <Image
                    src={isDark ? "/images/zeroup-partners-logo-dark-mode.png" : "/images/zeroup-partners-logo-light-mode.png"}
                    alt="ZeroUp"
                    fill
                    className="object-cover"
                  />
                </div>
                <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>ZeroUp Partners</span>
              </Link>
              <p className={`text-sm max-w-md ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                A global ecosystem where individuals and organizations co-create social impact 
                with communities through shared ownership, trust, and long-term collaboration.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Quick Links</h4>
              <nav className="flex flex-col gap-2">
                <Link href="/projects" className={`text-sm transition-colors ${isDark ? 'text-white/40 hover:text-white/70' : 'text-slate-500 hover:text-slate-700'}`}>Projects</Link>
                <Link href="/community" className={`text-sm transition-colors ${isDark ? 'text-white/40 hover:text-white/70' : 'text-slate-500 hover:text-slate-700'}`}>Community</Link>
                <Link href="/resources" className={`text-sm transition-colors ${isDark ? 'text-white/40 hover:text-white/70' : 'text-slate-500 hover:text-slate-700'}`}>Resources</Link>
                <Link href="/dashboard" className={`text-sm transition-colors ${isDark ? 'text-white/40 hover:text-white/70' : 'text-slate-500 hover:text-slate-700'}`}>Dashboard</Link>
              </nav>
            </div>

            {/* Support */}
            <div>
              <h4 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Support</h4>
              <nav className="flex flex-col gap-2">
                <a href="mailto:support@zeroup.org" className={`text-sm transition-colors ${isDark ? 'text-white/40 hover:text-white/70' : 'text-slate-500 hover:text-slate-700'}`}>Contact Us</a>
                <a href="mailto:partners@zeroup.org" className={`text-sm transition-colors ${isDark ? 'text-white/40 hover:text-white/70' : 'text-slate-500 hover:text-slate-700'}`}>Partner Inquiries</a>
              </nav>
            </div>
          </div>

          <div className={`mt-12 pt-8 border-t text-center ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
            <p className={`text-sm ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
              © {new Date().getFullYear()} ZeroUp Partners. Building sustainable impact together.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
