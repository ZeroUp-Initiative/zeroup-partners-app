'use client'

import Link from 'next/link'
import Image from 'next/image'

interface FooterSectionProps {
  isDark: boolean
}

export function FooterSection({ isDark }: FooterSectionProps) {
  return (
    <footer
      className={`border-t py-12 ${isDark ? 'border-white/5' : 'bg-slate-100 border-slate-200'}`}
      style={isDark ? { backgroundColor: '#130927' } : undefined}
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden">
                <Image
                  src={isDark ? '/images/zeroup-partners-logo-dark-mode.png' : '/images/zeroup-partners-logo-light-mode.png'}
                  alt="ZeroUp"
                  fill
                  className="object-cover"
                />
              </div>
              <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                ZeroUp Partners
              </span>
            </Link>
            <p className={`text-sm max-w-md ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
              A global ecosystem where individuals and organizations co-create social impact with
              communities through shared ownership, trust, and long-term collaboration.
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
  )
}
