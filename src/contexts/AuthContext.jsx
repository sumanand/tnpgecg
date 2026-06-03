import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.email || (user?.isAnonymous ? 'Anonymous Session' : 'No user'));
      
      if (user) {
        if (user.isAnonymous) {
          // If anonymously authenticated, treat as guest (logged out) in the UI state
          setCurrentUser(null);
          setUserRole(null);
          setUserData(null);
          setAuthError(null);
          setLoading(false);
          return;
        }

        setCurrentUser(user);
        
        try {
          // Fetch user role and data from database
          const userRef = ref(db, `users/${user.uid}`);
          const snapshot = await get(userRef);
          
          console.log('User data from DB:', snapshot.exists() ? snapshot.val() : 'No data');
          
          if (snapshot.exists()) {
            const userInfo = snapshot.val();
            setUserRole(userInfo.role);
            
            // Fetch role-specific data
            const collectionName = userInfo.role === 'company' ? 'companies' : `${userInfo.role}s`;
            const roleRef = ref(db, `${collectionName}/${user.uid}`);
            const roleSnapshot = await get(roleRef);
            if (roleSnapshot.exists()) {
              setUserData(roleSnapshot.val());
              console.log(`${userInfo.role} data loaded:`, roleSnapshot.val());
            } else {
              console.log(`No ${userInfo.role} data found`);
            }
          } else {
            console.log('No user record found in database');
            setAuthError('User record not found. Please contact admin.');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setAuthError(error.message);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setUserData(null);
        setAuthError(null);
        
        // Background sign-in anonymously so guests satisfy strict 'auth != null' database security rules
        try {
          console.log('No active session. Initializing background anonymous auth for database access...');
          await signInAnonymously(auth);
        } catch (error) {
          console.error('Failed to sign in anonymously in the background:', error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    userRole,
    userData,
    loading,
    authError,
    setUserData,
    setUserRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};