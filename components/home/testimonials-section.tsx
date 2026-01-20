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

export function TestimonialsSection() {
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
      className="relative py-24 md:py-32 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
            <Quote className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-sm text-amber-400 font-medium">Real Voices</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
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
          <div className="relative bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-white/5 p-8 md:p-12 lg:p-16">
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
                <blockquote className="text-xl md:text-2xl lg:text-3xl text-white font-light leading-relaxed mb-8 md:mb-12">
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
                    <div className="font-semibold text-white text-lg">
                      {currentTestimonial.author}
                    </div>
                    <div className="text-white/50 text-sm">
                      {currentTestimonial.role} • {currentTestimonial.location}
                    </div>
                  </div>

                  {/* Optional audio button */}
                  <button className="ml-auto p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors group hidden md:flex">
                    <Volume2 className="w-5 h-5 text-white/40 group-hover:text-white/60" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 md:mt-12 pt-8 border-t border-white/5">
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
                        : 'bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>

              {/* Arrows */}
              <div className="flex gap-2">
                <button
                  onClick={goToPrev}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-white/60" />
                </button>
                <button
                  onClick={goToNext}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-white/60" />
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
                className="w-[300px] flex-shrink-0 bg-slate-900/50 rounded-xl border border-white/5 p-5"
              >
                <Quote className={`w-6 h-6 mb-3 bg-gradient-to-r ${typeColors[testimonial.type]} bg-clip-text text-transparent`} fill="currentColor" />
                <p className="text-white/80 text-sm mb-4 line-clamp-4">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${typeColors[testimonial.type]} flex items-center justify-center`}>
                    <span className="text-xs font-bold text-white">{testimonial.author.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{testimonial.author}</div>
                    <div className="text-xs text-white/40">{testimonial.role}</div>
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
