import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { orderService } from '@/services/orderService';
import { authService } from '@/services/authService';
import { 
  CreateOrderRequest, 
  DeliveryAddress, 
  PaymentMethod, 
  GuestUserInfo 
} from '@/types/order';

export default function CheckoutScreen() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Malaysia',
    specialInstructions: ''
  });
  
  const [contactNumber, setContactNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [orderNotes, setOrderNotes] = useState('');
  
  // Guest user info (for non-authenticated users)
  const [guestInfo, setGuestInfo] = useState<GuestUserInfo>({
    fullName: '',
    email: '',
    phoneNumber: ''
  });

  // Pre-fill user information if logged in
  useEffect(() => {
    if (userProfile) {
      if (userProfile.phoneNumber) {
        setContactNumber(userProfile.phoneNumber);
      }
      
      // Pre-fill address from profile if available
      if (userProfile.address) {
        setDeliveryAddress({
          street: userProfile.address.street || '',
          city: userProfile.address.city || '',
          state: userProfile.address.state || '',
          postalCode: userProfile.address.postalCode || '',
          country: userProfile.address.country || 'Malaysia',
          specialInstructions: ''
        });
      }
    }
  }, [userProfile]);

  const orderSummary = orderService.calculateOrderSummary(
    orderService.convertCartItemsToOrderItems(cartItems)
  );

  const validateForm = (): boolean => {
    // Check cart
    if (cartItems.length === 0) {
      Alert.alert('Troli Kosong', 'Tambah item ke troli terlebih dahulu!');
      return false;
    }

    // Check guest info if not logged in
    if (!user) {
      if (!guestInfo.fullName.trim()) {
        Alert.alert('Maklumat Tidak Lengkap', 'Sila masukkan nama penuh anda.');
        return false;
      }
      if (!guestInfo.email.trim() || !guestInfo.email.includes('@')) {
        Alert.alert('Maklumat Tidak Lengkap', 'Sila masukkan alamat email yang sah.');
        return false;
      }
      if (!guestInfo.phoneNumber.trim()) {
        Alert.alert('Maklumat Tidak Lengkap', 'Sila masukkan nombor telefon anda.');
        return false;
      }
    }

    // Check delivery address
    if (!deliveryAddress.street.trim()) {
      Alert.alert('Alamat Tidak Lengkap', 'Sila masukkan alamat jalan.');
      return false;
    }
    if (!deliveryAddress.city.trim()) {
      Alert.alert('Alamat Tidak Lengkap', 'Sila masukkan bandar.');
      return false;
    }
    if (!deliveryAddress.state.trim()) {
      Alert.alert('Alamat Tidak Lengkap', 'Sila masukkan negeri.');
      return false;
    }
    if (!deliveryAddress.postalCode.trim()) {
      Alert.alert('Alamat Tidak Lengkap', 'Sila masukkan poskod.');
      return false;
    }
    
    // Check contact number
    if (!contactNumber.trim()) {
      Alert.alert('Maklumat Hubungan', 'Sila masukkan nombor telefon untuk penghantaran.');
      return false;
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      let userId = user?.uid;
      
      // If user is not authenticated, create a user account first
      if (!user && guestInfo.email && guestInfo.fullName) {
        try {
          // Use standard password for guest users
          const standardPassword = 'password';
          
          const userProfile = await authService.register(
            guestInfo.email,
            standardPassword,
            guestInfo.fullName,
            'user'
          );
          
          userId = userProfile.uid;
        } catch (authError: any) {
          console.error('Error creating user account:', authError);
          
          // Check if error is due to existing email
          if (authError?.code === 'auth/email-already-in-use') {
            setLoading(false);
            Alert.alert(
              'Email Sudah Wujud',
              `Email "${guestInfo.email}" sudah mempunyai akaun dalam sistem kami. Sila pilih tindakan:`,
              [
                {
                  text: 'Guna Email Lain',
                  style: 'default',
                },
                {
                  text: 'Log Masuk',
                  style: 'default',
                  onPress: () => {
                    router.push('/(auth)/login');
                  }
                }
              ]
            );
            return; // Stop the order creation process
          } else {
            // For other authentication errors, show error and stop
            setLoading(false);
            Alert.alert(
              'Ralat Pendaftaran',
              'Terdapat masalah semasa membuat akaun. Sila cuba lagi.'
            );
            return;
          }
        }
      }

      const orderRequest: CreateOrderRequest = {
        items: orderService.convertCartItemsToOrderItems(cartItems),
        deliveryAddress,
        contactNumber,
        paymentMethod,
        guestInfo: !user ? guestInfo : undefined,
        notes: orderNotes
      };

      const orderId = await orderService.createOrder(orderRequest, userId);

      // Clear cart after successful order
      clearCart();
      
      // Navigate to appropriate screen based on payment method
      if (paymentMethod === 'qr_code') {
        router.push({
          pathname: '/qr-payment',
          params: { orderId }
        });
      } else {
        router.push({
          pathname: '/order-confirmation',
          params: { orderId }
        });
      }
      
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert(
        'Ralat Pesanan',
        'Terdapat masalah semasa membuat pesanan. Sila cuba lagi.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderGuestForm = () => {
    if (user) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Maklumat Pelanggan</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nama Penuh *</Text>
          <TextInput
            style={styles.input}
            value={guestInfo.fullName}
            onChangeText={(text) => setGuestInfo({...guestInfo, fullName: text})}
            placeholder="Masukkan nama penuh anda"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Alamat Email *</Text>
          <TextInput
            style={styles.input}
            value={guestInfo.email}
            onChangeText={(text) => setGuestInfo({...guestInfo, email: text})}
            placeholder="contoh@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombor Telefon *</Text>
          <TextInput
            style={styles.input}
            value={guestInfo.phoneNumber}
            onChangeText={(text) => setGuestInfo({...guestInfo, phoneNumber: text})}
            placeholder="01X-XXXXXXX"
            keyboardType="phone-pad"
          />
        </View>
      </View>
    );
  };

  const renderDeliveryForm = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Alamat Penghantaran</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Alamat Jalan *</Text>
        <TextInput
          style={styles.input}
          value={deliveryAddress.street}
          onChangeText={(text) => setDeliveryAddress({...deliveryAddress, street: text})}
          placeholder="No. rumah, nama jalan"
          multiline
        />
      </View>

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Bandar *</Text>
          <TextInput
            style={styles.input}
            value={deliveryAddress.city}
            onChangeText={(text) => setDeliveryAddress({...deliveryAddress, city: text})}
            placeholder="Bandar"
          />
        </View>
        
        <View style={styles.halfInput}>
          <Text style={styles.label}>Negeri *</Text>
          <TextInput
            style={styles.input}
            value={deliveryAddress.state}
            onChangeText={(text) => setDeliveryAddress({...deliveryAddress, state: text})}
            placeholder="Negeri"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Poskod *</Text>
          <TextInput
            style={styles.input}
            value={deliveryAddress.postalCode}
            onChangeText={(text) => setDeliveryAddress({...deliveryAddress, postalCode: text})}
            placeholder="12345"
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.halfInput}>
          <Text style={styles.label}>Negara</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={deliveryAddress.country}
            editable={false}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Arahan Khas untuk Penghantaran</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={deliveryAddress.specialInstructions}
          onChangeText={(text) => setDeliveryAddress({...deliveryAddress, specialInstructions: text})}
          placeholder="Cth: Tinggalkan di pagar hadapan, panggil bila sampai"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nombor Telefon untuk Penghantaran *</Text>
        <TextInput
          style={styles.input}
          value={contactNumber}
          onChangeText={setContactNumber}
          placeholder="01X-XXXXXXX"
          keyboardType="phone-pad"
        />
      </View>
    </View>
  );

  const renderPaymentMethods = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Kaedah Pembayaran</Text>
      
      <TouchableOpacity
        style={[
          styles.paymentOption,
          paymentMethod === 'cash_on_delivery' && styles.selectedPayment
        ]}
        onPress={() => setPaymentMethod('cash_on_delivery')}
      >
        <View style={styles.paymentContent}>
          <Text style={styles.paymentTitle}>Tunai Semasa Penghantaran</Text>
          <Text style={styles.paymentDescription}>
            Bayar secara tunai kepada rider semasa menerima pesanan
          </Text>
        </View>
        <View style={[
          styles.radioButton,
          paymentMethod === 'cash_on_delivery' && styles.radioSelected
        ]} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.paymentOption,
          paymentMethod === 'qr_code' && styles.selectedPayment
        ]}
        onPress={() => setPaymentMethod('qr_code')}
      >
        <View style={styles.paymentContent}>
          <Text style={styles.paymentTitle}>Bayar dengan QR Code</Text>
          <Text style={styles.paymentDescription}>
            Bayar menggunakan kod QR melalui aplikasi banking
          </Text>
        </View>
        <View style={[
          styles.radioButton,
          paymentMethod === 'qr_code' && styles.radioSelected
        ]} />
      </TouchableOpacity>
    </View>
  );

  const renderOrderSummary = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Ringkasan Pesanan</Text>
      
      {cartItems.map((item) => (
        <View key={item.id} style={styles.orderItem}>
          <Text style={styles.orderItemName}>
            {item.quantity}x {item.food.name}
          </Text>
          <Text style={styles.orderItemPrice}>
            RM{(item.food.price * item.quantity).toFixed(2)}
          </Text>
        </View>
      ))}

      <View style={styles.divider} />
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Subtotal</Text>
        <Text style={styles.summaryValue}>RM{orderSummary.subtotal.toFixed(2)}</Text>
      </View>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Bayaran Penghantaran</Text>
        <Text style={styles.summaryValue}>RM{orderSummary.deliveryFee.toFixed(2)}</Text>
      </View>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Cukai (8%)</Text>
        <Text style={styles.summaryValue}>RM{orderSummary.tax.toFixed(2)}</Text>
      </View>
      
      <View style={[styles.summaryRow, styles.totalRow]}>
        <Text style={styles.totalLabel}>Jumlah</Text>
        <Text style={styles.totalValue}>RM{orderSummary.total.toFixed(2)}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Checkout</Text>
          <Text style={styles.subtitle}>Lengkapkan pesanan anda</Text>
        </View>

        {renderGuestForm()}
        {renderDeliveryForm()}
        {renderPaymentMethods()}
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nota untuk Restoran (Pilihan)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={orderNotes}
            onChangeText={setOrderNotes}
            placeholder="Cth: Makanan tidak pedas, tambahan sos"
            multiline
            numberOfLines={3}
          />
        </View>

        {renderOrderSummary()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderButton, loading && styles.disabledButton]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.placeOrderButtonText}>
              Buat Pesanan - RM{orderSummary.total.toFixed(2)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    marginTop: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.48,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedPayment: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  paymentContent: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  paymentDescription: {
    fontSize: 14,
    color: '#666',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  radioSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  orderItemName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  orderItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
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
    paddingVertical: 12,
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
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  placeOrderButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  placeOrderButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
}); 