export interface UserAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'user';
  displayName?: string;
  phoneNumber?: string;
  address?: UserAddress;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ProfileUpdateData {
  displayName?: string;
  phoneNumber?: string | null;
  address?: UserAddress | null;
} 