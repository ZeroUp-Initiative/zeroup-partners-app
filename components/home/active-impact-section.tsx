'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { MapPin, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Project {
  id: string
  title: string
  description: string
  location?: string
  phase?: string
  category?: string
  status?: string
  imageUrl?: string
  currentAmount?: number
  targetAmount?: number
}

interface ActiveImpactSectionProps {
  projects: Project[]
}

const phaseColors: Record<string, { bg: string; text: string; border: string }> = {
  'idea': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  'planning': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  'pilot': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  'active': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'scaling': { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
  'completed': { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
}

function getPhaseStyle(phase?: string) {
  return phaseColors[phase?.toLowerCase() || 'active'] || phaseColors.active
}

function getHumanLine(project: Project): string {
  const lines: Record<string, string> = {
    'education': 'Building futures through knowledge and skills',
    'healthcare': 'Bringing health and hope to communities',
    'technology': 'Connecting communities with digital solutions',
    'environment': 'Protecting our planet for generations to come',
    'economic': 'Creating sustainable livelihoods and growth',
    'agriculture': 'Cultivating food security and prosperity',
  }
  return lines[project.category?.toLowerCase() || ''] || 'Creating meaningful change together'
}

export function ActiveImpactSection({ projects }: ActiveImpactSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  // Take top 6 projects for display
  const displayProjects = projects.slice(0, 6)

  return (
    <section 
      ref={sectionRef}
      className="relative py-24 md:py-32 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium">Live Projects</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              Impact in{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Motion
              </span>
            </h2>
            <p className="text-lg text-white/50 max-w-xl">
              Real projects. Real communities. Real progress happening right now.
            </p>
          </div>

          <Link href="/projects">
            <Button 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10 group"
            >
              View All Projects
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>

        {/* Project Cards Grid */}
        {displayProjects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayProjects.map((project, index) => {
              const phaseStyle = getPhaseStyle(project.phase || project.status)
              const progress = project.targetAmount 
                ? Math.min(((project.currentAmount || 0) / project.targetAmount) * 100, 100)
                : 0

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group relative"
                >
                  <div className="relative h-full bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden hover:border-emerald-500/30 transition-all duration-500 hover:shadow-xl hover:shadow-emerald-500/5">
                    {/* Image or gradient header */}
                    <div className="relative h-40 overflow-hidden">
                      {project.imageUrl ? (
                        <>
                          <img 
                            src={project.imageUrl} 
                            alt={project.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-900/50 to-teal-900/50" />
                      )}
                      
                      {/* Phase badge */}
                      <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium ${phaseStyle.bg} ${phaseStyle.text} ${phaseStyle.border} border backdrop-blur-sm`}>
                        {(project.phase || project.status || 'Active').charAt(0).toUpperCase() + (project.phase || project.status || 'Active').slice(1)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                      {/* Location */}
                      {project.location && (
                        <div className="flex items-center gap-1.5 text-white/40 text-sm">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{project.location}</span>
                        </div>
                      )}

                      {/* Title */}
                      <h3 className="text-xl font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                        {project.title}
                      </h3>

                      {/* Human-centered line */}
                      <p className="text-sm text-white/50 italic">
                        "{getHumanLine(project)}"
                      </p>

                      {/* Progress bar */}
                      {project.targetAmount && project.targetAmount > 0 && (
                        <div className="space-y-2">
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={isInView ? { width: `${progress}%` } : {}}
                              transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                            />
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-white/40">
                              ₦{(project.currentAmount || 0).toLocaleString()}
                            </span>
                            <span className="text-emerald-400 font-medium">
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      )}

                      {/* CTAs */}
                      <div className="flex gap-3 pt-2">
                        <Link href={`/projects?id=${project.id}`} className="flex-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
                          >
                            View Story
                          </Button>
                        </Link>
                        <Link href={`/contributions?project=${project.id}`} className="flex-1">
                          <Button 
                            size="sm" 
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                          >
                            Support
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Projects Coming Soon</h3>
            <p className="text-white/50 mb-6">New impact initiatives are being designed with communities.</p>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-500">
                Join the Ecosystem
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  )
}
