"use client"

import { useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Crown, Medal, Star, Trophy, Sparkles, Download, Loader2 } from "lucide-react"
import html2canvas from "html2canvas"

export interface PartnerFlierCardProps {
  variant?: "top-partner" | "regular"
  name: string
  amount: number
  photoURL?: string
  month: string
  year: number
  customMessage?: string
  showDownload?: boolean
  className?: string
}

export function PartnerFlierCard({
  variant = "regular",
  name,
  amount,
  photoURL,
  month,
  year,
  customMessage,
  showDownload = true,
  className = "",
}: PartnerFlierCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const isTopPartner = variant === "top-partner"
  
  const defaultMessage = isTopPartner 
    ? "Thank you for your incredible generosity and commitment to transforming lives!"
    : "Thank you for being a valued partner in our mission to transform lives!"

  const handleDownload = async () => {
    if (!cardRef.current) return
    
    setIsDownloading(true)
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, // Higher quality for social media
        backgroundColor: null,
        useCORS: true,
        allowTaint: true,
        logging: false,
      })
      
      const link = document.createElement("a")
      link.download = `zeroup-partner-${name.toLowerCase().replace(/\s+/g, '-')}-${month}-${year}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    } catch (error) {
      console.error("Error downloading image:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <Card 
        ref={cardRef}
        className="relative overflow-hidden border-0 shadow-2xl aspect-[4/5]"
      >
        {/* Background gradient with premium look */}
        <div className={`absolute inset-0 ${
          isTopPartner 
            ? "bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500"
            : "bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600"
        }`} />
        <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] ${
          isTopPartner
            ? "from-yellow-400/40 via-transparent to-transparent"
            : "from-cyan-400/40 via-transparent to-transparent"
        }`} />
        <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] ${
          isTopPartner 
            ? "from-red-600/30 via-transparent to-transparent"
            : "from-violet-600/30 via-transparent to-transparent"
        }`} />
        
        {/* Decorative sparkles/patterns */}
        <div className="absolute top-4 right-4 text-white/20">
          <Sparkles className="w-10 h-10 sm:w-14 sm:h-14" />
        </div>
        <div className="absolute top-1/4 left-6 text-white/15">
          <Sparkles className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>
        <div className="absolute top-1/4 left-8 w-2 h-2 bg-white/30 rounded-full" />
        <div className="absolute top-1/3 right-12 w-3 h-3 bg-white/20 rounded-full" />
        
        <CardHeader className="relative pb-1 pt-3 sm:pt-5">
          <div className="flex items-center gap-2 sm:gap-3 justify-center">
            <div className={`p-1.5 sm:p-2.5 rounded-xl backdrop-blur-sm shadow-lg bg-white/20`}>
              {isTopPartner ? (
                <Crown className="h-4 w-4 sm:h-6 sm:w-6 text-white drop-shadow-lg" />
              ) : (
                <Star className="h-4 w-4 sm:h-6 sm:w-6 text-white drop-shadow-lg" />
              )}
            </div>
            <div className="text-center">
              <CardTitle className="text-base sm:text-xl md:text-2xl font-bold text-white drop-shadow-lg">
                {isTopPartner ? "Partner of the Month" : "Partner for"}
              </CardTitle>
              {!isTopPartner && (
                <p className="text-white/90 text-sm sm:text-base font-semibold mt-0.5">
                  {month} {year}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center justify-between h-[calc(100%-60px)] sm:h-[calc(100%-80px)] py-2 sm:py-4 relative">
          {/* Month/Year Banner - only for top partner */}
          {isTopPartner && (
            <div className="px-3 sm:px-5 py-0.5 sm:py-1 bg-white/90 dark:bg-gray-900/90 rounded-full shadow-xl backdrop-blur-sm">
              <span className="text-[10px] sm:text-xs font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                {month} {year}
              </span>
            </div>
          )}
          
          {/* For regular variant, just add a spacer */}
          {!isTopPartner && <div className="h-2" />}
          
          <div className="relative my-2 sm:my-3">
            {/* Premium glow effect */}
            <div className="absolute inset-0 bg-white rounded-full blur-2xl opacity-40 scale-125" />
            <div className={`absolute inset-0 rounded-full blur-xl opacity-50 scale-110 ${
              isTopPartner 
                ? "bg-gradient-to-br from-yellow-300 to-orange-400"
                : "bg-gradient-to-br from-cyan-300 to-blue-400"
            }`} />
            <Avatar className="h-20 w-20 sm:h-28 sm:w-28 md:h-32 md:w-32 border-4 sm:border-[5px] border-white shadow-2xl relative">
              <AvatarImage src={photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${name}&backgroundColor=${isTopPartner ? 'f59e0b' : '3b82f6'}`} />
              <AvatarFallback className={`text-2xl sm:text-3xl font-bold text-white ${
                isTopPartner 
                  ? "bg-gradient-to-br from-amber-400 to-orange-500"
                  : "bg-gradient-to-br from-blue-400 to-indigo-500"
              }`}>
                {name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            
            {/* Crown/Star badge */}
            {isTopPartner && (
              <div className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2">
                <div className="bg-gradient-to-br from-yellow-400 to-amber-500 text-white p-1 sm:p-1.5 rounded-full shadow-xl animate-bounce">
                  <Crown className="h-3 w-3 sm:h-5 sm:w-5" />
                </div>
              </div>
            )}
            
            {/* Medal badge */}
            <div className={`absolute -bottom-1 -right-1 text-white p-1.5 sm:p-2 rounded-full shadow-xl ${
              isTopPartner 
                ? "bg-white text-amber-500 ring-2 sm:ring-4 ring-amber-400"
                : "bg-white text-blue-500 ring-2 sm:ring-4 ring-blue-400"
            }`}>
              <Medal className="h-3 w-3 sm:h-5 sm:w-5" />
            </div>
          </div>
          
          <div className="text-center space-y-1 sm:space-y-2">
            <h3 className="text-lg sm:text-xl md:text-3xl font-extrabold text-white drop-shadow-lg tracking-tight px-2">
              {name || 'Anonymous Partner'}
            </h3>
            <div className="inline-flex items-center gap-1 px-2 sm:px-4 py-1 sm:py-2 rounded-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-xl">
              <span className="text-gray-500 text-[10px] sm:text-xs font-medium">Contributed</span>
              <span className={`text-base sm:text-xl md:text-2xl font-black bg-clip-text text-transparent ${
                isTopPartner 
                  ? "bg-gradient-to-r from-amber-500 to-orange-600"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600"
              }`}>
                ₦{amount.toLocaleString()}
              </span>
            </div>
          </div>
          
          {/* Star rating */}
          <div className="flex gap-0.5 sm:gap-1">
            {[1,2,3,4,5].map(i => (
              <Star 
                key={i} 
                className={`h-4 w-4 sm:h-5 sm:w-5 drop-shadow-lg ${
                  isTopPartner 
                    ? "fill-yellow-300 text-yellow-300"
                    : "fill-cyan-300 text-cyan-300"
                }`}
              />
            ))}
          </div>
          
          <p className="text-[10px] sm:text-xs text-center text-white/90 max-w-[200px] sm:max-w-[280px] font-medium italic drop-shadow px-2 leading-tight">
            "{customMessage || defaultMessage}"
          </p>
          
          {/* Bottom badge and branding */}
          <div className="flex flex-col items-center gap-1 sm:gap-2">
            <div className={`flex items-center gap-1.5 sm:gap-2 ${isTopPartner ? "text-white/90" : "text-white/90"}`}>
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-[10px] sm:text-xs font-semibold tracking-wide">
                {isTopPartner ? "TOP CONTRIBUTOR" : "VALUED PARTNER"}
              </span>
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
            <span className="text-white/40 text-[8px] sm:text-[10px] font-semibold tracking-widest">
              ZEROUP PARTNERS
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* Download button - positioned outside the card for cleaner export */}
      {showDownload && (
        <div className="mt-4 flex justify-center" data-download-btn>
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className={`${
              isTopPartner
                ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            } text-white shadow-lg`}
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Download Image
          </Button>
        </div>
      )}
    </div>
  )
}

// Modal version for showing partner flier in a dialog
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface PartnerFlierModalProps {
  trigger: React.ReactNode
  partner: {
    name: string
    amount: number
    photoURL?: string
    month?: string
    year?: number
  }
  variant?: "top-partner" | "regular"
  customMessage?: string
}

export function PartnerFlierModal({
  trigger,
  partner,
  variant = "regular",
  customMessage,
}: PartnerFlierModalProps) {
  const now = new Date()
  const month = partner.month || now.toLocaleString('default', { month: 'long' })
  const year = partner.year || now.getFullYear()

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Partner Recognition Card</DialogTitle>
        </DialogHeader>
        <PartnerFlierCard
          variant={variant}
          name={partner.name}
          amount={partner.amount}
          photoURL={partner.photoURL}
          month={month}
          year={year}
          customMessage={customMessage}
          showDownload={true}
        />
      </DialogContent>
    </Dialog>
  )
}
