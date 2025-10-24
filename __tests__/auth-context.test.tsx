import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { ReactNode } from 'react'
import { auth } from '@/lib/firebase/client'
import { User } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'

// Mock Firebase services
jest.mock('@/lib/firebase/client', () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
  },
  db: {},
}))

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  onSnapshot: jest.fn(),
}))

describe('useAuth', () => {
  let authCallback: (user: User | null) => void
  let firestoreCallback: (snapshot: { exists: () => boolean; data: () => any }) => void
  let mockAuthUnsubscribe: jest.Mock
  let mockFirestoreUnsubscribe: jest.Mock

  beforeEach(() => {
    mockAuthUnsubscribe = jest.fn();
    mockFirestoreUnsubscribe = jest.fn();
    (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) => {
      authCallback = callback
      return mockAuthUnsubscribe
    });

    (onSnapshot as jest.Mock).mockImplementation((_, callback) => {
      firestoreCallback = callback
      return mockFirestoreUnsubscribe
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('throws an error when used outside of an AuthProvider', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider',
    )
    consoleErrorSpy.mockRestore();
  })

  it('provides the authentication context, initially loading', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.user).toBeNull()
  })

  it('updates the authentication state when a user signs in', async () => {
    const mockUser = { uid: '123', email: 'test@example.com' } as User
    const mockUserData = { firstName: 'John', lastName: 'Doe', role: 'admin' }

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )
    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => {
      authCallback(mockUser)
    })

    act(() => {
      firestoreCallback({ exists: () => true, data: () => mockUserData })
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isLoggedIn).toBe(true)
    expect(result.current.user).toEqual({ ...mockUser, ...mockUserData })
  })

  it('updates the authentication state when a user signs out', async () => {
    const mockUser = { uid: '123', email: 'test@example.com' } as User
    const mockUserData = { firstName: 'John', lastName: 'Doe' };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )
    const { result } = renderHook(() => useAuth(), { wrapper })

    // Sign in
    act(() => {
      authCallback(mockUser)
    })
    act(() => {
      firestoreCallback({ exists: () => true, data: () => mockUserData });
    });

    // Wait for the user to be logged in
    await waitFor(() => {
      expect(result.current.isLoggedIn).toBe(true);
    });

    // Sign out
    act(() => {
      authCallback(null)
    })

    await waitFor(() => {
      expect(result.current.isLoggedIn).toBe(false);
    });

    expect(result.current.isLoggedIn).toBe(false)
    expect(result.current.user).toBeNull()
  })
})
