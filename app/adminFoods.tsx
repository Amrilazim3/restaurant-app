import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Switch,
  ActionSheetIOS,
  Platform,
  Image,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import { menuService, Food, Menu } from '@/services/menuService';
import { imageService } from '@/services/imageService';

export default function AdminFoodsScreen() {
  const { menuId } = useLocalSearchParams<{ menuId?: string }>();
  
  const [foods, setFoods] = useState<Food[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [currentMenu, setCurrentMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [selectedMenuId, setSelectedMenuId] = useState<string>(menuId || '');
  const [selectedFoods, setSelectedFoods] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'updated'>('name');

  // Refetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    filterFoods();
  }, [foods, searchQuery, showInactive, showUnavailable, selectedMenuId, sortBy]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load menus
      const allMenus = await menuService.getAllMenus();
      setMenus(allMenus);
      
      // Set current menu if menuId is provided
      if (menuId) {
        const menu = allMenus.find(m => m.id === menuId);
        setCurrentMenu(menu || null);
      }
      
      // Load foods based on selected menu
      const foodsData = selectedMenuId 
        ? await menuService.getAllFoodsByMenuId(selectedMenuId)
        : await menuService.getAllFoods();
      
      setFoods(foodsData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterFoods = () => {
    let filtered = [...foods];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(food =>
        food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        food.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        food.ingredients.some(ingredient => 
          ingredient.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Filter by active status
    if (!showInactive) {
      filtered = filtered.filter(food => food.isActive === true);
    } else {
      filtered = filtered.filter(food => food.isActive === false);
    }

    // Filter by availability
    if (!showUnavailable) {
      filtered = filtered.filter(food => food.isAvailable === true);
    } else {
      filtered = filtered.filter(food => food.isAvailable === false);
    }

    // Sort foods
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return a.price - b.price;
        case 'updated':
          const dateA = a.updatedAt || a.createdAt;
          const dateB = b.updatedAt || b.createdAt;
          return dateB.getTime() - dateA.getTime();
        default:
          return 0;
      }
    });

    setFilteredFoods(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleMenuChange = (menuId: string) => {
    setSelectedMenuId(menuId);
    const menu = menus.find(m => m.id === menuId);
    setCurrentMenu(menu || null);
    loadFoodsByMenu(menuId);
  };

  const loadFoodsByMenu = async (menuId: string) => {
    try {
      const foodsData = menuId 
        ? await menuService.getAllFoodsByMenuId(menuId)
        : await menuService.getAllFoods();
      setFoods(foodsData);
    } catch (error) {
      console.error('Error loading foods by menu:', error);
      Alert.alert('Error', 'Failed to load foods. Please try again.');
    }
  };

  const handleCreateFood = () => {
    const targetMenuId = selectedMenuId || menuId;
    if (targetMenuId) {
      router.push(`/adminFoodForm?menuId=${targetMenuId}`);
    } else {
      router.push('/adminFoodForm');
    }
  };

  const handleEditFood = (food: Food) => {
    router.push(`/adminFoodForm?id=${food.id}`);
  };

  const handleDeleteFood = (food: Food) => {
    Alert.alert(
      'Delete Food',
      `Are you sure you want to delete "${food.name}"? This will hide the food from customers but preserve the data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await menuService.deleteFood(food.id);
              Alert.alert('Success', 'Food deleted successfully');
              loadData();
            } catch (error) {
              console.error('Error deleting food:', error);
              Alert.alert('Error', 'Failed to delete food. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleFoodPress = (food: Food) => {
    if (bulkMode) {
      toggleFoodSelection(food.id);
    } else {
      showFoodOptions(food);
    }
  };

  const showFoodOptions = (food: Food) => {
    const options = [
      'Edit Food',
      'Delete Food',
      'Cancel'
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: 3,
        },
        (buttonIndex) => {
          switch (buttonIndex) {
            case 0:
              handleEditFood(food);
              break;
            case 1:
              handleDeleteFood(food);
              break;
          }
        }
      );
    } else {
      Alert.alert('Food Options', 'Choose an action:', [
        { text: 'Edit Food', onPress: () => handleEditFood(food) },
        { text: 'Delete Food', style: 'destructive', onPress: () => handleDeleteFood(food) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const toggleFoodSelection = (foodId: string) => {
    setSelectedFoods(prev => 
      prev.includes(foodId) 
        ? prev.filter(id => id !== foodId)
        : [...prev, foodId]
    );
  };

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'available' | 'unavailable' | 'delete') => {
    if (selectedFoods.length === 0) {
      Alert.alert('No Selection', 'Please select foods to perform bulk actions.');
      return;
    }

    const actionText = action === 'activate' ? 'activate' : 
                     action === 'deactivate' ? 'deactivate' :
                     action === 'available' ? 'mark as available' :
                     action === 'unavailable' ? 'mark as unavailable' : 'delete';
    
    const selectedCount = selectedFoods.length;

    Alert.alert(
      `Bulk ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      `Are you sure you want to ${actionText} ${selectedCount} food(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: action === 'delete' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              if (action === 'delete') {
                await menuService.bulkUpdateFoodStatus(selectedFoods, false);
              } else if (action === 'activate' || action === 'deactivate') {
                await menuService.bulkUpdateFoodStatus(selectedFoods, action === 'activate');
              } else {
                await menuService.bulkUpdateFoodAvailability(selectedFoods, action === 'available');
              }
              
              Alert.alert('Success', `${selectedCount} food(s) ${actionText}d successfully`);
              setSelectedFoods([]);
              setBulkMode(false);
              loadData();
            } catch (error) {
              console.error(`Error performing bulk ${action}:`, error);
              Alert.alert('Error', `Failed to ${actionText} foods. Please try again.`);
            }
          },
        },
      ]
    );
  };

  const FoodCard = ({ food }: { food: Food }) => {
    const menu = menus.find(m => m.id === food.menuId);
    
    return (
      <TouchableOpacity
        style={[
          styles.foodCard,
          (!food.isActive || !food.isAvailable) && styles.inactiveCard,
          bulkMode && selectedFoods.includes(food.id) && styles.selectedCard
        ]}
        onPress={() => handleFoodPress(food)}
        onLongPress={() => {
          if (!bulkMode) {
            setBulkMode(true);
            setSelectedFoods([food.id]);
          }
        }}
      >
        <View style={styles.foodHeader}>
          <View style={styles.foodImageContainer}>
            <Image 
              source={{ uri: food.image || imageService.getDefaultImageUrls().food }}
              style={styles.foodImage}
            />
          </View>
          
          <View style={styles.foodInfo}>
            <Text style={styles.foodName}>{food.name}</Text>
            <Text style={styles.foodPrice}>RM{food.price.toFixed(2)}</Text>
            <Text style={styles.foodDescription} numberOfLines={2}>
              {food.description}
            </Text>
            {!selectedMenuId && menu && (
              <Text style={styles.menuName}>Menu: {menu.name}</Text>
            )}
          </View>
          
          {bulkMode && (
            <View style={styles.checkbox}>
              <Ionicons
                name={selectedFoods.includes(food.id) ? 'checkbox' : 'checkbox-outline'}
                size={24}
                color={selectedFoods.includes(food.id) ? '#007AFF' : '#666'}
              />
            </View>
          )}
        </View>

        <View style={styles.foodFooter}>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusIndicator, 
              { backgroundColor: food.isActive ? '#28a745' : '#dc3545' }
            ]} />
            <Text style={styles.statusText}>
              {food.isActive ? 'Active' : 'Inactive'}
            </Text>
            
            <View style={[
              styles.statusIndicator, 
              { backgroundColor: food.isAvailable ? '#007AFF' : '#ffc107', marginLeft: 12 }
            ]} />
            <Text style={styles.statusText}>
              {food.isAvailable ? 'Available' : 'Unavailable'}
            </Text>
          </View>
          
          <Text style={styles.updatedText}>
            Updated: {food.updatedAt ? food.updatedAt.toLocaleDateString() : food.createdAt.toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading foods...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {currentMenu ? `${currentMenu.name} Foods` : 'Food Management'}
        </Text>
        <TouchableOpacity onPress={handleCreateFood} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search foods..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        {/* Menu Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.menuFilter}>
          <TouchableOpacity
            style={[styles.menuFilterItem, !selectedMenuId && styles.menuFilterItemActive]}
            onPress={() => handleMenuChange('')}
          >
            <Text style={[styles.menuFilterText, !selectedMenuId && styles.menuFilterTextActive]}>
              All Foods
            </Text>
          </TouchableOpacity>
          {menus.map(menu => (
            <TouchableOpacity
              key={menu.id}
              style={[styles.menuFilterItem, selectedMenuId === menu.id && styles.menuFilterItemActive]}
              onPress={() => handleMenuChange(menu.id)}
            >
              <Text style={[styles.menuFilterText, selectedMenuId === menu.id && styles.menuFilterTextActive]}>
                {menu.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <View style={styles.filterContainer}>
          <View style={styles.filterRow}>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Inactive</Text>
              <Switch
                value={showInactive}
                onValueChange={setShowInactive}
                trackColor={{ false: '#767577', true: '#007AFF' }}
              />
            </View>
            
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Unavailable</Text>
              <Switch
                value={showUnavailable}
                onValueChange={setShowUnavailable}
                trackColor={{ false: '#767577', true: '#007AFF' }}
              />
            </View>
          </View>
          
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => {
                const nextSort = sortBy === 'name' ? 'price' : sortBy === 'price' ? 'updated' : 'name';
                setSortBy(nextSort);
              }}
            >
              <Text style={styles.sortButtonText}>
                Sort: {sortBy === 'name' ? 'Name' : sortBy === 'price' ? 'Price' : 'Updated'}
              </Text>
              <Ionicons name="swap-vertical" size={16} color="#007AFF" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.bulkButton}
              onPress={() => {
                setBulkMode(!bulkMode);
                setSelectedFoods([]);
              }}
            >
              <Text style={styles.bulkButtonText}>
                {bulkMode ? 'Cancel' : 'Bulk Edit'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Bulk Actions */}
      {bulkMode && (
        <View style={styles.bulkActions}>
          <Text style={styles.bulkTitle}>
            {selectedFoods.length} food(s) selected
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.bulkButtons}>
              <TouchableOpacity
                style={[styles.bulkActionButton, styles.activateButton]}
                onPress={() => handleBulkAction('activate')}
              >
                <Text style={styles.bulkActionText}>Activate</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bulkActionButton, styles.deactivateButton]}
                onPress={() => handleBulkAction('deactivate')}
              >
                <Text style={styles.bulkActionText}>Deactivate</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bulkActionButton, styles.availableButton]}
                onPress={() => handleBulkAction('available')}
              >
                <Text style={styles.bulkActionText}>Available</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bulkActionButton, styles.unavailableButton]}
                onPress={() => handleBulkAction('unavailable')}
              >
                <Text style={styles.bulkActionText}>Unavailable</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bulkActionButton, styles.deleteButton]}
                onPress={() => handleBulkAction('delete')}
              >
                <Text style={styles.bulkActionText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Food List */}
      <ScrollView
        style={styles.foodList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredFoods.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No foods found matching your search' : 'No foods available'}
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleCreateFood}>
              <Text style={styles.emptyButtonText}>Add First Food</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredFoods.map((food) => (
            <FoodCard key={food.id} food={food} />
          ))
        )}
      </ScrollView>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 30,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  menuFilter: {
    marginBottom: 12,
  },
  menuFilterItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  menuFilterItemActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  menuFilterText: {
    fontSize: 14,
    color: '#666',
  },
  menuFilterTextActive: {
    color: '#fff',
  },
  filterContainer: {
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  sortButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 4,
  },
  bulkButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  bulkButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  bulkActions: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  bulkTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  bulkButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  bulkActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  activateButton: {
    backgroundColor: '#28a745',
  },
  deactivateButton: {
    backgroundColor: '#6c757d',
  },
  availableButton: {
    backgroundColor: '#007AFF',
  },
  unavailableButton: {
    backgroundColor: '#ffc107',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  bulkActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  foodList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  foodCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inactiveCard: {
    opacity: 0.6,
  },
  selectedCard: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  foodHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  foodImageContainer: {
    marginRight: 12,
  },
  foodImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  foodPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28a745',
    marginBottom: 4,
  },
  foodDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  menuName: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
  checkbox: {
    marginLeft: 12,
  },
  foodFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  updatedText: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 