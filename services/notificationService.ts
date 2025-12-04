import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { OneSignal, LogLevel } from 'react-native-onesignal';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { orderService } from './orderService';
import { Order, OrderStatus } from '@/types/order';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }) as any,
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
  private isExpoGo: boolean = false;
  private initialized: boolean = false;
  private oneSignalAppId: string | null = null;
  private oneSignalRestApiKey: string | null = null;

  constructor() {
    // Check if running in Expo Go
    this.isExpoGo = Constants.appOwnership === 'expo';
    
    // Get OneSignal credentials from config
    this.oneSignalAppId = Constants.expoConfig?.extra?.onesignal?.appId || null;
    this.oneSignalRestApiKey = Constants.expoConfig?.extra?.onesignal?.restApiKey || null;
  }

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Initialize OneSignal SDK if App ID is configured
      if (this.oneSignalAppId && !this.isExpoGo) {
        try {
          OneSignal.Debug.setLogLevel(LogLevel.Verbose);
          OneSignal.initialize(this.oneSignalAppId);
          
          // Request push notification permissions
          OneSignal.Notifications.requestPermission(false);
          
          console.log('OneSignal initialized successfully');
          
          // Setup local notifications for fallback (doesn't require Firebase)
          await this.setupLocalNotifications();
          this.initialized = true;
          return; // Skip Expo push token registration since we're using OneSignal
        } catch (error) {
          console.error('Failed to initialize OneSignal:', error);
          // Fall through to setup local notifications
        }
      }

      if (this.isExpoGo) {
        console.log('Running in Expo Go - Push notifications disabled. Use development build for full functionality.');
        // Only setup local notifications for Expo Go
        await this.setupLocalNotifications();
      } else {
        // Only try Expo push tokens if OneSignal is not configured
        // This requires Firebase to be set up, which we're not using for push notifications
        console.log('OneSignal not configured - using local notifications only');
        await this.setupLocalNotifications();
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      // Initialize with local notifications only as fallback
      await this.setupLocalNotifications();
      this.initialized = true;
    }
  }

  /**
   * Setup local notifications only (for Expo Go)
   */
  private async setupLocalNotifications(): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // Request permissions for local notifications
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
      }
    } catch (error) {
      console.error('Failed to setup local notifications:', error);
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
        // Use Firebase project ID for push notifications
        const projectId = Constants.expoConfig?.extra?.firebase?.projectId ?? 'retaurant-block-twenty-9';
        
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
   * Check if push notifications are available
   */
  isPushNotificationAvailable(): boolean {
    return !this.isExpoGo && this.expoPushToken !== null;
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
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  /**
   * Send push notification (only works in development builds)
   */
  async sendPushNotification(
    expoPushToken: string,
    data: NotificationData
  ): Promise<void> {
    if (this.isExpoGo) {
      console.log('Push notifications not available in Expo Go - using local notification instead');
      await this.sendLocalNotification(data);
      return;
    }

    try {
      const message = {
        to: expoPushToken,
        sound: 'default',
        title: data.title,
        body: data.message,
        data: data.data,
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Push notification sent:', result);
    } catch (error) {
      console.error('Error sending push notification:', error);
      // Fallback to local notification
      await this.sendLocalNotification(data);
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

    // Send local notification
    await this.sendLocalNotification(notification);

    // Send push notification to the user who made the order
    if (order.userId) {
      try {
        await this.sendOneSignalPushNotification(
          [order.userId],
          notification.title,
          notification.message,
          notification.data
        );
      } catch (error) {
        console.error('Failed to send order status push notification:', error);
        // Continue without throwing - local notification already sent
      }
    }
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
   * Handle new order notifications for user
   */
  async notifyNewOrder(order: Order): Promise<void> {
    const customerName = order.guestInfo?.fullName || 'Pelanggan Berdaftar';
    
    // User notification (for the customer who made the order)
    const userNotification: NotificationData = {
      orderId: order.id,
      type: 'new_order',
      title: 'Pesanan Berjaya Dibuat',
      message: `Anda telah berjaya membuat pesanan - RM${order.grandTotal.toFixed(2)}`,
      data: {
        orderId: order.id,
        type: 'new_order',
      },
    };

    // Admin notification template
    const adminNotification: NotificationData = {
      orderId: order.id,
      type: 'new_order',
      title: 'Pesanan Baru Diterima',
      message: `Pesanan baru dari ${customerName} - RM${order.grandTotal.toFixed(2)}`,
      data: {
        orderId: order.id,
        type: 'new_order',
      },
    };

    // Send local notification to user
    await this.sendLocalNotification(userNotification);

    // Send push notification to the user who made the order
    if (order.userId) {
      try {
        await this.sendOneSignalPushNotification(
          [order.userId],
          userNotification.title,
          userNotification.message,
          userNotification.data
        );
      } catch (error) {
        console.error('Failed to send new order push notification to user:', error);
        // Continue without throwing - local notification already sent
      }
    }

    // Send push notification to all admin users
    try {
      const adminUserIds = await this.getAllAdminUserIds();
      if (adminUserIds.length > 0) {
        await this.sendOneSignalPushNotification(
          adminUserIds,
          adminNotification.title,
          adminNotification.message,
          adminNotification.data
        );
      }
    } catch (error) {
      console.error('Failed to send new order push notification to admins:', error);
      // Continue without throwing - user notification already sent
    }
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

  /**
   * Get all admin user IDs from Firestore
   */
  private async getAllAdminUserIds(): Promise<string[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'admin')
      );
      
      const querySnapshot = await getDocs(q);
      const adminIds: string[] = [];
      
      querySnapshot.forEach((doc) => {
        adminIds.push(doc.id);
      });
      
      return adminIds;
    } catch (error) {
      console.error('Error fetching admin users:', error);
      return [];
    }
  }

  /**
   * Send push notification via OneSignal REST API
   */
  private async sendOneSignalPushNotification(
    externalUserIds: string[],
    title: string,
    message: string,
    data?: any
  ): Promise<void> {
    if (!this.oneSignalAppId || !this.oneSignalRestApiKey) {
      console.log('OneSignal credentials not configured, skipping push notification');
      return;
    }

    if (externalUserIds.length === 0) {
      console.log('No user IDs provided, skipping push notification');
      return;
    }

    try {
      const notificationPayload = {
        app_id: this.oneSignalAppId,
        include_external_user_ids: externalUserIds,
        headings: { en: title },
        contents: { en: message },
        data: data || {},
      };

      // OneSignal requires Basic auth with base64-encoded REST API key
      const encodedApiKey = Buffer.from(`${this.oneSignalRestApiKey}:`).toString('base64');
      
      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${encodedApiKey}`,
        },
        body: JSON.stringify(notificationPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OneSignal API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('OneSignal push notification sent successfully:', result);
    } catch (error) {
      console.error('Error sending OneSignal push notification:', error);
      throw error;
    }
  }

  /**
   * Set external user ID in OneSignal
   */
  async setOneSignalExternalUserId(userId: string): Promise<void> {
    if (!this.oneSignalAppId || this.isExpoGo) {
      return;
    }

    try {
      await OneSignal.login(userId);
      console.log('OneSignal external user ID set:', userId);
    } catch (error) {
      console.error('Error setting OneSignal external user ID:', error);
    }
  }

  /**
   * Clear external user ID in OneSignal
   */
  async clearOneSignalExternalUserId(): Promise<void> {
    if (!this.oneSignalAppId || this.isExpoGo) {
      return;
    }

    try {
      await OneSignal.logout();
      console.log('OneSignal external user ID cleared');
    } catch (error) {
      console.error('Error clearing OneSignal external user ID:', error);
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService; 