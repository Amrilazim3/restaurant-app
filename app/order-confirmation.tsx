import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { orderService } from '@/services/orderService';
import { Order } from '@/types/order';

export default function OrderConfirmationScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      if (!orderId) return;
      
      const orderData = await orderService.getOrderById(orderId);
      if (orderData) {
        setOrder(orderData);
      } else {
        Alert.alert('Ralat', 'Pesanan tidak dijumpai.');
        router.replace('/(tabs)/menu');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      Alert.alert('Ralat', 'Gagal memuatkan maklumat pesanan.');
      router.replace('/(tabs)/menu');
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatusText = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'Menunggu Pengesahan';
      case 'confirmed':
        return 'Disahkan';
      case 'preparing':
        return 'Sedang Disediakan';
      case 'ready':
        return 'Sedia untuk Penghantaran';
      case 'delivered':
        return 'Telah Dihantar';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status;
    }
  };

  const getOrderStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return '#ffc107';
      case 'confirmed':
        return '#007AFF';
      case 'preparing':
        return '#fd7e14';
      case 'ready':
        return '#20c997';
      case 'delivered':
        return '#28a745';
      case 'cancelled':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getPaymentMethodText = (method: string): string => {
    switch (method) {
      case 'cash_on_delivery':
        return 'Tunai Semasa Penghantaran';
      case 'qr_code':
        return 'Pembayaran QR Code';
      default:
        return method;
    }
  };

  const handleBackToMenu = () => {
    router.replace('/(tabs)/menu');
  };

  const handleViewOrders = () => {
    router.replace('/(tabs)/orders');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Memuatkan maklumat pesanan...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Pesanan tidak dijumpai</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToMenu}>
          <Text style={styles.backButtonText}>Kembali ke Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Success Header */}
      <View style={styles.successHeader}>
        <View style={styles.successIcon}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
        <Text style={styles.successTitle}>Pesanan Berjaya!</Text>
        <Text style={styles.successSubtitle}>
          Terima kasih atas pesanan anda. Kami akan menyediakan makanan anda dengan segera.
        </Text>
      </View>

      {/* Order Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Maklumat Pesanan</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nombor Pesanan:</Text>
          <Text style={styles.infoValue}>#{order.id?.slice(-8).toUpperCase()}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status:</Text>
          <View style={[styles.statusBadge, { backgroundColor: getOrderStatusColor(order.orderStatus) }]}>
            <Text style={styles.statusText}>{getOrderStatusText(order.orderStatus)}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tarikh Pesanan:</Text>
          <Text style={styles.infoValue}>
            {order.createdAt.toLocaleDateString('ms-MY', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Kaedah Pembayaran:</Text>
          <Text style={styles.infoValue}>{getPaymentMethodText(order.paymentMethod)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status Pembayaran:</Text>
          <Text style={[
            styles.infoValue,
            { color: order.paymentConfirmed ? '#28a745' : '#ffc107' }
          ]}>
            {order.paymentConfirmed ? 'Telah Dibayar' : 'Belum Dibayar'}
          </Text>
        </View>
      </View>

      {/* Customer Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Maklumat Pelanggan</Text>
        
        {order.guestInfo ? (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nama:</Text>
              <Text style={styles.infoValue}>{order.guestInfo.fullName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{order.guestInfo.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Telefon:</Text>
              <Text style={styles.infoValue}>{order.guestInfo.phoneNumber}</Text>
            </View>
          </>
        ) : (
          <Text style={styles.infoValue}>Pengguna Berdaftar</Text>
        )}
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Telefon Penghantaran:</Text>
          <Text style={styles.infoValue}>{order.contactNumber}</Text>
        </View>
      </View>

      {/* Delivery Address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alamat Penghantaran</Text>
        <Text style={styles.addressText}>
          {order.deliveryAddress.street}
        </Text>
        <Text style={styles.addressText}>
          {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.postalCode}
        </Text>
        <Text style={styles.addressText}>
          {order.deliveryAddress.country}
        </Text>
        
        {order.deliveryAddress.specialInstructions && (
          <View style={styles.specialInstructions}>
            <Text style={styles.specialInstructionsLabel}>Arahan Khas:</Text>
            <Text style={styles.specialInstructionsText}>
              {order.deliveryAddress.specialInstructions}
            </Text>
          </View>
        )}
      </View>

      {/* Order Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Item Pesanan</Text>
        
        {order.items.map((item, index) => (
          <View key={index} style={styles.orderItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.quantity}x {item.foodName}</Text>
              {item.specialInstructions && (
                <Text style={styles.itemInstructions}>
                  Nota: {item.specialInstructions}
                </Text>
              )}
            </View>
            <Text style={styles.itemPrice}>
              RM{(item.price * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      {/* Order Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ringkasan Pembayaran</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>RM{order.totalAmount.toFixed(2)}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Bayaran Penghantaran</Text>
          <Text style={styles.summaryValue}>RM{order.deliveryFee.toFixed(2)}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Cukai</Text>
          <Text style={styles.summaryValue}>RM{order.tax.toFixed(2)}</Text>
        </View>
        
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Jumlah</Text>
          <Text style={styles.totalValue}>RM{order.grandTotal.toFixed(2)}</Text>
        </View>
      </View>

      {order.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nota untuk Restoran</Text>
          <Text style={styles.notesText}>{order.notes}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleViewOrders}>
          <Text style={styles.primaryButtonText}>Lihat Semua Pesanan</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={handleBackToMenu}>
          <Text style={styles.secondaryButtonText}>Teruskan Membeli</Text>
        </TouchableOpacity>
      </View>

      {/* Contact Info */}
      <View style={styles.contactInfo}>
        <Text style={styles.contactTitle}>Bantuan Diperlukan?</Text>
        <Text style={styles.contactText}>
          Hubungi kami di +60 12-345 6789 untuk sebarang pertanyaan mengenai pesanan anda.
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successHeader: {
    backgroundColor: '#fff',
    padding: 40,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkmark: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addressText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
    lineHeight: 22,
  },
  specialInstructions: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  specialInstructionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  specialInstructionsText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  itemInstructions: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  itemPrice: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
  },
  totalRow: {
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  notesText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  actionContainer: {
    padding: 20,
    marginTop: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  contactInfo: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 20,
    marginBottom: 20,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
}); 