import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AppProviders } from "@/components/app-providers"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Partners Hub | ZeroUp Initiative",
  description: "Empowering partners to track contributions and drive impact through the ZeroUp Initiative",
  keywords: "partners, contributions, impact tracking, social change, ZeroUp Initiative, Bridge AI, community",
  authors: [{ name: "ZeroUp Initiative" }],
  creator: "ZeroUp Initiative",
  publisher: "ZeroUp Initiative",
  openGraph: {
    title: "Partners Hub | ZeroUp Initiative",
    description: "Join our community of dedicated partners tracking contributions and creating lasting impact",
    url: "https://partners-hub.vercel.app",
    siteName: "Partners Hub",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Partners Hub",
    description: "Empowering partners to track contributions and drive meaningful change",
    creator: "@ZeroUpInitiative",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
      <body className={`font-sans ${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange={false}>
          <AppProviders>
            <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
          </AppProviders>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
