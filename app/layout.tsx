import type React from "react"
import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import dynamic from "next/dynamic"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

// Dynamic import for AppProviders to reduce initial bundle
const AppProviders = dynamic(
  () => import("@/components/app-providers").then((mod) => mod.AppProviders),
  { ssr: false }
)

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
  preload: true,
})

// Separate viewport export for themeColor (Next.js 14+)
export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  title: "Partners Hub | ZeroUp Initiative",
  description: "Empowering partners to track contributions and drive impact through the ZeroUp Initiative",
  keywords: "partners, contributions, impact tracking, social change, ZeroUp Initiative, Bridge AI, community",
  authors: [{ name: "ZeroUp Initiative" }],
  creator: "ZeroUp Initiative",
  publisher: "ZeroUp Initiative",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ZeroUp Partners",
  },
  formatDetection: {
    telephone: false,
  },
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
    <html lang="en" suppressHydrationWarning className={`${plusJakartaSans.variable} antialiased`}>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/images/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ZeroUp Partners" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#6366f1" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={`font-sans ${plusJakartaSans.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange={false}>
          <AppProviders>
            <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
          </AppProviders>
        </ThemeProvider>
        <Analytics />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful');
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
