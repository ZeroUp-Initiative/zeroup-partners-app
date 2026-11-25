'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Menu, X, ArrowRight } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/#challenge' },
  { label: 'Initiatives', href: '/projects' },
  { label: 'Partners', href: '/#partners' },
  { label: 'Impact', href: '/#what-we-do' },
  { label: 'Resources', href: '/resources' },
]

interface SiteHeaderProps {
  isLoggedIn?: boolean
}

export function SiteHeader({ isLoggedIn }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="relative z-50 bg-editorial-cream">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <Image
              src="/images/zeroup-partners-logo-light-mode.png"
              alt="ZeroUp Partners"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
            <div className="leading-tight">
              <p className="text-base font-bold text-editorial-navy">ZeroUp Partners</p>
              <p className="text-[11px] tracking-wide text-editorial-muted">People. Partnerships. Possibilities.</p>
            </div>
          </Link>

          {/* Center nav — this header only ever renders on "/", so Home is always active */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link, i) => (
              <Link
                key={link.label}
                href={link.href}
                className={`px-3.5 py-2 text-sm font-medium transition-colors ${
                  i === 0
                    ? 'text-editorial-navy underline underline-offset-8 decoration-2'
                    : 'text-editorial-navy/80 hover:text-editorial-navy'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              aria-label="Search"
              className="hidden sm:flex w-10 h-10 items-center justify-center rounded-full border border-editorial-border text-editorial-navy hover:bg-editorial-cream-soft transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
            <Link
              href={isLoggedIn ? '/dashboard' : '/signup'}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-editorial-navy text-white text-sm font-semibold px-5 h-10 hover:bg-editorial-navy-deep transition-colors"
            >
              {isLoggedIn ? 'Dashboard' : 'Partner With Us'}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex lg:hidden w-10 h-10 items-center justify-center rounded-full border border-editorial-border text-editorial-navy"
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden border-t border-editorial-border bg-editorial-cream px-4 py-4 space-y-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-editorial-navy hover:bg-editorial-cream-soft transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={isLoggedIn ? '/dashboard' : '/signup'}
            onClick={() => setMenuOpen(false)}
            className="mt-2 flex items-center justify-center gap-1.5 rounded-full bg-editorial-navy text-white text-sm font-semibold px-5 h-11"
          >
            {isLoggedIn ? 'Dashboard' : 'Partner With Us'}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </header>
  )
}
