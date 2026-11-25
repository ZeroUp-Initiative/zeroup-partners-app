'use client'

import Link from 'next/link'
import Image from 'next/image'

export function FooterSection() {
  return (
    <footer className="border-t border-white/10 bg-editorial-navy-deep py-12">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden">
                <Image
                  src="/images/zeroup-partners-logo-dark-mode.png"
                  alt="ZeroUp"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-lg font-bold text-white">ZeroUp Partners</span>
            </Link>
            <p className="text-sm max-w-md text-white/40">
              A global ecosystem where individuals and organizations co-create social impact with
              communities through shared ownership, trust, and long-term collaboration.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Quick Links</h4>
            <nav className="flex flex-col gap-1">
              <Link href="/projects" className="text-sm py-1.5 min-h-[36px] flex items-center transition-colors text-white/40 hover:text-white/70">Initiatives</Link>
              <Link href="/schools" className="text-sm py-1.5 min-h-[36px] flex items-center transition-colors text-white/40 hover:text-white/70">Partner Schools</Link>
              <Link href="/community" className="text-sm py-1.5 min-h-[36px] flex items-center transition-colors text-white/40 hover:text-white/70">Community</Link>
              <Link href="/resources" className="text-sm py-1.5 min-h-[36px] flex items-center transition-colors text-white/40 hover:text-white/70">Resources</Link>
              <Link href="/dashboard" className="text-sm py-1.5 min-h-[36px] flex items-center transition-colors text-white/40 hover:text-white/70">Dashboard</Link>
            </nav>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Support</h4>
            <nav className="flex flex-col gap-1">
              <a href="mailto:support@zeroup.org" className="text-sm py-1.5 min-h-[36px] flex items-center transition-colors text-white/40 hover:text-white/70">Contact Us</a>
              <a href="mailto:partners@zeroup.org" className="text-sm py-1.5 min-h-[36px] flex items-center transition-colors text-white/40 hover:text-white/70">Partner Inquiries</a>
            </nav>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-sm text-white/30">
            © {new Date().getFullYear()} ZeroUp Partners. Building sustainable impact together.
          </p>
        </div>
      </div>
    </footer>
  )
}
