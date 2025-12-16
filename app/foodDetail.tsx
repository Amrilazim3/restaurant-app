import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { menuService } from '@/services/menuService';
import { Food } from '@/types/menu';
import { useCart } from '@/contexts/CartContext';

export default function FoodDetailScreen() {
  const { foodId } = useLocalSearchParams<{ foodId: string }>();
  const [food, setFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const { addToCart, getCartItem } = useCart();

  useEffect(() => {
    if (foodId) {
      loadFoodDetails();
    }
  }, [foodId]);

  const loadFoodDetails = async () => {
    try {
      const foodData = await menuService.getFoodById(foodId);
      setFood(foodData);
    } catch (error) {
      console.error('Error loading food details:', error);
      Alert.alert('Ralat', 'Gagal memuatkan butiran makanan');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!food) return;
    
    addToCart(food, quantity, specialInstructions.trim() || undefined);
    
    Alert.alert(
      'Ditambah ke Troli!',
      `${quantity} x ${food.name} telah ditambah ke troli anda.`,
      [
        {
          text: 'Terus Membeli',
          onPress: () => router.back(),
        },
        {
          text: 'Lihat Troli',
          onPress: () => router.push('/(tabs)/cart'),
        },
      ]
    );
  };

  const adjustQuantity = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Memuatkan butiran makanan...</Text>
      </View>
    );
  }

  if (!food) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Makanan tidak dijumpai</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cartItem = getCartItem(food.id);

  return (
    <ScrollView style={styles.container}>
      {/* Food Image */}
      <View style={styles.imageContainer}>
        {food.image ? (
          <Image source={{ uri: food.image }} style={styles.foodImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>Tiada Gambar Tersedia</Text>
          </View>
        )}
      </View>

      {/* Food Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.foodName}>{food.name}</Text>
        <Text style={styles.foodPrice}>RM{food.price.toFixed(2)}</Text>
        <Text style={styles.foodDescription}>{food.description}</Text>

        {/* Cart Status */}
        {cartItem && (
          <View style={styles.cartStatus}>
            <Text style={styles.cartStatusText}>
              {cartItem.quantity} dalam troli
            </Text>
          </View>
        )}

        {/* Ingredients */}
        {food.ingredients && food.ingredients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bahan-bahan</Text>
            <View style={styles.tagContainer}>
              {food.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{ingredient}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Allergens */}
        {food.allergens && food.allergens.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alergen</Text>
            <View style={styles.tagContainer}>
              {food.allergens.map((allergen, index) => (
                <View key={index} style={[styles.tag, styles.allergenTag]}>
                  <Text style={[styles.tagText, styles.allergenText]}>{allergen}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ketersediaan</Text>
          <Text style={[
            styles.availabilityText,
            food.isAvailable ? styles.availableText : styles.unavailableText
          ]}>
            {food.isAvailable ? 'Tersedia' : 'Tidak Tersedia Buat Masa Ini'}
          </Text>
        </View>
      </View>

      {/* Special Instructions */}
      {food.isAvailable && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.sectionTitle}>Arahan Khas</Text>
          <TextInput
            style={styles.instructionsInput}
            placeholder="Apa-apa permintaan khas? (pilihan)"
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      )}

      {/* Quantity and Add to Cart */}
      {food.isAvailable && (
        <View style={styles.cartSection}>
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Kuantiti</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => adjustQuantity(-1)}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => adjustQuantity(1)}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
            <Text style={styles.addToCartText}>
              Tambah ke Troli - RM{(food.price * quantity).toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    height: 250,
    backgroundColor: '#fff',
  },
  foodImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f9fa',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  foodName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  foodPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 16,
  },
  foodDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  cartStatus: {
    backgroundColor: '#d4edda',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  cartStatusText: {
    fontSize: 14,
    color: '#155724',
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tagText: {
    fontSize: 14,
    color: '#666',
  },
  allergenTag: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
  },
  allergenText: {
    color: '#856404',
  },
  availabilityText: {
    fontSize: 16,
    fontWeight: '600',
  },
  availableText: {
    color: '#28a745',
  },
  unavailableText: {
    color: '#dc3545',
  },
  instructionsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  instructionsInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 80,
    textAlignVertical: 'top',
  },
  cartSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 20,
  },
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    backgroundColor: '#007AFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  addToCartButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addToCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 