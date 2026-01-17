import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  tracesSampleRate: 1.0,
  
  // Set profilesSampleRate to 1.0 to profile every sampled transaction.
  profilesSampleRate: 1.0,
  
  // Enable debug mode in development
  debug: process.env.NODE_ENV === "development",
  
  // Only enable in production
  enabled: process.env.NODE_ENV === "production",
  
  // Set environment
  environment: process.env.NODE_ENV,
})
