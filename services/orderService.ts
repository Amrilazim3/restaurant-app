import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Order, 
  CreateOrderRequest, 
  OrderStatus, 
  OrderSummary,
  OrderItem 
} from '@/types/order';
import { CartItem } from '@/contexts/CartContext';

const ORDERS_COLLECTION = 'orders';

// Constants for calculations
const DELIVERY_FEE = 2.99;
const TAX_RATE = 0.08; // 8% tax

class OrderService {
  /**
   * Calculate order summary with taxes and fees
   */
  calculateOrderSummary(items: OrderItem[]): OrderSummary {
    const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const deliveryFee = DELIVERY_FEE;
    const tax = subtotal * TAX_RATE;
    const total = subtotal + deliveryFee + tax;

    return {
      subtotal,
      deliveryFee,
      tax,
      total
    };
  }

  /**
   * Convert cart items to order items
   */
  convertCartItemsToOrderItems(cartItems: CartItem[]): OrderItem[] {
    return cartItems.map(item => ({
      foodId: item.food.id,
      foodName: item.food.name,
      quantity: item.quantity,
      price: item.food.price,
      specialInstructions: item.specialInstructions || null
    }));
  }

  /**
   * Create a new order
   */
  async createOrder(orderRequest: CreateOrderRequest, userId?: string): Promise<string> {
    try {
      const summary = this.calculateOrderSummary(orderRequest.items);
      const now = new Date();

      const orderData: Omit<Order, 'id'> = {
        userId,
        guestInfo: orderRequest.guestInfo,
        items: orderRequest.items,
        totalAmount: summary.subtotal,
        deliveryFee: summary.deliveryFee,
        tax: summary.tax,
        grandTotal: summary.total,
        deliveryAddress: orderRequest.deliveryAddress,
        contactNumber: orderRequest.contactNumber,
        paymentMethod: orderRequest.paymentMethod,
        orderStatus: 'pending',
        createdAt: now,
        updatedAt: now,
        paymentConfirmed: orderRequest.paymentMethod === 'cash_on_delivery',
        notes: orderRequest.notes
      };

      if (!orderData.guestInfo) {
        delete orderData.guestInfo;
      }

      // Convert dates to Firestore timestamps
      const firestoreData = {
        ...orderData,
        createdAt: Timestamp.fromDate(orderData.createdAt),
        updatedAt: Timestamp.fromDate(orderData.updatedAt)
      };

      const docRef = await addDoc(collection(db, ORDERS_COLLECTION), firestoreData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Failed to create order. Please try again.');
    }
  }

  /**
   * Get orders for a specific user
   */
  async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const q = query(
        collection(db, ORDERS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const orders: Order[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          estimatedDeliveryTime: data.estimatedDeliveryTime?.toDate()
        } as Order);
      });

      return orders;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw new Error('Failed to fetch orders. Please try again.');
    }
  }

  /**
   * Get all orders (for admin)
   */
  async getAllOrders(): Promise<Order[]> {
    try {
      const q = query(
        collection(db, ORDERS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const orders: Order[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          estimatedDeliveryTime: data.estimatedDeliveryTime?.toDate()
        } as Order);
      });

      return orders;
    } catch (error) {
      console.error('Error fetching all orders:', error);
      throw new Error('Failed to fetch orders. Please try again.');
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const orderDoc = await getDoc(doc(db, ORDERS_COLLECTION, orderId));
      
      if (!orderDoc.exists()) {
        return null;
      }

      const data = orderDoc.data();
      return {
        id: orderDoc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        estimatedDeliveryTime: data.estimatedDeliveryTime?.toDate()
      } as Order;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw new Error('Failed to fetch order. Please try again.');
    }
  }

  /**
   * Update order status (for admin)
   */
  async updateOrderStatus(
    orderId: string, 
    status: OrderStatus, 
    estimatedDeliveryTime?: Date
  ): Promise<void> {
    try {
      const updateData: any = {
        orderStatus: status,
        updatedAt: Timestamp.fromDate(new Date())
      };

      if (estimatedDeliveryTime) {
        updateData.estimatedDeliveryTime = Timestamp.fromDate(estimatedDeliveryTime);
      }

      await updateDoc(doc(db, ORDERS_COLLECTION, orderId), updateData);
    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error('Failed to update order status. Please try again.');
    }
  }

  /**
   * Confirm payment for an order
   */
  async confirmPayment(orderId: string): Promise<void> {
    try {
      await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
        paymentConfirmed: true,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw new Error('Failed to confirm payment. Please try again.');
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<void> {
    try {
      await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
        orderStatus: 'cancelled',
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw new Error('Failed to cancel order. Please try again.');
    }
  }

  /**
   * Get orders by status (for admin filtering)
   */
  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    try {
      const q = query(
        collection(db, ORDERS_COLLECTION),
        where('orderStatus', '==', status),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const orders: Order[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          estimatedDeliveryTime: data.estimatedDeliveryTime?.toDate()
        } as Order);
      });

      return orders;
    } catch (error) {
      console.error('Error fetching orders by status:', error);
      throw new Error('Failed to fetch orders. Please try again.');
    }
  }
}

export const orderService = new OrderService();
export default orderService; 