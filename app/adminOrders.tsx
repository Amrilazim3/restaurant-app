import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/contexts/AuthContext';
import { orderService } from '@/services/orderService';
import { Order, OrderStatus } from '@/types/order';
import { OrderDetailsSheet } from '@/components/OrderDetailsSheet';
import { StatusUpdateDialog } from '@/components/StatusUpdateDialog';

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

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderSheet, setShowOrderSheet] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { userProfile } = useAuth();

  // Redirect if not admin
  useEffect(() => {
    if (userProfile && userProfile.role !== 'admin') {
      router.replace('/');
    }
  }, [userProfile]);

  useFocusEffect(
    useCallback(() => {
      // Set up real-time subscription
      const unsubscribe = orderService.subscribeToAllOrders((orders) => {
        setOrders(orders);
        setLoading(false);
      });

      return () => {
        unsubscribe();
      };
    }, [])
  );

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const allOrders = await orderService.getAllOrders();
      setOrders(allOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Ralat', 'Gagal memuatkan pesanan. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(order =>
        order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some(item =>
          item.foodName.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        order.contactNumber.includes(searchQuery) ||
        (order.guestInfo && 
          order.guestInfo.fullName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.orderStatus === statusFilter);
    }

    setFilteredOrders(filtered);
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

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;

    try {
      setUpdatingStatus(true);
      await orderService.updateOrderStatus(selectedOrder.id!, newStatus);
      
      // Close dialog immediately after successful update
      setShowStatusDialog(false);
      
      // Show success message after dialog is closed
      Alert.alert('Berjaya', 'Status pesanan berjaya dikemas kini');
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Ralat', 'Gagal mengemaskini status pesanan. Sila cuba lagi.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const confirmPayment = async (orderId: string) => {
    try {
      await orderService.confirmPayment(orderId);
      
      // Close sheet immediately after successful confirmation
      setShowOrderSheet(false);
      
      // Show success message
      Alert.alert('Berjaya', 'Pembayaran telah disahkan');
    } catch (error) {
      console.error('Error confirming payment:', error);
      Alert.alert('Ralat', 'Gagal mengesahkan pembayaran. Sila cuba lagi.');
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    return ORDER_STATUS_COLORS[status] || '#666';
  };

  const getStatusLabel = (status: OrderStatus) => {
    return ORDER_STATUS_LABELS[status] || status;
  };

  const getTotalDailySales = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime() && 
             order.orderStatus !== 'cancelled';
    });

    return todayOrders.reduce((total, order) => total + order.grandTotal, 0);
  };

  const getOrderStats = () => {
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.orderStatus === 'pending').length,
      confirmed: orders.filter(o => o.orderStatus === 'confirmed').length,
      preparing: orders.filter(o => o.orderStatus === 'preparing').length,
      ready: orders.filter(o => o.orderStatus === 'ready').length,
      delivered: orders.filter(o => o.orderStatus === 'delivered').length,
    };
    return stats;
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <TouchableOpacity
      style={[
        styles.orderCard,
        { borderLeftColor: getStatusColor(order.orderStatus) }
      ]}
      onPress={() => handleOrderPress(order)}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{order.id?.substring(0, 8)}</Text>
        <Text style={[styles.orderStatus, { color: getStatusColor(order.orderStatus) }]}>
          {getStatusLabel(order.orderStatus)}
        </Text>
      </View>
      
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>
          {order.guestInfo ? order.guestInfo.fullName : 'Pelanggan Berdaftar'}
        </Text>
        <Text style={styles.contactNumber}>{order.contactNumber}</Text>
      </View>

      <View style={styles.orderItems}>
        <Text style={styles.itemsTitle}>Items ({order.items.length}):</Text>
        {order.items.slice(0, 2).map((item, index) => (
          <Text key={index} style={styles.itemName}>
            {item.quantity}x {item.foodName}
          </Text>
        ))}
        {order.items.length > 2 && (
          <Text style={styles.moreItems}>+{order.items.length - 2} lagi</Text>
        )}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>RM{order.grandTotal.toFixed(2)}</Text>
        <Text style={styles.orderTime}>
          {new Date(order.createdAt).toLocaleString('ms-MY')}
        </Text>
      </View>

      {!order.paymentConfirmed && order.paymentMethod === 'qr_code' && (
        <View style={styles.paymentWarning}>
          <Ionicons name="warning" size={16} color="#FF9500" />
          <Text style={styles.paymentWarningText}>Pembayaran belum disahkan</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Memuatkan pesanan...</Text>
      </View>
    );
  }

  const stats = getOrderStats();
  const dailySales = getTotalDailySales();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Jumlah</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Menunggu</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>RM{dailySales.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Jualan Hari Ini</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari pesanan..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView
            horizontal
            style={styles.filterContainer}
            showsHorizontalScrollIndicator={false}
        >
            <TouchableOpacity
            style={[styles.filterButton, statusFilter === 'all' && styles.activeFilter]}
            onPress={() => setStatusFilter('all')}
            >
            <Text style={[styles.filterText, statusFilter === 'all' && styles.activeFilterText]}>
                Semua
            </Text>
            </TouchableOpacity>
            
            {Object.entries(ORDER_STATUS_LABELS).map(([status, label]) => (
            <TouchableOpacity
                key={status}
                style={[styles.filterButton, statusFilter === status && styles.activeFilter]}
                onPress={() => setStatusFilter(status as OrderStatus)}
            >
                <Text style={[styles.filterText, statusFilter === status && styles.activeFilterText]}>
                {label}
                </Text>
            </TouchableOpacity>
            ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.ordersContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>Tiada pesanan dijumpai</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? 'Cuba cari dengan kata kunci lain' : 'Pesanan akan dipaparkan di sini'}
            </Text>
          </View>
        ) : (
          filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))
        )}
      </ScrollView>

      <OrderDetailsSheet
        order={selectedOrder}
        open={showOrderSheet}
        onOpenChange={setShowOrderSheet}
        onUpdateStatus={() => {
          setShowOrderSheet(false);
          setTimeout(() => setShowStatusDialog(true), 50);
        }}
        onConfirmPayment={() => selectedOrder && confirmPayment(selectedOrder.id!)}
      />
      <StatusUpdateDialog
        open={showStatusDialog}
        onOpenChange={(open) => {
          setShowStatusDialog(open);
          if (!open) {
            // When dialog closes, reopen the sheet
            setTimeout(() => setShowOrderSheet(true), 100);
          }
        }}
        currentStatus={selectedOrder?.orderStatus || 'pending'}
        onStatusUpdate={handleStatusUpdate}
        updating={updatingStatus}
      />
    </View>
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
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  activeFilter: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
  },
  ordersContainer: {
    flex: 1,
  },
  orderCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  customerInfo: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contactNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  orderItems: {
    marginBottom: 12,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  moreItems: {
    fontSize: 14,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  orderTime: {
    fontSize: 12,
    color: '#999',
  },
  paymentWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FFF3CD',
    borderRadius: 6,
  },
  paymentWarningText: {
    fontSize: 12,
    color: '#FF9500',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },

  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 