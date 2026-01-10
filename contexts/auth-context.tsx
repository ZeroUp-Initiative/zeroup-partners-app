'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

interface UserProfile {
  firstName: string;
  lastName: string;
  organization?: string;
  role?: string;
  totalContributions?: number;
  createdAt?: any;
}

interface AuthState {
  user: (FirebaseUser & Partial<UserProfile>) | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  error: string | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<(FirebaseUser & Partial<UserProfile>) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const logout = async () => {
    if (!isBrowser || !auth) return;
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out');
    }
  };

  const authState: AuthState = {
    user,
    isLoading,
    isLoggedIn: !!user,
    error,
    logout
  };

  useEffect(() => {
    if (!isBrowser || !auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeFirestore = onSnapshot(userDocRef, 
          (doc) => {
            const userProfile = (doc.exists() ? doc.data() : {}) as UserProfile;
            setUser({ ...firebaseUser, ...userProfile });
            setIsLoading(false);
            setError(null);
          },
          (error) => {
            console.error("Error fetching user profile:", error);
            setError("Failed to load user profile.");
            setIsLoading(false);
          }
        );
        return unsubscribeFirestore;
      } else {
        setUser(null);
        setIsLoading(false);
        setError(null);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
