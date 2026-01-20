'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ConstellationNode, ConstellationNodeData } from './constellation-node'
import { ConnectionLines } from './connection-lines'
import { ProjectStoryPanel } from './project-story-panel'
import { ParticleBackground } from './particle-background'

interface Project {
  id: string
  title: string
  description: string
  targetAmount: number
  currentAmount: number
  status: string
  category?: string
  imageUrl?: string
  location?: string
  phase?: string
}

interface ConstellationCanvasProps {
  projects: Project[]
  user?: {
    uid: string
    displayName?: string | null
    firstName?: string | null
    lastName?: string | null
    photoURL?: string | null
    totalContributions?: number
  } | null
  isLoggedIn: boolean
}

// Generate positions in a constellation pattern
function generateConstellationPositions(
  count: number,
  centerX: number,
  centerY: number,
  minRadius: number,
  maxRadius: number
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = []
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))

  for (let i = 0; i < count; i++) {
    const angle = i * goldenAngle
    const radius = minRadius + (maxRadius - minRadius) * Math.sqrt(i / count)
    
    // Add some randomness for natural feel
    const jitterX = (Math.random() - 0.5) * 40
    const jitterY = (Math.random() - 0.5) * 40
    
    positions.push({
      x: centerX + Math.cos(angle) * radius + jitterX,
      y: centerY + Math.sin(angle) * radius + jitterY
    })
  }

  return positions
}

// Generate community nodes between projects
function generateCommunityNodes(
  projects: ConstellationNodeData[],
  centerX: number,
  centerY: number
): ConstellationNodeData[] {
  const communities = [
    { id: 'community-youth', label: 'Youth Hub', subtitle: 'Skills & Education', impactSnapshot: 'Empowering the next generation' },
    { id: 'community-women', label: 'Women Hub', subtitle: 'Economic Empowerment', impactSnapshot: 'Breaking barriers, building futures' },
    { id: 'community-health', label: 'Health Hub', subtitle: 'Community Wellness', impactSnapshot: 'Healthy communities thrive' },
  ]

  const radius = 180
  return communities.map((community, index) => {
    const angle = (index * 2 * Math.PI) / communities.length - Math.PI / 2
    return {
      ...community,
      type: 'community' as const,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      status: 'active' as const
    }
  })
}

// Generate milestone nodes
function generateMilestoneNodes(
  centerX: number,
  centerY: number,
  projectCount: number
): ConstellationNodeData[] {
  const milestones = [
    { id: 'milestone-1', label: '10 Projects', subtitle: 'First decade', status: projectCount >= 10 ? 'completed' : 'upcoming', impactSnapshot: 'First 10 projects funded' },
    { id: 'milestone-2', label: '50 Partners', subtitle: 'Growing family', status: 'completed', impactSnapshot: '50+ partners joined the ecosystem' },
    { id: 'milestone-3', label: '₦1M Impact', subtitle: 'Major milestone', status: 'completed', impactSnapshot: 'Over ₦1 million in total impact' },
  ]

  const radius = 320
  return milestones.map((milestone, index) => {
    const angle = (index * 2 * Math.PI) / milestones.length + Math.PI / 6
    return {
      ...milestone,
      type: 'milestone' as const,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      status: milestone.status as 'completed' | 'upcoming'
    }
  })
}

