'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

interface EcosystemSectionProps {
  isDark?: boolean
}

export function EcosystemSection({ isDark = true }: EcosystemSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })
  const [animationProgress, setAnimationProgress] = useState(0)

  useEffect(() => {
    if (isInView) {
      const timer = setInterval(() => {
        setAnimationProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer)
            return 100
          }
          return prev + 2
        })
      }, 50)
      return () => clearInterval(timer)
    }
  }, [isInView])

  const nodes = [
    { id: 'partner', label: 'Partner', x: 50, y: 80 },
    { id: 'project', label: 'Project', x: 180, y: 80 },
    { id: 'community', label: 'Community', x: 310, y: 80 },
    { id: 'outcome', label: 'Outcome', x: 440, y: 80 },
  ]

  const getLineProgress = (index: number) => {
    const segmentSize = 100 / 3
    const segmentStart = index * segmentSize
    return Math.max(0, Math.min(100, ((animationProgress - segmentStart) / segmentSize) * 100))
  }

  return (
    <section 
      ref={sectionRef}
      className={`relative py-24 md:py-32 overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-b from-[#130927] via-[#1a0d35] to-[#130927]' 
          : 'bg-gradient-to-b from-[#f5ecff]/50 via-white to-[#f5ecff]/30'
      }`}
    >
      {/* Subtle grid background */}
      <div className={`absolute inset-0 ${isDark ? 'opacity-5' : 'opacity-40'}`}>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${isDark ? 'white' : 'rgb(141, 68, 209)'} 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      {/* Light mode decorative blobs */}
      {!isDark && (
        <>
          <div className="absolute top-20 -left-20 w-72 h-72 bg-[#8d44d1]/6 rounded-full blur-3xl" />
          <div className="absolute bottom-20 -right-20 w-72 h-72 bg-[#8d44d1]/6 rounded-full blur-3xl" />
        </>
      )}

      <div className="mx-auto max-w-7xl px-4 md:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${
              isDark 
                ? 'bg-[#8d44d1]/10 border-[#8d44d1]/20' 
                : 'bg-[#f5ecff] border-slate-200'
            }`}>
              <div className="w-1.5 h-1.5 rounded-full bg-[#a05cd4] animate-pulse" />
              <span className={`text-sm font-medium ${isDark ? 'text-[#a05cd4]' : 'text-[#7030b0]'}`}>The Vision</span>
            </div>
            
            <h2 className={`text-4xl md:text-5xl lg:text-6xl font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Not a Platform.
              <br />
              <span className="bg-gradient-to-r from-[#a05cd4] to-[#8d44d1] bg-clip-text text-transparent">
                An Impact System.
              </span>
            </h2>
            
            <p className={`text-lg md:text-xl leading-relaxed max-w-xl ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
              Zero Partners is a global system where individuals and organizations co-create 
              social impact with communities — not through charity, but through{' '}
              <span className={isDark ? 'text-white/80' : 'text-slate-800 font-medium'}>shared ownership</span>,{' '}
              <span className={isDark ? 'text-white/80' : 'text-slate-800 font-medium'}>trust</span>, and{' '}
              <span className={isDark ? 'text-white/80' : 'text-slate-800 font-medium'}>long-term collaboration</span>.
            </p>
          </motion.div>

          {/* Right: Animated Schematic */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative"
          >
            <div className={`relative rounded-2xl border p-8 md:p-12 backdrop-blur-sm overflow-hidden transition-all duration-300 ${
              isDark 
                ? 'bg-[#1e1040]/50 border-white/5' 
                : 'bg-white/80 border-slate-200 hover:shadow-md'
            }`}>
              {/* Gradient top bar for light mode */}
              {!isDark && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#a05cd4] to-[#8d44d1]" />}
              
              {/* Glow effect */}
              <div className={`absolute inset-0 ${
                isDark 
                  ? 'bg-gradient-to-br from-[#8d44d1]/5 via-transparent to-[#7030b0]/5' 
                  : 'bg-gradient-to-br from-[#f5ecff] via-transparent to-[#f5ecff]'
              }`} />
              
              {/* SVG Diagram — desktop/tablet only */}
              <svg viewBox="0 0 500 160" className="hidden md:block w-full h-auto relative z-10">
                {/* Connection lines */}
                {[0, 1, 2].map((index) => (
                  <g key={`line-${index}`}>
                    {/* Background line */}
                    <line
                      x1={nodes[index].x + 30}
                      y1={nodes[index].y}
                      x2={nodes[index + 1].x - 30}
                      y2={nodes[index + 1].y}
                      stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(100,116,139,0.25)"}
                      strokeWidth="2"
                      strokeDasharray="4,4"
                    />
                    {/* Animated line */}
                    <line
                      x1={nodes[index].x + 30}
                      y1={nodes[index].y}
                      x2={nodes[index].x + 30 + ((nodes[index + 1].x - 30 - nodes[index].x - 30) * getLineProgress(index) / 100)}
                      y2={nodes[index].y}
                      stroke="url(#lineGradient)"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    {/* Arrow head */}
                    {getLineProgress(index) > 80 && (
                      <motion.polygon
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        points={`${nodes[index + 1].x - 35},${nodes[index + 1].y - 5} ${nodes[index + 1].x - 25},${nodes[index + 1].y} ${nodes[index + 1].x - 35},${nodes[index + 1].y + 5}`}
                        fill="rgb(112, 48, 176)"
                      />
                    )}
                  </g>
                ))}

                {/* Gradient definition */}
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgb(141, 68, 209)" />
                    <stop offset="100%" stopColor="rgb(112, 48, 176)" />
                  </linearGradient>
                </defs>

                {/* Nodes */}
                {nodes.map((node, index) => {
                  const segmentSize = 100 / 4
                  const nodeActive = animationProgress >= index * segmentSize
                  
                  return (
                    <g key={node.id}>
                      {/* Glow */}
                      {nodeActive && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r="35"
                          fill="url(#nodeGlow)"
                          className="animate-pulse"
                        />
                      )}
                      {/* Node circle */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="25"
                        fill={nodeActive ? "url(#nodeGradient)" : (isDark ? "rgba(255,255,255,0.1)" : "rgba(100,116,139,0.1)")}
                        stroke={nodeActive ? "rgba(141, 68, 209, 0.5)" : (isDark ? "rgba(255,255,255,0.2)" : "rgba(100,116,139,0.3)")}
                        strokeWidth="2"
                        className="transition-all duration-500"
                      />
                      {/* Icon placeholder - using simple shapes */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="8"
                        fill={nodeActive ? "white" : (isDark ? "rgba(255,255,255,0.3)" : "rgba(100,116,139,0.3)")}
                        className="transition-all duration-500"
                      />
                      {/* Label */}
                      <text
                        x={node.x}
                        y={node.y + 50}
                        textAnchor="middle"
                        fill={nodeActive ? (isDark ? "rgba(255,255,255,0.9)" : "rgb(15,23,42)") : (isDark ? "rgba(255,255,255,0.4)" : "rgba(100,116,139,0.6)")}
                        fontSize="12"
                        fontWeight="500"
                        className="transition-all duration-500"
                      >
                        {node.label}
                      </text>
                    </g>
                  )
                })}

                {/* Gradient definitions */}
                <defs>
                  <radialGradient id="nodeGlow">
                    <stop offset="0%" stopColor="rgba(141, 68, 209, 0.3)" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                  <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgb(141, 68, 209)" />
                    <stop offset="100%" stopColor="rgb(112, 48, 176)" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Mobile: Vertical version */}
              <div className="md:hidden mt-8 space-y-4">
                {nodes.map((node, index) => {
                  const segmentSize = 100 / 4
                  const nodeActive = animationProgress >= index * segmentSize
                  
                  return (
                    <div key={node.id} className="flex items-center gap-4">
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center
                        transition-all duration-500
                        ${nodeActive 
                          ? 'bg-gradient-to-br from-[#8d44d1] to-[#7030b0] shadow-lg' 
                          : isDark ? 'bg-white/10 border border-white/20' : 'bg-slate-100 border border-slate-200'
                        }
                      `}>
                        <div className={`w-3 h-3 rounded-full ${nodeActive ? 'bg-white' : isDark ? 'bg-white/30' : 'bg-slate-400'}`} />
                      </div>
                      <span className={`font-medium transition-colors ${
                        nodeActive 
                          ? isDark ? 'text-white' : 'text-slate-900' 
                          : isDark ? 'text-white/40' : 'text-slate-400'
                      }`}>
                        {node.label}
                      </span>
                      {index < nodes.length - 1 && (
                        <div className="flex-1 h-px bg-gradient-to-r from-[#8d44d1]/50 to-transparent" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
