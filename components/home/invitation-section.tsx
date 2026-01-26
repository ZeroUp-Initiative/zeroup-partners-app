'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface InvitationSectionProps {
  isDark?: boolean
}

export function InvitationSection({ isDark = true }: InvitationSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  return (
    <section 
      ref={sectionRef}
      className={`relative py-32 md:py-48 overflow-hidden ${
        isDark ? 'bg-slate-950' : 'bg-gradient-to-b from-teal-50/40 via-white to-emerald-50/50'
      }`}
    >
      {/* Background constellation fade */}
      <div className="absolute inset-0">
        {/* Radial gradient from center */}
        <div className={`absolute inset-0 ${
          isDark 
            ? 'bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.08)_0%,_transparent_60%)]' 
            : 'bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.20)_0%,_transparent_70%)]'
        }`} />
        
        {/* Light mode decorative blobs */}
        {!isDark && (
          <>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-200/40 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-100/30 rounded-full blur-3xl" />
          </>
        )}
        
        {/* Animated particles/stars */}
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-1 h-1 rounded-full ${isDark ? 'bg-white/20' : 'bg-emerald-500/30'}`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.1, 0.5, 0.1],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
            />
          ))}
        </div>

        {/* Soft connection lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 1000 600" preserveAspectRatio="none">
          <motion.path
            d="M100,300 Q300,200 500,300 T900,300"
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          <motion.path
            d="M200,400 Q400,350 500,400 T800,350"
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
            transition={{ duration: 2, delay: 0.3, ease: "easeInOut" }}
          />
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="rgb(16, 185, 129)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center"
        >
          {/* Animated icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
            className={`w-20 h-20 mx-auto mb-8 rounded-full flex items-center justify-center ${
              isDark 
                ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20' 
                : 'bg-gradient-to-br from-emerald-100 to-teal-100 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-200'
            }`}
          >
            <Sparkles className="w-10 h-10 text-emerald-400" />
          </motion.div>

          {/* Title */}
          <h2 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Step Into the{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Ecosystem
            </span>
          </h2>

          {/* Copy */}
          <p className={`text-xl md:text-2xl leading-relaxed mb-12 max-w-2xl mx-auto ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
            Zero Partners is an invitation to rethink how change happens — 
            and to <span className={isDark ? 'text-white/80' : 'text-slate-800 font-medium'}>build it together</span>.
          </p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/signup">
              <Button 
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-lg px-8 py-6 shadow-xl shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:scale-105"
              >
                Become a Zero Partner
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/projects">
              <Button 
                size="lg"
                variant="outline"
                className={`w-full sm:w-auto text-lg px-8 py-6 ${
                  isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Explore the Ecosystem
              </Button>
            </Link>
          </motion.div>

          {/* Trust line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.8 }}
            className={`mt-12 text-sm ${isDark ? 'text-white/30' : 'text-slate-500'}`}
          >
            Join a growing community of partners creating sustainable change worldwide.
          </motion.p>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className={`absolute bottom-0 left-0 right-0 h-32 ${
        isDark ? 'bg-gradient-to-t from-slate-950 to-transparent' : 'bg-gradient-to-t from-emerald-50/50 to-transparent'
      }`} />
    </section>
  )
}
