'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Quote, ChevronLeft, ChevronRight, Volume2 } from 'lucide-react'

const testimonials = [
  {
    quote: "This wasn't support from afar. We built this together. For the first time, we felt like true partners in our own development.",
    author: "Amara Okonkwo",
    role: "Community Innovator",
    location: "Lagos, Nigeria",
    avatar: null,
    type: 'community'
  },
  {
    quote: "I used to think impact meant writing checks. Now I understand it means showing up, listening, and growing alongside communities.",
    author: "David Chen",
    role: "Zero Partner",
    location: "Singapore",
    avatar: null,
    type: 'partner'
  },
  {
    quote: "The skills I learned here changed everything. Now I'm teaching others in my village. The impact keeps spreading.",
    author: "Grace Mutua",
    role: "Youth Participant",
    location: "Nairobi, Kenya",
    avatar: null,
    type: 'youth'
  },
  {
    quote: "What impressed me most was the transparency. Every contribution, every outcome — we could track it all. That's rare.",
    author: "Sarah Williams",
    role: "Corporate Partner",
    location: "London, UK",
    avatar: null,
    type: 'partner'
  },
  {
    quote: "They didn't come with solutions. They came with questions. That respect made all the difference.",
    author: "Chief Emmanuel Adeyemi",
    role: "Community Leader",
    location: "Ibadan, Nigeria",
    avatar: null,
    type: 'community'
  }
]

const typeColors: Record<string, string> = {
  community: 'from-emerald-400 to-teal-400',
  partner: 'from-blue-400 to-indigo-400',
  youth: 'from-purple-400 to-pink-400'
}

interface TestimonialsSectionProps {
  isDark?: boolean
}

export function TestimonialsSection({ isDark = true }: TestimonialsSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)

  useEffect(() => {
    if (!autoPlay) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [autoPlay])

  const goToPrev = () => {
    setAutoPlay(false)
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const goToNext = () => {
    setAutoPlay(false)
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const currentTestimonial = testimonials[currentIndex]

  return (
    <section 
      ref={sectionRef}
      className={`relative py-24 md:py-32 overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950' 
          : 'bg-gradient-to-b from-amber-50/30 via-white to-orange-50/20'
      }`}
    >
      {/* Background decoration */}
      <div className={`absolute top-20 left-10 w-64 h-64 rounded-full blur-3xl ${isDark ? 'bg-emerald-500/5' : 'bg-amber-200/40'}`} />
      <div className={`absolute bottom-20 right-10 w-64 h-64 rounded-full blur-3xl ${isDark ? 'bg-purple-500/5' : 'bg-orange-200/40'}`} />
      {!isDark && <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-yellow-200/30 rounded-full blur-3xl" />}

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-6 ${
            isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'
          }`}>
            <Quote className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            <span className={`text-sm font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Real Voices</span>
          </div>
          
          <h2 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Voices From the{' '}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Ecosystem
            </span>
          </h2>
        </motion.div>

        {/* Main testimonial display */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className={`relative backdrop-blur-sm rounded-3xl border p-8 md:p-12 lg:p-16 ${
            isDark 
              ? 'bg-slate-900/50 border-white/5' 
              : 'bg-white/90 border-amber-200 shadow-xl shadow-amber-500/10 ring-1 ring-amber-100'
          }`}>
            {/* Gradient top bar for light mode */}
            {!isDark && <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl bg-gradient-to-r from-amber-400 to-orange-400" />}
            {/* Large quote icon */}
            <div className="absolute top-6 left-6 md:top-8 md:left-8">
              <Quote className={`w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r ${typeColors[currentTestimonial.type]} bg-clip-text text-transparent opacity-30`} fill="currentColor" />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="relative z-10"
              >
                {/* Quote */}
                <blockquote className={`text-xl md:text-2xl lg:text-3xl font-light leading-relaxed mb-8 md:mb-12 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  "{currentTestimonial.quote}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-4">
                  {/* Avatar placeholder */}
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${typeColors[currentTestimonial.type]} flex items-center justify-center`}>
                    <span className="text-xl font-bold text-white">
                      {currentTestimonial.author.charAt(0)}
                    </span>
                  </div>
                  
                  <div>
                    <div className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {currentTestimonial.author}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                      {currentTestimonial.role} • {currentTestimonial.location}
                    </div>
                  </div>

                  {/* Optional audio button */}
                  <button className={`ml-auto p-3 rounded-full transition-colors group hidden md:flex ${
                    isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'
                  }`}>
                    <Volume2 className={`w-5 h-5 ${isDark ? 'text-white/40 group-hover:text-white/60' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className={`flex items-center justify-between mt-8 md:mt-12 pt-8 border-t ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
              {/* Dots */}
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setAutoPlay(false)
                      setCurrentIndex(index)
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex 
                        ? 'w-8 bg-gradient-to-r from-emerald-400 to-teal-400' 
                        : isDark ? 'bg-white/20 hover:bg-white/40' : 'bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>

              {/* Arrows */}
              <div className="flex gap-2">
                <button
                  onClick={goToPrev}
                  className={`p-2 rounded-full transition-colors ${
                    isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  <ChevronLeft className={`w-5 h-5 ${isDark ? 'text-white/60' : 'text-slate-600'}`} />
                </button>
                <button
                  onClick={goToNext}
                  className={`p-2 rounded-full transition-colors ${
                    isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  <ChevronRight className={`w-5 h-5 ${isDark ? 'text-white/60' : 'text-slate-600'}`} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mobile: Scrollable cards */}
        <div className="md:hidden mt-8 -mx-6 px-6 overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: index * 0.1 }}
                className={`w-[300px] flex-shrink-0 rounded-xl border p-5 ${
                  isDark ? 'bg-slate-900/50 border-white/5' : 'bg-white/90 border-amber-200 shadow-lg ring-1 ring-amber-100'
                }`}
              >
                {/* Gradient top bar for light mode */}
                {!isDark && <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r from-amber-400 to-orange-400" />}
                <Quote className={`w-6 h-6 mb-3 bg-gradient-to-r ${typeColors[testimonial.type]} bg-clip-text text-transparent`} fill="currentColor" />
                <p className={`text-sm mb-4 line-clamp-4 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${typeColors[testimonial.type]} flex items-center justify-center`}>
                    <span className="text-xs font-bold text-white">{testimonial.author.charAt(0)}</span>
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{testimonial.author}</div>
                    <div className={`text-xs ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
