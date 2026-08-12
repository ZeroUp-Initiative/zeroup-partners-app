'use client'

import { useState, useEffect } from 'react'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useAuth } from '@/contexts/auth-context'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, Loader2, Copy, Banknote, PartyPopper } from 'lucide-react'
import { uploadImage, validateImageFile } from '@/lib/image-upload'
import { getStoredRef } from '@/lib/referral'
import { PartnerFlierCard } from '@/components/partner-flier-card'
import toast from 'react-hot-toast'

interface ContributeProject {
  id: string
  title: string
}

interface ContributeDialogProps {
  project: ContributeProject | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ContributeDialog({ project, open, onOpenChange, onSuccess }: ContributeDialogProps) {
  const { user } = useAuth()
  const [contributionAmount, setContributionAmount] = useState('')
  const [message, setMessage] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [isContributing, setIsContributing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [paymentSettings, setPaymentSettings] = useState<{ accountNumber: string; bankName: string; accountName: string; bankDetails: string } | null>(null)
  const [justContributed, setJustContributed] = useState<{ amount: number } | null>(null)

  useEffect(() => {
    const loadPaymentSettings = async () => {
      try {
        const res = await fetch('/api/settings/payment')
        if (!res.ok) return
        const data = await res.json()
        if (data?.configured) {
          setPaymentSettings({
            accountNumber: data.accountNumber || '',
            bankName: data.bankName || '',
            accountName: data.accountName || '',
            bankDetails: data.bankDetails || '',
          })
        }
      } catch (err) {
        console.error('Failed to load payment settings:', err)
      }
    }
    loadPaymentSettings()
  }, [])

  useEffect(() => {
    if (open) {
      setError('')
      setContributionAmount('')
      setMessage('')
      setReceiptFile(null)
      setJustContributed(null)
    }
  }, [open])

  const copyAccountNumber = () => {
    const accountNumber = paymentSettings?.accountNumber
    if (!accountNumber) {
      toast.error('Bank account details are not configured yet.')
      return
    }
    navigator.clipboard.writeText(accountNumber)
    toast.success('Account number copied to clipboard!')
  }

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setReceiptFile(file)
  }

  const handleConfirmContribution = async () => {
    if (!project || !contributionAmount || !receiptFile) {
      setError('Please enter an amount and upload a receipt.')
      return
    }
    const amount = parseFloat(contributionAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount.')
      return
    }

    setIsContributing(true)
    setError('')

    try {
      setIsUploading(true)
      const validation = validateImageFile(receiptFile, 10)
      if (!validation.valid) {
        setError(validation.error || 'Invalid receipt file')
        setIsContributing(false)
        setIsUploading(false)
        return
      }
      const receiptUrl = await uploadImage(receiptFile)
      setIsUploading(false)

      await addDoc(collection(db, 'payments'), {
        amount: amount,
        projectId: project.id === 'general' ? 'general' : project.id,
        projectTitle: project.id === 'general' ? 'General Contribution' : project.title,
        userId: user?.uid,
        userFirstName: user?.firstName,
        userLastName: user?.lastName,
        userFullName: `${user?.firstName} ${user?.lastName}`,
        userEmail: user?.email || '',
        status: 'pending',
        proofURL: receiptUrl,
        referrerDreamerId: getStoredRef() || null,
        createdAt: new Date(),
        date: new Date(),
        description: project.id === 'general' ? 'General contribution' : `Contribution to project: ${project.title}`,
        message: message.trim() || null,
      })

      try {
        await fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: user?.email,
            type: 'contribution_submitted',
            data: {
              name: user?.firstName || 'Partner',
              amount: amount.toLocaleString(),
              description: project.id === 'general' ? 'General contribution' : `Contribution to project: ${project.title}`,
              date: new Date().toLocaleDateString(),
            },
          }),
        })
      } catch (err) {
        console.error('Failed to send confirmation email:', err)
      }

      setReceiptFile(null)
      setJustContributed({ amount })
      onSuccess?.()
    } catch (err) {
      console.error('Contribution failed:', err)
      setError('Failed to process contribution. Please try again.')
    } finally {
      setIsContributing(false)
      setIsUploading(false)
    }
  }

  if (justContributed && project) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PartyPopper className="w-5 h-5 text-[#8d44d1]" /> Thank you for partnering!
            </DialogTitle>
            <DialogDescription>
              Your contribution is submitted and pending review. Here's a card to share the moment.
            </DialogDescription>
          </DialogHeader>
          <PartnerFlierCard
            variant="regular"
            name={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Partner'}
            amount={justContributed.amount}
            photoURL={user?.photoURL || undefined}
            month={new Date().toLocaleString('default', { month: 'long' })}
            year={new Date().getFullYear()}
            customMessage={project.id === 'general' ? "I just partnered with ZeroUp!" : `I just partnered with ${project.title}!`}
            showDownload={true}
          />
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {project?.id === 'general' ? 'Make General Contribution' : `Contribute to ${project?.title}`}
          </DialogTitle>
          <DialogDescription>
            {project?.id === 'general'
              ? 'Your contribution will support our overall mission.'
              : 'Your contribution will directly fund this project.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Banknote className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">Bank Transfer Details</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Account Number:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold">
                    {paymentSettings?.accountNumber || 'Not configured yet'}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={copyAccountNumber}
                    className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Bank:</span>
                <span className="font-medium">{paymentSettings?.bankName || 'Not configured yet'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Account Name:</span>
                <span className="font-medium">{paymentSettings?.accountName || 'Not configured yet'}</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {paymentSettings?.bankDetails || 'Please check with the administrator for bank transfer details.'}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₦)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="e.g., 5000"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Leave a public message (optional)</Label>
            <Textarea
              id="message"
              placeholder="e.g., Proud to support this!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">Shown alongside your name on this project's partner wall once approved.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="receipt">Upload Receipt</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors">
              <input
                id="receipt"
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.webp"
                onChange={handleReceiptChange}
                className="hidden"
                disabled={isContributing}
              />
              <label htmlFor="receipt" className="cursor-pointer block">
                {isUploading ? (
                  <Loader2 className="w-6 h-6 text-primary mx-auto mb-2 animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                )}
                <p className="text-sm font-medium truncate">
                  {receiptFile ? receiptFile.name : 'Click to upload receipt'}
                </p>
                <p className="text-xs text-muted-foreground">JPG, PNG, GIF, WebP (max 10MB)</p>
              </label>
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirmContribution} disabled={isContributing}>
            {isContributing ? 'Processing...' : 'Confirm Contribution'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
