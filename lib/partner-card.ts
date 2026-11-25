// Draws the shareable partner card straight onto a <canvas>.
//
// Why not html2canvas: v1.4.1 can't parse the oklab()/color-mix() colours
// Tailwind v4 emits, so every capture threw and the download silently failed.
// Drawing it ourselves also means the preview and the saved file are the exact
// same pixels on every phone.

export type PartnerCardFormat = "post" | "story"

export interface PartnerCardData {
  variant: "top-partner" | "regular"
  name: string
  amount: number
  month: string
  year: number
  photoURL?: string
  projectTitle?: string
  projectImageURL?: string
  message?: string
}

export const CARD_SIZE: Record<PartnerCardFormat, { w: number; h: number }> = {
  post: { w: 1080, h: 1350 },
  story: { w: 1080, h: 1920 },
}

const NAVY = "#1b2540"
const NAVY_DEEP = "#10172d"
const CREAM = "#f4f0e5"
const AMBER = "#f5a300"
const MUTED = "rgba(244,240,229,0.66)"

const LOGO_SRC = "/images/zeroup-partners-logo-light-mode.png"
// The circle-and-arrow mark inside that 500x500 file.
const LOGO_MARK = { x: 199, y: 79, w: 121, h: 113 }

type Ctx = CanvasRenderingContext2D
type FontFn = (px: number) => string

// ---------- loading ----------

async function loadImage(src?: string): Promise<HTMLImageElement | null> {
  if (!src) return null
  return new Promise((resolve) => {
    const img = new Image()
    const remote = /^https?:/i.test(src)
    // Anything without CORS headers would taint the canvas and block saving,
    // so it must fail here (and fall back) rather than load un-exportably.
    if (remote) img.crossOrigin = "anonymous"
    const timer = setTimeout(() => resolve(null), 12000)
    img.onload = () => { clearTimeout(timer); resolve(img.naturalWidth ? img : null) }
    img.onerror = () => { clearTimeout(timer); resolve(null) }
    // The app shows the same photos without CORS; a distinct URL avoids reusing
    // that cached, un-exportable response.
    img.src = remote ? `${src}${src.includes("?") ? "&" : "?"}card=1` : src
  })
}

interface Fonts { display: string; sans: string; hand: string }

function fontFamily(cssVar: string, fallback: string) {
  const v = getComputedStyle(document.body).getPropertyValue(cssVar).trim()
  return v ? `${v}, ${fallback}` : fallback
}

async function loadFonts(): Promise<Fonts> {
  const fonts = {
    display: fontFamily("--font-playfair", "Georgia, serif"),
    sans: fontFamily("--font-plus-jakarta-sans", "system-ui, sans-serif"),
    hand: fontFamily("--font-caveat", "cursive"),
  }
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load(`700 80px ${fonts.display}`),
        document.fonts.load(`500 30px ${fonts.sans}`),
        document.fonts.load(`700 30px ${fonts.sans}`),
        document.fonts.load(`500 50px ${fonts.hand}`),
      ]),
      new Promise((r) => setTimeout(r, 6000)),
    ])
  } catch {
    /* system fallbacks still give a legible card */
  }
  return fonts
}

// ---------- drawing helpers ----------

function drawCover(ctx: Ctx, img: HTMLImageElement, x: number, y: number, w: number, h: number, focusY = 0.35) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const sw = w / s
  const sh = h / s
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) * focusY, sw, sh, x, y, w, h)
}

function archPath(ctx: Ctx, x: number, y: number, w: number, h: number) {
  const r = w / 2
  ctx.beginPath()
  ctx.moveTo(x, y + h)
  ctx.lineTo(x, y + r)
  ctx.arc(x + r, y + r, r, Math.PI, 0)
  ctx.lineTo(x + w, y + h)
  ctx.closePath()
}

function wrapWords(ctx: Ctx, text: string, maxW: number): string[] {
  const lines: string[] = []
  let line = ""
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word
    if (!line || ctx.measureText(next).width <= maxW) line = next
    else { lines.push(line); line = word }
  }
  if (line) lines.push(line)
  return lines
}

