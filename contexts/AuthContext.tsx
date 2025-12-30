import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { authService } from '../services/authService';
import { UserProfile, ProfileUpdateData } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string, role?: 'admin' | 'user', adminPasskey?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updateData: ProfileUpdateData) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Get user profile from Firestore
        try {
          const profile = await authService.getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error: any) {
          // Handle permission errors gracefully
          console.error('Error fetching user profile:', error);
          
          // If it's a permission error, log it but don't block the user
          // The profile will be null, but the user is still authenticated
          // This allows the app to continue functioning while highlighting the issue
          if (error?.message?.includes('Permission denied') || error?.code === 'permission-denied') {
            console.error('Firestore permission error: Please ensure security rules are properly configured.');
            setUserProfile(null);
          } else {
            // For other errors, still set profile to null but log the error
            setUserProfile(null);
          }
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const profile = await authService.login(email, password);
      setUserProfile(profile);
    } catch (error: any) {
      // Re-throw the error so the calling component can handle it
      // The error message from authService is already user-friendly
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName?: string, role: 'admin' | 'user' = 'user', adminPasskey?: string) => {
    try {
      const profile = await authService.register(email, password, displayName, role, adminPasskey);
      setUserProfile(profile);
    } catch (error: any) {
      // Re-throw the error so the calling component can handle it
      // The error message from authService is already user-friendly
      throw error;
    }
  };

  const logout = async () => {
    await authService.logout();
    setUserProfile(null);
  };

  const updateProfile = async (updateData: ProfileUpdateData) => {
    if (!user) {
      throw new Error('No authenticated user');
    }
    
    const updatedProfile = await authService.updateProfile(user.uid, updateData);
    setUserProfile(updatedProfile);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await authService.changePassword(currentPassword, newPassword);
  };

  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const profile = await authService.getUserProfile(user.uid);
      setUserProfile(profile);
    } catch (error: any) {
      // Log the error but don't throw - allow the app to continue
      // The profile will remain as it was before
      console.error('Error refreshing user profile:', error);
      
      // If it's a permission error, log it specifically
      if (error?.message?.includes('Permission denied') || error?.code === 'permission-denied') {
        console.error('Firestore permission error: Please ensure security rules are properly configured.');
      }
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 