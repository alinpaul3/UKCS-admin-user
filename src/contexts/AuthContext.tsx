import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Set up real-time listener for user profile
        unsubscribeDoc = onSnapshot(doc(db, 'users', fbUser.uid), async (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.data() as User;
            let needsUpdate = false;
            const updates: Partial<User> = {};

            // Ensure owner email always has admin role in state
            if (fbUser.email === 'alinaa20@gmail.com' && userData.role !== 'admin') {
              updates.role = 'admin';
              needsUpdate = true;
            }
            
            // If the name is generic "User", try to improve it from email
            const emailPrefix = fbUser.email?.split('@')[0] || 'User';
            const improvedName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
            
            if ((!userData.displayName || userData.displayName === 'User') && fbUser.email) {
              userData.displayName = improvedName;
              updates.displayName = improvedName;
              needsUpdate = true;
            }

            // Ensure username is set
            if (!userData.username && fbUser.email) {
              const defaultUsername = fbUser.email.split('@')[0].toLowerCase();
              userData.username = defaultUsername;
              updates.username = defaultUsername;
              needsUpdate = true;
            }

            if (needsUpdate) {
              await setDoc(doc(db, 'users', fbUser.uid), updates, { merge: true });
            }

            setUser({ ...userData, uid: snapshot.id });
            setLoading(false);
          } else {
            // Auto-link profile for first-time login/student registration
            try {
              let existingEnrollmentId = '';
              let existingDisplayName = '';
              let existingUsername = '';
              let existingRole: 'admin' | 'user' = 'user';
              
              if (fbUser.email) {
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('email', '==', fbUser.email.trim().toLowerCase()));
                const snap = await getDocs(q);
                
                // Find any legacy placeholder user document that matches this email and is NOT this authentictated UID
                const legacyDoc = snap.docs.find(d => d.id !== fbUser.uid);
                if (legacyDoc) {
                  const legacyData = legacyDoc.data();
                  existingEnrollmentId = legacyData.enrollmentId || '';
                  existingDisplayName = legacyData.displayName || '';
                  existingUsername = legacyData.username || '';
                  existingRole = legacyData.role || 'user';
                }
              }
              
              const emailPrefix = fbUser.email?.split('@')[0] || 'User';
              const defaultName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
              const defaultUsername = emailPrefix.toLowerCase();
              
              const newUser: User = {
                uid: fbUser.uid,
                email: fbUser.email || '',
                displayName: existingDisplayName || fbUser.displayName || defaultName,
                username: existingUsername || defaultUsername,
                role: fbUser.email === 'alinaa20@gmail.com' ? 'admin' : existingRole,
                enrollmentId: existingEnrollmentId,
                createdAt: Date.now()
              };
              
              await setDoc(doc(db, 'users', fbUser.uid), newUser);
              
              // Claim any certificates associated with this user's verified email
              if (fbUser.email) {
                const certsRef = collection(db, 'certificates');
                const qCerts = query(certsRef, where('userEmail', '==', fbUser.email.trim().toLowerCase()));
                const snapCerts = await getDocs(qCerts);
                for (const docCert of snapCerts.docs) {
                  const certData = docCert.data();
                  if (certData.userId !== fbUser.uid) {
                    await updateDoc(doc(db, 'certificates', docCert.id), { userId: fbUser.uid });
                  }
                }
              }
            } catch (err) {
              console.error("Failed during profile auto-linking:", err);
              // Fallback block to ensure profile creation doesn't leave user bricked
              const emailPrefix = fbUser.email?.split('@')[0] || 'User';
              const defaultName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
              const defaultUsername = emailPrefix.toLowerCase();
              const newUser: User = {
                uid: fbUser.uid,
                email: fbUser.email || '',
                displayName: fbUser.displayName || defaultName,
                username: defaultUsername,
                role: fbUser.email === 'alinaa20@gmail.com' ? 'admin' : 'user',
                createdAt: Date.now()
              };
              await setDoc(doc(db, 'users', fbUser.uid), newUser);
            }
          }
        }, (error) => {
          console.error("User document subscription error:", error);
          setLoading(false);
        });
      } else {
        if (unsubscribeDoc) unsubscribeDoc();
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const signOut = () => auth.signOut();

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAdmin: user?.role === 'admin',
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
