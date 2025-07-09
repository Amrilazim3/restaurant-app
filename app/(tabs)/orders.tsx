import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';

export default function OrdersScreen() {
  // TODO: Implement orders state management
  const orders = [
    {
      id: 1,
      date: '2024-01-15',
      status: 'Dihantar',
      total: 25.98,
      items: ['Burger Signature', 'Kentang Truffle'],
    },
    {
      id: 2,
      date: '2024-01-10',
      status: 'Dihantar',
      total: 18.99,
      items: ['Salmon Panggang'],
    },
    {
      id: 3,
      date: '2024-01-08',
      status: 'Dibatalkan',
      total: 12.99,
      items: ['Salad Caesar'],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Dihantar':
        return '#28a745';
      case 'Dalam Proses':
        return '#ffc107';
      case 'Dibatalkan':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pesanan</Text>
        <Text style={styles.subtitle}>Sejarah pesanan anda</Text>
      </View>

      <View style={styles.ordersSection}>
        {orders.length === 0 ? (
          <View style={styles.emptyOrders}>
            <Text style={styles.emptyOrdersText}>Tiada pesanan lagi</Text>
            <Text style={styles.emptyOrdersSubtext}>Buat pesanan pertama anda dari menu kami!</Text>
          </View>
        ) : (
          orders.map((order) => (
            <TouchableOpacity key={order.id} style={styles.orderItem}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderDate}>{order.date}</Text>
                <Text style={[styles.orderStatus, { color: getStatusColor(order.status) }]}>
                  {order.status}
                </Text>
              </View>
              <View style={styles.orderDetails}>
                <Text style={styles.orderItems}>
                  {order.items.join(', ')}
                </Text>
                <Text style={styles.orderTotal}>Jumlah: RM{order.total.toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  },
  emptyOrdersSubtext: {
    fontSize: 14,
    color: '#999',
  },
  orderItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
}); 