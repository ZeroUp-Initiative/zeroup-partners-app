import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging"
import { doc, updateDoc, arrayUnion, getDoc, setDoc } from "firebase/firestore"
import app, { db } from "./firebase/client"

// VAPID key for web push (you'll need to generate this in Firebase Console)
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

export interface NotificationPreferences {
  pushEnabled: boolean
  emailEnabled: boolean
  contributionReminders: boolean
  reminderFrequency: "weekly" | "biweekly" | "monthly"
  achievementNotifications: boolean
  projectUpdates: boolean
  communityUpdates: boolean
}

export const defaultNotificationPreferences: NotificationPreferences = {
  pushEnabled: false,
  emailEnabled: true,
  contributionReminders: true,
  reminderFrequency: "monthly",
  achievementNotifications: true,
  projectUpdates: true,
  communityUpdates: false,
}

/**
 * Check if push notifications are supported
 */
export async function isPushSupported(): Promise<boolean> {
  if (typeof window === "undefined") return false
  
  try {
    const supported = await isSupported()
    return supported && "Notification" in window && "serviceWorker" in navigator
  } catch {
    return false
  }
}

/**
 * Request permission and get FCM token
 */
export async function requestNotificationPermission(userId: string): Promise<string | null> {
  if (typeof window === "undefined") return null
  
  try {
    // Check if supported
    const supported = await isPushSupported()
    if (!supported) {
      console.warn("Push notifications not supported")
      return null
    }

    // Request permission
    const permission = await Notification.requestPermission()
    if (permission !== "granted") {
      console.warn("Notification permission denied")
      return null
    }

    // Get messaging instance
    const messaging = getMessaging(app)
    
    // Get FCM token
    const token = await getToken(messaging, { vapidKey: VAPID_KEY })
    
    if (token) {
      // Save token to user's document
      await saveFCMToken(userId, token)
      console.log("FCM Token saved:", token.substring(0, 20) + "...")
      return token
    }
    
    return null
  } catch (error) {
    console.error("Error getting notification permission:", error)
    return null
  }
}

/**
 * Save FCM token to Firestore
 */
async function saveFCMToken(userId: string, token: string): Promise<void> {
  if (!db) return
  
  const userRef = doc(db, "users", userId)
  
  try {
    await updateDoc(userRef, {
      fcmTokens: arrayUnion(token),
      pushNotificationsEnabled: true,
      lastTokenUpdate: new Date(),
    })
  } catch (error) {
    // If document doesn't exist, create it
    console.error("Error saving FCM token:", error)
  }
}

/**
 * Remove FCM token (when user disables notifications)
 */
export async function removeFCMToken(userId: string, token: string): Promise<void> {
  if (!db) return
  
  const userRef = doc(db, "users", userId)
  const userDoc = await getDoc(userRef)
  
  if (userDoc.exists()) {
    const tokens = userDoc.data().fcmTokens || []
    const updatedTokens = tokens.filter((t: string) => t !== token)
    
    await updateDoc(userRef, {
      fcmTokens: updatedTokens,
      pushNotificationsEnabled: updatedTokens.length > 0,
    })
  }
}

/**
 * Listen for foreground messages
 */
export function onForegroundMessage(callback: (payload: unknown) => void): () => void {
  if (typeof window === "undefined") return () => {}
  
  try {
    const messaging = getMessaging(app)
    return onMessage(messaging, (payload) => {
      console.log("Foreground message received:", payload)
      callback(payload)
    })
  } catch (error) {
    console.error("Error setting up foreground message listener:", error)
    return () => {}
  }
}

/**
 * Get user's notification preferences
 */
export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  if (!db) return defaultNotificationPreferences
  
  try {
    const prefsRef = doc(db, "notificationPreferences", userId)
    const prefsDoc = await getDoc(prefsRef)
    
    if (prefsDoc.exists()) {
      return { ...defaultNotificationPreferences, ...prefsDoc.data() } as NotificationPreferences
    }
    
    return defaultNotificationPreferences
  } catch (error) {
    console.error("Error getting notification preferences:", error)
    return defaultNotificationPreferences
  }
}

/**
 * Save user's notification preferences
 */
export async function saveNotificationPreferences(
  userId: string, 
  preferences: Partial<NotificationPreferences>
): Promise<void> {
  if (!db) return
  
  try {
    const prefsRef = doc(db, "notificationPreferences", userId)
    await setDoc(prefsRef, {
      ...preferences,
      updatedAt: new Date(),
    }, { merge: true })
  } catch (error) {
    console.error("Error saving notification preferences:", error)
    throw error
  }
}

/**
 * Subscribe to contribution reminders
 */
export async function subscribeToReminders(
  userId: string, 
  frequency: "weekly" | "biweekly" | "monthly"
): Promise<void> {
  if (!db) return
  
  try {
    const prefsRef = doc(db, "notificationPreferences", userId)
    await setDoc(prefsRef, {
      contributionReminders: true,
      reminderFrequency: frequency,
      updatedAt: new Date(),
    }, { merge: true })
  } catch (error) {
    console.error("Error subscribing to reminders:", error)
    throw error
  }
}

/**
 * Unsubscribe from contribution reminders
 */
export async function unsubscribeFromReminders(userId: string): Promise<void> {
  if (!db) return
  
  try {
    const prefsRef = doc(db, "notificationPreferences", userId)
    await setDoc(prefsRef, {
      contributionReminders: false,
      updatedAt: new Date(),
    }, { merge: true })
  } catch (error) {
    console.error("Error unsubscribing from reminders:", error)
    throw error
  }
}
