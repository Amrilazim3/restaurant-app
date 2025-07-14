import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { notificationService, NotificationData } from '@/services/notificationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  isInitialized: boolean;
  expoPushToken: string | null;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  sendTestNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const { user, userProfile } = useAuth();

  useEffect(() => {
    initializeNotifications();
  }, []);

  useEffect(() => {
    if (user) {
      setupNotificationListeners();
    }
  }, [user]);

  const initializeNotifications = async () => {
    try {
      await notificationService.initialize();
      const token = notificationService.getExpoPushToken();
      setExpoPushToken(token);
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  };

  const setupNotificationListeners = () => {
    const { notificationListener, responseListener } = notificationService.setupNotificationListeners();

    // Handle received notifications
    const notificationReceivedListener = Notifications.addNotificationReceivedListener((notification: Notifications.Notification) => {
      const data = notification.request.content.data;
      const newNotification: NotificationData = {
        orderId: data?.orderId,
        type: data?.type || 'general',
        title: notification.request.content.title || 'Notifikasi',
        message: notification.request.content.body || '',
        data: data,
      };

      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // Handle notification responses (when user taps notification)
    const notificationResponseListener = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;
      handleNotificationPress(data);
    });

    // Cleanup function
    return () => {
      notificationListener.remove();
      responseListener.remove();
      notificationReceivedListener.remove();
      notificationResponseListener.remove();
    };
  };

  const handleNotificationPress = (data: any) => {
    try {
      if (data?.type === 'order_status' && data?.orderId) {
        // Navigate to order details
        router.push('/(tabs)/orders');
      } else if (data?.type === 'new_order' && data?.orderId) {
        // Navigate to admin orders if user is admin
        if (userProfile?.role === 'admin') {
          router.push('/adminOrders');
        }
      } else if (data?.type === 'payment_confirmed' && data?.orderId) {
        // Navigate to order confirmation
        router.push({
          pathname: '/order-confirmation',
          params: { orderId: data.orderId }
        });
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.orderId === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const clearNotifications = async () => {
    await notificationService.clearAllNotifications();
    setNotifications([]);
    setUnreadCount(0);
  };

  const sendTestNotification = async () => {
    const testNotification: NotificationData = {
      type: 'general',
      title: 'Notifikasi Ujian',
      message: 'Ini adalah notifikasi ujian untuk memastikan sistem berfungsi dengan baik.',
      data: { type: 'test' },
    };
    
    await notificationService.sendLocalNotification(testNotification);
  };

  const value = {
    notifications,
    unreadCount,
    isInitialized,
    expoPushToken,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    sendTestNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 