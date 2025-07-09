import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export interface Menu {
  id: string;
  name: string;
  description: string;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Food {
  id: string;
  menuId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  ingredients: string[];
  allergens: string[];
  isAvailable: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export const menuService = {
  // Get all active menus
  async getActiveMenus(): Promise<Menu[]> {
    try {
      const q = query(
        collection(db, 'menus'),
        where('isActive', '==', true),
        orderBy('name')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Menu[];
    } catch (error) {
      console.error('Error getting active menus:', error);
      throw error;
    }
  },

  // Get all menus (for admin)
  async getAllMenus(): Promise<Menu[]> {
    try {
      const q = query(collection(db, 'menus'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Menu[];
    } catch (error) {
      console.error('Error getting all menus:', error);
      throw error;
    }
  },

  // Get menu by ID
  async getMenuById(menuId: string): Promise<Menu | null> {
    try {
      const docRef = doc(db, 'menus', menuId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate() || new Date(),
          updatedAt: docSnap.data().updatedAt?.toDate()
        } as Menu;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting menu by ID:', error);
      throw error;
    }
  },

  // Get foods by menu ID
  async getFoodsByMenuId(menuId: string): Promise<Food[]> {
    try {
      const q = query(
        collection(db, 'foods'),
        where('menuId', '==', menuId),
        where('isActive', '==', true),
        orderBy('name')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Food[];
    } catch (error) {
      console.error('Error getting foods by menu ID:', error);
      throw error;
    }
  },

  // Get available foods by menu ID
  async getAvailableFoodsByMenuId(menuId: string): Promise<Food[]> {
    try {
      const q = query(
        collection(db, 'foods'),
        where('menuId', '==', menuId),
        where('isActive', '==', true),
        where('isAvailable', '==', true),
        orderBy('name')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Food[];
    } catch (error) {
      console.error('Error getting available foods by menu ID:', error);
      throw error;
    }
  },

  // Get food by ID
  async getFoodById(foodId: string): Promise<Food | null> {
    try {
      const docRef = doc(db, 'foods', foodId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate() || new Date(),
          updatedAt: docSnap.data().updatedAt?.toDate()
        } as Food;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting food by ID:', error);
      throw error;
    }
  },

  // Search foods by name
  async searchFoods(searchTerm: string): Promise<Food[]> {
    try {
      const q = query(
        collection(db, 'foods'),
        where('isActive', '==', true),
        where('isAvailable', '==', true),
        orderBy('name')
      );
      
      const querySnapshot = await getDocs(q);
      const foods = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Food[];
      
      // Filter by search term (client-side filtering since Firestore doesn't support full-text search)
      return foods.filter(food => 
        food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        food.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching foods:', error);
      throw error;
    }
  },

  // Create menu (admin only)
  async createMenu(menuData: Omit<Menu, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'menus'), {
        ...menuData,
        createdAt: Timestamp.now()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating menu:', error);
      throw error;
    }
  },

  // Update menu (admin only)
  async updateMenu(menuId: string, menuData: Partial<Omit<Menu, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const docRef = doc(db, 'menus', menuId);
      await updateDoc(docRef, {
        ...menuData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating menu:', error);
      throw error;
    }
  },

  // Create food (admin only)
  async createFood(foodData: Omit<Food, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'foods'), {
        ...foodData,
        createdAt: Timestamp.now()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating food:', error);
      throw error;
    }
  },

  // Update food (admin only)
  async updateFood(foodId: string, foodData: Partial<Omit<Food, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const docRef = doc(db, 'foods', foodId);
      await updateDoc(docRef, {
        ...foodData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating food:', error);
      throw error;
    }
  }
}; 