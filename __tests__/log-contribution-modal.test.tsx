import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LogContributionModal } from '@/components/contributions/log-contribution-modal'

// Mock Firebase
jest.mock('@/lib/firebase/client', () => ({
  db: {},
  auth: {},
  default: null,
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren<unknown>) => <>{children}</>,
}))

// Mock useAuth
jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: {
      uid: 'test-user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    },
  }),
}))

// Mock Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  addDoc: jest.fn(() => Promise.resolve({ id: 'new-doc-id' })),
}))

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock image-upload
jest.mock('@/lib/image-upload', () => ({
  uploadImage: jest.fn(),
  validateImageFile: jest.fn(() => ({ valid: true })),
}))

describe('LogContributionModal', () => {
  const mockOnSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders with a trigger button', () => {
    render(
      <LogContributionModal onSuccess={mockOnSuccess}>
        <button>Open Modal</button>
      </LogContributionModal>
    )
    
    expect(screen.getByText('Open Modal')).toBeInTheDocument()
  })

  it('opens modal when trigger is clicked', async () => {
    render(
      <LogContributionModal onSuccess={mockOnSuccess}>
        <button>Open Modal</button>
      </LogContributionModal>
    )
    
    fireEvent.click(screen.getByText('Open Modal'))
    
    await waitFor(() => {
      expect(screen.getByText(/Log Your Contribution/i)).toBeInTheDocument()
    })
  })

  it('displays bank account information when opened', async () => {
    render(
      <LogContributionModal onSuccess={mockOnSuccess}>
        <button>Open Modal</button>
      </LogContributionModal>
    )
    
    fireEvent.click(screen.getByText('Open Modal'))
    
    await waitFor(() => {
      expect(screen.getByText(/0219230107/)).toBeInTheDocument()
      expect(screen.getByText(/DAVID OLAYEMI ADEBAYO/i)).toBeInTheDocument()
    })
  })

  it('shows amount input field when opened', async () => {
    render(
      <LogContributionModal onSuccess={mockOnSuccess}>
        <button>Open Modal</button>
      </LogContributionModal>
    )
    
    fireEvent.click(screen.getByText('Open Modal'))
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument()
    })
  })
})
