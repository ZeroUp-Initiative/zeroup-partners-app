"use client"

import ProtectedRoute from "@/components/auth/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, LogOut, CheckCircle, AlertCircle, Info, Trophy, Mail, Smartphone, Settings, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { auth } from "@/lib/firebase/client"

function NotificationsContent() {
  const { user } = useAuth()
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [achievementNotifications, setAchievementNotifications] = useState(true)
  const [contributionReminders, setContributionReminders] = useState(true)

  const logout = async () => {
    await auth.signOut()
  }

  // Mock notifications data
  const notifications = [
    {
      id: "1",
      type: "achievement",
      title: "New Badge Earned!",
      message:
        "Congratulations! You've earned the 'Consistent Contributor' badge for 6 months of regular contributions.",
      time: "2 hours ago",
      read: false,
      icon: Trophy,
      color: "text-secondary",
    },
    {
      id: "2",
      type: "contribution",
      title: "Contribution Verified",
      message: "Your March contribution of $500 has been verified and added to your impact score.",
      time: "1 day ago",
      read: false,
      icon: CheckCircle,
      color: "text-primary",
    },
    {
      id: "3",
      type: "reminder",
      title: "Monthly Contribution Reminder",
      message: "Don't forget to log your April contribution. You're currently at 85% of your monthly goal.",
      time: "3 days ago",
      read: true,
      icon: AlertCircle,
      color: "text-accent",
    },
    {
      id: "4",
      type: "update",
      title: "New Impact Report Available",
      message:
        "The Q1 2024 Impact Report is now available in the Resource Center. See how your contributions made a difference.",
      time: "1 week ago",
      read: true,
      icon: Info,
      color: "text-muted-foreground",
    },
    {
      id: "5",
      type: "community",
      title: "You're in the Top 10!",
      message: "Great news! You've moved up to #4 in the community leaderboard this month.",
      time: "1 week ago",
      read: true,
      icon: Trophy,
      color: "text-secondary",
    },
  ]

  const unreadCount = notifications.filter((n) => !n.read).length

  const getTypeColor = (type: string) => {
    switch (type) {
      case "achievement":
        return "bg-secondary/10 border-secondary/20"
      case "contribution":
        return "bg-primary/10 border-primary/20"
      case "reminder":
        return "bg-accent/10 border-accent/20"
      case "community":
        return "bg-destructive/10 border-destructive/20"
      default:
        return "bg-muted/50 border-border"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                  <span className="text-primary-foreground font-bold text-lg">Z</span>
                </div>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </h1>
                <p className="text-sm text-muted-foreground">Stay updated on your impact and achievements</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-4">
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
                <Link href="/contributions" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contributions
                </Link>
                <Link href="/analytics" className="text-muted-foreground hover:text-foreground transition-colors">
                  Analytics
                </Link>
                <Link href="/community" className="text-muted-foreground hover:text-foreground transition-colors">
                  Community
                </Link>
              </nav>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.firstName?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">{`${user?.firstName} ${user?.lastName}`}</p>
                  <p className="text-xs text-muted-foreground">{user?.organization || "Individual Partner"}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-balance">Your Notifications</h2>
            <p className="text-muted-foreground">
              Stay informed about your contributions, achievements, and community updates.
            </p>
          </div>

          {/* Notification Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unread</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{unreadCount}</div>
                <p className="text-xs text-muted-foreground">New notifications</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Achievements</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Updates</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">Recent updates</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reminders</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">Pending actions</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="all" className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="all">All Notifications</TabsTrigger>
                <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <Button variant="outline" size="sm">
                Mark All as Read
              </Button>
            </div>

            <TabsContent value="all" className="space-y-4">
              {notifications.map((notification) => {
                const IconComponent = notification.icon
                return (
                  <Card
                    key={notification.id}
                    className={`${getTypeColor(notification.type)} ${!notification.read ? "border-l-4 border-l-primary" : ""}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(notification.type)}`}
                        >
                          <IconComponent className={`w-5 h-5 ${notification.color}`} />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{notification.title}</h3>
                            <div className="flex items-center gap-2">
                              {!notification.read && (
                                <Badge variant="secondary" className="text-xs">
                                  New
                                </Badge>
                              )}
                              <span className="text-sm text-muted-foreground">{notification.time}</span>
                            </div>
                          </div>
                          <p className="text-muted-foreground">{notification.message}</p>
                          <div className="flex gap-2">
                            {!notification.read && (
                              <Button size="sm" variant="outline">
                                Mark as Read
                              </Button>
                            )}
                            <Button size="sm" variant="ghost">
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </TabsContent>

            <TabsContent value="unread" className="space-y-4">
              {notifications
                .filter((n) => !n.read)
                .map((notification) => {
                  const IconComponent = notification.icon
                  return (
                    <Card
                      key={notification.id}
                      className={`${getTypeColor(notification.type)} border-l-4 border-l-primary`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(notification.type)}`}
                          >
                            <IconComponent className={`w-5 h-5 ${notification.color}`} />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold">{notification.title}</h3>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  New
                                </Badge>
                                <span className="text-sm text-muted-foreground">{notification.time}</span>
                              </div>
                            </div>
                            <p className="text-muted-foreground">{notification.message}</p>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                Mark as Read
                              </Button>
                              <Button size="sm" variant="ghost">
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>Customize how and when you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Email Notifications */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Notifications
                    </h4>
                    <div className="space-y-3 ml-6">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email-all">All email notifications</Label>
                        <Switch id="email-all" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="achievement-emails">Achievement notifications</Label>
                        <Switch
                          id="achievement-emails"
                          checked={achievementNotifications}
                          onCheckedChange={setAchievementNotifications}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="contribution-reminders">Contribution reminders</Label>
                        <Switch
                          id="contribution-reminders"
                          checked={contributionReminders}
                          onCheckedChange={setContributionReminders}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Push Notifications */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      Push Notifications
                    </h4>
                    <div className="space-y-3 ml-6">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="push-all">All push notifications</Label>
                        <Switch id="push-all" checked={pushNotifications} onCheckedChange={setPushNotifications} />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button>Save Preferences</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsContent />
    </ProtectedRoute>
  )
}
