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