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

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'user';
  displayName?: string;
  phoneNumber?: string;
  address?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ProfileUpdateData {
  displayName?: string;
  phoneNumber?: string;
  address?: string;
}

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
      
      await setDoc(doc(db, 'users', user.uid), userProfile);
      
      return userProfile;
    } catch (error) {
      throw error;
    }
  },

  // Login user
  async login(email: string, password: string): Promise<UserProfile> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      } else {
        throw new Error('User profile not found');
      }
    } catch (error) {
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
      return userDoc.exists() ? (userDoc.data() as UserProfile) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  },

  // Update user profile
  async updateProfile(uid: string, updateData: ProfileUpdateData): Promise<UserProfile> {
    try {
      const updatedData = {
        ...updateData,
        updatedAt: new Date()
      };
      
      await updateDoc(doc(db, 'users', uid), updatedData);
      
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