import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { UserAddress } from '@/services/authService';

export default function EditProfileScreen() {
  const { userProfile, updateProfile } = useAuth();
  
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(userProfile?.phoneNumber || '');
  const [address, setAddress] = useState<UserAddress>({
    street: userProfile?.address?.street || '',
    city: userProfile?.address?.city || '',
    state: userProfile?.address?.state || '',
    postalCode: userProfile?.address?.postalCode || '',
    country: userProfile?.address?.country || 'Malaysia',
  });
  const [loading, setLoading] = useState(false);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert('Ralat', 'Nama diperlukan');
      return;
    }

    setLoading(true);
    try {
      // Clean up address - only save if there's meaningful data
      const cleanAddress = {
        street: address.street?.trim() || '',
        city: address.city?.trim() || '',
        state: address.state?.trim() || '',
        postalCode: address.postalCode?.trim() || '',
        country: address.country?.trim() || 'Malaysia',
      };
      
      // Check if address has any meaningful content
      const hasAddress = cleanAddress.street || cleanAddress.city || cleanAddress.state || cleanAddress.postalCode;
      
      await updateProfile({
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim() || null,
        address: hasAddress ? cleanAddress : null,
      });
      
      Alert.alert('Berjaya', 'Profil berjaya dikemas kini!');
      router.back();
    } catch (error: any) {
      Alert.alert('Ralat', error.message || 'Gagal mengemas kini profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Sunting Profil</Text>
          <Text style={styles.subtitle}>Kemas kini maklumat peribadi anda</Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Penuh *</Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan nama penuh anda"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mel</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={userProfile?.email}
                editable={false}
              />
              <Text style={styles.helperText}>E-mel tidak boleh diubah</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombor Telefon</Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan nombor telefon anda"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.sectionTitle}>Alamat</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Alamat Jalan</Text>
              <TextInput
                style={styles.input}
                placeholder="No. rumah, nama jalan"
                value={address.street}
                onChangeText={(text) => setAddress({...address, street: text})}
                autoCorrect={false}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Bandar</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Bandar"
                  value={address.city}
                  onChangeText={(text) => setAddress({...address, city: text})}
                  autoCorrect={false}
                />
              </View>
              
              <View style={styles.halfInput}>
                <Text style={styles.label}>Negeri</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Negeri"
                  value={address.state}
                  onChangeText={(text) => setAddress({...address, state: text})}
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Poskod</Text>
                <TextInput
                  style={styles.input}
                  placeholder="12345"
                  value={address.postalCode}
                  onChangeText={(text) => setAddress({...address, postalCode: text})}
                  keyboardType="numeric"
                  autoCorrect={false}
                />
              </View>
              
              <View style={styles.halfInput}>
                <Text style={styles.label}>Negara</Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={address.country}
                  editable={false}
                />
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => router.back()}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton, loading && styles.buttonDisabled]}
                onPress={handleSaveProfile}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  disabledInput: {
    backgroundColor: '#f8f9fa',
    color: '#666',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.48,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
}); 