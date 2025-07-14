import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/Button';

export default function WelcomeScreen() {
  const { user, loading } = useAuth();

  useEffect(() => {
    // If user is already authenticated, go to main tabs
    if (user && !loading) {
      router.replace('/(tabs)');
    }
  }, [user, loading]);

  // Show welcome screen for unauthenticated users
  if (!user && !loading) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="restaurant" size={64} color="#007AFF" />
            <Text style={styles.logoText}>Block Twenty-9</Text>
          </View>
          <Text style={styles.tagline}>Cita rasa autentik untuk jiwa yang lapar</Text>
        </View>

        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Ionicons name="restaurant-outline" size={32} color="#007AFF" />
            <Text style={styles.featureTitle}>Menu Lazat</Text>
            <Text style={styles.featureDescription}>
              Nikmati koleksi menu autentik dengan citarasa yang memukau
            </Text>
          </View>

          <View style={styles.feature}>
            <Ionicons name="timer-outline" size={32} color="#007AFF" />
            <Text style={styles.featureTitle}>Penghantaran Cepat</Text>
            <Text style={styles.featureDescription}>
              Pesanan anda akan dihantar dengan pantas dan selamat
            </Text>
          </View>

          <View style={styles.feature}>
            <Ionicons name="card-outline" size={32} color="#007AFF" />
            <Text style={styles.featureTitle}>Pembayaran Mudah</Text>
            <Text style={styles.featureDescription}>
              Bayar dengan QR code atau tunai semasa penghantaran
            </Text>
          </View>
        </View>

        <View style={styles.actionContainer}>
          <Text style={styles.actionTitle}>Mula menikmati pengalaman terbaik!</Text>
          
          <View style={styles.buttonContainer}>
            <Button
              title="Lihat Menu"
              onPress={() => router.push('/guestMenu')}
              variant="outline"
              size="large"
              fullWidth
              icon="restaurant-outline"
              style={styles.actionButton}
            />
            
            <Button
              title="Daftar Sekarang"
              onPress={() => router.push('/(auth)/register')}
              variant="primary"
              size="large"
              fullWidth
              icon="person-add-outline"
              style={styles.actionButton}
            />
          </View>

          <TouchableOpacity 
            style={styles.loginLink}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginLinkText}>
              Sudah ada akaun? <Text style={styles.loginLinkBold}>Log Masuk</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Dengan menggunakan aplikasi ini, anda bersetuju dengan{' '}
            <Text style={styles.footerLink}>Terma & Syarat</Text> dan{' '}
            <Text style={styles.footerLink}>Dasar Privasi</Text> kami.
          </Text>
        </View>
      </ScrollView>
    );
  }

  // Show loading for authenticated users or during auth check
  return (
    <View style={styles.loadingContainer}>
      <Ionicons name="restaurant" size={64} color="#007AFF" />
      <Text style={styles.loadingText}>Block Twenty-9</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 16,
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  feature: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 32,
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 24,
  },
  actionButton: {
    marginBottom: 0,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  loginLinkText: {
    fontSize: 14,
    color: '#666',
  },
  loginLinkBold: {
    color: '#007AFF',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: '#007AFF',
  },
}); 