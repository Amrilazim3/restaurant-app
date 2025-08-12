import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { orderService } from '@/services/orderService';
import { Order } from '@/types/order';

const { width } = Dimensions.get('window');

export default function QRPaymentScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

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
        router.back();
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      Alert.alert('Ralat', 'Gagal memuatkan maklumat pesanan.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentConfirmation = () => {
    Alert.alert(
      'Pengesahan Pembayaran',
      'Adakah anda telah selesai membuat pembayaran melalui QR code?',
      [
        {
          text: 'Belum',
          style: 'cancel',
        },
        {
          text: 'Ya, Sudah',
          onPress: confirmPayment,
        },
      ]
    );
  };

  const confirmPayment = async () => {
    if (!orderId) return;
    
    setConfirming(true);
    try {
      await orderService.confirmPayment(orderId);
      
      // Navigate to order confirmation
      router.replace({
        pathname: '/order-confirmation',
        params: { orderId }
      });
    } catch (error) {
      console.error('Error confirming payment:', error);
      Alert.alert(
        'Ralat Pengesahan',
        'Terdapat masalah semasa mengesahkan pembayaran. Sila cuba lagi.'
      );
    } finally {
      setConfirming(false);
    }
  };

  const handleCancelPayment = () => {
    Alert.alert(
      'Batalkan Pembayaran',
      'Adakah anda pasti mahu batalkan pembayaran ini? Pesanan anda akan dibatalkan.',
      [
        {
          text: 'Tidak',
          style: 'cancel',
        },
        {
          text: 'Ya, Batalkan',
          style: 'destructive',
          onPress: () => {
            if (orderId) {
              orderService.cancelOrder(orderId);
            }
            router.replace('/(tabs)/cart');
          },
        },
      ]
    );
  };

  const generateQRCodeURL = (orderId: string, amount: number): string => {
    // This is a placeholder QR code generation
    // In a real app, you would integrate with a payment gateway
    // that provides QR codes for the specific amount and merchant
    const paymentData = `Amount:${amount.toFixed(2)}|OrderID:${orderId}|Merchant:BlockTwenty9`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentData)}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Memuatkan maklumat pembayaran...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Pesanan tidak dijumpai</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Pembayaran QR Code</Text>
        <Text style={styles.subtitle}>Imbas kod QR untuk membuat pembayaran</Text>
      </View>

      {/* Payment Info */}
      <View style={styles.paymentInfo}>
        <Text style={styles.orderIdText}>Pesanan: #{order.id?.slice(-8).toUpperCase()}</Text>
        <Text style={styles.amountText}>RM{order.grandTotal.toFixed(2)}</Text>
      </View>

      {/* QR Code */}
      <View style={styles.qrContainer}>
        <Image
          source={{ uri: generateQRCodeURL(order.id || '', order.grandTotal) }}
          style={styles.qrCode}
          resizeMode="contain"
        />
        <Text style={styles.qrInstruction}>
          Imbas kod QR ini menggunakan aplikasi banking anda
        </Text>
      </View>

      {/* Payment Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Cara Pembayaran:</Text>
        <Text style={styles.instruction}>1. Buka aplikasi banking anda</Text>
        <Text style={styles.instruction}>2. Pilih fungsi "Scan QR" atau "Pay QR"</Text>
        <Text style={styles.instruction}>3. Imbas kod QR di atas</Text>
        <Text style={styles.instruction}>4. Sahkan jumlah pembayaran</Text>
        <Text style={styles.instruction}>5. Selesaikan pembayaran</Text>
        <Text style={styles.instruction}>6. Tekan butang "Sahkan Pembayaran" di bawah</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.confirmButton, confirming && styles.disabledButton]}
          onPress={handlePaymentConfirmation}
          disabled={confirming}
        >
          {confirming ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmButtonText}>Sahkan Pembayaran</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancelPayment}
          disabled={confirming}
        >
          <Text style={styles.cancelButtonText}>Batalkan Pembayaran</Text>
        </TouchableOpacity>
      </View>

      {/* Security Notice */}
      <View style={styles.securityNotice}>
        <Text style={styles.securityText}>
          🔒 Pembayaran ini selamat dan disulitkan
        </Text>
        <Text style={styles.securitySubtext}>
          Jangan kongsikan kod QR ini dengan orang lain
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
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  paymentInfo: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 20,
    alignItems: 'center',
  },
  orderIdText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  amountText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  qrContainer: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 30,
    alignItems: 'center',
  },
  qrCode: {
    width: width * 0.6,
    height: width * 0.6,
    marginBottom: 20,
  },
  qrInstruction: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  instructionsContainer: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  instruction: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    lineHeight: 22,
  },
  actionContainer: {
    padding: 20,
    marginTop: 12,
  },
  confirmButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  cancelButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: '600',
  },
  securityNotice: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  securityText: {
    fontSize: 16,
    color: '#28a745',
    fontWeight: '600',
    marginBottom: 4,
  },
  securitySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
}); 