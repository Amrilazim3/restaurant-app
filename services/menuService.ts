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
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const menus = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Menu[];
      
      // Sort by name client-side to avoid composite index requirement
      return menus.sort((a, b) => a.name.localeCompare(b.name));
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
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const foods = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Food[];
      
      // Sort by name client-side to avoid composite index requirement
      return foods.sort((a, b) => a.name.localeCompare(b.name));
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
        where('isAvailable', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const foods = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Food[];
      
      // Sort by name client-side to avoid composite index requirement
      return foods.sort((a, b) => a.name.localeCompare(b.name));
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
        where('isAvailable', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const foods = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Food[];
      
      // Filter by search term and sort (client-side to avoid composite index)
      const filteredFoods = foods.filter(food => 
        food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        food.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return filteredFoods.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error searching foods:', error);
      throw error;
    }
  },

  // Create menu (admin only)
  async createMenu(menuData: Omit<Menu, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Filter out undefined values to avoid Firebase errors
      const cleanedData = Object.fromEntries(
        Object.entries(menuData).filter(([_, value]) => value !== undefined)
      );
      
      const docRef = await addDoc(collection(db, 'menus'), {
        ...cleanedData,
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
      // Filter out undefined values to avoid Firebase errors
      const cleanedData = Object.fromEntries(
        Object.entries(menuData).filter(([_, value]) => value !== undefined)
      );
      
      const docRef = doc(db, 'menus', menuId);
      await updateDoc(docRef, {
        ...cleanedData,
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
      // Filter out undefined values to avoid Firebase errors
      const cleanedData = Object.fromEntries(
        Object.entries(foodData).filter(([_, value]) => value !== undefined)
      );
      
      const docRef = await addDoc(collection(db, 'foods'), {
        ...cleanedData,
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
      // Filter out undefined values to avoid Firebase errors
      const cleanedData = Object.fromEntries(
        Object.entries(foodData).filter(([_, value]) => value !== undefined)
      );
      
      const docRef = doc(db, 'foods', foodId);
      await updateDoc(docRef, {
        ...cleanedData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating food:', error);
      throw error;
    }
  },

  // Soft delete menu (admin only)
  async deleteMenu(menuId: string): Promise<void> {
    try {
      await this.updateMenu(menuId, { isActive: false });
    } catch (error) {
      console.error('Error soft deleting menu:', error);
      throw error;
    }
  },

  // Soft delete food (admin only)
  async deleteFood(foodId: string): Promise<void> {
    try {
      await this.updateFood(foodId, { isActive: false });
    } catch (error) {
      console.error('Error soft deleting food:', error);
      throw error;
    }
  },

  // Bulk update menu status (admin only)
  async bulkUpdateMenuStatus(menuIds: string[], isActive: boolean): Promise<void> {
    try {
      const updatePromises = menuIds.map(id => 
        this.updateMenu(id, { isActive })
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error bulk updating menu status:', error);
      throw error;
    }
  },

  // Bulk update food status (admin only)
  async bulkUpdateFoodStatus(foodIds: string[], isActive: boolean): Promise<void> {
    try {
      const updatePromises = foodIds.map(id => 
        this.updateFood(id, { isActive })
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error bulk updating food status:', error);
      throw error;
    }
  },

  // Bulk update food availability (admin only)
  async bulkUpdateFoodAvailability(foodIds: string[], isAvailable: boolean): Promise<void> {
    try {
      const updatePromises = foodIds.map(id => 
        this.updateFood(id, { isAvailable })
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error bulk updating food availability:', error);
      throw error;
    }
  },

  // Get all foods (admin only)
  async getAllFoods(): Promise<Food[]> {
    try {
      const q = query(collection(db, 'foods'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Food[];
    } catch (error) {
      console.error('Error getting all foods:', error);
      throw error;
    }
  },

  // Get foods by menu ID (admin - includes inactive)
  async getAllFoodsByMenuId(menuId: string): Promise<Food[]> {
    try {
      const q = query(
        collection(db, 'foods'),
        where('menuId', '==', menuId)
      );
      
      const querySnapshot = await getDocs(q);
      const foods = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Food[];
      
      // Sort by name client-side to avoid composite index requirement
      return foods.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error getting all foods by menu ID:', error);
      throw error;
    }
  },

  // Get menu statistics (admin only)
  async getMenuStats(menuId: string): Promise<{
    totalFoods: number;
    activeFoods: number;
    availableFoods: number;
    inactiveFoods: number;
  }> {
    try {
      const foods = await this.getAllFoodsByMenuId(menuId);
      
      return {
        totalFoods: foods.length,
        activeFoods: foods.filter(f => f.isActive).length,
        availableFoods: foods.filter(f => f.isActive && f.isAvailable).length,
        inactiveFoods: foods.filter(f => !f.isActive).length,
      };
    } catch (error) {
      console.error('Error getting menu stats:', error);
      throw error;
    }
  },

  // Validate menu data
  validateMenuData(menuData: Partial<Menu>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!menuData.name?.trim()) {
      errors.push('Menu name is required');
    }
    
    if (!menuData.description?.trim()) {
      errors.push('Menu description is required');
    }
    
    if (menuData.name && menuData.name.length > 50) {
      errors.push('Menu name must be less than 50 characters');
    }
    
    if (menuData.description && menuData.description.length > 200) {
      errors.push('Menu description must be less than 200 characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Validate food data
  validateFoodData(foodData: Partial<Food>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!foodData.name?.trim()) {
      errors.push('Food name is required');
    }
    
    if (!foodData.description?.trim()) {
      errors.push('Food description is required');
    }
    
    if (!foodData.menuId) {
      errors.push('Menu selection is required');
    }
    
    if (foodData.price !== undefined && foodData.price <= 0) {
      errors.push('Price must be greater than 0');
    }
    
    if (foodData.name && foodData.name.length > 100) {
      errors.push('Food name must be less than 100 characters');
    }
    
    if (foodData.description && foodData.description.length > 500) {
      errors.push('Food description must be less than 500 characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}; 