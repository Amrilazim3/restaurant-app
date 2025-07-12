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
        const profile = await authService.getUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const profile = await authService.login(email, password);
    setUserProfile(profile);
  };

  const register = async (email: string, password: string, displayName?: string, role: 'admin' | 'user' = 'user', adminPasskey?: string) => {
    const profile = await authService.register(email, password, displayName, role, adminPasskey);
    setUserProfile(profile);
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
    
    const profile = await authService.getUserProfile(user.uid);
    setUserProfile(profile);
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