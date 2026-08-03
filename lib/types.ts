import { Timestamp } from "firebase/firestore"

// ==========================================
// User Types
// ==========================================

export interface UserProfile {
  uid: string
  email: string
  firstName: string
  lastName: string
  displayName?: string
  organization?: string
  photoURL?: string
  isAdmin?: boolean
  createdAt: Timestamp | Date
  emailVerified?: boolean
}

export interface AuthUser {
  uid: string
  email: string | null
  emailVerified: boolean
  displayName: string | null
  photoURL: string | null
  firstName?: string
  lastName?: string
  organization?: string
  isAdmin?: boolean
  createdAt?: Timestamp | Date
}

// ==========================================
// Payment/Contribution Types
// ==========================================

export type PaymentStatus = "pending" | "approved" | "rejected" | "declined"

export interface Payment {
  id: string
  userId: string
  userFullName: string
  userEmail: string
  amount: number
  status: PaymentStatus
  projectId?: string
  projectTitle?: string
  receiptUrl?: string
  paymentMethod?: string
  note?: string
  createdAt: Timestamp | Date
  date?: Timestamp | Date
  approvedAt?: Timestamp | Date
  approvedBy?: string
  rejectedAt?: Timestamp | Date
  rejectedBy?: string
  rejectionReason?: string
  userDeleted?: boolean
  deletedAt?: Timestamp | Date
}

export interface PaymentFormData {
  amount: number
  projectId?: string
  paymentMethod?: string
  note?: string
  receiptUrl?: string
}

// ==========================================
// Project Types
// ==========================================

export type ProjectStatus = "pending" | "open" | "fully-funded" | "closed" | "rejected"

/** A single milestone on a project's public timeline. */
export interface ProjectTimelineItem {
  id: string
  title: string
  /** Free text, not a strict date — some milestones are "TBD". */
  date?: string
  description?: string
  status: "completed" | "in-progress" | "upcoming"
}

/** A single line item in a project's public, structured budget-per-phase breakdown. */
export interface ProjectBudgetPhase {
  id: string
  name: string
  amount: number
  description?: string
}

export interface Project {
  id: string
  title: string
  /** Short public summary shown on cards/lists. */
  description: string
  fundingGoal: number
  currentFunding: number
  status: ProjectStatus
  imageUrl?: string
  category?: string
  location?: string
  /** Current lifecycle stage (idea/planning/pilot/active) — distinct from budgetPhases below. */
  phase?: string
  dueDate?: any
  // Private fields (submission/review only)
  background?: string
  fundingBreakdown?: string
  expectedBeneficiaries?: string
  expectedOutcomes?: string
  previousFunding?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  organizationName?: string
  submittedBy?: string
  submittedByName?: string
  submittedByEmail?: string
  adminNotes?: string
  ownedByZeroUp?: boolean
  // Rich content (public, added post-approval)
  story?: string
  videoUrl?: string
  gallery?: string[]
  timeline?: ProjectTimelineItem[]
  /** Structured, public spend-by-milestone breakdown — distinct from the private freeform fundingBreakdown. */
  budgetPhases?: ProjectBudgetPhase[]
  createdAt?: any
  updatedAt?: any
}

export interface ProjectFormData {
  title: string
  description: string
  fundingGoal: number
  category?: string
  imageUrl?: string
}

// ==========================================
// Notification Types
// ==========================================

export type NotificationType = 
  | "contribution_approved"
  | "contribution_rejected"
  | "achievement_unlocked"
  | "level_up"
  | "new_project"
  | "general"

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: Timestamp | Date
  link?: string
}

// ==========================================
// Analytics Types
// ==========================================

export interface MonthlyData {
  month: string
  amount: number
}

export interface CategoryData {
  name: string
  value: number
}

export interface UserStats {
  totalContributions: number
  projectsSupported: number
  monthsActive: number
  impactScore: number
  badgesEarned: number
}

// ==========================================
// Leaderboard Types
// ==========================================

export interface LeaderboardEntry {
  id: string
  name: string
  amount: number
  rank?: number
  photoURL?: string
}

// ==========================================
// API Response Types
// ==========================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ==========================================
// Form Types
// ==========================================

export interface LoginFormData {
  email: string
  password: string
}

export interface SignupFormData {
  email: string
  password: string
  firstName: string
  lastName: string
  organization?: string
}

export interface ProfileFormData {
  firstName: string
  lastName: string
  organization?: string
  photoURL?: string
}

// ==========================================
// Utility Types
// ==========================================

export type FirebaseTimestamp = Timestamp | Date

export function isTimestamp(value: unknown): value is Timestamp {
  return value !== null && 
         typeof value === 'object' && 
         'toDate' in value && 
         typeof (value as Timestamp).toDate === 'function'
}

export function toDate(value: FirebaseTimestamp | null | undefined): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (isTimestamp(value)) return value.toDate()
  return null
}

export function formatTimestamp(
  value: FirebaseTimestamp | null | undefined,
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }
): string {
  const date = toDate(value)
  if (!date) return 'N/A'
  return date.toLocaleDateString('en-US', options)
}
