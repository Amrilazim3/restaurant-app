import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/contexts/AuthContext';
import { orderService } from '@/services/orderService';
import { menuService } from '@/services/menuService';
import { Order, OrderStatus } from '@/types/order';
import { Menu, Food } from '@/types/menu';

interface SalesStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  allTime: number;
}

interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  preparing: number;
  ready: number;
  delivered: number;
  cancelled: number;
}

interface TopSellingItem {
  foodName: string;
  quantity: number;
  revenue: number;
}

export default function BusinessReportScreen() {
  const { userProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (userProfile && userProfile.role !== 'admin') {
      router.replace('/');
    }
  }, [userProfile]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, menusData, foodsData] = await Promise.all([
        orderService.getAllOrders(),
        menuService.getAllMenus(),
        menuService.getAllFoods(),
      ]);
      setOrders(ordersData);
      setMenus(menusData);
      setFoods(foodsData);
    } catch (error) {
      console.error('Error loading business report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getSalesStats = (): SalesStats => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const completedOrders = orders.filter(
      (o) => o.orderStatus === 'delivered' && o.paymentConfirmed !== false
    );

    return {
      today: completedOrders
        .filter((o) => {
          const orderDate = new Date(o.createdAt);
          orderDate.setHours(0, 0, 0, 0);
          return orderDate.getTime() === today.getTime();
        })
        .reduce((sum, o) => sum + o.grandTotal, 0),
      thisWeek: completedOrders
        .filter((o) => {
          const orderDate = new Date(o.createdAt);
          return orderDate >= thisWeek;
        })
        .reduce((sum, o) => sum + o.grandTotal, 0),
      thisMonth: completedOrders
        .filter((o) => {
          const orderDate = new Date(o.createdAt);
          return orderDate >= thisMonth;
        })
        .reduce((sum, o) => sum + o.grandTotal, 0),
      allTime: completedOrders.reduce((sum, o) => sum + o.grandTotal, 0),
    };
  };

  const getOrderStats = (): OrderStats => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.orderStatus === 'pending').length,
      confirmed: orders.filter((o) => o.orderStatus === 'confirmed').length,
      preparing: orders.filter((o) => o.orderStatus === 'preparing').length,
      ready: orders.filter((o) => o.orderStatus === 'ready').length,
      delivered: orders.filter((o) => o.orderStatus === 'delivered').length,
      cancelled: orders.filter((o) => o.orderStatus === 'cancelled').length,
    };
  };

  const getTopSellingItems = (limit: number = 10): TopSellingItem[] => {
    const itemMap = new Map<string, { quantity: number; revenue: number }>();

    orders
      .filter((o) => o.orderStatus !== 'cancelled')
      .forEach((order) => {
        order.items.forEach((item) => {
          const existing = itemMap.get(item.foodName) || {
            quantity: 0,
            revenue: 0,
          };
          itemMap.set(item.foodName, {
            quantity: existing.quantity + item.quantity,
            revenue: existing.revenue + item.price * item.quantity,
          });
        });
      });

    return Array.from(itemMap.entries())
      .map(([foodName, data]) => ({
        foodName,
        quantity: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);
  };

  const getPaymentMethodBreakdown = () => {
    const qrCode = orders.filter((o) => o.paymentMethod === 'qr_code').length;
    const cashOnDelivery = orders.filter(
      (o) => o.paymentMethod === 'cash_on_delivery'
    ).length;
    return { qrCode, cashOnDelivery };
  };

  const getRevenueBreakdown = () => {
    const completedOrders = orders.filter(
      (o) => o.orderStatus === 'delivered' && o.paymentConfirmed !== false
    );
    const subtotal = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const deliveryFees = completedOrders.reduce(
      (sum, o) => sum + o.deliveryFee,
      0
    );
    const taxes = completedOrders.reduce((sum, o) => sum + o.tax, 0);
    return { subtotal, deliveryFees, taxes };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Memuatkan laporan...</Text>
      </View>
    );
  }

  const salesStats = getSalesStats();
  const orderStats = getOrderStats();
  const topSellingItems = getTopSellingItems(10);
  const paymentBreakdown = getPaymentMethodBreakdown();
  const revenueBreakdown = getRevenueBreakdown();
  const activeMenus = menus.filter((m) => m.isActive).length;
  const activeFoods = foods.filter((f) => f.isActive && f.isAvailable).length;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Sales Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistik Jualan</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="today" size={24} color="#007AFF" />
            <Text style={styles.statValue}>RM{salesStats.today.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Hari Ini</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color="#30D158" />
            <Text style={styles.statValue}>RM{salesStats.thisWeek.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Minggu Ini</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar-outline" size={24} color="#FF9500" />
            <Text style={styles.statValue}>RM{salesStats.thisMonth.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Bulan Ini</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={24} color="#34C759" />
            <Text style={styles.statValue}>RM{salesStats.allTime.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Jumlah Keseluruhan</Text>
          </View>
        </View>
      </View>

      {/* Order Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistik Pesanan</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{orderStats.total}</Text>
            <Text style={styles.statLabel}>Jumlah Pesanan</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFF3CD' }]}>
            <Text style={[styles.statValue, { color: '#FF9500' }]}>
              {orderStats.pending}
            </Text>
            <Text style={styles.statLabel}>Menunggu</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#D1ECF1' }]}>
            <Text style={[styles.statValue, { color: '#007AFF' }]}>
              {orderStats.confirmed}
            </Text>
            <Text style={styles.statLabel}>Disahkan</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#D4EDDA' }]}>
            <Text style={[styles.statValue, { color: '#34C759' }]}>
              {orderStats.delivered}
            </Text>
            <Text style={styles.statLabel}>Dihantar</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F8D7DA' }]}>
            <Text style={[styles.statValue, { color: '#DC3545' }]}>
              {orderStats.cancelled}
            </Text>
            <Text style={styles.statLabel}>Dibatalkan</Text>
          </View>
        </View>
      </View>

      {/* Revenue Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pecahan Pendapatan</Text>
        <View style={styles.revenueCard}>
          <View style={styles.revenueRow}>
            <Text style={styles.revenueLabel}>Subtotal Makanan</Text>
            <Text style={styles.revenueValue}>
              RM{revenueBreakdown.subtotal.toFixed(2)}
            </Text>
          </View>
          <View style={styles.revenueRow}>
            <Text style={styles.revenueLabel}>Yuran Penghantaran</Text>
            <Text style={styles.revenueValue}>
              RM{revenueBreakdown.deliveryFees.toFixed(2)}
            </Text>
          </View>
          <View style={styles.revenueRow}>
            <Text style={styles.revenueLabel}>Cukai</Text>
            <Text style={styles.revenueValue}>
              RM{revenueBreakdown.taxes.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.revenueRow, styles.revenueTotal]}>
            <Text style={styles.revenueTotalLabel}>Jumlah Pendapatan</Text>
            <Text style={styles.revenueTotalValue}>
              RM{salesStats.allTime.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Menu & Food Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistik Menu & Makanan</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="restaurant" size={24} color="#007AFF" />
            <Text style={styles.statValue}>{menus.length}</Text>
            <Text style={styles.statLabel}>Jumlah Menu</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            <Text style={styles.statValue}>{activeMenus}</Text>
            <Text style={styles.statLabel}>Menu Aktif</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="fast-food" size={24} color="#FF9500" />
            <Text style={styles.statValue}>{foods.length}</Text>
            <Text style={styles.statLabel}>Jumlah Makanan</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            <Text style={styles.statValue}>{activeFoods}</Text>
            <Text style={styles.statLabel}>Makanan Tersedia</Text>
          </View>
        </View>
      </View>

      {/* Top Selling Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Makanan Terlaris</Text>
        {topSellingItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Tiada data jualan</Text>
          </View>
        ) : (
          <View style={styles.topItemsCard}>
            {topSellingItems.map((item, index) => (
              <View key={index} style={styles.topItemRow}>
                <View style={styles.topItemRank}>
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                </View>
                <View style={styles.topItemInfo}>
                  <Text style={styles.topItemName}>{item.foodName}</Text>
                  <Text style={styles.topItemDetails}>
                    {item.quantity} unit • RM{item.revenue.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Dikemaskini: {new Date().toLocaleString('ms-MY')}
        </Text>
      </View>
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
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  revenueCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  revenueTotal: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#007AFF',
  },
  revenueLabel: {
    fontSize: 16,
    color: '#666',
  },
  revenueValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  revenueTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  revenueTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  paymentCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  paymentLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  paymentValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  topItemsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  topItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  topItemRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  topItemInfo: {
    flex: 1,
  },
  topItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  topItemDetails: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

