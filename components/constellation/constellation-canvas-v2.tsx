'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ConstellationNode, ConstellationNodeData } from './constellation-node'
import { ConnectionLines } from './connection-lines'
import { ProjectStoryPanel } from './project-story-panel'
import { ParticleBackground } from './particle-background'
import { db } from '@/lib/firebase/client'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { cn } from '@/lib/utils'

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

interface Partner {
  id: string
  displayName: string
  firstName?: string
  lastName?: string
  photoURL?: string
  totalContributions: number
  joinedAt?: Date
  projectsSupported?: string[]
  impactArea?: string
  tier: 'primary' | 'secondary' | 'tertiary' // For visual hierarchy
}

interface ConstellationCanvasProps {
  projects: Project[]
  partners?: Partner[]
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

// ============================================================
// ORGANIC SPATIAL DISTRIBUTION ALGORITHM
// Creates clusters distributed across the space, NOT radial
// ============================================================

interface Cluster {
  id: string
  centerX: number
  centerY: number
  category: string
}

// Generate organic cluster positions across the canvas
function generateClusterPositions(
  width: number,
  height: number,
  padding: number
): Cluster[] {
  const usableWidth = width - padding * 2
  const usableHeight = height - padding * 2
  
  // Create 4-6 organic cluster zones (non-symmetrical)
  const clusters: Cluster[] = [
    { id: 'cluster-1', centerX: padding + usableWidth * 0.2, centerY: padding + usableHeight * 0.25, category: 'education' },
    { id: 'cluster-2', centerX: padding + usableWidth * 0.7, centerY: padding + usableHeight * 0.18, category: 'technology' },
    { id: 'cluster-3', centerX: padding + usableWidth * 0.15, centerY: padding + usableHeight * 0.65, category: 'healthcare' },
    { id: 'cluster-4', centerX: padding + usableWidth * 0.55, centerY: padding + usableHeight * 0.55, category: 'community' },
    { id: 'cluster-5', centerX: padding + usableWidth * 0.85, centerY: padding + usableHeight * 0.7, category: 'environment' },
    { id: 'cluster-6', centerX: padding + usableWidth * 0.4, centerY: padding + usableHeight * 0.85, category: 'economic' },
  ]
  
  // Add slight randomness to cluster positions for organic feel
  return clusters.map(cluster => ({
    ...cluster,
    centerX: cluster.centerX + (Math.random() - 0.5) * 30,
    centerY: cluster.centerY + (Math.random() - 0.5) * 30,
  }))
}

// Generate positions within a cluster (for projects/partners in same area)
function generateClusterNodePositions(
  cluster: Cluster,
  nodeCount: number,
  maxRadius: number = 80
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = []
  
  for (let i = 0; i < nodeCount; i++) {
    // Spiral-like distribution with randomness
    const angle = i * 2.4 + Math.random() * 0.5 // Golden angle-ish
    const radiusFactor = Math.sqrt((i + 1) / nodeCount) // Denser in center
    const radius = radiusFactor * maxRadius * (0.7 + Math.random() * 0.3)
    
    positions.push({
      x: cluster.centerX + Math.cos(angle) * radius,
      y: cluster.centerY + Math.sin(angle) * radius,
    })
  }
  
  return positions
}

// Assign projects to clusters based on category
function assignToCluster(category?: string): string {
  const mapping: Record<string, string> = {
    'education': 'cluster-1',
    'technology': 'cluster-2',
    'healthcare': 'cluster-3',
    'community': 'cluster-4',
    'environment': 'cluster-5',
    'economic': 'cluster-6',
    'agriculture': 'cluster-6',
  }
  return mapping[category?.toLowerCase() || ''] || `cluster-${Math.floor(Math.random() * 6) + 1}`
}

// Calculate partner visual tier based on engagement
function calculatePartnerTier(partner: Partner): 'primary' | 'secondary' | 'tertiary' {
  if (partner.totalContributions >= 100000) return 'primary'
  if (partner.totalContributions >= 25000) return 'secondary'
  return 'tertiary'
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function ConstellationCanvasV2({ projects: initialProjects, partners = [], user, isLoggedIn }: ConstellationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<ConstellationNodeData | null>(null)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomTarget, setZoomTarget] = useState({ x: 0, y: 0 })
  const [isMobile, setIsMobile] = useState(false)
  
  // Living system: smooth breathing using requestAnimationFrame
  const [breatheOffset, setBreatheOffset] = useState(0)
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(Date.now())

  // Real-time Firebase data
  const [liveProjects, setLiveProjects] = useState<Project[]>(initialProjects)
  const [livePartners, setLivePartners] = useState<Partner[]>([])
  const [partnerPayments, setPartnerPayments] = useState<Record<string, string[]>>({}) // userId -> projectIds

  // RESPONSIVE PADDING: Smaller on mobile
  const EDGE_PADDING = isMobile ? 40 : 100
  const TOP_PADDING = isMobile ? 80 : 120

  // ============================================================
  // REAL-TIME FIREBASE SYNC - Projects
  // ============================================================
  useEffect(() => {
    const projectsQuery = query(collection(db, 'projects'))
    const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
      console.log('[Constellation] Projects snapshot received:', snapshot.size, 'projects')
      const projectsData: Project[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        console.log('[Constellation] Project:', doc.id, data.title)
        projectsData.push({ id: doc.id, ...data } as Project)
      })
      setLiveProjects(projectsData)
    }, (error) => {
      console.error('[Constellation] Error fetching projects:', error)
    })
    return () => unsubscribe()
  }, [])

  // ============================================================
  // REAL-TIME FIREBASE SYNC - Partners (Users)
  // ============================================================
  useEffect(() => {
    const usersQuery = query(collection(db, 'users'))
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      console.log('[Constellation] Users snapshot received:', snapshot.size, 'users')
      const usersData: Partner[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        console.log('[Constellation] User:', doc.id, data.firstName, data.lastName, data.photoURL)
        usersData.push({
          id: doc.id,
          displayName: data.firstName && data.lastName 
            ? `${data.firstName} ${data.lastName}` 
            : data.displayName || data.email?.split('@')[0] || 'Partner',
          firstName: data.firstName,
          lastName: data.lastName,
          photoURL: data.photoURL,
          totalContributions: data.totalContributions || 0,
          joinedAt: data.createdAt?.toDate?.() || new Date(),
          projectsSupported: [],
          impactArea: data.impactArea || undefined,
          tier: calculatePartnerTier({
            id: doc.id,
            displayName: '',
            totalContributions: data.totalContributions || 0,
            tier: 'tertiary'
          }),
        })
      })
      console.log('[Constellation] Setting livePartners:', usersData.length)
      setLivePartners(usersData)
    }, (error) => {
      console.error('[Constellation] Error fetching users:', error)
    })
    return () => unsubscribe()
  }, [])

  // ============================================================
  // REAL-TIME FIREBASE SYNC - Payments (Partner → Project links)
  // ============================================================
  useEffect(() => {
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('status', '==', 'approved')
    )
    const unsubscribe = onSnapshot(paymentsQuery, (snapshot) => {
      const paymentsByUser: Record<string, Set<string>> = {}
      snapshot.forEach((doc) => {
        const data = doc.data()
        if (data.userId && data.projectId) {
          if (!paymentsByUser[data.userId]) {
            paymentsByUser[data.userId] = new Set()
          }
          paymentsByUser[data.userId].add(data.projectId)
        }
      })
      // Convert Sets to arrays
      const result: Record<string, string[]> = {}
      Object.entries(paymentsByUser).forEach(([userId, projectIds]) => {
        result[userId] = Array.from(projectIds)
      })
      setPartnerPayments(result)
    })
    return () => unsubscribe()
  }, [])

  // Update dimensions on resize and detect mobile
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth
        setDimensions({
          width: width,
          height: containerRef.current.clientHeight
        })
        setIsMobile(width < 768) // Mobile breakpoint
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // ============================================================
  // SMOOTH BREATHING ANIMATION using requestAnimationFrame
  // ============================================================
  useEffect(() => {
    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      // Very slow cycle: ~60 seconds for full rotation
      const offset = (elapsed * 6) % 360
      setBreatheOffset(offset)
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animationRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Generate clusters (stable reference) - responsive spacing
  const clusters = useMemo(() => {
    if (dimensions.width === 0) return []
    return generateClusterPositions(
      dimensions.width, 
      dimensions.height, 
      Math.max(EDGE_PADDING, TOP_PADDING)
    )
  }, [dimensions.width, dimensions.height, EDGE_PADDING, TOP_PADDING])

  // Responsive node spacing
  const nodeSpacing = isMobile ? 60 : 100

  // ============================================================
  // GENERATE ALL NODES (Organic Distribution)
  // Uses LIVE data from Firebase
  // ============================================================
  const nodes = useMemo(() => {
    if (dimensions.width === 0 || clusters.length === 0) return []

    const allNodes: ConstellationNodeData[] = []
    
    // Use live projects from Firebase
    const projectsByCluster: Record<string, Project[]> = {}
    liveProjects.forEach(project => {
      const clusterId = assignToCluster(project.category)
      if (!projectsByCluster[clusterId]) projectsByCluster[clusterId] = []
      projectsByCluster[clusterId].push(project)
    })

    // Generate project nodes per cluster - responsive spacing
    clusters.forEach(cluster => {
      const clusterProjects = projectsByCluster[cluster.id] || []
      const positions = generateClusterNodePositions(cluster, clusterProjects.length, nodeSpacing)
      
      clusterProjects.forEach((project, index) => {
        const pos = positions[index]
        if (pos) {
          const currentAmount = project.currentAmount ?? 0
          allNodes.push({
            id: project.id,
            type: 'project',
            label: project.title,
            subtitle: project.category || project.location || 'Impact Project',
            x: pos.x,
            y: pos.y,
            status: project.status === 'fully-funded' ? 'completed' : 'active',
            impactSnapshot: `₦${currentAmount.toLocaleString()} raised`,
            depth: 'foreground' as const,
          })
        }
      })
      // Hub nodes removed - only real projects appear
    })

    // ============================================================
    // PARTNER NODES - Uses LIVE data from Firebase
    // Placed near the projects they've funded
    // ============================================================
    
    // Use live partners from Firebase (excludes current user to add separately)
    const allPartners: Partner[] = livePartners.filter(p => p.id !== user?.uid)
    
    // Add current user as a partner if logged in
    if (isLoggedIn && user) {
      allPartners.unshift({
        id: user.uid,
        displayName: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.displayName || 'You',
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        photoURL: user.photoURL || undefined,
        totalContributions: user.totalContributions || 0,
        projectsSupported: partnerPayments[user.uid] || [],
        tier: calculatePartnerTier({
          id: user.uid,
          displayName: user.displayName || 'You',
          totalContributions: user.totalContributions || 0,
          tier: 'tertiary'
        }),
      })
    }

    // Place partners near their supported projects or distribute organically
    allPartners.forEach((partner, index) => {
      // Get projects this partner has funded from real payment data
      const fundedProjects = partnerPayments[partner.id] || partner.projectsSupported || []
      const tier = calculatePartnerTier(partner)
      
      // Find a project node to attach near (or use random cluster)
      let baseX = dimensions.width / 2
      let baseY = dimensions.height / 2
      
      if (fundedProjects.length > 0) {
        // Place near first supported project
        const supportedProject = allNodes.find(n => n.id === fundedProjects[0])
        if (supportedProject) {
          baseX = supportedProject.x
          baseY = supportedProject.y
        }
      } else {
        // Distribute across clusters organically
        const randomCluster = clusters[index % clusters.length]
        if (randomCluster) {
          baseX = randomCluster.centerX
          baseY = randomCluster.centerY
        }
      }
      
      // Offset from base position - responsive distance
      const angle = (index * 2.4) + Math.random()
      const baseDistance = isMobile ? 35 : 60
      const distance = baseDistance + Math.random() * (isMobile ? 25 : 40)
      
      // Determine depth based on tier
      const depth = tier === 'primary' ? 'foreground' 
                  : tier === 'secondary' ? 'midground' 
                  : 'background'
      
      allNodes.push({
        id: `partner-${partner.id}`,
        type: 'partner',
        label: partner.displayName,
        subtitle: partner.impactArea ? `Active in ${partner.impactArea}` : 'Zero Partner',
        x: baseX + Math.cos(angle) * distance,
        y: baseY + Math.sin(angle) * distance,
        photoURL: partner.photoURL,
        status: 'active',
        impactSnapshot: fundedProjects.length > 0 
          ? `Funding ${fundedProjects.length} project${fundedProjects.length !== 1 ? 's' : ''}`
          : `₦${partner.totalContributions.toLocaleString()} contributed`,
        depth: depth as 'foreground' | 'midground' | 'background',
        partnerTier: tier,
        partnerSince: partner.joinedAt ? new Date(partner.joinedAt).getFullYear().toString() : '2025',
        // Store funded projects for connection drawing
        projectsSupported: fundedProjects,
      } as ConstellationNodeData & { projectsSupported: string[] })
    })

    // Milestone nodes removed - only real data appears

    return allNodes
  }, [liveProjects, livePartners, partnerPayments, user, isLoggedIn, dimensions, clusters, isMobile, nodeSpacing])

  // ============================================================
  // SMOOTH BREATHING - Apply subtle CSS-transition-friendly offsets
  // Uses continuous requestAnimationFrame for smooth motion
  // ============================================================
  const animatedNodes = useMemo(() => {
    // Reduce breathing amplitude on mobile for cleaner look
    const mobileMultiplier = isMobile ? 0.5 : 1
    
    return nodes.map((node, index) => {
      // Each node has a unique phase offset based on its index
      const nodePhaseOffset = index * 47 // Prime number for varied distribution
      const phase = ((breatheOffset + nodePhaseOffset) * Math.PI) / 180
      
      // Very subtle offset - reduced on mobile
      const breatheAmplitude = (node.depth === 'background' ? 4 : node.depth === 'midground' ? 2.5 : 1.5) * mobileMultiplier
      const xOffset = Math.sin(phase) * breatheAmplitude
      const yOffset = Math.cos(phase * 0.7) * breatheAmplitude * 0.6
      
      return {
        ...node,
        x: node.x + xOffset,
        y: node.y + yOffset,
      }
    })
  }, [nodes, breatheOffset, isMobile])

  // ============================================================
  // CONNECTIONS - Partner connections only show on hover
  // ============================================================
  const connections = useMemo(() => {
    if (animatedNodes.length === 0) return []

    const conns: Array<{
      from: ConstellationNodeData
      to: ConstellationNodeData
      message?: string
      isPartnerConnection?: boolean
    }> = []

    const projectNodes = animatedNodes.filter(n => n.type === 'project')

    // ============================================================
    // PARTNER CONNECTIONS - Only shown when partner is hovered
    // Uses actual payment data to link to funded projects
    // ============================================================
    const partnerNodes = animatedNodes.filter(n => n.type === 'partner')
    
    partnerNodes.forEach(partner => {
      // Get the actual projects this partner has funded
      const partnerId = partner.id.replace('partner-', '')
      const fundedProjectIds = partnerPayments[partnerId] || []
      
      // Create connections to each funded project
      fundedProjectIds.forEach(projectId => {
        const projectNode = projectNodes.find(p => p.id === projectId)
        if (projectNode) {
          conns.push({
            from: partner,
            to: projectNode,
            message: 'Funding this project',
            isPartnerConnection: true // Mark for hover-only display
          })
        }
      })
      
      // If no funded projects, show connection to nearest project on hover
      if (fundedProjectIds.length === 0 && projectNodes.length > 0) {
        let nearestProject = projectNodes[0]
        let minDist = Infinity
        
        projectNodes.forEach(project => {
          const dist = Math.hypot(partner.x - project.x, partner.y - project.y)
          if (dist < minDist) {
            minDist = dist
            nearestProject = project
          }
        })
        
        if (nearestProject && minDist < 200) {
          conns.push({
            from: partner,
            to: nearestProject,
            message: 'Nearby project',
            isPartnerConnection: true
          })
        }
      }
    })

    return conns
  }, [animatedNodes, partnerPayments])

  // ============================================================
  // FILTERED CONNECTIONS - Partner lines only visible on hover
  // ============================================================
  const visibleConnections = useMemo(() => {
    return connections.filter(conn => {
      // Always show non-partner connections
      if (!conn.isPartnerConnection) return true
      
      // For partner connections, only show if that partner is hovered
      const isPartnerHovered = conn.from.type === 'partner' && conn.from.id === hoveredNodeId
      const isProjectHovered = conn.to.type === 'project' && conn.to.id === hoveredNodeId
      
      return isPartnerHovered || isProjectHovered
    })
  }, [connections, hoveredNodeId])

  // Handle node click
  const handleNodeClick = useCallback((node: ConstellationNodeData) => {
    setZoomTarget({ x: node.x, y: node.y })
    setIsZoomed(true)
    setSelectedNode(node)
  }, [])

  // Get project details for selected node
  const selectedProjectDetails = useMemo(() => {
    if (!selectedNode || selectedNode.type !== 'project') return undefined
    const project = liveProjects.find(p => p.id === selectedNode.id)
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
  }, [selectedNode, liveProjects])

  const centerX = dimensions.width / 2
  const centerY = dimensions.height / 2

  // ============================================================
  // EMPTY STATE
  // ============================================================
  const isEmpty = liveProjects.length === 0

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
    >
      {/* Particle background - slow, calm (Task 9) */}
      <ParticleBackground />

      {/* Subtle grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Empty State (Task 10) */}
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className={cn(
            "text-center space-y-4 px-6",
            isMobile ? "max-w-xs" : "max-w-md"
          )}>
            <div className={cn(
              "mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center mb-6",
              isMobile ? "w-16 h-16" : "w-20 h-20"
            )}>
              <div className={cn(
                "rounded-full bg-emerald-400 animate-pulse",
                isMobile ? "w-3 h-3" : "w-4 h-4"
              )} />
            </div>
            <h3 className={cn(
              "font-semibold text-white",
              isMobile ? "text-lg" : "text-xl"
            )}>
              The Ecosystem is Growing
            </h3>
            <p className={cn(
              "text-white/50",
              isMobile ? "text-sm" : "text-base"
            )}>
              New partnerships and projects appear here as they begin. 
              Be among the first to join.
            </p>
            <div className={cn(
              "flex gap-3 justify-center mt-6 text-white/30",
              isMobile ? "text-[10px]" : "text-xs"
            )}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400/50" />
                <span>Projects</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400/50" />
                <span>Partners</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400/50" />
                <span>Milestones</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main constellation container with zoom transform */}
      <motion.div
        className="absolute inset-0"
        animate={{
          scale: isZoomed ? 1.5 : 1,
          x: isZoomed ? (centerX - zoomTarget.x) * 0.5 : 0,
          y: isZoomed ? (centerY - zoomTarget.y) * 0.5 : 0
        }}
        transition={{ 
          duration: 1.2, // Slower, calmer (Task 9)
          ease: [0.16, 1, 0.3, 1] 
        }}
      >
        {/* Connection lines - uses filtered connections for hover behavior */}
        <ConnectionLines
          connections={visibleConnections}
          hoveredNodeId={hoveredNodeId}
          width={dimensions.width}
          height={dimensions.height}
        />

        {/* Nodes - rendered by depth layer (Task 7) */}
        {/* Background layer (tertiary partners) */}
        {animatedNodes.filter(n => n.depth === 'background').map(node => (
          <ConstellationNode
            key={node.id}
            node={node}
            isHovered={hoveredNodeId === node.id}
            isSelected={selectedNode?.id === node.id}
            onHover={setHoveredNodeId}
            onClick={handleNodeClick}
            isMobile={isMobile}
          />
        ))}
        
        {/* Midground layer */}
        {animatedNodes.filter(n => n.depth === 'midground').map(node => (
          <ConstellationNode
            key={node.id}
            node={node}
            isHovered={hoveredNodeId === node.id}
            isSelected={selectedNode?.id === node.id}
            onHover={setHoveredNodeId}
            onClick={handleNodeClick}
            isMobile={isMobile}
          />
        ))}
        
        {/* Foreground layer (primary focus) */}
        {animatedNodes.filter(n => n.depth === 'foreground' || !n.depth).map(node => (
          <ConstellationNode
            key={node.id}
            node={node}
            isHovered={hoveredNodeId === node.id}
            isSelected={selectedNode?.id === node.id}
            onHover={setHoveredNodeId}
            onClick={handleNodeClick}
            isMobile={isMobile}
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

      {/* Legend - responsive positioning */}
      <div className={cn(
        "absolute flex items-center gap-4 text-white/40",
        isMobile ? "bottom-4 left-4 text-[10px]" : "bottom-6 left-6 text-xs"
      )}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span>Live ecosystem</span>
        </div>
      </div>

      {/* Node count indicator - responsive */}
      {!isEmpty && (
        <div className={cn(
          "absolute text-white/30",
          isMobile ? "bottom-4 right-4 text-[10px]" : "bottom-6 right-6 text-xs"
        )}>
          {liveProjects.length} project{liveProjects.length !== 1 ? 's' : ''} • {livePartners.length} partner{livePartners.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
