'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ConstellationNodeData } from './constellation-node'

interface ConnectionLineProps {
  from: ConstellationNodeData
  to: ConstellationNodeData
  isHighlighted: boolean
  highlightMessage?: string
}

export function ConnectionLine({ from, to, isHighlighted, highlightMessage }: ConnectionLineProps) {
  const lineRef = useRef<SVGLineElement>(null)

  // Calculate midpoint for potential label
  const midX = (from.x + to.x) / 2
  const midY = (from.y + to.y) / 2

  // Calculate line length for animation
  const length = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2))

  return (
    <g>
      {/* Background glow line */}
      <motion.line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={isHighlighted ? "rgba(52, 211, 153, 0.3)" : "rgba(148, 163, 184, 0.1)"}
        strokeWidth={isHighlighted ? 6 : 2}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, delay: Math.random() * 0.5 }}
        filter={isHighlighted ? "blur(4px)" : undefined}
      />

      {/* Main line */}
      <motion.line
        ref={lineRef}
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={isHighlighted ? "rgba(52, 211, 153, 0.8)" : "rgba(148, 163, 184, 0.25)"}
        strokeWidth={isHighlighted ? 2 : 1}
        strokeLinecap="round"
        strokeDasharray={isHighlighted ? "none" : "4 4"}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, delay: Math.random() * 0.5 }}
      />

      {/* Animated pulse along the line */}
      {isHighlighted && (
        <motion.circle
          r={4}
          fill="rgba(52, 211, 153, 0.9)"
          filter="blur(2px)"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            cx: [from.x, to.x],
            cy: [from.y, to.y]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}

      {/* Highlight message */}
      {isHighlighted && highlightMessage && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <rect
            x={midX - 90}
            y={midY - 14}
            width={180}
            height={28}
            rx={14}
            fill="rgba(15, 23, 42, 0.9)"
            stroke="rgba(52, 211, 153, 0.3)"
            strokeWidth={1}
          />
          <text
            x={midX}
            y={midY + 4}
            textAnchor="middle"
            fill="rgba(255, 255, 255, 0.9)"
            fontSize={11}
            fontFamily="system-ui"
          >
            {highlightMessage}
          </text>
        </motion.g>
      )}
    </g>
  )
}

interface ConnectionLinesProps {
  connections: Array<{
    from: ConstellationNodeData
    to: ConstellationNodeData
    message?: string
    isPartnerConnection?: boolean
  }>
  hoveredNodeId: string | null
  width: number
  height: number
}

export function ConnectionLines({ connections, hoveredNodeId, width, height }: ConnectionLinesProps) {
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={width}
      height={height}
      style={{ zIndex: 5 }}
    >
      <defs>
        {/* Gradient for lines */}
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(52, 211, 153, 0.6)" />
          <stop offset="50%" stopColor="rgba(139, 92, 246, 0.6)" />
          <stop offset="100%" stopColor="rgba(251, 191, 36, 0.6)" />
        </linearGradient>
        
        {/* Glow filter */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {connections.map((connection, index) => {
        const isHighlighted = 
          hoveredNodeId === connection.from.id || 
          hoveredNodeId === connection.to.id

        return (
          <ConnectionLine
            key={`${connection.from.id}-${connection.to.id}-${index}`}
            from={connection.from}
            to={connection.to}
            isHighlighted={isHighlighted}
            highlightMessage={isHighlighted ? connection.message : undefined}
          />
        )
      })}
    </svg>
  )
}
