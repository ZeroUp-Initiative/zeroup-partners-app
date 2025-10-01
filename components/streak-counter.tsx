"use client"

import { motion } from "framer-motion"
import { Flame, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface StreakCounterProps {
  currentStreak: number
  longestStreak: number
  streakType: "daily" | "weekly" | "monthly"
  className?: string
}

export function StreakCounter({ currentStreak, longestStreak, streakType, className = "" }: StreakCounterProps) {
  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "text-red-500"
    if (streak >= 14) return "text-orange-500"
    if (streak >= 7) return "text-yellow-500"
    return "text-blue-500"
  }

  const getStreakIntensity = (streak: number) => {
    if (streak >= 30) return 3
    if (streak >= 14) return 2
    if (streak >= 7) return 1
    return 0
  }

  const streakColor = getStreakColor(currentStreak)
  const intensity = getStreakIntensity(currentStreak)

  return (
    <Card className={`glassmorphism ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="relative"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            >
              <Flame className={`w-8 h-8 ${streakColor}`} />
              {intensity > 0 && (
                <motion.div
                  className="absolute inset-0"
                  animate={{
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                >
                  <Flame className={`w-8 h-8 ${streakColor} blur-sm`} />
                </motion.div>
              )}
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Current Streak</h3>
                <Badge variant="outline" className="text-xs">
                  {streakType}
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <motion.span
                  className={`text-2xl font-bold ${streakColor}`}
                  animate={{
                    textShadow:
                      intensity > 0
                        ? ["0 0 0px currentColor", "0 0 10px currentColor", "0 0 0px currentColor"]
                        : undefined,
                  }}
                  transition={{
                    duration: 2,
                    repeat: intensity > 0 ? Number.POSITIVE_INFINITY : 0,
                  }}
                >
                  {currentStreak}
                </motion.span>
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Best: {longestStreak}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Streak Milestones */}
          <div className="flex flex-col gap-1">
            {[7, 14, 30].map((milestone) => (
              <motion.div
                key={milestone}
                className={`w-3 h-3 rounded-full border-2 ${
                  currentStreak >= milestone
                    ? `bg-${getStreakColor(milestone).split("-")[1]}-500 border-${getStreakColor(milestone).split("-")[1]}-500`
                    : "border-muted-foreground/30"
                }`}
                animate={
                  currentStreak >= milestone
                    ? {
                        scale: [1, 1.2, 1],
                        boxShadow: ["0 0 0px currentColor", "0 0 8px currentColor", "0 0 0px currentColor"],
                      }
                    : {}
                }
                transition={{
                  duration: 2,
                  repeat: currentStreak >= milestone ? Number.POSITIVE_INFINITY : 0,
                }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
