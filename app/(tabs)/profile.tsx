import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

export default function ProfileScreen() {
  const { userProfile, logout } = useAuth();
  const { cartCount, clearCart } = useCart();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
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

  const handleEditProfile = () => {
    router.push('/editProfile');
  };

  const handleChangePassword = () => {
    router.push('/changePassword');
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
        Alert.alert('Admin Action', 'Order management feature coming soon!');
        break;
      case 'User Management':
        Alert.alert('Admin Action', 'User management feature coming soon!');
        break;
      case 'Analytics':
        Alert.alert('Admin Action', 'Analytics feature coming soon!');
        break;
      default:
        Alert.alert('Admin Action', `${action} feature coming soon!`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Manage your account</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.profileItem}>
          <Text style={styles.profileLabel}>Name</Text>
          <Text style={styles.profileValue}>{userProfile?.displayName || 'Not set'}</Text>
        </View>

        <View style={styles.profileItem}>
          <Text style={styles.profileLabel}>Email</Text>
          <Text style={styles.profileValue}>{userProfile?.email}</Text>
        </View>

        <View style={styles.profileItem}>
          <Text style={styles.profileLabel}>Phone</Text>
          <Text style={styles.profileValue}>{userProfile?.phoneNumber || 'Not set'}</Text>
        </View>

        <View style={styles.profileItem}>
          <Text style={styles.profileLabel}>Address</Text>
          <Text style={styles.profileValue}>{userProfile?.address || 'Not set'}</Text>
        </View>

        <View style={styles.profileItem}>
          <Text style={styles.profileLabel}>Role</Text>
          <Text style={[styles.profileValue, styles.roleValue]}>
            {userProfile?.role === 'admin' ? 'Administrator' : 'User'}
          </Text>
        </View>

        {cartCount > 0 && (
          <View style={styles.profileItem}>
            <Text style={styles.profileLabel}>Cart</Text>
            <Text style={styles.profileValue}>{cartCount} items</Text>
          </View>
        )}
      </View>

      {/* Admin Panel */}
      {userProfile?.role === 'admin' && (
        <View style={styles.adminSection}>
          <Text style={styles.adminTitle}>Admin Panel</Text>
          <Text style={styles.adminSubtitle}>Administrative functions</Text>
          
          <TouchableOpacity 
            style={styles.adminButton}
            onPress={() => handleAdminAction('Manage Menus')}
          >
            <Text style={styles.adminButtonText}>Manage Menus</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.adminButton}
            onPress={() => handleAdminAction('Manage Foods')}
          >
            <Text style={styles.adminButtonText}>Manage Foods</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.adminButton}
            onPress={() => handleAdminAction('View Orders')}
          >
            <Text style={styles.adminButtonText}>View All Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.adminButton}
            onPress={() => handleAdminAction('User Management')}
          >
            <Text style={styles.adminButtonText}>User Management</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.adminButton}
            onPress={() => handleAdminAction('Analytics')}
          >
            <Text style={styles.adminButtonText}>Analytics & Reports</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionButton} onPress={handleEditProfile}>
          <Text style={styles.actionButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleChangePassword}>
          <Text style={styles.actionButtonText}>Change Password</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Order History</Text>
        </TouchableOpacity>

        {cartCount > 0 && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.clearCartButton]} 
            onPress={clearCart}
          >
            <Text style={[styles.actionButtonText, styles.clearCartButtonText]}>
              Clear Cart ({cartCount})
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
          <Text style={[styles.actionButtonText, styles.logoutButtonText]}>Logout</Text>
        </TouchableOpacity>
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
}); 