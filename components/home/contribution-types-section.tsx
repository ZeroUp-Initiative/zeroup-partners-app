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

export function ContributionTypesSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  return (
    <section 
      ref={sectionRef}
      className="relative py-24 md:py-32 bg-slate-950 overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-emerald-500/5 via-transparent to-transparent blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-sm text-purple-400 font-medium">Ways to Contribute</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            More Than{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Money
            </span>
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
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
                relative h-full p-6 md:p-8 rounded-2xl border border-white/5 
                bg-slate-900/30 backdrop-blur-sm transition-all duration-500
                hover:border-white/10 hover:shadow-xl ${type.hoverBg}
              `}>
                {/* Icon */}
                <div className={`
                  w-14 h-14 rounded-xl mb-5 flex items-center justify-center
                  bg-gradient-to-br ${type.color} shadow-lg
                  transition-transform duration-300 group-hover:scale-110
                `}>
                  <type.icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                  {type.title}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  {type.description}
                </p>

                {/* Hover indicator */}
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-5 h-5 text-white/30" />
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
          <p className="text-white/40 italic mb-6">
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
