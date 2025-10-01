"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Coins } from "lucide-react"
import { useState, useEffect } from "react"

interface CoinDropAnimationProps {
  isActive: boolean
  coinCount: number
}

export function CoinDropAnimation({ isActive, coinCount }: CoinDropAnimationProps) {
  const [coins, setCoins] = useState<Array<{ id: number; delay: number }>>([])

  useEffect(() => {
    if (isActive) {
      const newCoins = Array.from({ length: Math.min(coinCount / 100, 10) }, (_, i) => ({
        id: i,
        delay: i * 0.1,
      }))
      setCoins(newCoins)
    }
  }, [isActive, coinCount])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {isActive &&
          coins.map((coin) => (
            <motion.div
              key={coin.id}
              className="absolute top-0 text-yellow-500"
              initial={{
                x: Math.random() * 300,
                y: -50,
                rotate: 0,
                scale: 0,
              }}
              animate={{
                y: 400,
                rotate: 720,
                scale: [0, 1, 0.8, 1, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 2,
                delay: coin.delay,
                ease: "easeOut",
              }}
            >
              <Coins className="w-6 h-6" />
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  )
}
