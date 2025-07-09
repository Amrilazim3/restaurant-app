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
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import { menuService, Menu } from '@/services/menuService';
import { imageService } from '@/services/imageService';

interface MenuWithStats extends Menu {
  stats?: {
    totalFoods: number;
    activeFoods: number;
    availableFoods: number;
    inactiveFoods: number;
  };
}

export default function AdminMenusScreen() {
  const [menus, setMenus] = useState<MenuWithStats[]>([]);
  const [filteredMenus, setFilteredMenus] = useState<MenuWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedMenus, setSelectedMenus] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);

  // Refetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadMenus();
    }, [])
  );

  useEffect(() => {
    filterMenus();
  }, [menus, searchQuery, showInactive]);

  const loadMenus = async () => {
    try {
      setLoading(true);
      const allMenus = await menuService.getAllMenus();
      
      // Load stats for each menu
      const menusWithStats = await Promise.all(
        allMenus.map(async (menu) => {
          try {
            const stats = await menuService.getMenuStats(menu.id);
            return { ...menu, stats };
          } catch (error) {
            console.error('Error loading stats for menu:', menu.id, error);
            return menu;
          }
        })
      );
      
      setMenus(menusWithStats);
    } catch (error) {
      console.error('Error loading menus:', error);
      Alert.alert('Error', 'Failed to load menus. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterMenus = () => {
    let filtered = menus;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(menu =>
        menu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        menu.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by active status
    if (!showInactive) {
      filtered = filtered.filter(menu => menu.isActive === true);
    } else {
      filtered = filtered.filter(menu => menu.isActive === false);
    }

    setFilteredMenus(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMenus();
    setRefreshing(false);
  };

  const handleCreateMenu = () => {
    router.push('/adminMenuForm');
  };

  const handleEditMenu = (menu: Menu) => {
    router.push(`/adminMenuForm?id=${menu.id}`);
  };

  const handleDeleteMenu = (menu: Menu) => {
    Alert.alert(
      'Delete Menu',
      `Are you sure you want to delete "${menu.name}"? This will hide the menu from customers but preserve the data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await menuService.deleteMenu(menu.id);
              Alert.alert('Success', 'Menu deleted successfully');
              loadMenus();
            } catch (error) {
              console.error('Error deleting menu:', error);
              Alert.alert('Error', 'Failed to delete menu. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleMenuPress = (menu: Menu) => {
    if (bulkMode) {
      toggleMenuSelection(menu.id);
    } else {
      showMenuOptions(menu);
    }
  };

  const showMenuOptions = (menu: Menu) => {
    const options = [
      'Edit Menu',
      'Delete Menu',
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
              handleEditMenu(menu);
              break;
            case 1:
              handleDeleteMenu(menu);
              break;
          }
        }
      );
    } else {
      Alert.alert('Menu Options', 'Choose an action:', [
        { text: 'Edit Menu', onPress: () => handleEditMenu(menu) },
        { text: 'Delete Menu', style: 'destructive', onPress: () => handleDeleteMenu(menu) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const toggleMenuSelection = (menuId: string) => {
    setSelectedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedMenus.length === 0) {
      Alert.alert('No Selection', 'Please select menus to perform bulk actions.');
      return;
    }

    const actionText = action === 'activate' ? 'activate' : action === 'deactivate' ? 'deactivate' : 'delete';
    const selectedCount = selectedMenus.length;

    Alert.alert(
      `Bulk ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      `Are you sure you want to ${actionText} ${selectedCount} menu(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: action === 'delete' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              if (action === 'delete') {
                await menuService.bulkUpdateMenuStatus(selectedMenus, false);
              } else {
                await menuService.bulkUpdateMenuStatus(selectedMenus, action === 'activate');
              }
              
              Alert.alert('Success', `${selectedCount} menu(s) ${actionText}d successfully`);
              setSelectedMenus([]);
              setBulkMode(false);
              loadMenus();
            } catch (error) {
              console.error(`Error performing bulk ${action}:`, error);
              Alert.alert('Error', `Failed to ${actionText} menus. Please try again.`);
            }
          },
        },
      ]
    );
  };

  const MenuCard = ({ menu }: { menu: MenuWithStats }) => (
    <TouchableOpacity
      style={[
        styles.menuCard,
        !menu.isActive && styles.inactiveCard,
        bulkMode && selectedMenus.includes(menu.id) && styles.selectedCard
      ]}
      onPress={() => handleMenuPress(menu)}
      onLongPress={() => {
        if (!bulkMode) {
          setBulkMode(true);
          setSelectedMenus([menu.id]);
        }
      }}
    >
      <View style={styles.menuHeader}>
        <View style={styles.menuInfo}>
          <Text style={styles.menuName}>{menu.name}</Text>
          <Text style={styles.menuDescription}>{menu.description}</Text>
        </View>
        
        {bulkMode && (
          <View style={styles.checkbox}>
            <Ionicons
              name={selectedMenus.includes(menu.id) ? 'checkbox' : 'checkbox-outline'}
              size={24}
              color={selectedMenus.includes(menu.id) ? '#007AFF' : '#666'}
            />
          </View>
        )}
      </View>

      {menu.stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{menu.stats.totalFoods}</Text>
            <Text style={styles.statLabel}>Total Foods</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{menu.stats.activeFoods}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{menu.stats.availableFoods}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
        </View>
      )}

      <View style={styles.menuFooter}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: menu.isActive ? '#28a745' : '#dc3545' }]} />
          <Text style={styles.statusText}>{menu.isActive ? 'Active' : 'Inactive'}</Text>
        </View>
        
        <Text style={styles.updatedText}>
          Updated: {menu.updatedAt ? menu.updatedAt.toLocaleDateString() : menu.createdAt.toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading menus...</Text>
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
        <Text style={styles.title}>Menu Management</Text>
        <TouchableOpacity onPress={handleCreateMenu} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search menus..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={styles.filterContainer}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Show Inactive</Text>
            <Switch
              value={showInactive}
              onValueChange={setShowInactive}
              trackColor={{ false: '#767577', true: '#007AFF' }}
            />
          </View>
          
          <TouchableOpacity
            style={styles.bulkButton}
            onPress={() => {
              setBulkMode(!bulkMode);
              setSelectedMenus([]);
            }}
          >
            <Text style={styles.bulkButtonText}>
              {bulkMode ? 'Cancel' : 'Bulk Edit'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bulk Actions */}
      {bulkMode && (
        <View style={styles.bulkActions}>
          <Text style={styles.bulkTitle}>
            {selectedMenus.length} menu(s) selected
          </Text>
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
              style={[styles.bulkActionButton, styles.deleteButton]}
              onPress={() => handleBulkAction('delete')}
            >
              <Text style={styles.bulkActionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Menu List */}
      <ScrollView
        style={styles.menuList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredMenus.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No menus found matching your search' : 'No menus available'}
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleCreateMenu}>
              <Text style={styles.emptyButtonText}>Create First Menu</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredMenus.map((menu) => (
            <MenuCard key={menu.id} menu={menu} />
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
  filterContainer: {
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
    justifyContent: 'space-around',
  },
  bulkActionButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  activateButton: {
    backgroundColor: '#28a745',
  },
  deactivateButton: {
    backgroundColor: '#ffc107',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  bulkActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  menuList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  menuCard: {
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
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  menuInfo: {
    flex: 1,
  },
  menuName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  checkbox: {
    marginLeft: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  menuFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
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