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
  isDark?: boolean
}

const phaseColors: Record<string, { bg: string; text: string; border: string }> = {
  'idea': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  'planning': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  'pilot': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  'active': { bg: 'bg-[#8d44d1]/10', text: 'text-[#a05cd4]', border: 'border-[#8d44d1]/30' },
  'scaling': { bg: 'bg-[#7030b0]/10', text: 'text-[#8d44d1]', border: 'border-[#7030b0]/30' },
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

export function ActiveImpactSection({ projects, isDark = true }: ActiveImpactSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })

  // Take top 6 projects for display
  const displayProjects = projects.slice(0, 6)

  return (
    <section 
      ref={sectionRef}
      className={`relative py-24 md:py-32 overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-b from-[#130927] via-[#1a0d35] to-[#130927]' 
          : 'bg-gradient-to-b from-[#f5ecff]/40 via-white to-slate-50'
      }`}
    >
      {/* Background pattern */}
      <div className={`absolute inset-0 ${isDark ? 'opacity-5' : 'opacity-50'}`}>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${isDark ? 'white' : 'rgb(141, 68, 209)'} 1px, transparent 0)`,
          backgroundSize: '60px 60px'
        }} />
      </div>
      
      {/* Light mode decorative blobs */}
      {!isDark && (
        <>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#8d44d1]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#8d44d1]/5 rounded-full blur-3xl" />
        </>
      )}

      <div className="mx-auto max-w-7xl px-4 md:px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16"
        >
          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-6 ${
              isDark ? 'bg-[#8d44d1]/10 border-[#8d44d1]/20' : 'bg-[#f5ecff] border-slate-200'
            }`}>
              <Sparkles className={`w-3.5 h-3.5 ${isDark ? 'text-[#a05cd4]' : 'text-[#7030b0]'}`} />
              <span className={`text-sm font-medium ${isDark ? 'text-[#a05cd4]' : 'text-[#7030b0]'}`}>Live Projects</span>
            </div>
            
            <h2 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Impact in{' '}
              <span className="bg-gradient-to-r from-[#a05cd4] to-[#8d44d1] bg-clip-text text-transparent">
                Motion
              </span>
            </h2>
            <p className={`text-lg max-w-xl ${isDark ? 'text-white/50' : 'text-slate-600'}`}>
              Real projects. Real communities. Real progress happening right now.
            </p>
          </div>

          <Link href="/projects">
            <Button 
              variant="outline" 
              className={`group ${isDark ? 'border-white/20 text-white hover:bg-white/10' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
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
                  <div className={`relative h-full backdrop-blur-sm rounded-2xl border overflow-hidden transition-all duration-500 hover:shadow-xl ${
                    isDark 
                      ? 'bg-[#1e1040]/50 border-white/5 hover:border-[#8d44d1]/30 hover:shadow-[#8d44d1]/5' 
                      : 'bg-white/90 border-slate-200 shadow-lg hover:border-slate-300 hover:shadow-md '
                  }`}>
                    {/* Gradient top bar for light mode */}
                    {!isDark && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#a05cd4] to-[#8d44d1] z-10" />}
                    {/* Image or gradient header */}
                    <div className="relative h-40 overflow-hidden">
                      {project.imageUrl ? (
                        <>
                          <img 
                            src={project.imageUrl} 
                            alt={project.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-t from-[#1e1040] via-[#1a0d35]/50 to-transparent' : 'bg-gradient-to-t from-white via-white/50 to-transparent'}`} />
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#2a0d54]/50 to-[#2a0d54]/50" />
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
                        <div className={`flex items-center gap-1.5 text-sm ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{project.location}</span>
                        </div>
                      )}

                      {/* Title */}
                      <h3 className={`text-xl font-semibold transition-colors line-clamp-2 ${isDark ? 'text-white group-hover:text-[#a05cd4]' : 'text-slate-900 group-hover:text-[#7030b0]'}`}>
                        {project.title}
                      </h3>

                      {/* Human-centered line */}
                      <p className={`text-sm italic ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                        "{getHumanLine(project)}"
                      </p>

                      {/* Progress bar */}
                      {project.targetAmount && project.targetAmount > 0 && (
                        <div className="space-y-2">
                          <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-200'}`}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={isInView ? { width: `${progress}%` } : {}}
                              transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                              className="h-full bg-gradient-to-r from-[#8d44d1] to-[#7030b0] rounded-full"
                            />
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className={isDark ? 'text-white/40' : 'text-slate-500'}>
                              ₦{(project.currentAmount || 0).toLocaleString()}
                            </span>
                            <span className="text-[#8d44d1] font-medium">
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      )}

                      {/* CTAs */}
                      <div className="flex gap-3 pt-2">
                        <Link href={`/projects/${project.id}`} className="flex-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className={`w-full ${isDark ? 'border-white/10 text-white/70 hover:bg-white/5 hover:text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                          >
                            View Story
                          </Button>
                        </Link>
                        <Link href={`/contributions?project=${project.id}`} className="flex-1">
                          <Button 
                            size="sm" 
                            className="w-full bg-gradient-to-r from-[#8d44d1] to-[#7030b0] hover:from-[#7030b0] hover:to-[#5e269a] text-white"
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
            <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${isDark ? 'bg-[#8d44d1]/10' : 'bg-[#ede9fe]'}`}>
              <Sparkles className="w-10 h-10 text-[#a05cd4]" />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Projects Coming Soon</h3>
            <p className={`mb-6 ${isDark ? 'text-white/50' : 'text-slate-600'}`}>New impact initiatives are being designed with communities.</p>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-[#8d44d1] to-[#7030b0]">
                Join the Ecosystem
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  )
}
