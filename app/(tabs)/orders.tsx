import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Modal } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/contexts/AuthContext';
import { orderService } from '@/services/orderService';
import { Order, OrderStatus } from '@/types/order';

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
  const [showOrderModal, setShowOrderModal] = useState(false);
  const { user } = useAuth();

  useFocusEffect(
    useCallback(() => {
      if (user) {
        // Set up real-time subscription
        const unsubscribe = orderService.subscribeToUserOrders(user.uid, (orders) => {
          setOrders(orders);
          setLoading(false);
        });

        return () => {
          unsubscribe();
        };
      }
    }, [user])
  );

  const loadOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userOrders = await orderService.getUserOrders(user.uid);
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
    setShowOrderModal(true);
  };

  const getStatusColor = (status: OrderStatus) => {
    return ORDER_STATUS_COLORS[status] || '#666';
  };

  const getStatusLabel = (status: OrderStatus) => {
    return ORDER_STATUS_LABELS[status] || status;
  };

  const OrderModal = () => (
    <Modal
      visible={showOrderModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowOrderModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Butiran Pesanan</Text>
          <TouchableOpacity onPress={() => setShowOrderModal(false)}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {selectedOrder && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.orderDetailSection}>
              <Text style={styles.sectionTitle}>Maklumat Pesanan</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>ID Pesanan:</Text>
                <Text style={styles.detailValue}>#{selectedOrder.id?.substring(0, 8)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={[styles.detailValue, { color: getStatusColor(selectedOrder.orderStatus) }]}>
                  {getStatusLabel(selectedOrder.orderStatus)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Masa Pesanan:</Text>
                <Text style={styles.detailValue}>
                  {new Date(selectedOrder.createdAt).toLocaleString('ms-MY')}
                </Text>
              </View>
              {selectedOrder.estimatedDeliveryTime && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Anggaran Masa Hantar:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedOrder.estimatedDeliveryTime).toLocaleString('ms-MY')}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.orderDetailSection}>
              <Text style={styles.sectionTitle}>Alamat Penghantaran</Text>
              <Text style={styles.addressText}>
                {selectedOrder.deliveryAddress.street}, {selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} {selectedOrder.deliveryAddress.postalCode}
              </Text>
              {selectedOrder.deliveryAddress.specialInstructions && (
                <Text style={styles.specialInstructions}>
                  Arahan Khas: {selectedOrder.deliveryAddress.specialInstructions}
                </Text>
              )}
            </View>

            <View style={styles.orderDetailSection}>
              <Text style={styles.sectionTitle}>Item Pesanan</Text>
              {selectedOrder.items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                  <Text style={styles.itemName}>{item.foodName}</Text>
                  <Text style={styles.itemPrice}>RM{(item.price * item.quantity).toFixed(2)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.orderDetailSection}>
              <Text style={styles.sectionTitle}>Ringkasan Bayaran</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal:</Text>
                <Text style={styles.summaryValue}>RM{selectedOrder.totalAmount.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Yuran Penghantaran:</Text>
                <Text style={styles.summaryValue}>RM{selectedOrder.deliveryFee.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Cukai:</Text>
                <Text style={styles.summaryValue}>RM{selectedOrder.tax.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Jumlah:</Text>
                <Text style={styles.totalValue}>RM{selectedOrder.grandTotal.toFixed(2)}</Text>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );

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
      
      <OrderModal />
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  orderDetailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  specialInstructions: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
    width: 40,
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
}); 