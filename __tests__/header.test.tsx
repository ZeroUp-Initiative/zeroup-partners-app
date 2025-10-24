import { render, waitFor } from '@testing-library/react'
import Header from '@/components/layout/header'
import { AuthProvider } from '@/contexts/auth-context'

describe('Header', () => {
  it('renders the header with the correct title and subtitle', async () => {
    const { getByText } = render(
      <AuthProvider>
        <Header title="Test Title" subtitle="Test Subtitle" />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(getByText('Test Title')).toBeInTheDocument()
      expect(getByText('Test Subtitle')).toBeInTheDocument()
    })
  })
})
