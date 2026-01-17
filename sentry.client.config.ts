import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production, or using tracesSampler for finer control.
  tracesSampleRate: 1.0,
  
  // Set profilesSampleRate to 1.0 to profile every sampled transaction.
  profilesSampleRate: 1.0,
  
  // Capture Replay for 10% of all sessions
  replaysSessionSampleRate: 0.1,
  
  // Capture 100% of sessions with an error
  replaysOnErrorSampleRate: 1.0,
  
  // Enable debug mode in development
  debug: process.env.NODE_ENV === "development",
  
  // Only enable in production
  enabled: process.env.NODE_ENV === "production",
  
  // Filter out known non-actionable errors
  ignoreErrors: [
    // Firebase auth expected errors
    "auth/popup-closed-by-user",
    "auth/cancelled-popup-request",
    // Network errors
    "Network request failed",
    "Load failed",
    // Common browser extensions
    "ResizeObserver loop",
  ],
  
  // Set environment
  environment: process.env.NODE_ENV,
})
