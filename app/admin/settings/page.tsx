"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { auth } from "@/lib/firebase/client"
import ProtectedRoute from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, Loader2 } from "lucide-react"
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

function AdminSettingsPage() {
  const { user } = useAuth()
  const [form, setForm] = useState<BankFormState>(DEFAULT_FORM)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

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
    } catch {
      toast.error("Could not load current settings.")
    } finally {
      setIsLoading(false)
    }
  }

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
