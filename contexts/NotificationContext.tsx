import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { OneSignal } from 'react-native-onesignal';
import Constants from 'expo-constants';
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
  const cleanupRef = useRef<(() => void) | null>(null);

  // Initialize notifications only once
  useEffect(() => {
    let isMounted = true;
    
    const initializeNotifications = async () => {
      try {
        await notificationService.initialize();
        if (isMounted) {
          const token = notificationService.getExpoPushToken();
          setExpoPushToken(token);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
        if (isMounted) {
          setIsInitialized(true); // Still mark as initialized to prevent retries
        }
      }
    };

    initializeNotifications();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once

  // Set OneSignal external user ID when user logs in, clear when user logs out
  useEffect(() => {
    if (!isInitialized) return;

    const manageOneSignalUserId = async () => {
      try {
        if (user) {
          // User logged in - set external user ID
          await notificationService.setOneSignalExternalUserId(user.uid);
        } else {
          // User logged out - clear external user ID
          await notificationService.clearOneSignalExternalUserId();
        }
      } catch (error) {
        console.error('Failed to manage OneSignal external user ID:', error);
      }
    };

    manageOneSignalUserId();
  }, [user, isInitialized]);

  const handleNotificationPress = useCallback((data: any) => {
    try {
      // Priority: use path from notification data if available
      if (data?.path) {
        // Handle query params if path includes them
        if (data.path.includes('?')) {
          const [pathname, queryString] = data.path.split('?');
          const params: Record<string, string> = {};
          queryString.split('&').forEach((param: string) => {
            const [key, value] = param.split('=');
            if (key && value) {
              params[key] = decodeURIComponent(value);
            }
          });
          router.push({ pathname, params });
        } else {
          router.push(data.path as any);
        }
        return;
      }

      // Fallback: determine path based on notification type
      if (data?.type === 'order_status' && data?.orderId) {
        router.push('/(tabs)/orders');
      } else if (data?.type === 'new_order' && data?.orderId) {
        // Navigate to admin orders if user is admin, otherwise user orders
        if (userProfile?.role === 'admin') {
          router.push('/adminOrders');
        } else {
          router.push('/(tabs)/orders');
        }
      } else if (data?.type === 'payment_confirmed' && data?.orderId) {
        router.push({
          pathname: '/order-confirmation',
          params: { orderId: data.orderId }
        });
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  }, [userProfile?.role]);

  // Setup notification listeners when user is available
  useEffect(() => {
    if (!user || !isInitialized) return;

    const setupNotificationListeners = () => {
        console.log('📱 [NotificationContext] Setting up notification listeners');
      try {
        const { notificationListener, responseListener } = notificationService.setupNotificationListeners();

        // Handle received notifications (Expo)
        const notificationReceivedListener = Notifications.addNotificationReceivedListener((notification: Notifications.Notification) => {
          console.log('📬 [NotificationContext] Expo notification received:', {
            title: notification.request.content.title,
            body: notification.request.content.body,
            data: notification.request.content.data,
          });
          
          const data = notification.request.content.data;
          const newNotification: NotificationData = {
            orderId: data?.orderId as string,
            type: (data?.type as 'order_status' | 'payment_confirmed' | 'new_order' | 'general') || 'general',
            title: notification.request.content.title || 'Notifikasi',
            message: notification.request.content.body || '',
            data: data,
          };

          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        });

        // Handle notification responses (when user taps notification) - Expo
        const notificationResponseListener = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
          const data = response.notification.request.content.data;
          console.log('👆 [NotificationContext] Expo notification tapped:', {
            type: data?.type,
            orderId: data?.orderId,
            path: data?.path,
            fullData: data,
          });
          handleNotificationPress(data);
        });

        // Set up OneSignal listeners if OneSignal is configured
        const oneSignalAppId = Constants.expoConfig?.extra?.onesignal?.appId;
        const isExpoGo = Constants.appOwnership === 'expo';
        let oneSignalClickCleanup: (() => void) | null = null;
        let oneSignalForegroundCleanup: (() => void) | null = null;

        if (oneSignalAppId && !isExpoGo) {
          // Set up OneSignal listeners directly
          try {
            // OneSignal notification clicked listener
            const clickHandler = (event: any) => {
              const notification = event.notification;
              const data = notification.additionalData || {};
              
              console.log('👆 [NotificationContext] OneSignal notification clicked:', {
                notificationId: notification.notificationId,
                title: notification.title,
                body: notification.body,
                type: data?.type,
                orderId: data?.orderId,
                path: data?.path,
                fullData: data,
              });

              // Update state
              const newNotification: NotificationData = {
                orderId: data?.orderId as string,
                type: (data?.type as 'order_status' | 'payment_confirmed' | 'new_order' | 'general') || 'general',
                title: notification.title || 'Notifikasi',
                message: notification.body || '',
                data: data,
              };

              setNotifications(prev => [newNotification, ...prev]);
              
              // Handle navigation
              handleNotificationPress(data);
            };

            // OneSignal foreground notification listener
            const foregroundHandler = (event: any) => {
              const notification = event.notification;
              const data = notification.additionalData || {};
              
              console.log('📬 [NotificationContext] OneSignal notification received (foreground):', {
                notificationId: notification.notificationId,
                title: notification.title,
                body: notification.body,
                type: data?.type,
                orderId: data?.orderId,
                path: data?.path,
                fullData: data,
              });

              // Update state
              const newNotification: NotificationData = {
                orderId: data?.orderId as string,
                type: (data?.type as 'order_status' | 'payment_confirmed' | 'new_order' | 'general') || 'general',
                title: notification.title || 'Notifikasi',
                message: notification.body || '',
                data: data,
              };

              setNotifications(prev => [newNotification, ...prev]);
              setUnreadCount(prev => prev + 1);
            };

            OneSignal.Notifications.addEventListener('click', clickHandler);
            OneSignal.Notifications.addEventListener('foregroundWillDisplay', foregroundHandler);

            oneSignalClickCleanup = () => OneSignal.Notifications.removeEventListener('click', clickHandler);
            oneSignalForegroundCleanup = () => OneSignal.Notifications.removeEventListener('foregroundWillDisplay', foregroundHandler);
            
            console.log('✅ [NotificationContext] OneSignal listeners set up successfully');
          } catch (error) {
            console.error('❌ [NotificationContext] Failed to set up OneSignal listeners:', error);
          }
        }

        // Cleanup function
        return () => {
          notificationListener?.remove();
          responseListener?.remove();
          notificationReceivedListener?.remove();
          notificationResponseListener?.remove();
          oneSignalClickCleanup?.();
          oneSignalForegroundCleanup?.();
        };
      } catch (error) {
        console.error('Error setting up notification listeners:', error);
        return () => {}; // Return empty cleanup function
      }
    };

    cleanupRef.current = setupNotificationListeners();

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [user, isInitialized, handleNotificationPress]); // Added handleNotificationPress to dependencies

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.orderId === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(async () => {
    try {
      await notificationService.clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }, []);

  const sendTestNotification = useCallback(async () => {
    try {
      const testNotification: NotificationData = {
        type: 'general',
        title: 'Notifikasi Ujian',
        message: 'Ini adalah notifikasi ujian untuk memastikan sistem berfungsi dengan baik.',
        data: { type: 'test' },
      };
      
      await notificationService.sendLocalNotification(testNotification);
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }, []);

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