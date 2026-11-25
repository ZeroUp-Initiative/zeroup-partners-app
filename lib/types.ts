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
  role?: "user" | "admin" | "school"
  // Partner-school fields (present when role === "school")
  schoolName?: string
  schoolRegistrationNumber?: string
  schoolAddress?: string
  schoolContactName?: string
  schoolContactPhone?: string
  /** The rep's role/title at the school (Principal, Admin, Program Coordinator...) — helps admin judge legitimacy. */
  schoolRepTitle?: string
  /** Approximate student population — gives case scale context. */
  schoolStudentPopulation?: string
  /** Freeform: what prompted this application, in the school's own words. */
  schoolApplicationNote?: string
  schoolDocuments?: string[]
  schoolStatus?: "pending" | "approved" | "rejected"
  schoolAppliedAt?: Timestamp | Date
  /** Admin-only notes left when approving/rejecting a school application. */
  schoolReviewNotes?: string
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
  /** Optional public message the partner leaves, shown on the project's partner wall once approved. */
  message?: string
  createdAt: Timestamp | Date
  date?: Timestamp | Date
  approvedAt?: Timestamp | Date
  approvedBy?: string
  rejectedAt?: Timestamp | Date
  rejectedBy?: string
  rejectionReason?: string
  userDeleted?: boolean
  deletedAt?: Timestamp | Date
  /** Set when this payment was logged via the "sponsor this case fully" flow — see soloSponsoredBy on Project. */
  isSoloSponsor?: boolean
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
  /** Amount admins have allocated toward this specific line item so far (from approved contributions). */
  currentAmount?: number
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
  /** Set when an organization account proposed this project and ZeroUp approved it. */
  ownerOrgId?: string
  ownerOrgName?: string
  ownerOrgUid?: string
  /** Set when this project originated from a verified Education Case — see EducationCase. */
  caseId?: string
  /** Denormalized from the source case's verificationNotes at conversion time, for the public "Verified by ZeroUp" stamp — avoids needing public read access to the (private) cases collection. */
  verificationNote?: string
  /** Denormalized from the source case at conversion time, for public browse filtering. */
  caseType?: CaseType
  /** Denormalized from the source case's school at conversion time, for the public school directory. */
  schoolName?: string
  /** Set once the school's post-funding outcome update has been admin-published — the "what happened" evidence. */
  outcomeNote?: string
  outcomePhotos?: string[]
  outcomeConfirmedAt?: any
  /** Guards the "almost funded" nudge (see NotificationHelpers) from firing more than once per project. */
  almostFundedNotified?: boolean
  /** Set when one partner's contribution fully closed this project in a single go — see the "sponsor this case" flow. */
  soloSponsoredBy?: string
  soloSponsoredByName?: string
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

// ==========================================
// Education Case Types (school-submitted, admin-verified)
// ==========================================

export type CaseStatus = "submitted" | "needs_info" | "verified" | "published" | "outcome_submitted" | "closed" | "rejected"

export type CaseType =
  | "fees"
  | "feeding"
  | "materials"
  | "infrastructure"
  | "special_needs"
  | "teacher_support"
  | "other"

/** A single itemized cost line on a case — maps 1:1 to a ProjectBudgetPhase on conversion. */
export interface CaseBudgetItem {
  id: string
  name: string
  amount: number
  description?: string
}

/**
 * A real, specific education need submitted by a partner school (e.g. one
 * student's fees, a classroom's supplies). Reviewed and verified by admin,
 * then converted into a public Project — see Project.caseId.
 */
export interface EducationCase {
  id: string
  schoolId: string
  schoolName: string
  title: string
  caseType: CaseType
  narrative: string
  /** First name / initials only — never a full identity. See `anonymize` below. */
  beneficiaryDisplayName: string
  /** A band ("Grade 6", "14-16"), not an exact date of birth. */
  beneficiaryAgeGrade?: string
  /** When true, nothing beneficiary-identifying (name or photo) may be shown publicly. */
  anonymize: boolean
  estimatedCost: number
  budgetItems?: CaseBudgetItem[]
  photos?: string[]
  documents?: string[]
  /** The school attests it has guardian consent to share this story publicly. */
  consentConfirmed: boolean
  urgency?: "low" | "medium" | "high"
  status: CaseStatus
  /** Admin-only working notes. */
  adminNotes?: string
  /** What was checked to verify this case — becomes the public "Verified by ZeroUp" note. */
  verificationNotes?: string
  projectId?: string
  /** The school's own account of what happened after funding — awaiting admin publish. */
  outcomeNote?: string
  outcomePhotos?: string[]
  outcomeSubmittedAt?: any
  createdAt: any
  updatedAt?: any
  reviewedAt?: any
  reviewedBy?: string
}

// ==========================================
// Referral Types (lightweight "flag a need" lead for non-school partners)
// ==========================================

export type ReferralStatus = "new" | "contacted" | "converted" | "closed"

export interface Referral {
  id: string
  submittedBy: string
  submittedByName?: string
  /** Who/what is being referred — freeform, e.g. a student's name or a school. */
  subjectName?: string
  contactInfo?: string
  description: string
  status: ReferralStatus
  createdAt: any
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
  | "badge_earned"
  | "system"
  | "school_approved"
  | "school_rejected"
  | "case_needs_info"
  | "case_verified"
  | "case_rejected"
  | "case_published"
  | "case_outcome_published"
  | "almost_funded"

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
// Milestone & Badge Types
// ==========================================

/** What kind of community-wide milestone this is. */
export type MilestoneType = "funding" | "partners"

/**
 * A community-wide milestone that has been reached (e.g. ₦1,000,000 total
 * funding, or the 100th registered partner). One doc per threshold crossed —
 * written once, server-side only, when the threshold is first crossed.
 */
export interface Milestone {
  id: string
  type: MilestoneType
  /** The threshold value reached, e.g. 1000000 (naira) or 100 (partner count). */
  threshold: number
  /** Human label shown in emails/UI, e.g. "₦1,000,000 in Partnership" or "100 Partners". */
  label: string
  /** Number of distinct qualifying partners at the moment this was reached. */
  recipientCount: number
  reachedAt: Timestamp | Date | any
}

export type PartnerBadgeStatus = "pending" | "claimed"

/**
 * One badge awarded to one partner for one milestone. Created (status:
 * "pending") for every qualifying partner when a Milestone is reached.
 * Claiming (via /api/badges/claim) flips status to "claimed" and, if
 * isDreamerEligible, credits drAmount DR to the partner's linked Dreamer Dash wallet.
 */
export interface PartnerBadge {
  id: string
  userId: string
  milestoneId: string
  type: MilestoneType
  threshold: number
  label: string
  status: PartnerBadgeStatus
  isDreamerEligible: boolean
  drAmount: number
  createdAt: Timestamp | Date | any
  claimedAt?: Timestamp | Date | any
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
