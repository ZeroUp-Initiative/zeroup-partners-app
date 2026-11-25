export const ORG_TYPES = [
  { value: 'ngo', label: 'NGO / Non-profit' },
  { value: 'school', label: 'School' },
  { value: 'company', label: 'Company' },
  { value: 'community', label: 'Community group' },
  { value: 'other', label: 'Other' },
] as const

export type OrgStatus = 'invited' | 'active' | 'suspended' | 'cancelled'

/** organizations/{id}. Written only by the server. */
export interface Organization {
  id: string
  name: string
  type: string
  contactName: string
  email: string
  phone?: string
  registrationNumber?: string
  status: OrgStatus
  uid?: string | null
  inviteExpiresAt?: string | null
  createdAt?: string | null
  activatedAt?: string | null
}

export type ProposalStatus = 'submitted' | 'approved' | 'rejected'

/** orgProposals/{id}. Private until ZeroUp approves it, when a public project is created. */
export interface OrgProposal {
  id: string
  orgId: string
  orgName: string
  uid: string
  title: string
  description: string
  story: string
  fundingGoal: number
  category: string
  location: string
  dueDate: string | null
  imageUrl: string
  status: ProposalStatus
  notes?: string
  projectId?: string | null
  createdAt?: string | null
}

export const PROJECT_CATEGORIES = [
  'Education', 'Healthcare', 'Technology', 'Environment', 'Economic Development',
  'Agriculture', 'Youth & Sports', 'Arts & Culture', 'Other',
]

export const MIN_PASSWORD = 10
