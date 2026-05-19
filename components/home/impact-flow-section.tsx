'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { HandCoins, Users, Repeat2 } from 'lucide-react'

interface ImpactFlowSectionProps {
  isDark?: boolean
}

const steps = [
  {
    icon: HandCoins,
    step: '01',
    title: 'Partners Bring Resources',
    description:
      'Individuals and organizations join not as donors but as collaborators — bringing funding, skills, expertise, networks, and time to where it matters most.',
  },
  {
    icon: Users,
    step: '02',
    title: 'Communities Define & Lead',
    description:
      'Communities identify their own needs and lead execution. Partners co-design alongside them — not above them. Local leaders drive every project from the ground up.',
  },
  {
    icon: Repeat2,
    step: '03',
    title: 'Impact Loops Back',
    description:
      'Every outcome is tracked and shared openly. When communities succeed, they become partners themselves — creating a regenerative loop, not a dependency.',
  },
]

export function ImpactFlowSection({ isDark = true }: ImpactFlowSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  return (
    <section
      ref={sectionRef}
      className="relative py-24 md:py-32 overflow-hidden"
      style={isDark ? { backgroundColor: '#130927' } : undefined}
    >
      {!isDark && (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50" />
      )}

      {/* Subtle top glow */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[280px] blur-3xl pointer-events-none ${
          isDark ? 'bg-[#8d44d1]/8' : 'bg-[#8d44d1]/5'
        }`}
      />

      <div className="mx-auto max-w-7xl px-4 md:px-6 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-6 ${
              isDark
                ? 'bg-[#8d44d1]/10 border-[#8d44d1]/20'
                : 'bg-[#f5ecff] border-slate-200'
            }`}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#8d44d1] animate-pulse" />
            <span className={`text-sm font-medium ${isDark ? 'text-[#a05cd4]' : 'text-[#5e269a]'}`}>
              How It Works
            </span>
          </div>

          <h2
            className={`text-4xl md:text-5xl font-bold mb-4 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Not charity.{' '}
            <span className="bg-gradient-to-r from-[#a05cd4] to-[#8d44d1] bg-clip-text text-transparent">
              Shared ownership.
            </span>
          </h2>
          <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            A regenerative loop where every contribution strengthens the whole system over time.
          </p>
        </motion.div>

        {/* Cards grid — same on all screen sizes, stacks on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="group"
            >
              {/* Single card */}
              <div
                className={`flex flex-col h-full p-6 rounded-2xl border transition-all duration-300 group-hover:border-[#8d44d1]/30 ${
                  isDark
                    ? 'bg-[#1e1040]/50 border-white/5 hover:bg-[#1e1040]/80'
                    : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#8d44d1] to-[#7030b0] shadow-md mb-5 ${
                    isDark ? 'shadow-[#8d44d1]/25' : 'shadow-[#8d44d1]/15'
                  }`}
                >
                  <step.icon className="w-5 h-5 text-white" />
                </div>

                {/* Title + description */}
                <h3
                  className={`text-lg font-semibold mb-3 leading-snug ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {step.title}
                </h3>
                <p
                  className={`text-sm leading-relaxed flex-1 ${
                    isDark ? 'text-white/45' : 'text-slate-500'
                  }`}
                >
                  {step.description}
                </p>

                {/* Step number — bottom of card */}
                <div className="mt-6 pt-4 border-t border-dashed border-current/10">
                  <span
                    className={`text-3xl font-black leading-none select-none ${
                      isDark ? 'text-white/10' : 'text-slate-900/10'
                    }`}
                  >
                    {step.step}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
