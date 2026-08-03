'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function ProjectGallery({ images }: { images: string[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (!images || images.length === 0) return null

  const showPrev = () => setOpenIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length))
  const showNext = () => setOpenIndex((i) => (i === null ? null : (i + 1) % images.length))

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((src, i) => (
          <button
            key={src + i}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="aspect-square rounded-lg overflow-hidden bg-muted hover:opacity-90 transition-opacity"
          >
            <img src={src} alt={`Gallery image ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      <Dialog open={openIndex !== null} onOpenChange={(o) => !o && setOpenIndex(null)}>
        <DialogContent className="max-w-3xl p-2 bg-black/95 border-0">
          {openIndex !== null && (
            <div className="relative flex items-center justify-center min-h-[50vh]">
              <img
                src={images[openIndex]}
                alt={`Gallery image ${openIndex + 1}`}
                className="max-h-[80vh] w-auto max-w-full object-contain rounded"
              />
              {images.length > 1 && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={showPrev}
                    className="absolute left-1 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={showNext}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
