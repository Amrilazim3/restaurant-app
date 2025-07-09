import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { menuService, Menu, Food } from '@/services/menuService';
import { useCart } from '@/contexts/CartContext';

export default function MenuScreen() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const { addToCart, getCartItem } = useCart();

  useEffect(() => {
    loadMenus();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      performSearch();
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchTerm]);

  const loadMenus = async () => {
    try {
      const menusData = await menuService.getActiveMenus();
      setMenus(menusData);
      
      // Select first menu by default
      if (menusData.length > 0) {
        setSelectedMenu(menusData[0]);
        loadFoods(menusData[0].id);
      }
    } catch (error) {
      console.error('Error loading menus:', error);
      Alert.alert('Error', 'Failed to load menus');
    } finally {
      setLoading(false);
    }
  };

  const loadFoods = async (menuId: string) => {
    try {
      const foodsData = await menuService.getAvailableFoodsByMenuId(menuId);
      setFoods(foodsData);
    } catch (error) {
      console.error('Error loading foods:', error);
      Alert.alert('Error', 'Failed to load foods');
    }
  };

  const performSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await menuService.searchFoods(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching foods:', error);
      Alert.alert('Error', 'Failed to search foods');
    } finally {
      setIsSearching(false);
    }
  };

  const handleMenuSelect = (menu: Menu) => {
    setSelectedMenu(menu);
    loadFoods(menu.id);
    setSearchTerm(''); // Clear search when selecting menu
  };

  const handleFoodPress = (food: Food) => {
    router.push({
      pathname: '/foodDetail',
      params: { foodId: food.id }
    });
  };

  const handleAddToCart = (food: Food) => {
    addToCart(food, 1);
    Alert.alert(
      'Added to Cart!',
      `${food.name} has been added to your cart.`,
      [
        {
          text: 'Continue Shopping',
          style: 'cancel',
        },
        {
          text: 'View Cart',
          onPress: () => router.push('/(tabs)/cart'),
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMenus();
    setRefreshing(false);
  };

  const renderFoodItem = (food: Food) => {
    const cartItem = getCartItem(food.id);
    
    return (
      <TouchableOpacity
        key={food.id}
        style={styles.foodItem}
        onPress={() => handleFoodPress(food)}
      >
        <View style={styles.foodImageContainer}>
          {food.image ? (
            <Image source={{ uri: food.image }} style={styles.foodImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
        </View>
        <View style={styles.foodInfo}>
          <Text style={styles.foodName}>{food.name}</Text>
          <Text style={styles.foodDescription} numberOfLines={2}>
            {food.description}
          </Text>
          <View style={styles.foodFooter}>
            <Text style={styles.foodPrice}>${food.price.toFixed(2)}</Text>
            <TouchableOpacity 
              style={[
                styles.addButton,
                cartItem && styles.addButtonInCart
              ]}
              onPress={() => handleAddToCart(food)}
            >
              <Text style={[
                styles.addButtonText,
                cartItem && styles.addButtonTextInCart
              ]}>
                {cartItem ? `In Cart (${cartItem.quantity})` : 'Add to Cart'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Our Menu</Text>
        <Text style={styles.subtitle}>Delicious food awaits you</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for food..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Search Results */}
      {searchTerm.trim() && (
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>
            Search Results {isSearching && <ActivityIndicator size="small" />}
          </Text>
          {searchResults.length > 0 ? (
            <View style={styles.foodGrid}>
              {searchResults.map(renderFoodItem)}
            </View>
          ) : !isSearching && (
            <Text style={styles.noResultsText}>No food items found</Text>
          )}
        </View>
      )}

      {/* Menu Categories */}
      {!searchTerm.trim() && (
        <>
          <View style={styles.menuContainer}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.menuScroll}
            >
              {menus.map((menu) => (
                <TouchableOpacity
                  key={menu.id}
                  style={[
                    styles.menuItem,
                    selectedMenu?.id === menu.id && styles.selectedMenuItem
                  ]}
                  onPress={() => handleMenuSelect(menu)}
                >
                  <Text style={[
                    styles.menuText,
                    selectedMenu?.id === menu.id && styles.selectedMenuText
                  ]}>
                    {menu.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Food Items */}
          {selectedMenu && (
            <View style={styles.foodSection}>
              <Text style={styles.sectionTitle}>
                {selectedMenu.name} ({foods.length} items)
              </Text>
              <View style={styles.foodGrid}>
                {foods.map(renderFoodItem)}
              </View>
            </View>
          )}
        </>
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
  header: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
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
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuScroll: {
    marginTop: 12,
  },
  menuItem: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedMenuItem: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  selectedMenuText: {
    color: '#fff',
  },
  foodSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  foodGrid: {
    gap: 16,
  },
  foodItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  foodImageContainer: {
    width: 80,
    height: 80,
    marginRight: 16,
  },
  foodImage: {
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
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  foodDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  foodFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonInCart: {
    backgroundColor: '#28a745',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addButtonTextInCart: {
    color: '#fff',
  },
  noResultsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
}); 