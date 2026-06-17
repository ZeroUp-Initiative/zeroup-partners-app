"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { auth } from "@/lib/firebase/client"
import ProtectedRoute from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, Loader2, Mail, Send } from "lucide-react"
import toast from "react-hot-toast"

interface BankFormState {
  adminNotificationEmail: string
  bankName: string
  accountNumber: string
  accountName: string
  bankDetails: string
}

const DEFAULT_FORM: BankFormState = {
  adminNotificationEmail: "",
  bankName: "",
  accountNumber: "",
  accountName: "",
  bankDetails: "",
}

interface SmtpFormState {
  host: string
  port: string
  user: string
  pass: string
  from: string
  secure: boolean
}

// Gmail-friendly defaults (port 587 uses STARTTLS, so secure = false)
const DEFAULT_SMTP: SmtpFormState = {
  host: "smtp.gmail.com",
  port: "587",
  user: "",
  pass: "",
  from: "",
  secure: false,
}

function AdminSettingsPage() {
  const { user } = useAuth()
  const [form, setForm] = useState<BankFormState>(DEFAULT_FORM)
  const [smtp, setSmtp] = useState<SmtpFormState>(DEFAULT_SMTP)
  const [smtpConfigured, setSmtpConfigured] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingSmtp, setIsSavingSmtp] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testTo, setTestTo] = useState("")

  useEffect(() => {
    if (!user) return
    loadSettings()
  }, [user])

  async function getToken() {
    return auth?.currentUser?.getIdToken() ?? ""
  }

  async function loadSettings() {
    setIsLoading(true)
    try {
      const token = await getToken()
      const res = await fetch("/api/admin/settings/email", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to load")
      const data = await res.json()
      if (data.configured) {
        setForm({
          adminNotificationEmail: data.adminNotificationEmail ?? "",
          bankName: data.bankName ?? "",
          accountNumber: data.accountNumber ?? "",
          accountName: data.accountName ?? "",
          bankDetails: data.bankDetails ?? "",
        })
      }
      // SMTP fields (password is never returned by the API)
      const hasSmtp = Boolean(data.host && data.user)
      setSmtpConfigured(hasSmtp)
      if (hasSmtp) {
        setSmtp({
          host: data.host ?? DEFAULT_SMTP.host,
          port: data.port ? String(data.port) : DEFAULT_SMTP.port,
          user: data.user ?? "",
          pass: "",
          from: data.from ?? "",
          secure: Boolean(data.secure),
        })
      }
    } catch {
      toast.error("Could not load current settings.")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSaveSmtp() {
    if (!smtp.host.trim() || !smtp.user.trim() || !smtp.from.trim()) {
      toast.error("Host, username and From address are required.")
      return
    }
    if (!smtpConfigured && !smtp.pass.trim()) {
      toast.error("Password is required when setting up SMTP for the first time.")
      return
    }
    setIsSavingSmtp(true)
    try {
      const token = await getToken()
      const res = await fetch("/api/admin/settings/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: "save",
          host: smtp.host.trim(),
          port: Number(smtp.port) || 587,
          user: smtp.user.trim(),
          // Leave blank to keep the existing password
          pass: smtp.pass.trim() || undefined,
          from: smtp.from.trim(),
          secure: smtp.secure,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Save failed")
      toast.success("Email settings saved. Sending may take up to 5 minutes to take effect.")
      setSmtpConfigured(true)
      setSmtp(prev => ({ ...prev, pass: "" }))
    } catch (err: any) {
      toast.error(err.message || "Failed to save email settings.")
    } finally {
      setIsSavingSmtp(false)
    }
  }

  async function handleTestSmtp() {
    if (!smtp.host.trim() || !smtp.user.trim() || !smtp.from.trim()) {
      toast.error("Fill in host, username and From address first.")
      return
    }
    if (!smtp.pass.trim()) {
      toast.error("Enter the password to send a test (it isn't stored in the form for security).")
      return
    }
    setIsTesting(true)
    try {
      const token = await getToken()
      const res = await fetch("/api/admin/settings/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: "test",
          host: smtp.host.trim(),
          port: Number(smtp.port) || 587,
          user: smtp.user.trim(),
          pass: smtp.pass.trim(),
          from: smtp.from.trim(),
          secure: smtp.secure,
          testTo: testTo.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Test failed")
      toast.success(data.message || "Test email sent — check the inbox.")
    } catch (err: any) {
      toast.error(err.message || "Test send failed. Double-check the credentials.")
    } finally {
      setIsTesting(false)
    }
  }

  const setSmtpField = (key: keyof SmtpFormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSmtp(prev => ({ ...prev, [key]: e.target.value }))

  async function handleSave() {
    setIsSaving(true)
    try {
      const token = await getToken()
      const res = await fetch("/api/admin/settings/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: "saveBankOnly",
          adminNotificationEmail: form.adminNotificationEmail.trim(),
          bankName: form.bankName.trim(),
          accountNumber: form.accountNumber.trim(),
          accountName: form.accountName.trim(),
          bankDetails: form.bankDetails.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Save failed")
      toast.success("Settings saved successfully.")
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings.")
    } finally {
      setIsSaving(false)
    }
  }

  const set = (key: keyof BankFormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  if (!user || (user as any).role !== "admin") {
    return <p>You do not have permission to view this page.</p>
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Manage payment details and notification settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment & Bank Details</CardTitle>
          <CardDescription>Bank account used to receive contributions from partners.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading settings…
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Admin Notification Email</Label>
                <Input
                  type="email"
                  placeholder="e.g., admin@yourorganization.com"
                  value={form.adminNotificationEmail}
                  onChange={set("adminNotificationEmail")}
                />
                <p className="text-xs text-muted-foreground">
                  New project submissions and contribution notifications will be sent to this email.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Bank Name</Label>
                <Input placeholder="e.g., First Bank of Nigeria" value={form.bankName} onChange={set("bankName")} />
              </div>
              <div className="space-y-1.5">
                <Label>Account Name</Label>
                <Input placeholder="e.g., ZeroUp Initiative" value={form.accountName} onChange={set("accountName")} />
              </div>
              <div className="space-y-1.5">
                <Label>Account Number</Label>
                <Input placeholder="e.g., 0123456789" value={form.accountNumber} onChange={set("accountNumber")} />
              </div>
              <div className="space-y-1.5">
                <Label>Additional Bank Details</Label>
                <Input
                  placeholder="e.g., Zenith Bank — Pan African Centre for Social Development"
                  value={form.bankDetails}
                  onChange={set("bankDetails")}
                />
              </div>
              <div className="pt-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-[#8d44d1] to-[#7030b0] text-white border-0"
                >
                  {isSaving
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
                    : <><Save className="w-4 h-4 mr-2" />Save Settings</>}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email (SMTP) Settings
          </CardTitle>
          <CardDescription>
            Mail server used to send welcome, approval and notification emails. Until this is set up,
            emails are not delivered to anyone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading settings…
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`text-xs rounded-md px-3 py-2 ${smtpConfigured ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                {smtpConfigured
                  ? "SMTP is configured. Emails are being sent through the server below."
                  : "⚠️ SMTP is not configured yet — no emails are currently being delivered."}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>SMTP Host</Label>
                  <Input placeholder="smtp.gmail.com" value={smtp.host} onChange={setSmtpField("host")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Port</Label>
                  <Input placeholder="587" inputMode="numeric" value={smtp.port} onChange={setSmtpField("port")} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Username</Label>
                <Input
                  type="email"
                  placeholder="zeroupacademy@gmail.com"
                  value={smtp.user}
                  onChange={setSmtpField("user")}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Password {smtpConfigured && <span className="text-muted-foreground font-normal">(leave blank to keep current)</span>}</Label>
                <Input
                  type="password"
                  placeholder={smtpConfigured ? "••••••••" : "Google App Password (not your normal password)"}
                  value={smtp.pass}
                  onChange={setSmtpField("pass")}
                  autoComplete="new-password"
                />
                <p className="text-xs text-muted-foreground">
                  For Gmail you must use a 16-character{" "}
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    App Password
                  </a>{" "}
                  (requires 2-Step Verification enabled), not the account password.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>From Address</Label>
                <Input
                  placeholder="ZeroUp Partners <zeroupacademy@gmail.com>"
                  value={smtp.from}
                  onChange={setSmtpField("from")}
                />
                <p className="text-xs text-muted-foreground">
                  Shown as the sender. With Gmail this should use the same address as the username.
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={smtp.secure}
                  onChange={(e) => setSmtp(prev => ({ ...prev, secure: e.target.checked }))}
                  className="h-4 w-4"
                />
                Use SSL (port 465). Leave unchecked for port 587 (Gmail default).
              </label>

              <div className="border-t pt-4 space-y-2">
                <Label>Send a test email to</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="email"
                    placeholder={smtp.user || "you@example.com"}
                    value={testTo}
                    onChange={(e) => setTestTo(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    onClick={handleTestSmtp}
                    disabled={isTesting}
                    className="shrink-0"
                  >
                    {isTesting
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending…</>
                      : <><Send className="w-4 h-4 mr-2" />Send Test</>}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the password above before testing. If the test arrives, real emails will work too.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleSaveSmtp}
                  disabled={isSavingSmtp}
                  className="bg-gradient-to-r from-[#8d44d1] to-[#7030b0] text-white border-0"
                >
                  {isSavingSmtp
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
                    : <><Save className="w-4 h-4 mr-2" />Save Email Settings</>}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ProtectedAdminSettingsPage() {
  return (
    <ProtectedRoute>
      <AdminSettingsPage />
    </ProtectedRoute>
  )
}
