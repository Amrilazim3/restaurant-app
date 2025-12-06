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
  const processedNotificationsRef = useRef<Set<string>>(new Set());

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
            identifier: notification.request.identifier,
          });
          
          const data = notification.request.content.data;
          
          // Create a unique key to prevent duplicate notifications
          // Use identifier if available, otherwise use orderId + type + timestamp
          const uniqueKey = notification.request.identifier || 
            `${data?.orderId || 'unknown'}-${data?.type || 'general'}-${Date.now()}`;
          
          // Skip if we've already processed this notification
          if (processedNotificationsRef.current.has(uniqueKey)) {
            console.log('⚠️ [NotificationContext] Skipping duplicate notification:', uniqueKey);
            return;
          }
          
          // Mark as processed
          processedNotificationsRef.current.add(uniqueKey);
          
          // Clean up old entries (keep only last 100)
          if (processedNotificationsRef.current.size > 100) {
            const entries = Array.from(processedNotificationsRef.current);
            entries.slice(0, entries.length - 100).forEach(key => {
              processedNotificationsRef.current.delete(key);
            });
          }
          
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
              
              // Extract notification content - OneSignal may structure this differently
              const title = notification.title || notification.notification?.title || 'Notifikasi';
              const body = notification.body || notification.notification?.body || '';
              
              console.log('👆 [NotificationContext] OneSignal notification clicked:', {
                notificationId: notification.notificationId,
                title: title,
                body: body,
                type: data?.type,
                orderId: data?.orderId,
                path: data?.path,
                fullData: data,
                fullNotification: notification,
              });

              // Ensure path is available in data for navigation
              const notificationData = {
                ...data,
                path: data?.path || notificationService.getNotificationPath(data),
              };

              // Update state
              const newNotification: NotificationData = {
                orderId: data?.orderId as string,
                type: (data?.type as 'order_status' | 'payment_confirmed' | 'new_order' | 'general') || 'general',
                title: title,
                message: body,
                data: notificationData,
              };

              setNotifications(prev => [newNotification, ...prev]);
              
              // Handle navigation with the complete data including path
              handleNotificationPress(notificationData);
            };

            // OneSignal foreground notification listener
            const foregroundHandler = async (event: any) => {
              const notification = event.notification;
              const data = notification.additionalData || {};
              
              // Extract notification content - OneSignal may structure this differently
              const title = notification.title || notification.notification?.title || 'Notifikasi';
              const body = notification.body || notification.notification?.body || '';
              
              console.log('📬 [NotificationContext] OneSignal notification received (foreground):', {
                notificationId: notification.notificationId,
                title: title,
                body: body,
                type: data?.type,
                orderId: data?.orderId,
                path: data?.path,
                fullData: data,
                fullNotification: notification,
              });

              // Prevent OneSignal from showing its own notification
              // We'll display it via Expo Notifications instead for consistent behavior
              try {
                // Try preventDefault first (if available)
                if (typeof event.preventDefault === 'function') {
                  event.preventDefault();
                  console.log('✅ [NotificationContext] Prevented OneSignal default notification display');
                }
                // Also try to prevent display via the notification object
                if (event.notification && typeof event.notification.display === 'function') {
                  // Don't call display() - this prevents OneSignal from showing it
                }
              } catch (error) {
                console.log('⚠️ [NotificationContext] preventDefault not available, OneSignal may show its own notification');
              }

              // Display notification using Expo Notifications so it shows properly with title and body
              // This ensures consistent display and proper navigation handling
              // Note: We don't update state here - the Expo notificationReceivedListener will handle it
              // This prevents duplicate notifications
              try {
                const notificationPath = data?.path || notificationService.getNotificationPath(data);
                
                // Create a unique identifier based on OneSignal notification ID to prevent duplicates
                const onesignalNotificationId = notification.notificationId || `onesignal-${Date.now()}`;
                const uniqueId = `onesignal-${onesignalNotificationId}`;
                
                // Check if we've already processed this OneSignal notification
                if (processedNotificationsRef.current.has(uniqueId)) {
                  console.log('⚠️ [NotificationContext] Skipping duplicate OneSignal notification:', onesignalNotificationId);
                  return;
                }
                
                // Mark as processed before displaying
                processedNotificationsRef.current.add(uniqueId);
                
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title: title,
                    body: body,
                    data: {
                      ...data,
                      path: notificationPath,
                      type: data?.type || 'general',
                      orderId: data?.orderId,
                      _onesignalId: onesignalNotificationId, // Mark as OneSignal notification
                    },
                  },
                  trigger: null, // Show immediately
                  identifier: uniqueId, // Use unique identifier
                });
                
                console.log('✅ [NotificationContext] Expo notification displayed for foreground OneSignal notification');
              } catch (error) {
                console.error('❌ [NotificationContext] Error displaying foreground notification via Expo:', error);
                // If Expo fails, try to let OneSignal show it (if method exists)
                try {
                  if (notification && typeof notification.display === 'function') {
                    notification.display();
                  }
                } catch (displayError) {
                  console.error('Failed to display notification via OneSignal fallback:', displayError);
                }
              }
              
              // Don't update state here - the Expo notificationReceivedListener will handle it
              // This prevents duplicate notifications from being added to state
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