/** Largest size (stepping down) at which the text fits; truncates as a last resort. */
function fitText(ctx: Ctx, text: string, font: FontFn, max: number, min: number, maxW: number, maxLines: number) {
  const fits = (l: string) => ctx.measureText(l).width <= maxW
  for (let px = max; px >= min; px -= 2) {
    ctx.font = font(px)
    const lines = wrapWords(ctx, text, maxW)
    if (lines.length <= maxLines && lines.every(fits)) return { px, lines }
  }
  ctx.font = font(min)
  const all = wrapWords(ctx, text, maxW)
  const lines = all.slice(0, maxLines).map((l, i) => {
    const cut = i === maxLines - 1 && all.length > maxLines
    if (!cut && fits(l)) return l
    let s = l
    while (s && !fits(`${s}…`)) s = s.slice(0, -1)
    return `${s.trimEnd()}…`
  })
  return { px: min, lines }
}

/** The web fonts ship without a naira glyph, so it is drawn: an N with two bars. Returns the total width. */
function naira(ctx: Ctx, value: string, x: number, baseline: number, px: number, font: FontFn, color: string, draw = true) {
  ctx.font = font(px)
  const nW = ctx.measureText("N").width
  const gap = px * 0.07
  const over = px * 0.07
  if (draw) {
    ctx.fillStyle = color
    ctx.textAlign = "left"
    ctx.fillText("N", x + over, baseline)
    ctx.fillText(value, x + over * 2 + nW + gap, baseline)
    const capH = ctx.measureText("N").actualBoundingBoxAscent || px * 0.7
    const t = Math.max(2, px * 0.045)
    ctx.fillRect(x, baseline - capH * 0.62, nW + over * 2, t)
    ctx.fillRect(x, baseline - capH * 0.42, nW + over * 2, t)
  }
  return over * 2 + nW + gap + ctx.measureText(value).width
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] || "Z") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase()
}

function tintedMark(logo: HTMLImageElement, color: string, size: number) {
  const c = document.createElement("canvas")
  c.width = size
  c.height = Math.round((size * LOGO_MARK.h) / LOGO_MARK.w)
  const x = c.getContext("2d")!
  x.imageSmoothingQuality = "high"
  x.drawImage(logo, LOGO_MARK.x, LOGO_MARK.y, LOGO_MARK.w, LOGO_MARK.h, 0, 0, c.width, c.height)
  x.globalCompositeOperation = "source-in"
  x.fillStyle = color
  x.fillRect(0, 0, c.width, c.height)
  return c
}

/** Round stamp with the month set around its edge, like a postmark for the gift. */
function drawSeal(ctx: Ctx, cx: number, cy: number, r: number, label: string, fonts: Fonts, logo: HTMLImageElement | null) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.shadowColor = "rgba(0,0,0,0.35)"
  ctx.shadowBlur = 36
  ctx.shadowOffsetY = 12
  ctx.fillStyle = CREAM
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowColor = "transparent"

  ctx.strokeStyle = NAVY
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.arc(0, 0, r - 10, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(0, 0, r - 46, 0, Math.PI * 2)
  ctx.stroke()

  // Text around the ring, spaced so it closes exactly.
  const textR = r - 28
  const chars = Array.from(`${label} `)
  ctx.fillStyle = NAVY
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  let px = 22
  let widths: number[] = []
  let total = 0
  do {
    ctx.font = `700 ${px}px ${fonts.sans}`
    widths = chars.map((c) => ctx.measureText(c).width)
    total = widths.reduce((a, b) => a + b, 0)
    px -= 1
  } while (total > 2 * Math.PI * textR * 0.94 && px > 12)
  const extra = (2 * Math.PI * textR - total) / chars.length
  ctx.rotate(-Math.PI * 0.75)
  chars.forEach((c, i) => {
    const step = (widths[i] + extra) / textR
    ctx.rotate(step / 2)
    ctx.fillText(c, 0, -textR)
    ctx.rotate(step / 2)
  })
  ctx.restore()

  if (logo) {
    const m = tintedMark(logo, NAVY, Math.round((r - 46) * 1.15))
    ctx.drawImage(m, cx - m.width / 2, cy - m.height / 2)
  }
}

