'use client'

type ParsedVideo =
  | { type: 'youtube'; embedSrc: string }
  | { type: 'vimeo'; embedSrc: string }
  | { type: 'file'; src: string }

export function parseVideoUrl(url: string | undefined | null): ParsedVideo | null {
  if (!url) return null
  const trimmed = url.trim()
  if (!trimmed) return null

  const youtubeMatch = trimmed.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{6,})/
  )
  if (youtubeMatch) {
    return { type: 'youtube', embedSrc: `https://www.youtube.com/embed/${youtubeMatch[1]}` }
  }

  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeoMatch) {
    return { type: 'vimeo', embedSrc: `https://player.vimeo.com/video/${vimeoMatch[1]}` }
  }

  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(trimmed)) {
    return { type: 'file', src: trimmed }
  }

  return null
}

export function VideoEmbed({ url, className }: { url: string | undefined | null; className?: string }) {
  const parsed = parseVideoUrl(url)
  if (!parsed) return null

  if (parsed.type === 'file') {
    return (
      <video controls className={className ?? 'w-full h-full rounded-lg'} src={parsed.src}>
        Your browser does not support embedded video.
      </video>
    )
  }

  return (
    <iframe
      className={className ?? 'w-full h-full rounded-lg'}
      src={parsed.embedSrc}
      title="Project video"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  )
}
