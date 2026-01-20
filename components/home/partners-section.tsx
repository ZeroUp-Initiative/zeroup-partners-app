'use client'

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

// Sample partner data - in production this would come from a database
const partners = [
  { name: 'TechBridge Africa', since: '2024', impact: 'Technology Access' },
  { name: 'Global Education Fund', since: '2024', impact: 'Education' },
  { name: 'Green Future Initiative', since: '2024', impact: 'Environment' },
  { name: 'Community Health Alliance', since: '2024', impact: 'Healthcare' },
  { name: 'Youth Empowerment Network', since: '2025', impact: 'Youth Development' },
  { name: 'Sustainable Livelihoods', since: '2025', impact: 'Economic Growth' },
]

export function PartnersSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <section 
      ref={sectionRef}
      className="relative py-24 md:py-32 bg-slate-950 overflow-hidden"
    >
      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-sm text-blue-400 font-medium">Our Partners</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            Who Builds{' '}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              With Us
            </span>
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Partners, not sponsors. Organizations committed to genuine collaboration.
          </p>
        </motion.div>

        {/* Partner Grid - Minimal, elegant */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {partners.map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="relative group"
            >
              <div className={`
                h-32 md:h-40 rounded-2xl border transition-all duration-500
                flex items-center justify-center cursor-default
                ${hoveredIndex === index 
                  ? 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/30' 
                  : 'bg-slate-900/30 border-white/5 hover:border-white/10'
                }
              `}>
                {/* Logo placeholder - would be actual logos in production */}
                <div className="text-center px-4">
                  <div className={`
                    text-lg md:text-xl font-semibold transition-colors
                    ${hoveredIndex === index ? 'text-white' : 'text-white/60'}
                  `}>
                    {partner.name}
                  </div>
                  
                  {/* Hover tooltip */}
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ 
                      opacity: hoveredIndex === index ? 1 : 0,
                      y: hoveredIndex === index ? 0 : 5
                    }}
                    className="mt-2 text-sm text-white/40"
                  >
                    Partnered since {partner.since} • {partner.impact}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Become a partner CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-12 md:mt-16"
        >
          <p className="text-white/40 mb-4">
            Interested in partnering with us?
          </p>
          <a 
            href="mailto:partners@zeroup.org" 
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium"
          >
            Get in touch
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  )
}
