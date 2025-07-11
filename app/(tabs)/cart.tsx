import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useCart, CartItem } from '@/contexts/CartContext';

export default function CartScreen() {
  const { 
    cartItems, 
    cartCount, 
    cartTotal, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    loading 
  } = useCart();

  const handleQuantityChange = (item: CartItem, change: number) => {
    const newQuantity = item.quantity + change;
    if (newQuantity <= 0) {
      handleRemoveItem(item);
    } else {
      updateQuantity(item.id, newQuantity);
    }
  };

  const handleRemoveItem = (item: CartItem) => {
    Alert.alert(
      'Buang Item',
      `Buang ${item.food.name} dari troli?`,
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Buang',
          style: 'destructive',
          onPress: () => removeFromCart(item.id),
        },
      ]
    );
  };

  const handleClearCart = () => {
    Alert.alert(
      'Kosongkan Troli',
      'Adakah anda pasti mahu membuang semua item dari troli anda?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Kosongkan Semua',
          style: 'destructive',
          onPress: clearCart,
        },
      ]
    );
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Troli Kosong', 'Tambah beberapa item ke troli anda terlebih dahulu!');
      return;
    }
    
    // Navigate to checkout screen
    router.push('/checkout');
  };

  const renderCartItem = (item: CartItem) => (
    <View key={item.id} style={styles.cartItem}>
      <View style={styles.itemImageContainer}>
        {item.food.image ? (
          <Image source={{ uri: item.food.image }} style={styles.itemImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>Tiada Gambar</Text>
          </View>
        )}
      </View>

      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.food.name}</Text>
        <Text style={styles.itemPrice}>RM{item.food.price.toFixed(2)} setiap</Text>
        
        {item.specialInstructions && (
          <Text style={styles.specialInstructions}>
            Nota: {item.specialInstructions}
          </Text>
        )}

        <View style={styles.itemFooter}>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(item, -1)}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(item, 1)}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveItem(item)}
          >
            <Text style={styles.removeButtonText}>Buang</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.itemTotal}>
        <Text style={styles.itemTotalText}>
          RM{(item.food.price * item.quantity).toFixed(2)}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Memuatkan troli...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Troli Anda</Text>
        <Text style={styles.subtitle}>
          {cartCount} {cartCount === 1 ? 'item' : 'item'}
        </Text>
        {cartItems.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClearCart}>
            <Text style={styles.clearButtonText}>Kosongkan Semua</Text>
          </TouchableOpacity>
        )}
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Troli anda kosong</Text>
          <Text style={styles.emptySubtitle}>
            Tambah beberapa item lazat dari menu kami!
          </Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => router.push('/(tabs)/menu')}
          >
            <Text style={styles.browseButtonText}>Lihat Menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Cart Items */}
          <ScrollView style={styles.cartItemsContainer}>
            {cartItems.map(renderCartItem)}
          </ScrollView>

          {/* Cart Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Jumlah</Text>
              <Text style={styles.summaryValue}>RM{cartTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Bayaran Penghantaran</Text>
              <Text style={styles.summaryValue}>RM2.99</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Cukai</Text>
              <Text style={styles.summaryValue}>RM{(cartTotal * 0.08).toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Jumlah</Text>
              <Text style={styles.totalValue}>
                RM{(cartTotal + 2.99 + cartTotal * 0.08).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Checkout Button */}
          <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
            <Text style={styles.checkoutButtonText}>
              Terus ke Checkout
            </Text>
          </TouchableOpacity>
        </>
      )}
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
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    position: 'relative',
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
  clearButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    padding: 8,
  },
  clearButtonText: {
    color: '#dc3545',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  browseButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cartItemsContainer: {
    flex: 1,
    paddingVertical: 16,
  },
  cartItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImageContainer: {
    width: 80,
    height: 80,
    marginRight: 16,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  placeholderText: {
    fontSize: 10,
    color: '#666',
  },
  itemInfo: {
    flex: 1,
    marginRight: 16,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  specialInstructions: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    backgroundColor: '#007AFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    padding: 4,
  },
  removeButtonText: {
    color: '#dc3545',
    fontSize: 12,
    fontWeight: '600',
  },
  itemTotal: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTotalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  checkoutButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 