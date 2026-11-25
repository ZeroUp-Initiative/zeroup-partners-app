// Public address used in emails and shared links. Emails used to hardcode the
// deleted Vercel address, so every button in them led to a 404.
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://zeroup-partners-app.bridegai.workers.dev').replace(/\/$/, '')
