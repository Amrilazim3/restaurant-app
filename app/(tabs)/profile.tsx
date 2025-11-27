import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useNotification } from '@/contexts/NotificationContext';

export default function ProfileScreen() {
  const { user, userProfile, logout } = useAuth();
  const { cartCount, clearCart } = useCart();
  const { unreadCount, markAllAsRead, clearNotifications, sendTestNotification } = useNotification();

  const handleLogout = () => {
    Alert.alert(
      'Log Keluar',
      'Adakah anda pasti mahu log keluar?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Log Keluar',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleEditProfile = () => {
    if (!userProfile) {
      router.push('/login');
    } else {
      router.push('/editProfile');
    }
  };

  const handleChangePassword = () => {
    if (!userProfile) {
      router.push('/login');
    } else {
      router.push('/changePassword');
    }
  };

  const handleAdminAction = (action: string) => {
    switch (action) {
      case 'Manage Menus':
        router.push('/adminMenus');
        break;
      case 'Manage Foods':
        router.push('/adminFoods');
        break;
      case 'View Orders':
        router.push('/adminOrders');
        break;
      case 'Business Report':
        router.push('/businessReport' as any);
        break;
      default:
        Alert.alert('Tindakan Admin', `Fungsi ${action} akan datang tidak lama lagi!`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profil</Text>
        <Text style={styles.subtitle}>Urus akaun anda</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.profileItem}>
          <Text style={styles.profileLabel}>Nama</Text>
          <Text style={styles.profileValue}>{userProfile?.displayName || 'Tidak ditetapkan'}</Text>
        </View>

        <View style={styles.profileItem}>
          <Text style={styles.profileLabel}>E-mel</Text>
          <Text style={styles.profileValue}>{userProfile?.email}</Text>
        </View>

        <View style={styles.profileItem}>
          <Text style={styles.profileLabel}>Telefon</Text>
          <Text style={styles.profileValue}>{userProfile?.phoneNumber || 'Tidak ditetapkan'}</Text>
        </View>

        <View style={styles.profileItem}>
          <Text style={styles.profileLabel}>Alamat</Text>
          <Text style={styles.profileValue}>
            {userProfile?.address 
              ? `${userProfile.address.street || ''}, ${userProfile.address.city || ''}, ${userProfile.address.state || ''} ${userProfile.address.postalCode || ''}`.trim().replace(/^,\s*/, '').replace(/,\s*$/, '') 
              : 'Tidak ditetapkan'}
          </Text>
        </View>

        <View style={styles.profileItem}>
          <Text style={styles.profileLabel}>Peranan</Text>
          <Text style={[styles.profileValue, styles.roleValue]}>
            {userProfile?.role === 'admin' ? 'Pentadbir' : 'Pengguna'}
          </Text>
        </View>

        {cartCount > 0 && (
          <View style={styles.profileItem}>
            <Text style={styles.profileLabel}>Troli</Text>
            <Text style={styles.profileValue}>{cartCount} item</Text>
          </View>
        )}

        {unreadCount > 0 && (
          <View style={styles.profileItem}>
            <Text style={styles.profileLabel}>Notifikasi</Text>
            <Text style={styles.profileValue}>{unreadCount} belum dibaca</Text>
          </View>
        )}
      </View>

      {/* Admin Panel */}
      {userProfile?.role === 'admin' && (
        <View style={styles.adminSection}>
          <Text style={styles.adminTitle}>Panel Admin</Text>
          <Text style={styles.adminSubtitle}>Fungsi pentadbiran</Text>
          
          <TouchableOpacity 
            style={styles.adminButton}
            onPress={() => handleAdminAction('Manage Menus')}
          >
            <Text style={styles.adminButtonText}>Urus Menu</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.adminButton}
            onPress={() => handleAdminAction('Manage Foods')}
          >
            <Text style={styles.adminButtonText}>Urus Makanan</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.adminButton}
            onPress={() => handleAdminAction('View Orders')}
          >
            <Text style={styles.adminButtonText}>Lihat Semua Pesanan</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.adminButton}
            onPress={() => handleAdminAction('Business Report')}
          >
            <Text style={styles.adminButtonText}>Laporan Perniagaan</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.actionsSection}>
        {user && (
          <TouchableOpacity style={styles.actionButton} onPress={handleEditProfile}>
            <Text style={styles.actionButtonText}>Sunting Profil</Text>
          </TouchableOpacity>
        )}

        {user && (
          <TouchableOpacity style={styles.actionButton} onPress={handleChangePassword}>
            <Text style={styles.actionButtonText}>Tukar Kata Laluan</Text>
          </TouchableOpacity>
        )}

        {cartCount > 0 && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.clearCartButton]} 
            onPress={clearCart}
          >
            <Text style={[styles.actionButtonText, styles.clearCartButtonText]}>
              Kosongkan Troli ({cartCount})
            </Text>
          </TouchableOpacity>
        )}

        {user && (
          <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
            <Text style={[styles.actionButtonText, styles.logoutButtonText]}>Log Keluar</Text>
          </TouchableOpacity>
        )}
        {!user && (
                <TouchableOpacity style={[styles.actionButton, styles.loginButton]} onPress={handleLogin}>
                    <Text style={[styles.actionButtonText, styles.logoutButtonText]}>Log Masuk</Text>
                </TouchableOpacity>
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
  profileSection: {
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  profileValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
    textAlign: 'right',
  },
  roleValue: {
    fontWeight: '600',
    color: '#007AFF',
  },
  adminSection: {
    backgroundColor: '#fff',
    marginBottom: 20,
    padding: 20,
  },
  adminTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  adminSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  adminButton: {
    backgroundColor: '#28a745',
    marginBottom: 12,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  adminButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionsSection: {
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearCartButton: {
    backgroundColor: '#ffc107',
  },
  clearCartButtonText: {
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
  },
  logoutButtonText: {
    color: '#fff',
  },
  loginButton: {
    backgroundColor: '#007AFF',
  },
  loginButtonText: {
    color: '#fff',
  },
}); 