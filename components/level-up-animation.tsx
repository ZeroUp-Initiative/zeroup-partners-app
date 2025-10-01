"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Crown, Star, Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState } from "react"

interface LevelUpAnimationProps {
  newLevel: number | null
  onClose: () => void
}

export function LevelUpAnimation({ newLevel, onClose }: LevelUpAnimationProps) {
  const [showParticles, setShowParticles] = useState(false)

  useEffect(() => {
    if (newLevel) {
      setShowParticles(true)
      const timer = setTimeout(() => {
        setShowParticles(false)
        onClose()
      }, 3500)
      return () => clearTimeout(timer)
    }
  }, [newLevel, onClose])

  if (!newLevel) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Particle Effects */}
        {showParticles && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  y: -100,
                }}
                transition={{
                  duration: 2,
                  delay: Math.random() * 1,
                  repeat: Number.POSITIVE_INFINITY,
                }}
              >
                <Star className="w-4 h-4 text-yellow-400" />
              </motion.div>
            ))}
          </div>
        )}

        <motion.div
          initial={{ scale: 0, y: 100, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0, y: -100, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 150,
            damping: 12,
            duration: 1,
          }}
        >
          <Card className="glassmorphism max-w-lg mx-4 shadow-2xl shadow-yellow-500/30">
            <CardContent className="p-10 text-center space-y-8">
              <motion.div
                className="flex justify-center"
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.3, 1],
                }}
                transition={{
                  rotate: { duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                  scale: { duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" },
                }}
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400/30 to-orange-500/30 flex items-center justify-center shadow-2xl shadow-yellow-500/50">
                  <Crown className="w-12 h-12 text-yellow-500" />
                </div>
              </motion.div>

              <div className="space-y-4">
                <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                  <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                    LEVEL UP!
                  </h2>
                </motion.div>

                <motion.div
                  className="space-y-2"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-2xl font-semibold text-foreground">Level {newLevel}</p>
                  <p className="text-muted-foreground">You've reached a new milestone!</p>
                </motion.div>

                <motion.div
                  className="flex items-center justify-center gap-6"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold">New Perks Unlocked</span>
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