// ---------- the card ----------

export async function renderPartnerCard(data: PartnerCardData, format: PartnerCardFormat): Promise<Blob> {
  const [fonts, photo, projectImg, logo] = await Promise.all([
    loadFonts(),
    loadImage(data.photoURL),
    loadImage(data.projectImageURL),
    loadImage(LOGO_SRC),
  ])

  const { w: W, h: H } = CARD_SIZE[format]
  const story = format === "story"
  const top = data.variant === "top-partner"
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas is not available in this browser.")
  ctx.imageSmoothingQuality = "high"
  ctx.textBaseline = "alphabetic"

  const M = 80
  // Stories hide roughly 200px at each end behind the app's own controls.
  const safeTop = story ? 230 : 84
  const safeBottom = story ? H - 230 : H - 76

  const g = ctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, NAVY)
  g.addColorStop(1, NAVY_DEEP)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  const displayFont: FontFn = (px) => `700 ${px}px ${fonts.display}`
  const sansBold: FontFn = (px) => `700 ${px}px ${fonts.sans}`
  const sans: FontFn = (px) => `500 ${px}px ${fonts.sans}`
  const hand: FontFn = (px) => `500 ${px}px ${fonts.hand}`

  // Text is laid out first, from the bottom up; the portrait takes what is left.
  const headline = top ? "Partner of the Month" : data.projectTitle || "ZeroUp Initiative"
  const kicker = top ? `${data.month} ${data.year}` : data.projectTitle ? "I partnered with" : "Proud partner of"
  let title = fitText(ctx, headline, displayFont, story ? 108 : 92, 64, W - M * 2, 2)
  if (title.lines.some((l) => l.endsWith("…"))) title = fitText(ctx, headline, displayFont, 62, 42, W - M * 2, 3)
  const titleLH = title.px * 1.08
  const titleH = titleLH * title.lines.length
  const messageText = data.message?.trim()
  const message = messageText ? fitText(ctx, messageText, hand, 46, 36, W - M * 2, 2) : null
  const messageH = message ? message.lines.length * message.px * 1.05 + 18 : 0

  const nameBase = safeBottom
  const ruleY = nameBase - 112
  const titleTop = ruleY - (story ? 48 : 38) - messageH - titleH
  const kickerBase = titleTop - 16
  const artBottom = kickerBase - (story ? 100 : 84)

  // Portrait arch; shifts left to make room for the project's framed artwork
  const artTop = safeTop
  const archH = artBottom - artTop
  const archW = Math.min(story ? 640 : 560, Math.round(archH * 0.88))
  const showPrint = !!projectImg && !top
  const archX = showPrint ? Math.round(W * 0.42 - archW / 2) : Math.round((W - archW) / 2)

  ctx.strokeStyle = top ? AMBER : "rgba(244,240,229,0.28)"
  ctx.lineWidth = 3
  archPath(ctx, archX - 22, artTop - 22, archW + 44, archH + 22)
  ctx.stroke()

  ctx.save()
  archPath(ctx, archX, artTop, archW, archH)
  ctx.clip()
  ctx.fillStyle = AMBER
  ctx.fillRect(archX, artTop, archW, archH)
  if (photo) {
    drawCover(ctx, photo, archX, artTop, archW, archH)
  } else {
    const text = initialsOf(data.name)
    let px = archH * 0.5
    ctx.font = displayFont(px)
    const tw = ctx.measureText(text).width
    const room = archW * (showPrint ? 0.58 : 0.7)
    if (tw > room) { px *= room / tw; ctx.font = displayFont(px) }
    const ascent = ctx.measureText(text).actualBoundingBoxAscent || px * 0.7
    ctx.fillStyle = NAVY
    ctx.textAlign = "center"
    ctx.fillText(text, archX + archW / 2, artTop + archH * (showPrint ? 0.31 : 0.5) + ascent / 2)
  }
  ctx.restore()

  // Project artwork as a framed print, shown whole: posters carry text, so never cropped
  if (projectImg && showPrint) {
    const landscape = projectImg.naturalWidth > projectImg.naturalHeight * 1.15
    const maxW = (story ? 370 : 310) * (landscape ? 1.35 : 1)
    const s = Math.min(maxW / projectImg.naturalWidth, (archH * 0.58) / projectImg.naturalHeight)
    const pw = projectImg.naturalWidth * s
    const ph = projectImg.naturalHeight * s
    const frame = 14
    const cx = Math.min(archX + archW + pw * 0.22, W - M - pw / 2)
    const cy = artBottom - ph / 2 - 30
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate((4 * Math.PI) / 180)
    ctx.shadowColor = "rgba(0,0,0,0.45)"
    ctx.shadowBlur = 44
    ctx.shadowOffsetY = 18
    ctx.fillStyle = CREAM
    ctx.fillRect(-pw / 2 - frame, -ph / 2 - frame, pw + frame * 2, ph + frame * 2)
    ctx.shadowColor = "transparent"
    ctx.drawImage(projectImg, -pw / 2, -ph / 2, pw, ph)
    ctx.restore()
  }

  const sealR = story ? 120 : 108
  drawSeal(
    ctx,
    Math.max(archX + 10, M + sealR - 30),
    artBottom - sealR * 0.72,
    sealR,
    `ZEROUP PARTNERS • ${data.month.toUpperCase()} ${data.year} •`,
    fonts,
    logo,
  )

  ctx.textAlign = "left"
  ctx.fillStyle = AMBER
  ctx.font = hand(story ? 64 : 58)
  ctx.fillText(kicker, M, kickerBase)

  ctx.fillStyle = CREAM
  ctx.font = displayFont(title.px)
  title.lines.forEach((l, i) => ctx.fillText(l, M - 2, titleTop + titleLH * i + title.px * 0.92))

  if (message) {
    ctx.fillStyle = MUTED
    ctx.font = hand(message.px)
    const y0 = titleTop + titleH + 18
    message.lines.forEach((l, i) => ctx.fillText(l, M, y0 + message.px * (0.9 + i * 1.05)))
  }

  ctx.fillStyle = "rgba(244,240,229,0.22)"
  ctx.fillRect(M, ruleY, W - M * 2, 2)

  const value = Math.round(data.amount || 0).toLocaleString("en-NG")
  const amountPx = 52
  const amountW = naira(ctx, value, 0, 0, amountPx, sansBold, AMBER, false)

  ctx.font = sans(24)
  ctx.fillStyle = MUTED
  ctx.textAlign = "left"
  ctx.fillText(top ? "Top contributor" : "Partner", M, ruleY + 44)
  ctx.textAlign = "right"
  ctx.fillText("Contributed", W - M, ruleY + 44)

  naira(ctx, value, W - M - amountW, nameBase, amountPx, sansBold, AMBER)

  const cleanName = data.name.trim().replace(/\s+/g, " ") || "A ZeroUp Partner"
  const nameW = W - M * 2 - amountW - 40
  let name = fitText(ctx, cleanName, sansBold, 52, 38, nameW, 1)
  if (name.lines[0].endsWith("…")) name = fitText(ctx, cleanName, sansBold, 34, 26, nameW, 2)
  ctx.font = sansBold(name.px)
  ctx.fillStyle = CREAM
  ctx.textAlign = "left"
  name.lines.forEach((l, i) => {
    const below = name.lines.length - 1 - i
    // A two-line name hangs its second line just under the amount's baseline.
    const shift = name.lines.length > 1 ? name.px * 0.55 : 0
    ctx.fillText(l, M, nameBase + shift - below * name.px * 1.15)
  })

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not create the image."))), "image/png")
  })
}
