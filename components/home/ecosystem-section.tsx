'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

export function EcosystemSection() {
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
      className="relative py-24 md:py-32 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden"
    >
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-emerald-400 font-medium">The Vision</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Not a Platform.
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                An Impact System.
              </span>
            </h2>
            
            <p className="text-lg md:text-xl text-white/60 leading-relaxed max-w-xl">
              Zero Partners is a global system where individuals and organizations co-create 
              social impact with communities — not through charity, but through{' '}
              <span className="text-white/80">shared ownership</span>,{' '}
              <span className="text-white/80">trust</span>, and{' '}
              <span className="text-white/80">long-term collaboration</span>.
            </p>
          </motion.div>

          {/* Right: Animated Schematic */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative bg-slate-900/50 rounded-2xl border border-white/5 p-8 md:p-12 backdrop-blur-sm overflow-hidden">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5" />
              
              {/* SVG Diagram */}
              <svg viewBox="0 0 500 160" className="w-full h-auto relative z-10">
                {/* Connection lines */}
                {[0, 1, 2].map((index) => (
                  <g key={`line-${index}`}>
                    {/* Background line */}
                    <line
                      x1={nodes[index].x + 30}
                      y1={nodes[index].y}
                      x2={nodes[index + 1].x - 30}
                      y2={nodes[index + 1].y}
                      stroke="rgba(255,255,255,0.1)"
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
                        fill="rgb(45, 212, 191)"
                      />
                    )}
                  </g>
                ))}

                {/* Gradient definition */}
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgb(16, 185, 129)" />
                    <stop offset="100%" stopColor="rgb(45, 212, 191)" />
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
                        fill={nodeActive ? "url(#nodeGradient)" : "rgba(255,255,255,0.1)"}
                        stroke={nodeActive ? "rgba(16, 185, 129, 0.5)" : "rgba(255,255,255,0.2)"}
                        strokeWidth="2"
                        className="transition-all duration-500"
                      />
                      {/* Icon placeholder - using simple shapes */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="8"
                        fill={nodeActive ? "white" : "rgba(255,255,255,0.3)"}
                        className="transition-all duration-500"
                      />
                      {/* Label */}
                      <text
                        x={node.x}
                        y={node.y + 50}
                        textAnchor="middle"
                        fill={nodeActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)"}
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
                    <stop offset="0%" stopColor="rgba(16, 185, 129, 0.3)" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                  <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgb(16, 185, 129)" />
                    <stop offset="100%" stopColor="rgb(20, 184, 166)" />
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
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25' 
                          : 'bg-white/10 border border-white/20'
                        }
                      `}>
                        <div className={`w-3 h-3 rounded-full ${nodeActive ? 'bg-white' : 'bg-white/30'}`} />
                      </div>
                      <span className={`font-medium transition-colors ${nodeActive ? 'text-white' : 'text-white/40'}`}>
                        {node.label}
                      </span>
                      {index < nodes.length - 1 && (
                        <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/50 to-transparent" />
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
