import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { orderService } from './orderService';
import { Order, OrderStatus } from '@/types/order';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationData {
  orderId?: string;
  type: 'order_status' | 'payment_confirmed' | 'new_order' | 'general';
  title: string;
  message: string;
  data?: any;
}

class NotificationService {
  private expoPushToken: string | null = null;

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    try {
      await this.registerForPushNotificationsAsync();
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  /**
   * Register for push notifications
   */
  async registerForPushNotificationsAsync(): Promise<string | null> {
    let token = null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        
        if (!projectId) {
          throw new Error('Project ID not found');
        }

        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        this.expoPushToken = token;
        console.log('Push token:', token);
      } catch (error) {
        console.error('Error getting push token:', error);
        return null;
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  /**
   * Get current push token
   */
  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Send local notification
   */
  async sendLocalNotification(data: NotificationData): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.message,
          data: data.data,
          sound: 'default',
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  /**
   * Send push notification via Expo Push API
   */
  async sendPushNotification(
    expoPushToken: string,
    data: NotificationData
  ): Promise<void> {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: data.title,
      body: data.message,
      data: data.data,
    };

    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  /**
   * Handle order status change notifications
   */
  async notifyOrderStatusChange(order: Order, newStatus: OrderStatus): Promise<void> {
    const statusMessages = {
      pending: 'Pesanan anda telah diterima dan sedang diproses',
      confirmed: 'Pesanan anda telah disahkan oleh restoran',
      preparing: 'Pesanan anda sedang disediakan',
      ready: 'Pesanan anda sudah siap! Sila ambil pesanan anda',
      delivered: 'Pesanan anda telah dihantar. Terima kasih!',
      cancelled: 'Pesanan anda telah dibatalkan',
    };

    const notification: NotificationData = {
      orderId: order.id,
      type: 'order_status',
      title: `Pesanan #${order.id?.slice(-8).toUpperCase()}`,
      message: statusMessages[newStatus],
      data: {
        orderId: order.id,
        status: newStatus,
        type: 'order_status',
      },
    };

    await this.sendLocalNotification(notification);
  }

  /**
   * Handle payment confirmation notifications
   */
  async notifyPaymentConfirmed(order: Order): Promise<void> {
    const notification: NotificationData = {
      orderId: order.id,
      type: 'payment_confirmed',
      title: 'Pembayaran Disahkan',
      message: `Pembayaran untuk pesanan #${order.id?.slice(-8).toUpperCase()} telah disahkan`,
      data: {
        orderId: order.id,
        type: 'payment_confirmed',
      },
    };

    await this.sendLocalNotification(notification);
  }

  /**
   * Handle new order notifications for admin
   */
  async notifyNewOrder(order: Order): Promise<void> {
    const customerName = order.guestInfo?.fullName || 'Pelanggan Berdaftar';
    
    const notification: NotificationData = {
      orderId: order.id,
      type: 'new_order',
      title: 'Pesanan Baharu',
      message: `Pesanan baharu daripada ${customerName} - RM${order.grandTotal.toFixed(2)}`,
      data: {
        orderId: order.id,
        type: 'new_order',
      },
    };

    await this.sendLocalNotification(notification);
  }

  /**
   * Cancel all notifications for a specific order
   */
  async cancelOrderNotifications(orderId: string): Promise<void> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of notifications) {
        if (notification.content.data?.orderId === orderId) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  /**
   * Get notification history (from device)
   */
  async getNotificationHistory(): Promise<Notifications.Notification[]> {
    try {
      return await Notifications.getPresentedNotificationsAsync();
    } catch (error) {
      console.error('Error getting notification history:', error);
      return [];
    }
  }

  /**
   * Set up notification listeners
   */
  setupNotificationListeners(): {
    notificationListener: Notifications.EventSubscription;
    responseListener: Notifications.EventSubscription;
  } {
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      
      const data = response.notification.request.content.data;
      if (data?.type === 'order_status' || data?.type === 'new_order') {
        // Handle navigation based on notification type
        this.handleNotificationPress(data);
      }
    });

    return {
      notificationListener,
      responseListener,
    };
  }

  /**
   * Handle notification press actions
   */
  private handleNotificationPress(data: any): void {
    // This would integrate with your navigation system
    // For now, we'll just log the action
    console.log('Handling notification press:', data);
    
    // You can implement navigation logic here
    // For example: router.push(`/order-detail/${data.orderId}`);
  }
}

export const notificationService = new NotificationService();
export default notificationService; 