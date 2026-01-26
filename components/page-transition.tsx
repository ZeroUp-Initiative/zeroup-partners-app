"use client"

import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

interface PageTransitionProps {
  children: ReactNode
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -10,
  },
}

const pageTransition = {
  type: "tween",
  ease: "easeOut",
  duration: 0.2,
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()

  return (
    <LazyMotion features={domAnimation} strict>
      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={pathname}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className="min-h-screen"
        >
          {children}
        </m.div>
      </AnimatePresence>
    </LazyMotion>
  )
}
