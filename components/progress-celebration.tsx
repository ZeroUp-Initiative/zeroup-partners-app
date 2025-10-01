"use client"

import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, Star, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"

interface ProgressCelebrationProps {
  title: string
  currentValue: number
  targetValue: number
  showCelebration: boolean
  onCelebrationEnd: () => void
}

export function ProgressCelebration({
  title,
  currentValue,
  targetValue,
  showCelebration,
  onCelebrationEnd,
}: ProgressCelebrationProps) {
  const [animatedValue, setAnimatedValue] = useState(0)
  const percentage = Math.min((currentValue / targetValue) * 100, 100)
  const isComplete = currentValue >= targetValue

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(currentValue)
    }, 500)
    return () => clearTimeout(timer)
  }, [currentValue])

  useEffect(() => {
    if (showCelebration && isComplete) {
      const timer = setTimeout(onCelebrationEnd, 3000)
      return () => clearTimeout(timer)
    }
  }, [showCelebration, isComplete, onCelebrationEnd])

  return (
    <div className="relative">
      <Card className="glassmorphism">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{title}</h3>
              {isComplete && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                >
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </motion.div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {animatedValue.toLocaleString()} / {targetValue.toLocaleString()}
                </span>
              </div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <Progress value={percentage} className={`h-3 ${isComplete ? "progress-complete" : ""}`} />
              </motion.div>
              <div className="text-right">
                <motion.span
                  className={`text-sm font-medium ${isComplete ? "text-green-500" : "text-muted-foreground"}`}
                  animate={
                    isComplete
                      ? {
                          scale: [1, 1.1, 1],
                        }
                      : {}
                  }
                  transition={{
                    duration: 1,
                    repeat: isComplete ? Number.POSITIVE_INFINITY : 0,
                    repeatType: "reverse",
                  }}
                >
                  {percentage.toFixed(1)}%
                </motion.span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Celebration Animation */}
      <AnimatePresence>
        {showCelebration && isComplete && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Confetti */}
            {Array.from({ length: 15 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                }}
                initial={{ scale: 0, rotate: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  rotate: [0, 360, 720],
                  y: [-20, -60, 20],
                  x: [0, Math.random() * 40 - 20, Math.random() * 80 - 40],
                }}
                transition={{
                  duration: 2,
                  delay: Math.random() * 0.5,
                }}
              >
                {i % 3 === 0 ? (
                  <Star className="w-4 h-4 text-yellow-400" />
                ) : (
                  <Sparkles className="w-4 h-4 text-blue-400" />
                )}
              </motion.div>
            ))}

            {/* Success Glow */}
            <motion.div
              className="absolute inset-0 bg-green-500/10 rounded-lg"
              animate={{
                opacity: [0, 0.3, 0],
              }}
              transition={{
                duration: 1,
                repeat: 2,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
