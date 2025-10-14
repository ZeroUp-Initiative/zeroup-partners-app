'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';

// Enhanced UserProfile to include real-time data like totalContributions
interface UserProfile {
  firstName: string;
  lastName: string;
  organization?: string;
  totalContributions?: number; // This will be updated in real-time
}

interface AuthContextType {
  user: (FirebaseUser & Partial<UserProfile>) | null;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<(FirebaseUser & Partial<UserProfile>) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeFromFirestore: (() => void) | null = null;

    const unsubscribeFromAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // First, immediately update the auth state.
      // This is crucial to prevent the loading deadlock.
      if (firebaseUser) {
        // Set user with Firebase data first, and stop loading.
        setUser(firebaseUser);
        setIsLoading(false);

        // Now, listen for profile data from Firestore.
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeFromFirestore = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const userProfile = doc.data() as UserProfile;
            // Merge profile data into the existing user state.
            setUser(prevUser => ({ ...prevUser!, ...userProfile }));
          } else {
            // User is authenticated, but no profile document exists.
            // This is a valid state; they may need to create a profile.
            console.warn(`User profile for ${firebaseUser.uid} not found in Firestore.`);
          }
        }, (error) => {
          // This error is for the Firestore listener, not authentication itself.
          console.error("Error listening to user profile:", error);
          setError("Could not load user profile. Please try refreshing.");
        });

      } else {
        // User is signed out.
        setUser(null);
        setIsLoading(false);
        if (unsubscribeFromFirestore) {
          unsubscribeFromFirestore();
        }
      }
    });

    // Cleanup function to unsubscribe from auth and firestore listeners on component unmount.
    return () => {
      unsubscribeFromAuth();
      if (unsubscribeFromFirestore) {
        unsubscribeFromFirestore();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, error }}>
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
