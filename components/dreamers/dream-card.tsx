'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import html2canvas from 'html2canvas'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'
import { Download, Loader2, Lock } from 'lucide-react'
import type { DreamTier } from '@/lib/dreamers/tiers'

interface DreamCardProps {
  tier: DreamTier
  name: string
  drBalance: number
  memberNumber: string
  memberSince: string
  qrValue: string
  locked?: boolean
  unlockHint?: string
}

export function DreamCard({ tier, name, drBalance, memberNumber, memberSince, qrValue, locked, unlockHint }: DreamCardProps) {
  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)
  const [qr, setQr] = useState('')
  const [downloading, setDownloading] = useState<'front' | 'back' | null>(null)

  useEffect(() => {
    QRCode.toDataURL(qrValue, { margin: 1, width: 240, errorCorrectionLevel: 'M' })
      .then(setQr)
      .catch(() => {})
  }, [qrValue])

  const download = async (which: 'front' | 'back') => {
    const ref = which === 'front' ? frontRef : backRef
    if (!ref.current) return
    setDownloading(which)
    try {
      const canvas = await html2canvas(ref.current, { scale: 4, backgroundColor: null, useCORS: true, logging: false })
      const link = document.createElement('a')
      link.download = `zeroup-${tier.id}-dream-card-${which}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setDownloading(null)
    }
  }

  const text = tier.textOn === 'dark' ? '#141414' : '#ffffff'
  const sub = tier.textOn === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.7)'
  const hairline = tier.textOn === 'dark' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)'
  const faceStyle: CSSProperties = { background: tier.gradient, color: text }
  const displayName = (name || 'Dreamer').toUpperCase()

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {/* FRONT */}
      <div className="space-y-2">
        <div
          ref={frontRef}
          className="relative aspect-[856/540] w-full rounded-2xl shadow-2xl overflow-hidden"
          style={faceStyle}
        >
          {/* sheen */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg, rgba(255,255,255,0.18) 0%, transparent 35%, transparent 65%, rgba(255,255,255,0.10) 100%)' }} />
          {/* watermark tier name */}
          <div className="absolute -right-2 bottom-2 font-black leading-none select-none" style={{ fontSize: '4.5rem', color: hairline }}>
            {tier.name}
          </div>

          <div className="relative h-full w-full p-[5.5%] flex flex-col justify-between">
            {/* top row */}
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold tracking-[0.2em]" style={{ fontSize: '0.72rem' }}>ZEROUP DREAM CARD</p>
                <p style={{ color: sub, fontSize: '0.6rem', letterSpacing: '0.15em' }}>DREAMERS COMMUNITY</p>
              </div>
              <div className="text-right">
                <p className="font-extrabold" style={{ fontSize: '0.9rem' }}>{tier.name.toUpperCase()}</p>
                <p style={{ color: sub, fontSize: '0.55rem', letterSpacing: '0.15em' }}>MEMBER</p>
              </div>
            </div>

            {/* chip + balance */}
            <div className="flex items-center justify-between">
              {/* EMV chip */}
              <div
                className="rounded-md"
                style={{
                  width: '13%',
                  aspectRatio: '4 / 3',
                  background: 'linear-gradient(135deg, #f7e7a6, #c8a93a 60%, #9c7d1f)',
                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.2)',
                }}
              />
              <div className="text-right">
                <p className="font-black leading-none" style={{ fontSize: '1.35rem' }}>{drBalance.toLocaleString()}</p>
                <p style={{ color: sub, fontSize: '0.55rem', letterSpacing: '0.15em' }}>DREAM COINS</p>
              </div>
            </div>

            {/* card number */}
            <p className="font-mono" style={{ fontSize: '1.05rem', letterSpacing: '0.12em', textShadow: '0 1px 1px rgba(0,0,0,0.25)' }}>
              {memberNumber}
            </p>

            {/* bottom row */}
            <div className="flex items-end justify-between">
              <div>
                <p style={{ color: sub, fontSize: '0.5rem', letterSpacing: '0.15em' }}>CARD HOLDER</p>
                <p className="font-semibold" style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}>{displayName}</p>
              </div>
              <div className="text-right">
                <p style={{ color: sub, fontSize: '0.5rem', letterSpacing: '0.15em' }}>MEMBER SINCE</p>
                <p className="font-semibold" style={{ fontSize: '0.75rem' }}>{memberSince || '—'}</p>
              </div>
            </div>
          </div>

          {locked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-2 px-6" style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}>
              <Lock className="w-7 h-7" />
              <p className="font-semibold text-sm">{unlockHint || 'Partner with ZeroUp to unlock'}</p>
            </div>
          )}
        </div>
        <Button variant="outline" className="w-full" onClick={() => download('front')} disabled={locked || downloading !== null}>
          {downloading === 'front' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          Download front
        </Button>
      </div>

      {/* BACK */}
      <div className="space-y-2">
        <div
          ref={backRef}
          className="relative aspect-[856/540] w-full rounded-2xl shadow-2xl overflow-hidden"
          style={faceStyle}
        >
          <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg, rgba(255,255,255,0.12) 0%, transparent 40%, rgba(255,255,255,0.08) 100%)' }} />
          <div className="relative h-full w-full flex flex-col">
            {/* magnetic stripe */}
            <div className="mt-[6%] h-[18%] w-full" style={{ background: '#0b0b0b' }} />

            <div className="flex-1 px-[5.5%] py-[4%] flex gap-4">
              {/* left: signature + info */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  {/* signature strip */}
                  <div className="rounded-sm px-2 py-1" style={{ background: '#f4f4f5' }}>
                    <p className="italic" style={{ color: '#333', fontSize: '0.85rem', fontFamily: 'cursive' }}>{name || 'Dreamer'}</p>
                  </div>
                  <p style={{ color: sub, fontSize: '0.5rem', letterSpacing: '0.12em', marginTop: '0.25rem' }}>AUTHORIZED SIGNATURE</p>
                </div>
                <div>
                  <p className="font-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.12em' }}>{tier.cardName.toUpperCase()}</p>
                  <p style={{ color: sub, fontSize: '0.52rem', lineHeight: 1.4 }}>
                    This card certifies active membership in the ZeroUp Dreamers Community. If found, please return to ZeroUp Partners.
                  </p>
                </div>
              </div>

              {/* right: QR */}
              <div className="flex flex-col items-center justify-center">
                <div className="rounded-md p-1.5" style={{ background: '#ffffff' }}>
                  {qr ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qr} alt="QR" style={{ width: '4.2rem', height: '4.2rem', display: 'block' }} />
                  ) : (
                    <div style={{ width: '4.2rem', height: '4.2rem' }} />
                  )}
                </div>
                <p style={{ color: sub, fontSize: '0.5rem', letterSpacing: '0.1em', marginTop: '0.3rem' }}>SCAN TO VERIFY</p>
              </div>
            </div>
          </div>
        </div>
        <Button variant="outline" className="w-full" onClick={() => download('back')} disabled={locked || downloading !== null}>
          {downloading === 'back' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          Download back
        </Button>
      </div>
    </div>
  )
}
