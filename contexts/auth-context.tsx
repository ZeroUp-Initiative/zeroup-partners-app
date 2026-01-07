'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';

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
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isLoggedIn: false,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeFirestore = onSnapshot(userDocRef, 
          (doc) => {
            const userProfile = (doc.exists() ? doc.data() : {}) as UserProfile;
            setAuthState({
              user: { ...firebaseUser, ...userProfile },
              isLoading: false,
              isLoggedIn: true,
              error: null,
            });
          },
          (error) => {
            console.error("Error fetching user profile:", error);
            setAuthState(s => ({ ...s, isLoading: false, error: "Failed to load user profile." }));
          }
        );
        return unsubscribeFirestore;
      } else {
        setAuthState({
          user: null,
          isLoading: false,
          isLoggedIn: false,
          error: null,
        });
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
