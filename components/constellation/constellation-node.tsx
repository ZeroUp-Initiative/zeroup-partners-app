'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export type NodeType = 'partner' | 'project' | 'community' | 'milestone'
export type DepthLayer = 'foreground' | 'midground' | 'background'
export type PartnerTier = 'primary' | 'secondary' | 'tertiary'

export interface ConstellationNodeData {
  id: string
  type: NodeType
  label: string
  subtitle?: string
  x: number
  y: number
  photoURL?: string
  status?: 'active' | 'completed' | 'upcoming'
  impactSnapshot?: string
  isCenter?: boolean
  // New properties for enhanced constellation
  depth?: DepthLayer
  partnerTier?: PartnerTier
  partnerSince?: string
}

interface ConstellationNodeProps {
  node: ConstellationNodeData
  isHovered: boolean
  isSelected: boolean
  onHover: (id: string | null) => void
  onClick: (node: ConstellationNodeData) => void
  scale?: number
  isMobile?: boolean
}

export function ConstellationNode({
  node,
  isHovered,
  isSelected,
  onHover,
  onClick,
  scale = 1,
  isMobile = false
}: ConstellationNodeProps) {
  // ============================================================
  // SIZE CALCULATION (considers tier, depth, and mobile)
  // ============================================================
  const getNodeSize = () => {
    // Mobile multiplier - smaller nodes on mobile
    const mobileMultiplier = isMobile ? 0.7 : 1
    
    const baseSize = (() => {
      if (node.isCenter) return 80
      switch (node.type) {
        case 'partner':
          // Tier-based sizing
          switch (node.partnerTier) {
            case 'primary': return 65
            case 'secondary': return 50
            case 'tertiary': return 38
            default: return 45
          }
        case 'project':
          return 52
        case 'community':
          return 58
        case 'milestone':
          return 42
        default:
          return 45
      }
    })()
    
    // Depth-based size adjustment
    const depthScale = node.depth === 'background' ? 0.7 
                     : node.depth === 'midground' ? 0.85 
                     : 1
    
    return baseSize * depthScale * scale * mobileMultiplier
  }

  // ============================================================
  // COLOR GRADIENTS
  // ============================================================
  const getNodeColor = () => {
    switch (node.type) {
      case 'partner':
        // Tier-based coloring
        switch (node.partnerTier) {
          case 'primary': return 'from-emerald-400 to-teal-500'
          case 'secondary': return 'from-blue-400 to-indigo-500'
          case 'tertiary': return 'from-slate-400 to-slate-500'
          default: return 'from-emerald-400 to-teal-500'
        }
      case 'project':
        return 'from-violet-400 to-purple-500'
      case 'community':
        return 'from-amber-400 to-orange-500'
      case 'milestone':
        return node.status === 'completed' 
          ? 'from-emerald-300 to-green-400' 
          : 'from-slate-400 to-slate-500'
      default:
        return 'from-blue-400 to-cyan-500'
    }
  }

  const getGlowColor = () => {
    switch (node.type) {
      case 'partner':
        switch (node.partnerTier) {
          case 'primary': return 'rgba(52, 211, 153, 0.5)'
          case 'secondary': return 'rgba(96, 165, 250, 0.4)'
          case 'tertiary': return 'rgba(148, 163, 184, 0.25)'
          default: return 'rgba(52, 211, 153, 0.4)'
        }
      case 'project':
        return 'rgba(139, 92, 246, 0.4)'
      case 'community':
        return 'rgba(251, 191, 36, 0.4)'
      case 'milestone':
        return node.status === 'completed' 
          ? 'rgba(74, 222, 128, 0.5)' 
          : 'rgba(148, 163, 184, 0.3)'
      default:
        return 'rgba(96, 165, 250, 0.4)'
    }
  }

  // ============================================================
  // OPACITY & BLUR (Depth system)
  // ============================================================
  const getDepthOpacity = () => {
    if (isHovered || isSelected) return 1
    switch (node.depth) {
      case 'background': return 0.5
      case 'midground': return 0.75
      default: return 1
    }
  }

  const getDepthBlur = () => {
    if (isHovered) return 0
    switch (node.depth) {
      case 'background': return 1
      case 'midground': return 0.5
      default: return 0
    }
  }

  // ============================================================
  // Z-INDEX (Layer order)
  // ============================================================
  const getZIndex = () => {
    if (isHovered || isSelected) return 100
    if (node.isCenter) return 90
    switch (node.depth) {
      case 'foreground': return 30
      case 'midground': return 20
      case 'background': return 10
      default: return 25
    }
  }

  const size = getNodeSize()
  const isMilestone = node.type === 'milestone'
  const isCompleted = node.status === 'completed'
  const isPartner = node.type === 'partner'
  const isPrimaryPartner = node.partnerTier === 'primary'

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        left: node.x,
        top: node.y,
        transform: 'translate(-50%, -50%)',
        zIndex: getZIndex(),
        filter: `blur(${getDepthBlur()}px)`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: getDepthOpacity(), 
        scale: isHovered ? 1.12 : 1,
      }}
      transition={{ 
        duration: 0.8, // Slower, calmer
        delay: Math.random() * 0.8,
        scale: { duration: 0.3 }
      }}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(node)}
    >
      {/* Outer glow effect */}
      <motion.div
        className={cn(
          "absolute inset-0 rounded-full transition-opacity duration-500",
          isHovered || isCompleted || isPrimaryPartner ? "opacity-100" : "opacity-30"
        )}
        style={{
          background: `radial-gradient(circle, ${getGlowColor()} 0%, transparent 70%)`,
          width: size * 2,
          height: size * 2,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}
        // Primary partners get subtle auto-focus pulse
        animate={isPrimaryPartner && !isHovered ? {
          scale: [1, 1.1, 1],
          opacity: [0.4, 0.6, 0.4]
        } : {}}
        transition={{
          duration: 4, // Slow pulse
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Completed milestone pulse ring */}
      {isCompleted && (
        <motion.div
          className="absolute rounded-full border border-emerald-400/40"
          style={{
            width: size * 1.8,
            height: size * 1.8,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.4, 0, 0.4]
          }}
          transition={{
            duration: 3, // Slow
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}

      {/* Partner circular frame */}
      {isPartner && (
        <div
          className={cn(
            "absolute rounded-full border-2 transition-all duration-300",
            isPrimaryPartner 
              ? "border-emerald-400/60" 
              : node.partnerTier === 'secondary' 
                ? "border-blue-400/40" 
                : "border-white/20"
          )}
          style={{
            width: size + 6,
            height: size + 6,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: isPrimaryPartner ? `0 0 20px ${getGlowColor()}` : 'none'
          }}
        />
      )}

      {/* Node shape */}
      <div
        className={cn(
          "relative flex items-center justify-center transition-all duration-300",
          isMilestone ? "rotate-45" : "rounded-full",
          `bg-gradient-to-br ${getNodeColor()}`,
          isHovered && "ring-2 ring-white/60 ring-offset-2 ring-offset-transparent"
        )}
        style={{
          width: size,
          height: size,
          borderRadius: isMilestone ? '8px' : '50%',
          boxShadow: `0 0 ${isHovered ? 25 : 12}px ${getGlowColor()}`
        }}
      >
        {/* Partner avatar */}
        {isPartner && node.photoURL ? (
          <Avatar 
            className={cn("border-2 border-white/30")} 
            style={{ width: size - 6, height: size - 6 }}
          >
            <AvatarImage src={node.photoURL} alt={node.label} />
            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-medium" style={{ fontSize: size * 0.25 }}>
              {node.label.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div 
            className={cn("text-white font-semibold", isMilestone && "-rotate-45")} 
            style={{ fontSize: size * 0.25 }}
          >
            {node.type === 'milestone' ? '★' : node.label.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
        )}
      </div>

      {/* Label - only show for hovered, center, or primary foreground nodes */}
      {/* On mobile, only show on hover to reduce clutter */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 text-center whitespace-nowrap pointer-events-none"
        style={{ top: size / 2 + (isMobile ? 6 : 10) }}
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: isHovered || node.isCenter || (!isMobile && isPrimaryPartner && node.depth === 'foreground') ? 1 : 0 
        }}
        transition={{ duration: 0.3 }}
      >
        <p className={cn("font-medium text-white drop-shadow-lg", isMobile ? "text-xs" : "text-sm")}>
          {node.label}
        </p>
        {node.subtitle && !isMobile && (
          <p className="text-xs text-white/60 mt-0.5">
            {node.subtitle}
          </p>
        )}
        {node.isCenter && (
          <p className="text-xs text-emerald-400 mt-1 font-medium">
            Your Impact Network
          </p>
        )}
      </motion.div>

      {/* Enhanced hover tooltip - responsive sizing */}
      {isHovered && !node.isCenter && (
        <motion.div
          className={cn(
            "absolute left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-sm border border-white/10 rounded-xl shadow-2xl pointer-events-none",
            isMobile ? "px-3 py-2" : "px-4 py-3"
          )}
          style={{ 
            bottom: size / 2 + (isMobile ? 12 : 20), 
            minWidth: isMobile ? 160 : 220,
            maxWidth: isMobile ? 200 : 280
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <p className={cn("font-semibold text-white", isMobile ? "text-xs" : "text-sm")}>{node.label}</p>
          
          {/* Partner-specific tooltip content */}
          {isPartner && (
            <div className="mt-1.5 space-y-0.5">
              {node.partnerSince && (
                <p className={cn("text-white/60", isMobile ? "text-[10px]" : "text-xs")}>
                  Partner since {node.partnerSince}
                </p>
              )}
              {node.subtitle && !isMobile && (
                <p className="text-xs text-emerald-400">
                  {node.subtitle}
                </p>
              )}
            </div>
          )}
          
          {node.impactSnapshot && (
            <p className={cn("text-white/70 mt-1.5", isMobile ? "text-[10px]" : "text-xs")}>{node.impactSnapshot}</p>
          )}
          
          <p className={cn("text-emerald-400 mt-1.5 font-medium", isMobile ? "text-[10px]" : "text-xs")}>Tap to explore →</p>
        </motion.div>
      )}
    </motion.div>
  )
}
