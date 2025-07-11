import firestore from '@react-native-firebase/firestore';

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
      const querySnapshot = await firestore()
        .collection('menus')
        .where('isActive', '==', true)
        .get();
      
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
      const querySnapshot = await firestore()
        .collection('menus')
        .orderBy('name')
        .get();
      
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
      const docSnap = await firestore().collection('menus').doc(menuId).get();
      
      if (docSnap.exists) {
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
      const querySnapshot = await firestore()
        .collection('foods')
        .where('menuId', '==', menuId)
        .where('isActive', '==', true)
        .get();
      
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
      const querySnapshot = await firestore()
        .collection('foods')
        .where('menuId', '==', menuId)
        .where('isActive', '==', true)
        .where('isAvailable', '==', true)
        .get();
      
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
      const docSnap = await firestore().collection('foods').doc(foodId).get();
      
      if (docSnap.exists) {
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
      const querySnapshot = await firestore()
        .collection('foods')
        .where('isActive', '==', true)
        .where('isAvailable', '==', true)
        .get();
      
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
      const menuDoc = {
        ...menuData,
        createdAt: firestore.Timestamp.now(),
      };
      
      const docRef = await firestore().collection('menus').add(menuDoc);
      return docRef.id;
    } catch (error) {
      console.error('Error creating menu:', error);
      throw error;
    }
  },

  // Update menu (admin only)
  async updateMenu(menuId: string, menuData: Partial<Omit<Menu, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const updateData = {
        ...menuData,
        updatedAt: firestore.Timestamp.now()
      };
      
      await firestore().collection('menus').doc(menuId).update(updateData);
    } catch (error) {
      console.error('Error updating menu:', error);
      throw error;
    }
  },

  // Create food (admin only)
  async createFood(foodData: Omit<Food, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const foodDoc = {
        ...foodData,
        createdAt: firestore.Timestamp.now(),
      };
      
      const docRef = await firestore().collection('foods').add(foodDoc);
      return docRef.id;
    } catch (error) {
      console.error('Error creating food:', error);
      throw error;
    }
  },

  // Update food (admin only)
  async updateFood(foodId: string, foodData: Partial<Omit<Food, 'id' | 'createdAt'>>): Promise<void> {
    try {
      const updateData = {
        ...foodData,
        updatedAt: firestore.Timestamp.now()
      };
      
      await firestore().collection('foods').doc(foodId).update(updateData);
    } catch (error) {
      console.error('Error updating food:', error);
      throw error;
    }
  },

  // Delete menu (admin only)
  async deleteMenu(menuId: string): Promise<void> {
    try {
      await firestore().collection('menus').doc(menuId).delete();
    } catch (error) {
      console.error('Error deleting menu:', error);
      throw error;
    }
  },

  // Delete food (admin only)
  async deleteFood(foodId: string): Promise<void> {
    try {
      await firestore().collection('foods').doc(foodId).delete();
    } catch (error) {
      console.error('Error deleting food:', error);
      throw error;
    }
  },

  // Bulk update menu status (admin only)
  async bulkUpdateMenuStatus(menuIds: string[], isActive: boolean): Promise<void> {
    try {
      const batch = firestore().batch();
      
      menuIds.forEach(menuId => {
        const menuRef = firestore().collection('menus').doc(menuId);
        batch.update(menuRef, { 
          isActive,
          updatedAt: firestore.Timestamp.now()
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error bulk updating menu status:', error);
      throw error;
    }
  },

  // Bulk update food status (admin only)
  async bulkUpdateFoodStatus(foodIds: string[], isActive: boolean): Promise<void> {
    try {
      const batch = firestore().batch();
      
      foodIds.forEach(foodId => {
        const foodRef = firestore().collection('foods').doc(foodId);
        batch.update(foodRef, { 
          isActive,
          updatedAt: firestore.Timestamp.now()
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error bulk updating food status:', error);
      throw error;
    }
  },

  // Bulk update food availability (admin only)
  async bulkUpdateFoodAvailability(foodIds: string[], isAvailable: boolean): Promise<void> {
    try {
      const batch = firestore().batch();
      
      foodIds.forEach(foodId => {
        const foodRef = firestore().collection('foods').doc(foodId);
        batch.update(foodRef, { 
          isAvailable,
          updatedAt: firestore.Timestamp.now()
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error bulk updating food availability:', error);
      throw error;
    }
  },

  // Get all foods (for admin)
  async getAllFoods(): Promise<Food[]> {
    try {
      const querySnapshot = await firestore()
        .collection('foods')
        .orderBy('name')
        .get();
      
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

  // Get all foods by menu ID (for admin)
  async getAllFoodsByMenuId(menuId: string): Promise<Food[]> {
    try {
      const querySnapshot = await firestore()
        .collection('foods')
        .where('menuId', '==', menuId)
        .orderBy('name')
        .get();
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Food[];
    } catch (error) {
      console.error('Error getting all foods by menu ID:', error);
      throw error;
    }
  },

  // Get menu statistics
  async getMenuStats(menuId: string): Promise<{
    totalFoods: number;
    activeFoods: number;
    availableFoods: number;
    inactiveFoods: number;
  }> {
    try {
      const foods = await this.getAllFoodsByMenuId(menuId);
      
      const totalFoods = foods.length;
      const activeFoods = foods.filter(food => food.isActive).length;
      const availableFoods = foods.filter(food => food.isActive && food.isAvailable).length;
      const inactiveFoods = foods.filter(food => !food.isActive).length;
      
      return {
        totalFoods,
        activeFoods,
        availableFoods,
        inactiveFoods
      };
    } catch (error) {
      console.error('Error getting menu stats:', error);
      throw error;
    }
  },

  // Validate menu data
  validateMenuData(menuData: Partial<Menu>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!menuData.name || menuData.name.trim() === '') {
      errors.push('Menu name is required');
    }
    
    if (!menuData.description || menuData.description.trim() === '') {
      errors.push('Menu description is required');
    }
    
    if (menuData.name && (menuData.name.length < 2 || menuData.name.length > 100)) {
      errors.push('Menu name must be between 2 and 100 characters');
    }
    
    if (menuData.description && (menuData.description.length < 10 || menuData.description.length > 500)) {
      errors.push('Menu description must be between 10 and 500 characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Validate food data
  validateFoodData(foodData: Partial<Food>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!foodData.name || foodData.name.trim() === '') {
      errors.push('Food name is required');
    }
    
    if (!foodData.description || foodData.description.trim() === '') {
      errors.push('Food description is required');
    }
    
    if (!foodData.price || foodData.price <= 0) {
      errors.push('Food price must be greater than 0');
    }
    
    if (!foodData.menuId || foodData.menuId.trim() === '') {
      errors.push('Menu selection is required');
    }
    
    if (foodData.name && (foodData.name.length < 2 || foodData.name.length > 100)) {
      errors.push('Food name must be between 2 and 100 characters');
    }
    
    if (foodData.description && (foodData.description.length < 10 || foodData.description.length > 500)) {
      errors.push('Food description must be between 10 and 500 characters');
    }
    
    if (foodData.price && foodData.price > 999.99) {
      errors.push('Food price cannot exceed $999.99');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}; 