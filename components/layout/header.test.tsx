import { render, screen } from '@testing-library/react'
import Header from './header'
import { useAuth } from '@/contexts/auth-context'

// Mock the useAuth hook
jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: {
      firstName: 'John',
      lastName: 'Doe',
      organization: 'Test Corp',
    },
  }),
}))

describe('Header', () => {
  it('renders the title and subtitle', () => {
    render(<Header title="Test Title" subtitle="Test Subtitle" />)

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument()
  })

  it("renders the user's name and organization", () => {
    render(<Header title="Test Title" subtitle="Test Subtitle" />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Individual Partner')).toBeInTheDocument()
  })

  it('renders the logout button', () => {
    render(<Header title="Test Title" subtitle="Test Subtitle" />)

    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
  })
})
