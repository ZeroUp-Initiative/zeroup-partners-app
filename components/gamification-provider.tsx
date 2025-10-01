"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { AchievementUnlock } from "./achievement-unlock"
import { LevelUpAnimation } from "./level-up-animation"

interface Achievement {
  id: string
  title: string
  description: string
  icon: "trophy" | "star" | "award" | "crown" | "medal" | "zap"
  rarity: "common" | "rare" | "epic" | "legendary"
  points: number
}

interface GamificationContextType {
  showAchievement: (achievement: Achievement) => void
  showLevelUp: (newLevel: number) => void
  triggerCelebration: () => void
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined)

export function useGamification() {
  const context = useContext(GamificationContext)
  if (!context) {
    throw new Error("useGamification must be used within a GamificationProvider")
  }
  return context
}

interface GamificationProviderProps {
  children: ReactNode
}

export function GamificationProvider({ children }: GamificationProviderProps) {
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null)
  const [currentLevel, setCurrentLevel] = useState<number | null>(null)

  const showAchievement = useCallback((achievement: Achievement) => {
    setCurrentAchievement(achievement)
  }, [])

  const showLevelUp = useCallback((newLevel: number) => {
    setCurrentLevel(newLevel)
  }, [])

  const triggerCelebration = useCallback(() => {
    // This can be used to trigger other celebration effects
    console.log("🎉 Celebration triggered!")
  }, [])

  const handleAchievementClose = useCallback(() => {
    setCurrentAchievement(null)
  }, [])

  const handleLevelUpClose = useCallback(() => {
    setCurrentLevel(null)
  }, [])

  return (
    <GamificationContext.Provider
      value={{
        showAchievement,
        showLevelUp,
        triggerCelebration,
      }}
    >
      {children}
      <AchievementUnlock achievement={currentAchievement} onClose={handleAchievementClose} />
      <LevelUpAnimation newLevel={currentLevel} onClose={handleLevelUpClose} />
    </GamificationContext.Provider>
  )
}
