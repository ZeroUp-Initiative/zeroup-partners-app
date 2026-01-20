'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, MapPin, Users, Calendar, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConstellationNodeData } from './constellation-node'
import Link from 'next/link'

interface ProjectStoryPanelProps {
  node: ConstellationNodeData | null
  projectDetails?: {
    id: string
    title: string
    description: string
    story?: string
    location?: string
    beneficiaries?: number
    phase?: string
    targetAmount?: number
    currentAmount?: number
    imageUrl?: string
  }
  onClose: () => void
}

export function ProjectStoryPanel({ node, projectDetails, onClose }: ProjectStoryPanelProps) {
  if (!node) return null

  const progress = projectDetails?.targetAmount 
    ? Math.min((projectDetails.currentAmount || 0) / projectDetails.targetAmount * 100, 100)
    : 0

  const getPhaseLabel = (phase?: string) => {
    switch (phase) {
      case 'planning': return 'Planning Phase'
      case 'pilot': return 'Pilot Phase'
      case 'active': return 'Active Implementation'
      case 'scaling': return 'Scaling Up'
      case 'completed': return 'Completed'
      default: return 'In Progress'
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-slate-900/98 backdrop-blur-xl border-l border-white/10 z-[100] overflow-y-auto"
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-white/5 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              node.type === 'project' ? 'bg-violet-400' :
              node.type === 'community' ? 'bg-amber-400' :
              node.type === 'milestone' ? 'bg-emerald-400' :
              'bg-teal-400'
            }`} />
            <span className="text-sm font-medium text-white/60 uppercase tracking-wider">
              {node.type === 'project' ? 'Project Story' : 
               node.type === 'community' ? 'Community Hub' :
               node.type === 'milestone' ? 'Milestone' : 'Partner'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Image */}
        {projectDetails?.imageUrl && (
          <div className="relative h-48 overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${projectDetails.imageUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold text-white leading-tight">
              {projectDetails?.title || node.label}
            </h2>
            {node.subtitle && (
              <p className="text-white/50 mt-1">{node.subtitle}</p>
            )}
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap gap-4 text-sm">
            {projectDetails?.location && (
              <div className="flex items-center gap-2 text-white/60">
                <MapPin className="w-4 h-4" />
                <span>{projectDetails.location}</span>
              </div>
            )}
            {projectDetails?.beneficiaries && (
              <div className="flex items-center gap-2 text-white/60">
                <Users className="w-4 h-4" />
                <span>{projectDetails.beneficiaries.toLocaleString()} beneficiaries</span>
              </div>
            )}
          </div>

          {/* Journey Progress (not percentage) */}
          {projectDetails && (
            <div className="bg-white/5 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Impact Journey</span>
                <span className="text-sm font-medium text-emerald-400">
                  {getPhaseLabel(projectDetails.phase)}
                </span>
              </div>
              <div className="flex gap-1">
                {['planning', 'pilot', 'active', 'scaling', 'completed'].map((phase, index) => {
                  const phases = ['planning', 'pilot', 'active', 'scaling', 'completed']
                  const currentIndex = phases.indexOf(projectDetails.phase || 'planning')
                  const isCompleted = index <= currentIndex
                  const isCurrent = index === currentIndex

                  return (
                    <div
                      key={phase}
                      className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                        isCompleted 
                          ? isCurrent 
                            ? 'bg-gradient-to-r from-emerald-400 to-teal-400 animate-pulse' 
                            : 'bg-emerald-400/60'
                          : 'bg-white/10'
                      }`}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Story */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider">
              The Story
            </h3>
            <p className="text-white/80 leading-relaxed">
              {projectDetails?.story || projectDetails?.description || 
               "This project is part of the ZeroUp ecosystem, creating meaningful change in communities around the world. Every contribution helps build a sustainable future."}
            </p>
          </div>

          {/* Impact snapshot */}
          {node.impactSnapshot && (
            <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-400/20 rounded-xl p-4">
              <p className="text-sm text-white/60 mb-1">Impact Snapshot</p>
              <p className="text-white font-medium">{node.impactSnapshot}</p>
            </div>
          )}

          {/* Funding progress */}
          {projectDetails?.targetAmount && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Funding Progress</span>
                <span className="text-white font-medium">
                  ₦{(projectDetails.currentAmount || 0).toLocaleString()} / ₦{projectDetails.targetAmount.toLocaleString()}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {/* Action button */}
          <div className="pt-4">
            <Link href={`/projects?id=${projectDetails?.id || node.id}`}>
              <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                View Full Project
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Connection message */}
          <div className="pt-4 border-t border-white/10">
            <p className="text-center text-sm text-white/40 italic">
              "Your support enables this connection"
            </p>
          </div>
        </div>
      </motion.div>

      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
    </AnimatePresence>
  )
}
