import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  User,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, UserAddress, ProfileUpdateData } from '@/types/auth';

export const authService = {
  // Register a new user
  async register(
    email: string, 
    password: string, 
    displayName?: string, 
    role: 'admin' | 'user' = 'user',
    adminPasskey?: string
  ): Promise<UserProfile> {
    try {
      // Validate admin passkey if trying to register as admin
      if (role === 'admin') {
        if (!adminPasskey || adminPasskey !== 'admin123') {
          throw new Error('Invalid admin passkey');
        }
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        role: role,
        displayName: displayName || '',
        createdAt: new Date()
      };
      
      try {
        await setDoc(doc(db, 'users', user.uid), userProfile);
      } catch (firestoreError: any) {
        // Handle Firestore permission errors specifically
        if (firestoreError?.code === 'permission-denied' || firestoreError?.message?.includes('permission')) {
          throw new Error('Permission denied: Unable to create user profile. Please ensure Firestore security rules allow users to create their own profile.');
        }
        throw firestoreError;
      }
      
      return userProfile;
    } catch (error: any) {
      // Re-throw with better context for authentication errors
      if (error?.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists');
      } else if (error?.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else if (error?.code === 'auth/weak-password') {
        throw new Error('Password is too weak');
      } else if (error?.code === 'auth/operation-not-allowed') {
        throw new Error('Email/password accounts are not enabled');
      }
      throw error;
    }
  },

  // Login user
  async login(email: string, password: string): Promise<UserProfile> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user profile from Firestore
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          return userDoc.data() as UserProfile;
        } else {
          throw new Error('User profile not found. Please contact support.');
        }
      } catch (firestoreError: any) {
        // Handle Firestore permission errors specifically
        if (firestoreError?.code === 'permission-denied' || firestoreError?.message?.includes('permission')) {
          throw new Error('Permission denied: Unable to access user profile. Please ensure Firestore security rules are properly configured.');
        }
        throw firestoreError;
      }
    } catch (error: any) {
      // Re-throw with better context for authentication errors
      if (error?.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else if (error?.code === 'auth/user-disabled') {
        throw new Error('This account has been disabled');
      } else if (error?.code === 'auth/user-not-found') {
        throw new Error('No account found with this email');
      } else if (error?.code === 'auth/wrong-password') {
        throw new Error('Incorrect password');
      } else if (error?.code === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later');
      }
      throw error;
    }
  },

  // Logout user
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  },

  // Get user profile
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error: any) {
      // Log the error for debugging
      console.error('Error getting user profile:', error);
      
      // Throw error with descriptive message for permission issues
      if (error?.code === 'permission-denied' || error?.message?.includes('permission')) {
        throw new Error('Permission denied: Unable to access user profile. Please ensure Firestore security rules allow users to read their own profile.');
      }
      
      // For other errors, throw them so they can be handled upstream
      throw error;
    }
  },

  // Update user profile
  async updateProfile(uid: string, updateData: ProfileUpdateData): Promise<UserProfile> {
    try {
      const updatedData = {
        ...updateData,
        updatedAt: new Date()
      };
      
      try {
        await updateDoc(doc(db, 'users', uid), updatedData);
      } catch (firestoreError: any) {
        // Handle Firestore permission errors specifically
        if (firestoreError?.code === 'permission-denied' || firestoreError?.message?.includes('permission')) {
          throw new Error('Permission denied: Unable to update user profile. Please ensure Firestore security rules allow users to update their own profile.');
        }
        throw firestoreError;
      }
      
      // Get updated profile
      const updatedProfile = await this.getUserProfile(uid);
      if (!updatedProfile) {
        throw new Error('Failed to retrieve updated profile');
      }
      
      return updatedProfile;
    } catch (error) {
      throw error;
    }
  },

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('No authenticated user found');
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);
    } catch (error) {
      throw error;
    }
  }
}; 