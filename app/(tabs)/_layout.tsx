import { Tabs } from 'expo-router';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useNotification } from '@/contexts/NotificationContext';
import NotificationBadge from '@/components/NotificationBadge';
import { orderService } from '@/services/orderService';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

// Cart Badge Component
const CartBadge = ({ count }: { count: number }) => {
  if (count === 0) return null;
  
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>
        {count > 99 ? '99+' : count.toString()}
      </Text>
    </View>
  );
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, userProfile, loading } = useAuth();
  const { cartCount } = useCart();
  const [ordersCount, setOrdersCount] = useState(0);
  
  // Always call useNotification at the top level
  const { unreadCount } = useNotification();

  // Load user orders count
  const loadOrdersCount = useCallback(async () => {
    if (!userProfile) {
      setOrdersCount(0);
      return;
    }

    try {
      const userOrders = await orderService.getUserOrders(userProfile.uid);
      setOrdersCount(userOrders.length);
    } catch (error) {
      console.error('Error loading orders count:', error);
      setOrdersCount(0);
    }
  }, [userProfile]);

  // Load orders count when component mounts or user changes
  useEffect(() => {
    loadOrdersCount();
  }, [loadOrdersCount]);

  // Reload orders count when tab is focused
  useFocusEffect(
    useCallback(() => {
      loadOrdersCount();
    }, [loadOrdersCount])
  );

  // Removed automatic redirect to login - now handled by welcome screen

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color }) => <TabBarIcon name="cutlery" color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Keranjang',
          tabBarIcon: ({ color }) => (
            <View style={{ position: 'relative' }}>
              <TabBarIcon name="shopping-cart" color={color} />
              <CartBadge count={cartCount} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pesanan',
          tabBarIcon: ({ color }) => (
            <View style={{ position: 'relative' }}>
              <TabBarIcon name="list" color={color} />
              <NotificationBadge count={ordersCount} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
