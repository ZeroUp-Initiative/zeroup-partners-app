'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Users, Lightbulb, Heart, BarChart3, Repeat } from 'lucide-react'

const steps = [
  {
    icon: Users,
    title: 'Partners Join the Ecosystem',
    description: 'Individuals and organizations enter as collaborators, not donors.',
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20'
  },
  {
    icon: Lightbulb,
    title: 'Projects Are Co-Designed',
    description: 'Communities define needs. Partners provide resources and expertise.',
    color: 'from-amber-400 to-orange-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20'
  },
  {
    icon: Heart,
    title: 'Communities Lead Implementation',
    description: 'Local leaders drive execution with partner support.',
    color: 'from-rose-400 to-pink-500',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/20'
  },
  {
    icon: BarChart3,
    title: 'Impact Is Tracked & Shared',
    description: 'Real progress, real stories, complete transparency.',
    color: 'from-emerald-400 to-teal-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20'
  },
  {
    icon: Repeat,
    title: 'Systems Strengthen Over Time',
    description: 'Success compounds. Communities become partners.',
    color: 'from-purple-400 to-violet-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20'
  }
]

export function ImpactFlowSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  return (
    <section 
      ref={sectionRef}
      className="relative py-24 md:py-32 bg-slate-950 overflow-hidden"
    >
      {/* Background accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent blur-3xl" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-sm text-teal-400 font-medium">The Journey</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            How Impact{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Flows
            </span>
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            A living system where every contribution creates ripples of change
          </p>
        </motion.div>

        {/* Desktop: Horizontal flow */}
        <div className="hidden lg:block relative">
          {/* Connection line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2" />
          
          <div className="grid grid-cols-5 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="relative group"
              >
                {/* Card */}
                <div className={`
                  relative p-6 rounded-2xl border backdrop-blur-sm
                  transition-all duration-500 hover:scale-105
                  ${step.bgColor} ${step.borderColor}
                `}>
                  {/* Step number */}
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-white/60">{index + 1}</span>
                  </div>
                  
                  {/* Icon */}
                  <div className={`
                    w-14 h-14 rounded-xl mb-4 flex items-center justify-center
                    bg-gradient-to-br ${step.color} shadow-lg
                  `}>
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-lg font-semibold text-white mb-2 leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-sm text-white/50 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow connector (except last) */}
                {index < steps.length - 1 && (
                  <div className="absolute top-1/2 -right-6 transform -translate-y-1/2 z-10">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.4, delay: index * 0.15 + 0.3 }}
                      className="w-6 h-6 flex items-center justify-center"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path 
                          d="M9 6L15 12L9 18" 
                          stroke="rgba(255,255,255,0.3)" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                      </svg>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile & Tablet: Vertical flow */}
        <div className="lg:hidden space-y-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {/* Vertical line connector */}
              {index < steps.length - 1 && (
                <div className="absolute left-7 top-20 bottom-0 w-0.5 bg-gradient-to-b from-white/20 to-transparent" />
              )}
              
              <div className="flex gap-4">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className={`
                    w-14 h-14 rounded-xl flex items-center justify-center
                    bg-gradient-to-br ${step.color} shadow-lg shadow-black/20
                  `}>
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                </div>
                
                {/* Content */}
                <div className={`
                  flex-1 p-4 rounded-xl border backdrop-blur-sm
                  ${step.bgColor} ${step.borderColor}
                `}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-white/40">Step {index + 1}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-white/50">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
