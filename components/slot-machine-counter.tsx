"use client"

import { motion, useMotionValue, useSpring } from "framer-motion"
import { useEffect, useState } from "react"

interface SlotMachineCounterProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}

export function SlotMachineCounter({
  value,
  duration = 2,
  prefix = "",
  suffix = "",
  className = "",
}: SlotMachineCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0.2,
  })

  useEffect(() => {
    setIsAnimating(true)
    motionValue.set(value)

    const unsubscribe = springValue.on("change", (latest) => {
      setDisplayValue(Math.floor(latest))
    })

    const timeout = setTimeout(() => {
      setIsAnimating(false)
    }, duration * 1000)

    return () => {
      unsubscribe()
      clearTimeout(timeout)
    }
  }, [value, motionValue, springValue, duration])

  return (
    <motion.span
      className={`${className} ${isAnimating ? "text-yellow-500" : ""}`}
      animate={
        isAnimating
          ? {
              textShadow: [
                "0 0 0px rgba(234, 179, 8, 0)",
                "0 0 10px rgba(234, 179, 8, 0.8)",
                "0 0 0px rgba(234, 179, 8, 0)",
              ],
            }
          : {}
      }
      transition={{ duration: 0.5, repeat: isAnimating ? 3 : 0 }}
    >
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </motion.span>
  )
}
