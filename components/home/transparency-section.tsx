'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { 
  FileText, 
  Route, 
  Shield, 
  RefreshCw,
  Check
} from 'lucide-react'

const principles = [
  {
    icon: FileText,
    title: 'Open Impact Reporting',
    description: 'Every project, every outcome — transparent and accessible to all stakeholders.',
    color: 'from-emerald-400 to-teal-400'
  },
  {
    icon: Route,
    title: 'Clear Funding Pathways',
    description: 'Know exactly where your contribution goes and how it creates impact.',
    color: 'from-blue-400 to-cyan-400'
  },
  {
    icon: Shield,
    title: 'Community-Led Accountability',
    description: 'Communities verify outcomes. Their voice determines success.',
    color: 'from-purple-400 to-violet-400'
  },
  {
    icon: RefreshCw,
    title: 'Continuous Learning',
    description: 'We adapt, improve, and share what we learn with the ecosystem.',
    color: 'from-amber-400 to-orange-400'
  }
]

interface TransparencySectionProps {
  isDark?: boolean
}

export function TransparencySection({ isDark = true }: TransparencySectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  return (
    <section 
      ref={sectionRef}
      className={`relative py-24 md:py-32 overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950' 
          : 'bg-gradient-to-b from-emerald-50/40 via-white to-teal-50/30'
      }`}
    >
      {/* Background nodes pattern */}
      <div className={`absolute inset-0 ${isDark ? 'opacity-10' : 'opacity-30'}`}>
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="trustGrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1" fill="currentColor" className="text-emerald-500" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#trustGrid)" />
        </svg>
      </div>
      
      {/* Light mode decorative blobs */}
      {!isDark && (
        <>
          <div className="absolute top-20 left-10 w-64 h-64 bg-emerald-200/40 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-teal-200/40 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-green-100/30 rounded-full blur-3xl" />
        </>
      )}

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-6 ${
              isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
            }`}>
              <Shield className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <span className={`text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Our Promise</span>
            </div>
            
            <h2 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Built on{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Transparency
              </span>
            </h2>
            
            <p className={`text-lg leading-relaxed mb-8 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
              Trust isn't claimed — it's earned through radical openness. 
              Every decision, every outcome, every lesson is shared with our ecosystem.
            </p>

            {/* Quick trust indicators */}
            <div className="flex flex-wrap gap-4">
              {['Open Data', 'Verified Outcomes', 'Community Audits'].map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                    isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
                  }`}
                >
                  <Check className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <span className={`text-sm ${isDark ? 'text-white/80' : 'text-slate-700'}`}>{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Principles cards */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid sm:grid-cols-2 gap-4"
          >
            {principles.map((principle, index) => (
              <motion.div
                key={principle.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="group"
              >
                <div className={`h-full p-6 rounded-2xl border transition-all duration-300 ${
                  isDark 
                    ? 'bg-slate-900/50 border-white/5 hover:border-white/10 hover:bg-slate-900/70' 
                    : 'bg-white/90 border-emerald-200 shadow-lg ring-1 ring-emerald-100 hover:border-emerald-300 hover:shadow-emerald-500/15 hover:ring-emerald-200'
                }`}>
                  {/* Gradient top bar for light mode */}
                  {!isDark && <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r ${principle.color}`} />}
                  {/* Icon */}
                  <div className={`
                    w-12 h-12 rounded-xl mb-4 flex items-center justify-center
                    bg-gradient-to-br ${principle.color} shadow-lg
                  `}>
                    <principle.icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {principle.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-white/50' : 'text-slate-600'}`}>
                    {principle.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
