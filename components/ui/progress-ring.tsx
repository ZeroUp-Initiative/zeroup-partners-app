"use client"

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface ProgressRingProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  className?: string
  gradientId?: string
  gradientColors?: { start: string; end: string }
  showValue?: boolean
  label?: string
  animate?: boolean
  duration?: number
}

export function ProgressRing({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  className,
  gradientId = "progress-gradient",
  gradientColors = { start: "#8b5cf6", end: "#06b6d4" },
  showValue = true,
  label,
  animate = true,
  duration = 1500
}: ProgressRingProps) {
  const [animatedValue, setAnimatedValue] = useState(animate ? 0 : value)
  const [hasAnimated, setHasAnimated] = useState(false)
  const elementRef = useRef<SVGSVGElement>(null)
  
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percentage = Math.min((animatedValue / max) * 100, 100)
  const offset = circumference - (percentage / 100) * circumference

  useEffect(() => {
    if (!animate) {
      setAnimatedValue(value)
      return
    }

    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true)
            animateValue()
          }
        })
      },
      { threshold: 0.1 }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [animate, hasAnimated, value])

  const animateValue = () => {
    const startTime = performance.now()
    
    const tick = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      
      setAnimatedValue(eased * value)
      
      if (progress < 1) {
        requestAnimationFrame(tick)
      }
    }
    
    requestAnimationFrame(tick)
  }

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        ref={elementRef}
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradientColors.start} />
            <stop offset="100%" stopColor={gradientColors.end} />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-300"
        />
      </svg>
      
      {/* Center content */}
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums">
            {Math.round(animatedValue)}
          </span>
          {label && (
            <span className="text-xs text-muted-foreground">{label}</span>
          )}
        </div>
      )}
    </div>
  )
}

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  gradientColors?: { start: string; end: string }
  showLabel?: boolean
  label?: string
  animate?: boolean
  height?: number
  showMilestones?: boolean
  milestones?: number[]
}

export function ProgressBar({
  value,
  max = 100,
  className,
  gradientColors = { start: "#8b5cf6", end: "#06b6d4" },
  showLabel = true,
  label,
  animate = true,
  height = 8,
  showMilestones = false,
  milestones = [25, 50, 75]
}: ProgressBarProps) {
  const [animatedValue, setAnimatedValue] = useState(animate ? 0 : value)
  const [hasAnimated, setHasAnimated] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)
  
  const percentage = Math.min((animatedValue / max) * 100, 100)

  useEffect(() => {
    if (!animate) {
      setAnimatedValue(value)
      return
    }

    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true)
            const timer = setTimeout(() => {
              setAnimatedValue(value)
            }, 100)
            return () => clearTimeout(timer)
          }
        })
      },
      { threshold: 0.1 }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [animate, hasAnimated, value])

  return (
    <div ref={elementRef} className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <span className="text-sm font-bold">{Math.round(percentage)}%</span>
        </div>
      )}
      
      <div 
        className="relative w-full bg-muted/30 rounded-full overflow-hidden"
        style={{ height }}
      >
        {/* Milestones */}
        {showMilestones && milestones.map((milestone) => (
          <div
            key={milestone}
            className="absolute top-0 bottom-0 w-0.5 bg-background/50 z-10"
            style={{ left: `${milestone}%` }}
          />
        ))}
        
        {/* Progress fill */}
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(to right, ${gradientColors.start}, ${gradientColors.end})`
          }}
        />
      </div>
    </div>
  )
}
