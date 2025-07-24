import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/contexts/AuthContext';
import { orderService } from '@/services/orderService';
import { Order, OrderStatus } from '@/types/order';
import { OrderDetailsSheet } from '@/components/OrderDetailsSheet';

const ORDER_STATUS_COLORS = {
  pending: '#FF9500',
  confirmed: '#007AFF',
  preparing: '#FF9500',
  ready: '#30D158',
  delivered: '#34C759',
  cancelled: '#FF3B30',
};

const ORDER_STATUS_LABELS = {
  pending: 'Menunggu',
  confirmed: 'Disahkan',
  preparing: 'Menyediakan',
  ready: 'Siap',
  delivered: 'Dihantar',
  cancelled: 'Dibatalkan',
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderSheet, setShowOrderSheet] = useState(false);
  const { userProfile } = useAuth();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    if (!userProfile) {
        setLoading(false);
        return;
    };

    try {
      setLoading(true);
      const userOrders = await orderService.getUserOrders(userProfile?.uid || '');
      setOrders(userOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Ralat', 'Gagal memuatkan pesanan. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleOrderPress = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderSheet(true);
  };

  const getStatusColor = (status: OrderStatus) => {
    return ORDER_STATUS_COLORS[status] || '#666';
  };

  const getStatusLabel = (status: OrderStatus) => {
    return ORDER_STATUS_LABELS[status] || status;
  };



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Memuatkan pesanan...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Pesanan</Text>
        <Text style={styles.subtitle}>Sejarah pesanan anda</Text>
      </View>

      <View style={styles.ordersSection}>
        {orders.length === 0 ? (
          <View style={styles.emptyOrders}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyOrdersText}>Tiada pesanan lagi</Text>
            <Text style={styles.emptyOrdersSubtext}>Buat pesanan pertama anda dari menu kami!</Text>
          </View>
        ) : (
          orders.map((order) => (
            <TouchableOpacity key={order.id} style={styles.orderItem} onPress={() => handleOrderPress(order)}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderDate}>
                  {new Date(order.createdAt).toLocaleDateString('ms-MY')}
                </Text>
                <Text style={[styles.orderStatus, { color: getStatusColor(order.orderStatus) }]}>
                  {getStatusLabel(order.orderStatus)}
                </Text>
              </View>
              <View style={styles.orderDetails}>
                <Text style={styles.orderItems}>
                  {order.items.slice(0, 2).map(item => `${item.quantity}x ${item.foodName}`).join(', ')}
                  {order.items.length > 2 && ` +${order.items.length - 2} lagi`}
                </Text>
                <Text style={styles.orderTotal}>Jumlah: RM{order.grandTotal.toFixed(2)}</Text>
              </View>
              
              {order.orderStatus === 'ready' && (
                <View style={styles.readyBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#30D158" />
                  <Text style={styles.readyText}>Siap untuk diambil!</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
      
      <OrderDetailsSheet
        order={selectedOrder}
        open={showOrderSheet}
        onOpenChange={setShowOrderSheet}
        onUpdateStatus={() => {}} // No status update for regular users
        onConfirmPayment={() => {}} // No payment confirmation for regular users
        showAdminActions={false}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  ordersSection: {
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  emptyOrders: {
    padding: 40,
    alignItems: 'center',
  },
  emptyOrdersText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
    marginTop: 16,
  },
  emptyOrdersSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  orderItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  orderDetails: {
    marginTop: 8,
  },
  orderItems: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#F0FFF4',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#30D158',
  },
  readyText: {
    fontSize: 12,
    color: '#30D158',
    marginLeft: 4,
    fontWeight: '600',
  },

}); 