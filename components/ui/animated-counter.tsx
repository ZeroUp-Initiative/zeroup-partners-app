"use client"

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface AnimatedCounterProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  separator?: string
  className?: string
  onComplete?: () => void
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

export function AnimatedCounter({
  value,
  duration = 2000,
  prefix = "",
  suffix = "",
  decimals = 0,
  separator = ",",
  className,
  onComplete
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [hasAnimated, setHasAnimated] = useState(false)
  const elementRef = useRef<HTMLSpanElement>(null)
  const startTimeRef = useRef<number | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const previousValueRef = useRef(value)

  // Update display value when value prop changes
  useEffect(() => {
    if (previousValueRef.current !== value) {
      previousValueRef.current = value
      // If already visible, animate to new value
      if (hasAnimated) {
        startAnimation()
      } else {
        setDisplayValue(value)
      }
    }
  }, [value, hasAnimated])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true)
            startAnimation()
          }
        })
      },
      { threshold: 0.1 }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [hasAnimated])

  const startAnimation = () => {
    startTimeRef.current = null
    const startValue = displayValue
    const targetValue = value

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime
      }

      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutExpo(progress)
      const currentValue = startValue + (targetValue - startValue) * easedProgress

      setDisplayValue(currentValue)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(targetValue)
        onComplete?.()
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }

  const formatNumber = (num: number): string => {
    const fixed = num.toFixed(decimals)
    const [intPart, decPart] = fixed.split(".")
    const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    return decPart ? `${formatted}.${decPart}` : formatted
  }

  return (
    <span ref={elementRef} className={cn("tabular-nums", className)}>
      {prefix}{formatNumber(displayValue)}{suffix}
    </span>
  )
}

interface CurrencyCounterProps {
  value: number
  currency?: string
  duration?: number
  className?: string
}

export function CurrencyCounter({
  value,
  currency = "₦",
  duration = 2000,
  className
}: CurrencyCounterProps) {
  return (
    <AnimatedCounter
      value={value}
      duration={duration}
      prefix={currency}
      decimals={0}
      separator=","
      className={className}
    />
  )
}

interface PercentageCounterProps {
  value: number
  duration?: number
  className?: string
}

export function PercentageCounter({
  value,
  duration = 1500,
  className
}: PercentageCounterProps) {
  return (
    <AnimatedCounter
      value={value}
      duration={duration}
      suffix="%"
      decimals={0}
      className={className}
    />
  )
}
