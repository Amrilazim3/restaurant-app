import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Food } from '@/services/menuService';

export interface CartItem {
  id: string;
  food: Food;
  quantity: number;
  specialInstructions?: string;
  addedAt: Date;
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (food: Food, quantity: number, specialInstructions?: string) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartItem: (foodId: string) => CartItem | undefined;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

const CART_STORAGE_KEY = '@cart_items';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load cart from storage on app start
  useEffect(() => {
    loadCartFromStorage();
  }, []);

  // Save cart to storage whenever it changes
  useEffect(() => {
    if (!loading) {
      saveCartToStorage();
    }
  }, [cartItems, loading]);

  const loadCartFromStorage = async () => {
    try {
      const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart);
        // Convert date strings back to Date objects
        const cartWithDates = parsedCart.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt)
        }));
        setCartItems(cartWithDates);
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCartToStorage = async () => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  };

  const addToCart = (food: Food, quantity: number, specialInstructions?: string) => {
    const existingItemIndex = cartItems.findIndex(item => item.food.id === food.id);
    
    if (existingItemIndex !== -1) {
      // Update existing item
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: updatedItems[existingItemIndex].quantity + quantity,
        specialInstructions: specialInstructions || updatedItems[existingItemIndex].specialInstructions
      };
      setCartItems(updatedItems);
    } else {
      // Add new item
      const newItem: CartItem = {
        id: `${food.id}_${Date.now()}`,
        food,
        quantity,
        specialInstructions,
        addedAt: new Date()
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    const updatedItems = cartItems.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    );
    setCartItems(updatedItems);
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartItem = (foodId: string): CartItem | undefined => {
    return cartItems.find(item => item.food.id === foodId);
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + (item.food.price * item.quantity), 0);

  const value = {
    cartItems,
    cartCount,
    cartTotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartItem,
    loading
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}; 