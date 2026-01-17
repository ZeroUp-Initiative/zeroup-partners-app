"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { 
  getNotificationPreferences, 
  saveNotificationPreferences,
  requestNotificationPermission,
  isPushSupported,
  type NotificationPreferences 
} from "@/lib/push-notifications"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, Mail, Smartphone, Calendar, Trophy, Megaphone, Users, Loader2 } from "lucide-react"
import toast from "react-hot-toast"

export function NotificationPreferencesCard() {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pushSupported, setPushSupported] = useState(false)
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default")

  useEffect(() => {
    async function loadPreferences() {
      if (!user) return
      
      try {
        const prefs = await getNotificationPreferences(user.uid)
        setPreferences(prefs)
        
        // Check push support
        const supported = await isPushSupported()
        setPushSupported(supported)
        
        if (supported && typeof window !== "undefined" && "Notification" in window) {
          setPushPermission(Notification.permission)
        }
      } catch (error) {
        console.error("Error loading preferences:", error)
        toast.error("Failed to load notification preferences")
      } finally {
        setLoading(false)
      }
    }
    
    loadPreferences()
  }, [user])

  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: boolean | string) => {
    if (!user || !preferences) return
    
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)
    
    setSaving(true)
    try {
      await saveNotificationPreferences(user.uid, { [key]: value })
      toast.success("Preferences updated")
    } catch (error) {
      console.error("Error saving preferences:", error)
      toast.error("Failed to save preferences")
      // Revert on error
      setPreferences(preferences)
    } finally {
      setSaving(false)
    }
  }

  const handleEnablePush = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      const token = await requestNotificationPermission(user.uid)
      
      if (token) {
        setPreferences(prev => prev ? { ...prev, pushEnabled: true } : prev)
        setPushPermission("granted")
        toast.success("Push notifications enabled!")
      } else {
        toast.error("Could not enable push notifications. Please check your browser settings.")
      }
    } catch (error) {
      console.error("Error enabling push:", error)
      toast.error("Failed to enable push notifications")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (!preferences) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose how you want to receive updates and reminders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification Channels */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Notification Channels
          </h4>
          
          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <Label htmlFor="email-notifications" className="font-medium">
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates via email
                </p>
              </div>
            </div>
            <Switch
              id="email-notifications"
              checked={preferences.emailEnabled}
              onCheckedChange={(checked) => handlePreferenceChange("emailEnabled", checked)}
              disabled={saving}
            />
          </div>
          
          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Smartphone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <Label htmlFor="push-notifications" className="font-medium">
                  Push Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  {pushSupported 
                    ? "Receive instant notifications on your device"
                    : "Not supported in this browser"}
                </p>
              </div>
            </div>
            {pushSupported ? (
              pushPermission === "granted" && preferences.pushEnabled ? (
                <Switch
                  id="push-notifications"
                  checked={preferences.pushEnabled}
                  onCheckedChange={(checked) => handlePreferenceChange("pushEnabled", checked)}
                  disabled={saving}
                />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnablePush}
                  disabled={saving || pushPermission === "denied"}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enable"}
                </Button>
              )
            ) : (
              <span className="text-sm text-muted-foreground">Unavailable</span>
            )}
          </div>
        </div>

        {/* Contribution Reminders */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Contribution Reminders
          </h4>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                <Calendar className="h-4 w-4 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <Label htmlFor="contribution-reminders" className="font-medium">
                  Contribution Reminders
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get reminded to make contributions
                </p>
              </div>
            </div>
            <Switch
              id="contribution-reminders"
              checked={preferences.contributionReminders}
              onCheckedChange={(checked) => handlePreferenceChange("contributionReminders", checked)}
              disabled={saving}
            />
          </div>
          
          {preferences.contributionReminders && (
            <div className="ml-11 pl-3 border-l-2 border-muted">
              <Label htmlFor="reminder-frequency" className="text-sm text-muted-foreground">
                Reminder Frequency
              </Label>
              <Select
                value={preferences.reminderFrequency}
                onValueChange={(value: string) => handlePreferenceChange("reminderFrequency", value)}
                disabled={saving}
              >
                <SelectTrigger id="reminder-frequency" className="w-40 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Notification Types */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Notification Types
          </h4>
          
          {/* Achievement Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <Label htmlFor="achievement-notifications" className="font-medium">
                  Achievements
                </Label>
                <p className="text-sm text-muted-foreground">
                  When you unlock new achievements
                </p>
              </div>
            </div>
            <Switch
              id="achievement-notifications"
              checked={preferences.achievementNotifications}
              onCheckedChange={(checked) => handlePreferenceChange("achievementNotifications", checked)}
              disabled={saving}
            />
          </div>
          
          {/* Project Updates */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Megaphone className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <Label htmlFor="project-updates" className="font-medium">
                  Project Updates
                </Label>
                <p className="text-sm text-muted-foreground">
                  News about projects you support
                </p>
              </div>
            </div>
            <Switch
              id="project-updates"
              checked={preferences.projectUpdates}
              onCheckedChange={(checked) => handlePreferenceChange("projectUpdates", checked)}
              disabled={saving}
            />
          </div>
          
          {/* Community Updates */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <Label htmlFor="community-updates" className="font-medium">
                  Community Updates
                </Label>
                <p className="text-sm text-muted-foreground">
                  Leaderboard changes and community news
                </p>
              </div>
            </div>
            <Switch
              id="community-updates"
              checked={preferences.communityUpdates}
              onCheckedChange={(checked) => handlePreferenceChange("communityUpdates", checked)}
              disabled={saving}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
