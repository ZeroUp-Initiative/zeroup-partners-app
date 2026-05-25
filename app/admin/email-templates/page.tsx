"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { auth } from "@/lib/firebase/client"
import ProtectedRoute from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Trash2, Save, Eye, CheckCircle2, Mail, Pencil, X } from "lucide-react"
import toast from "react-hot-toast"

interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlContent: string
  type: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f5; }
  .wrapper { padding: 32px 16px; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #8d44d1, #7030b0); color: white; padding: 36px 32px; text-align: center; }
  .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
  .header p { margin: 8px 0 0; opacity: 0.85; font-size: 15px; }
  .body { padding: 32px; }
  .body p { margin: 0 0 16px; color: #444; }
  .highlight { background: #f5ecff; border-left: 4px solid #8d44d1; border-radius: 4px; padding: 16px; margin: 20px 0; }
  .btn { display: inline-block; background: linear-gradient(135deg, #8d44d1, #7030b0); color: #ffffff !important; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin-top: 8px; }
  .footer { text-align: center; padding: 24px 32px; color: #888; font-size: 13px; border-top: 1px solid #f0f0f0; }
</style>
</head>
<body>
<div class="wrapper"><div class="container">
  <div class="header">
    <h1>ZeroUp Partners</h1>
    <p>Email subtitle goes here</p>
  </div>
  <div class="body">
    <p>Hi {{name}},</p>
    <p>Email body content goes here. You can use HTML and CSS to style it however you like.</p>
    <div class="highlight">
      <strong>Highlighted Info</strong>
      Highlighted detail goes here.
    </div>
    <p>Continue your message here...</p>
    <a href="https://zeroup-partners-app.vercel.app/dashboard" class="btn">Button text goes here</a>
  </div>
  <div class="footer"><p>ZeroUp Partners · Building Dreams Together</p></div>
</div></div>
</body>
</html>`

const TEMPLATE_TYPES = [
  { value: "welcome", label: "Welcome Email" },
  { value: "reminder", label: "Project Deadline Reminder" },
  { value: "general", label: "General / Custom" },
  { value: "announcement", label: "Announcement" },
]

function EmailTemplatesPage() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [previewId, setPreviewId] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: "",
    subject: "",
    htmlContent: DEFAULT_HTML,
    type: "general",
  })

  async function getToken() {
    return auth?.currentUser?.getIdToken() ?? ""
  }

  async function loadTemplates() {
    setIsLoading(true)
    try {
      const token = await getToken()
      const res = await fetch("/api/admin/email-templates", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to load")
      const data = await res.json()
      setTemplates(data.templates ?? [])
    } catch {
      toast.error("Could not load email templates.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) loadTemplates()
  }, [user])

  function startCreate() {
    setEditingId(null)
    setForm({ name: "", subject: "", htmlContent: DEFAULT_HTML, type: "general" })
    setIsCreating(true)
    setPreviewId(null)
  }

  function startEdit(t: EmailTemplate) {
    setIsCreating(false)
    setEditingId(t.id)
    setForm({ name: t.name, subject: t.subject, htmlContent: t.htmlContent, type: t.type })
    setPreviewId(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setIsCreating(false)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.subject.trim() || !form.htmlContent.trim()) {
      toast.error("Name, subject and HTML content are required.")
      return
    }
    setIsSaving(true)
    try {
      const token = await getToken()
      if (isCreating) {
        const res = await fetch("/api/admin/email-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Create failed")
        toast.success("Template created.")
      } else if (editingId) {
        const res = await fetch(`/api/admin/email-templates/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Update failed")
        toast.success("Template saved.")
      }
      setIsCreating(false)
      setEditingId(null)
      await loadTemplates()
    } catch (err: any) {
      toast.error(err.message || "Failed to save template.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSetActive(id: string) {
    try {
      const token = await getToken()
      const res = await fetch(`/api/admin/email-templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ setActive: true }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Template set as active.")
      await loadTemplates()
    } catch {
      toast.error("Failed to activate template.")
    }
  }

  async function handleDeactivate(id: string) {
    try {
      const token = await getToken()
      const res = await fetch(`/api/admin/email-templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ setActive: false }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Template deactivated.")
      await loadTemplates()
    } catch {
      toast.error("Failed to deactivate template.")
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this template? This cannot be undone.")) return
    try {
      const token = await getToken()
      const res = await fetch(`/api/admin/email-templates/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Template deleted.")
      if (previewId === id) setPreviewId(null)
      if (editingId === id) setEditingId(null)
      await loadTemplates()
    } catch {
      toast.error("Failed to delete template.")
    }
  }

  const isEditing = isCreating || !!editingId
  const previewTemplate = previewId ? templates.find(t => t.id === previewId) : null
  const editorHtml = isEditing ? form.htmlContent : (previewTemplate?.htmlContent ?? "")
  const showPreview = isEditing || !!previewId

  if (!user || (user as any).role !== "admin") {
    return <p>You do not have permission to view this page.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Email Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage custom HTML email templates. One active template will override the default emails.
          </p>
        </div>
        {!isEditing && templates.length < 4 && (
          <Button
            onClick={startCreate}
            className="bg-gradient-to-r from-[#8d44d1] to-[#7030b0] text-white border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left — template list + editor */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading templates…
            </div>
          ) : (
            <>
              {/* Template cards */}
              {!isEditing && templates.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Mail className="w-10 h-10 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-sm">No templates yet.</p>
                    <p className="text-muted-foreground text-xs mt-1">Click "New Template" to create your first one.</p>
                  </CardContent>
                </Card>
              )}

              {!isEditing && templates.map(t => (
                <Card key={t.id} className={t.isActive ? "border-[#8d44d1] shadow-sm" : ""}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm truncate">{t.name}</span>
                          {t.isActive && (
                            <Badge className="bg-[#8d44d1] text-white text-xs px-2 py-0.5">Active</Badge>
                          )}
                          <Badge variant="outline" className="text-xs capitalize">{t.type}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">Subject: {t.subject}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Preview"
                          onClick={() => setPreviewId(previewId === t.id ? null : t.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Edit"
                          onClick={() => startEdit(t)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {t.isActive ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            title="Deactivate"
                            onClick={() => handleDeactivate(t.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600"
                            title="Set as Active"
                            onClick={() => handleSetActive(t.id)}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Delete"
                          onClick={() => handleDelete(t.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Editor form */}
              {isEditing && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {isCreating ? "New Template" : "Edit Template"}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Use <code className="bg-muted px-1 rounded">{"{{name}}"}</code> as a placeholder for the recipient's name.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Template Name</Label>
                        <Input
                          placeholder="Email template name goes here"
                          value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Type</Label>
                        <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TEMPLATE_TYPES.map(t => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Email Subject</Label>
                      <Input
                        placeholder="Email subject line goes here"
                        value={form.subject}
                        onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">HTML & CSS Content</Label>
                      <textarea
                        className="w-full min-h-[320px] rounded-md border bg-muted/40 px-3 py-2 text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-[#8d44d1]"
                        value={form.htmlContent}
                        onChange={e => setForm(f => ({ ...f, htmlContent: e.target.value }))}
                        spellCheck={false}
                      />
                      <p className="text-xs text-muted-foreground">
                        The preview on the right updates as you type.
                      </p>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-[#8d44d1] to-[#7030b0] text-white border-0"
                      >
                        {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : <><Save className="w-4 h-4 mr-2" />Save Template</>}
                      </Button>
                      <Button variant="outline" onClick={cancelEdit} disabled={isSaving}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Right — live preview */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              {isEditing ? "Live Preview" : previewTemplate ? `Preview: ${previewTemplate.name}` : "Preview"}
            </span>
          </div>
          {showPreview ? (
            <div className="border rounded-xl overflow-hidden bg-[#f4f4f5]" style={{ height: 600 }}>
              <iframe
                srcDoc={editorHtml}
                title="Email Preview"
                className="w-full h-full"
                sandbox="allow-same-origin"
              />
            </div>
          ) : (
            <div className="border rounded-xl flex items-center justify-center bg-muted/30" style={{ height: 600 }}>
              <div className="text-center text-muted-foreground">
                <Eye className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Click the eye icon on a template to preview it,<br />or click "New Template" to start editing.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ProtectedEmailTemplatesPage() {
  return (
    <ProtectedRoute>
      <EmailTemplatesPage />
    </ProtectedRoute>
  )
}
