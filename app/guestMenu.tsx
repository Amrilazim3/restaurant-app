import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import { menuService } from '@/services/menuService';
import { Menu, Food } from '@/types/menu';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import Button from '@/components/Button';
import Card from '@/components/Card';

export default function GuestMenuScreen() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'menus' | 'foods'>('menus');

  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
    try {
      setLoading(true);
      const activeMenus = await menuService.getActiveMenus();
      setMenus(activeMenus);
    } catch (error) {
      console.error('Error loading menus:', error);
      Alert.alert('Ralat', 'Gagal memuatkan menu. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const loadFoods = async (menu: Menu) => {
    try {
      setLoading(true);
      const menuFoods = await menuService.getFoodsByMenu(menu.id);
      const availableFoods = menuFoods.filter(food => food.isAvailable);
      setFoods(availableFoods);
      setSelectedMenu(menu);
      setView('foods');
    } catch (error) {
      console.error('Error loading foods:', error);
      Alert.alert('Ralat', 'Gagal memuatkan makanan. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (view === 'menus') {
      await loadMenus();
    } else if (selectedMenu) {
      await loadFoods(selectedMenu);
    }
    setRefreshing(false);
  };

  const handleBackToMenus = () => {
    setView('menus');
    setSelectedMenu(null);
    setFoods([]);
    setSearchQuery('');
  };

  const handleFoodPress = (food: Food) => {
    Alert.alert(
      'Sertai Kami',
      'Untuk menambah item ke troli dan membuat pesanan, sila daftar atau log masuk terlebih dahulu.',
      [
        { text: 'Nanti', style: 'cancel' },
        { text: 'Daftar', onPress: () => router.push('/(auth)/register') },
        { text: 'Log Masuk', onPress: () => router.push('/(auth)/login') },
      ]
    );
  };

  const handleLoginPress = () => {
    router.push('/(auth)/login');
  };

  const handleRegisterPress = () => {
    router.push('/(auth)/register');
  };

  const filteredItems = view === 'menus' 
    ? menus.filter(menu => 
        menu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        menu.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : foods.filter(food =>
        food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        food.description.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const renderMenuCard = (menu: Menu) => (
    <Card
      key={menu.id}
      onPress={() => loadFoods(menu)}
      style={styles.menuCard}
      variant="default"
      padding="none"
    >
      <View style={styles.menuImageContainer}>
        {menu.image ? (
          <Image source={{ uri: menu.image }} style={styles.menuImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="restaurant" size={40} color="#ccc" />
          </View>
        )}
        <View style={styles.menuOverlay}>
          <Text style={styles.menuName}>{menu.name}</Text>
        </View>
      </View>
      <View style={styles.menuInfo}>
        <Text style={styles.menuDescription} numberOfLines={2}>
          {menu.description}
        </Text>
        <View style={styles.menuFooter}>
          <Text style={styles.viewMenuText}>Lihat Menu</Text>
          <Ionicons name="chevron-forward" size={16} color="#007AFF" />
        </View>
      </View>
    </Card>
  );

  const renderFoodCard = (food: Food) => (
    <Card
      key={food.id}
      onPress={() => handleFoodPress(food)}
      style={styles.foodCard}
      variant="default"
      padding="none"
    >
      <View style={styles.foodImageContainer}>
        {food.image ? (
          <Image source={{ uri: food.image }} style={styles.foodImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="fast-food" size={32} color="#ccc" />
          </View>
        )}
      </View>
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{food.name}</Text>
        <Text style={styles.foodDescription} numberOfLines={2}>
          {food.description}
        </Text>
        <View style={styles.foodFooter}>
          <Text style={styles.foodPrice}>RM{food.price.toFixed(2)}</Text>
          <View style={styles.addButton}>
            <Ionicons name="add" size={20} color="#007AFF" />
          </View>
        </View>
      </View>
    </Card>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <LoadingSpinner text="Memuatkan menu..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {view === 'foods' && (
            <TouchableOpacity onPress={handleBackToMenus} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
          )}
          <View style={styles.headerContent}>
            <Text style={styles.title}>
              {view === 'menus' ? 'Menu Kami' : selectedMenu?.name}
            </Text>
            <Text style={styles.subtitle}>
              {view === 'menus' 
                ? 'Lihat koleksi menu lazat kami' 
                : 'Pilih makanan kegemaran anda'
              }
            </Text>
          </View>
          <View style={styles.authButtons}>
            <TouchableOpacity onPress={handleLoginPress} style={styles.loginButton}>
              <Text style={styles.loginButtonText}>Masuk</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={view === 'menus' ? 'Cari menu...' : 'Cari makanan...'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.length === 0 ? (
          <EmptyState
            icon={view === 'menus' ? 'restaurant-outline' : 'fast-food-outline'}
            title={`Tiada ${view === 'menus' ? 'menu' : 'makanan'} dijumpai`}
            subtitle={searchQuery ? 'Cuba cari dengan kata kunci lain' : 'Tiada item tersedia pada masa ini'}
          />
        ) : (
          <View style={styles.grid}>
            {view === 'menus' 
              ? filteredItems.map((menu) => renderMenuCard(menu as Menu))
              : filteredItems.map((food) => renderFoodCard(food as Food))
            }
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCTA}>
        <Text style={styles.ctaText}>Suka dengan apa yang anda lihat?</Text>
        <View style={styles.ctaButtons}>
          <Button
            title="Daftar"
            onPress={handleRegisterPress}
            variant="primary"
            size="medium"
            style={styles.ctaButton}
          />
          <Button
            title="Log Masuk"
            onPress={handleLoginPress}
            variant="outline"
            size="medium"
            style={styles.ctaButton}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerContent: {
    flex: 1,
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
  authButtons: {
    flexDirection: 'row',
  },
  loginButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  content: {
    flex: 1,
  },
  grid: {
    padding: 16,
  },
  menuCard: {
    marginBottom: 16,
  },
  menuImageContainer: {
    height: 150,
    position: 'relative',
  },
  menuImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  menuOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  menuName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  menuInfo: {
    padding: 16,
  },
  menuDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  menuFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewMenuText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  foodCard: {
    marginBottom: 16,
    flexDirection: 'row',
  },
  foodImageContainer: {
    width: 100,
    height: 100,
    marginRight: 12,
  },
  foodImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  foodInfo: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  foodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  foodDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  foodFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  foodPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  bottomCTA: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  ctaButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  ctaButton: {
    paddingHorizontal: 24,
  },
}); 