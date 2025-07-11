export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export type PaymentMethod = 'qr_code' | 'cash_on_delivery';

export interface OrderItem {
  foodId: string;
  foodName: string;
  quantity: number;
  price: number;
  specialInstructions?: string | null;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  specialInstructions?: string;
}

export interface GuestUserInfo {
  fullName: string;
  email: string;
  phoneNumber: string;
}

export interface Order {
  id?: string;
  userId?: string; // undefined for guest orders
  guestInfo?: GuestUserInfo | null; // required for guest orders
  items: OrderItem[];
  totalAmount: number;
  deliveryFee: number;
  tax: number;
  grandTotal: number;
  deliveryAddress: DeliveryAddress;
  contactNumber: string;
  paymentMethod: PaymentMethod;
  orderStatus: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  estimatedDeliveryTime?: Date;
  paymentConfirmed?: boolean;
  notes?: string;
}

export interface CreateOrderRequest {
  items: OrderItem[];
  deliveryAddress: DeliveryAddress;
  contactNumber: string;
  paymentMethod: PaymentMethod;
  guestInfo?: GuestUserInfo | null;
  notes?: string;
}

export interface OrderSummary {
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
} 