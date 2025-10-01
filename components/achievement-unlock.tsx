"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Trophy, Star, Award, Crown, Medal, Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"

interface Achievement {
  id: string
  title: string
  description: string
  icon: "trophy" | "star" | "award" | "crown" | "medal" | "zap"
  rarity: "common" | "rare" | "epic" | "legendary"
  points: number
}

interface AchievementUnlockProps {
  achievement: Achievement | null
  onClose: () => void
}

const iconMap = {
  trophy: Trophy,
  star: Star,
  award: Award,
  crown: Crown,
  medal: Medal,
  zap: Zap,
}

const rarityColors = {
  common: "text-gray-500",
  rare: "text-blue-500",
  epic: "text-purple-500",
  legendary: "text-yellow-500",
}

const rarityGlows = {
  common: "shadow-gray-500/50",
  rare: "shadow-blue-500/50",
  epic: "shadow-purple-500/50",
  legendary: "shadow-yellow-500/50",
}

export function AchievementUnlock({ achievement, onClose }: AchievementUnlockProps) {
  const [showFireworks, setShowFireworks] = useState(false)

  useEffect(() => {
    if (achievement) {
      setShowFireworks(true)
      const timer = setTimeout(() => {
        setShowFireworks(false)
        onClose()
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [achievement, onClose])

  if (!achievement) return null

  const IconComponent = iconMap[achievement.icon]

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Fireworks Effect */}
        {showFireworks && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                style={{
                  left: `${50 + Math.cos((i * Math.PI) / 4) * 20}%`,
                  top: `${50 + Math.sin((i * Math.PI) / 4) * 20}%`,
                }}
                initial={{ scale: 0, opacity: 1 }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [1, 1, 0],
                  x: Math.cos((i * Math.PI) / 4) * 200,
                  y: Math.sin((i * Math.PI) / 4) * 200,
                }}
                transition={{ duration: 2, delay: 0.5 }}
              />
            ))}
          </div>
        )}

        <motion.div
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0, rotate: 180, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            duration: 0.8,
          }}
        >
          <Card className={`glassmorphism max-w-md mx-4 shadow-2xl ${rarityGlows[achievement.rarity]}`}>
            <CardContent className="p-8 text-center space-y-6">
              <motion.div
                className="flex justify-center"
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  rotate: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                  scale: { duration: 1, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" },
                }}
              >
                <div
                  className={`w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ${rarityGlows[achievement.rarity]} shadow-lg`}
                >
                  <IconComponent className={`w-10 h-10 ${rarityColors[achievement.rarity]}`} />
                </div>
              </motion.div>

              <div className="space-y-2">
                <motion.h3
                  className="text-2xl font-bold text-foreground"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Achievement Unlocked!
                </motion.h3>
                <motion.h4
                  className="text-xl font-semibold text-primary"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {achievement.title}
                </motion.h4>
                <motion.p
                  className="text-muted-foreground"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {achievement.description}
                </motion.p>
              </div>

              <motion.div
                className="flex items-center justify-center gap-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Badge variant="outline" className={`${rarityColors[achievement.rarity]} border-current`}>
                  {achievement.rarity.toUpperCase()}
                </Badge>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-bold">+{achievement.points} XP</span>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
