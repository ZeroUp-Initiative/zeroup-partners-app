"use client"

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface DataPoint {
  label: string
  value: number
}

interface MiniChartProps {
  data: DataPoint[]
  className?: string
  height?: number
  gradientColors?: { start: string; end: string }
  showLabels?: boolean
  showValues?: boolean
  animate?: boolean
}

export function MiniLineChart({
  data,
  className,
  height = 80,
  gradientColors = { start: "#8b5cf6", end: "#06b6d4" },
  showLabels = true,
  animate = true
}: MiniChartProps) {
  const [isVisible, setIsVisible] = useState(!animate)
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!animate) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      { threshold: 0.1 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [animate])

  if (data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center text-muted-foreground text-sm", className)} style={{ height }}>
        No data available
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value), 1)
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue || 1
  
  const padding = 20
  const chartWidth = 100 // percentage
  const chartHeight = height - (showLabels ? 24 : 0)
  
  // Generate SVG path
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: chartHeight - ((d.value - minValue) / range) * (chartHeight - padding * 2) - padding
  }))
  
  const linePath = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ')
  
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`

  const gradientId = `line-gradient-${React.useId()}`

  return (
    <div ref={containerRef} className={cn("w-full", className)}>
      <svg 
        viewBox={`0 0 100 ${chartHeight}`} 
        preserveAspectRatio="none"
        className="w-full overflow-visible"
        style={{ height: chartHeight }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradientColors.start} />
            <stop offset="100%" stopColor={gradientColors.end} />
          </linearGradient>
          <linearGradient id={`${gradientId}-area`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={gradientColors.start} stopOpacity="0.3" />
            <stop offset="100%" stopColor={gradientColors.end} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Area fill */}
        <path
          d={areaPath}
          fill={`url(#${gradientId}-area)`}
          className={cn(
            "transition-all duration-1000",
            isVisible ? "opacity-100" : "opacity-0"
          )}
        />
        
        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "transition-all duration-1000",
            isVisible ? "opacity-100" : "opacity-0"
          )}
          style={{
            strokeDasharray: isVisible ? "none" : "1000",
            strokeDashoffset: isVisible ? "0" : "1000"
          }}
        />
        
        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="white"
            stroke={gradientColors.end}
            strokeWidth="2"
            className={cn(
              "transition-all duration-500",
              isVisible ? "opacity-100 scale-100" : "opacity-0 scale-0"
            )}
            style={{ transitionDelay: `${i * 100}ms` }}
          />
        ))}
      </svg>
      
      {showLabels && (
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          {data.map((d, i) => (
            <span key={i} className="truncate px-1">{d.label}</span>
          ))}
        </div>
      )}
    </div>
  )
}

interface MiniBarChartProps {
  data: DataPoint[]
  className?: string
  height?: number
  gradientColors?: { start: string; end: string }
  showLabels?: boolean
  showValues?: boolean
  animate?: boolean
}

export function MiniBarChart({
  data,
  className,
  height = 100,
  gradientColors = { start: "#8b5cf6", end: "#06b6d4" },
  showLabels = true,
  showValues = false,
  animate = true
}: MiniBarChartProps) {
  const [isVisible, setIsVisible] = useState(!animate)
  const containerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!animate) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      { threshold: 0.1 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [animate])

  if (data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center text-muted-foreground text-sm", className)} style={{ height }}>
        No data available
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value), 1)
  const barHeight = height - (showLabels ? 24 : 0) - (showValues ? 20 : 0)
  
  const gradientId = `bar-gradient-${React.useId()}`

  return (
    <div ref={containerRef} className={cn("w-full", className)}>
      <svg className="w-full" style={{ height: barHeight }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={gradientColors.start} />
            <stop offset="100%" stopColor={gradientColors.end} />
          </linearGradient>
        </defs>
        
        {data.map((d, i) => {
          const barWidth = 100 / data.length - 2
          const barX = (100 / data.length) * i + 1
          const barHeightPct = (d.value / maxValue) * 100
          
          return (
            <g key={i}>
              <rect
                x={`${barX}%`}
                y={`${100 - (isVisible ? barHeightPct : 0)}%`}
                width={`${barWidth}%`}
                height={`${isVisible ? barHeightPct : 0}%`}
                rx="4"
                fill={`url(#${gradientId})`}
                className="transition-all duration-700 ease-out"
                style={{ transitionDelay: `${i * 100}ms` }}
              />
            </g>
          )
        })}
      </svg>
      
      {showValues && (
        <div className="flex justify-around mt-1 text-xs font-medium">
          {data.map((d, i) => (
            <span 
              key={i} 
              className={cn(
                "transition-all duration-500",
                isVisible ? "opacity-100" : "opacity-0"
              )}
              style={{ transitionDelay: `${i * 100 + 300}ms` }}
            >
              ₦{d.value.toLocaleString()}
            </span>
          ))}
        </div>
      )}
      
      {showLabels && (
        <div className="flex justify-around mt-2 text-xs text-muted-foreground">
          {data.map((d, i) => (
            <span key={i} className="truncate">{d.label}</span>
          ))}
        </div>
      )}
    </div>
  )
}
