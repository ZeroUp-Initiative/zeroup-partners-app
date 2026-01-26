'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { 
  Banknote, 
  Wrench, 
  Users, 
  Laptop, 
  Network, 
  BookOpen,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ContributionTypesSectionProps {
  isDark?: boolean
}

const contributionTypes = [
  {
    icon: Banknote,
    title: 'Funding',
    description: 'Direct financial support for project phases',
    color: 'from-emerald-400 to-emerald-600',
    hoverBg: 'group-hover:bg-emerald-500/10'
  },
  {
    icon: Wrench,
    title: 'Skills',
    description: 'Professional expertise where it matters',
    color: 'from-blue-400 to-blue-600',
    hoverBg: 'group-hover:bg-blue-500/10'
  },
  {
    icon: Users,
    title: 'Mentorship',
    description: 'Guide community leaders and youth',
    color: 'from-purple-400 to-purple-600',
    hoverBg: 'group-hover:bg-purple-500/10'
  },
  {
    icon: Laptop,
    title: 'Technology',
    description: 'Tools, platforms, and digital access',
    color: 'from-cyan-400 to-cyan-600',
    hoverBg: 'group-hover:bg-cyan-500/10'
  },
  {
    icon: Network,
    title: 'Networks',
    description: 'Connections that open doors',
    color: 'from-orange-400 to-orange-600',
    hoverBg: 'group-hover:bg-orange-500/10'
  },
  {
    icon: BookOpen,
    title: 'Research & Insight',
    description: 'Knowledge that shapes strategy',
    color: 'from-rose-400 to-rose-600',
    hoverBg: 'group-hover:bg-rose-500/10'
  }
]

export function ContributionTypesSection({ isDark = true }: ContributionTypesSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  return (
    <section 
      ref={sectionRef}
      className={`relative py-24 md:py-32 overflow-hidden ${
        isDark ? 'bg-slate-950' : 'bg-gradient-to-b from-purple-50/30 via-white to-pink-50/30'
      }`}
    >
      {/* Background glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial blur-3xl ${
        isDark ? 'from-emerald-500/5 via-transparent to-transparent' : 'from-purple-200/40 via-pink-100/20 to-transparent'
      }`} />
      
      {/* Light mode decorative blobs */}
      {!isDark && (
        <>
          <div className="absolute top-20 left-20 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-pink-200/30 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-10 w-48 h-48 bg-blue-200/20 rounded-full blur-3xl" />
        </>
      )}

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-6 ${
            isDark ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-200'
          }`}>
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span className={`text-sm font-medium ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>Ways to Contribute</span>
          </div>
          
          <h2 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            More Than{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Money
            </span>
          </h2>
          <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-white/50' : 'text-slate-600'}`}>
            Impact grows when resources meet context. Your unique contribution matters.
          </p>
        </motion.div>

        {/* Contribution Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {contributionTypes.map((type, index) => (
            <motion.div
              key={type.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className={`
                relative h-full p-6 md:p-8 rounded-2xl border 
                backdrop-blur-sm transition-all duration-500
                hover:shadow-xl ${type.hoverBg}
                ${isDark 
                  ? 'border-white/5 bg-slate-900/30 hover:border-white/10' 
                  : 'border-slate-200 bg-white/90 shadow-lg ring-1 ring-slate-100 hover:border-purple-300 hover:shadow-purple-500/10 hover:ring-purple-200'
                }
              `}>
                {/* Gradient top bar for light mode */}
                {!isDark && <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r ${type.color}`} />}
                {/* Icon */}
                <div className={`
                  w-14 h-14 rounded-xl mb-5 flex items-center justify-center
                  bg-gradient-to-br ${type.color} shadow-lg
                  transition-transform duration-300 group-hover:scale-110
                `}>
                  <type.icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <h3 className={`text-xl font-semibold mb-2 transition-colors ${
                  isDark ? 'text-white group-hover:text-emerald-400' : 'text-slate-900 group-hover:text-purple-600'
                }`}>
                  {type.title}
                </h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-white/50' : 'text-slate-600'}`}>
                  {type.description}
                </p>

                {/* Hover indicator */}
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className={`w-5 h-5 ${isDark ? 'text-white/30' : 'text-slate-400'}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <p className={`italic mb-6 ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
            "Impact grows when resources meet context."
          </p>
          <Link href="/signup">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/20"
            >
              Find Your Way to Contribute
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