export function ConstellationCanvas({ projects, user, isLoggedIn }: ConstellationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<ConstellationNodeData | null>(null)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomTarget, setZoomTarget] = useState({ x: 0, y: 0 })

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  const centerX = dimensions.width / 2
  const centerY = dimensions.height / 2

  // Generate all nodes
  const nodes = useMemo(() => {
    if (dimensions.width === 0) return []

    const allNodes: ConstellationNodeData[] = []
    
    // Center node (partner or placeholder)
    const centerNode: ConstellationNodeData = isLoggedIn && user ? {
      id: 'center-partner',
      type: 'partner',
      label: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.displayName || 'You',
      subtitle: 'Zero Partner',
      x: centerX,
      y: centerY,
      photoURL: user.photoURL || undefined,
      isCenter: true,
      impactSnapshot: user.totalContributions 
        ? `₦${user.totalContributions.toLocaleString()} contributed`
        : 'Your impact journey begins'
    } : {
      id: 'center-placeholder',
      type: 'partner',
      label: 'You',
      subtitle: 'Future Partner',
      x: centerX,
      y: centerY,
      isCenter: true
    }
    
    allNodes.push(centerNode)

    // Project nodes
    const projectPositions = generateConstellationPositions(
      projects.length,
      centerX,
      centerY,
      150,
      Math.min(dimensions.width, dimensions.height) * 0.38
    )

    projects.forEach((project, index) => {
      const pos = projectPositions[index]
      if (pos) {
        const currentAmount = project.currentAmount ?? 0
        const targetAmount = project.targetAmount ?? 0
        allNodes.push({
          id: project.id,
          type: 'project',
          label: project.title,
          subtitle: project.category || project.location,
          x: pos.x,
          y: pos.y,
          status: project.status === 'fully-funded' ? 'completed' : 'active',
          impactSnapshot: `₦${currentAmount.toLocaleString()} / ₦${targetAmount.toLocaleString()}`
        })
      }
    })

    // Community nodes
    const communityNodes = generateCommunityNodes(allNodes, centerX, centerY)
    allNodes.push(...communityNodes)

    // Milestone nodes
    const milestoneNodes = generateMilestoneNodes(centerX, centerY, projects.length)
    allNodes.push(...milestoneNodes)

    return allNodes
  }, [projects, user, isLoggedIn, dimensions, centerX, centerY])

  // Generate connections
  const connections = useMemo(() => {
    if (nodes.length === 0) return []

    const conns: Array<{
      from: ConstellationNodeData
      to: ConstellationNodeData
      message?: string
    }> = []

    const centerNode = nodes.find(n => n.isCenter)
    if (!centerNode) return []

    // Connect center to projects
    const projectNodes = nodes.filter(n => n.type === 'project')
    projectNodes.forEach(project => {
      conns.push({
        from: centerNode,
        to: project,
        message: 'Your support enabled this'
      })
    })

    // Connect projects to communities
    const communityNodes = nodes.filter(n => n.type === 'community')
    projectNodes.forEach((project, i) => {
      if (communityNodes[i % communityNodes.length]) {
        conns.push({
          from: project,
          to: communityNodes[i % communityNodes.length],
          message: 'Impacting communities'
        })
      }
    })

    // Connect communities to milestones
    const milestoneNodes = nodes.filter(n => n.type === 'milestone')
    communityNodes.forEach((community, i) => {
      if (milestoneNodes[i % milestoneNodes.length]) {
        conns.push({
          from: community,
          to: milestoneNodes[i % milestoneNodes.length],
          message: 'Building towards goals'
        })
      }
    })

    return conns
  }, [nodes])

  // Handle node click
  const handleNodeClick = useCallback((node: ConstellationNodeData) => {
    if (node.isCenter) return
    
    setZoomTarget({ x: node.x, y: node.y })
    setIsZoomed(true)
    setSelectedNode(node)
  }, [])

  // Get project details for selected node
  const selectedProjectDetails = useMemo(() => {
    if (!selectedNode || selectedNode.type !== 'project') return undefined
    const project = projects.find(p => p.id === selectedNode.id)
    if (!project) return undefined
    return {
      id: project.id,
      title: project.title,
      description: project.description,
      location: project.location,
      phase: project.phase || 'active',
      targetAmount: project.targetAmount,
      currentAmount: project.currentAmount,
      imageUrl: project.imageUrl
    }
  }, [selectedNode, projects])

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
    >
      {/* Particle background */}
      <ParticleBackground />

      {/* Subtle grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Main constellation container with zoom transform */}
      <motion.div
        className="absolute inset-0"
        animate={{
          scale: isZoomed ? 1.5 : 1,
          x: isZoomed ? (centerX - zoomTarget.x) * 0.5 : 0,
          y: isZoomed ? (centerY - zoomTarget.y) * 0.5 : 0
        }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Connection lines */}
        <ConnectionLines
          connections={connections}
          hoveredNodeId={hoveredNodeId}
          width={dimensions.width}
          height={dimensions.height}
        />

        {/* Nodes */}
        {nodes.map(node => (
          <ConstellationNode
            key={node.id}
            node={node}
            isHovered={hoveredNodeId === node.id}
            isSelected={selectedNode?.id === node.id}
            onHover={setHoveredNodeId}
            onClick={handleNodeClick}
          />
        ))}
      </motion.div>

      {/* Project story panel */}
      <AnimatePresence>
        {selectedNode && (
          <ProjectStoryPanel
            node={selectedNode}
            projectDetails={selectedProjectDetails}
            onClose={() => {
              setSelectedNode(null)
              setIsZoomed(false)
            }}
          />
        )}
      </AnimatePresence>

      {/* Real-time update indicator */}
      <div className="absolute bottom-6 left-6 flex items-center gap-2 text-xs text-white/40">
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        <span>This ecosystem updates in real time</span>
      </div>
    </div>
  )
}
