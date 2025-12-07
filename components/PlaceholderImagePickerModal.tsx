import React from 'react';
import {
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  View,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Themed';

interface PlaceholderImagePickerModalProps {
  visible: boolean;
  images: string[];
  onSelect: (imageUri: string) => void;
  onClose: () => void;
  title?: string;
}

export function PlaceholderImagePickerModal({
  visible,
  images,
  onSelect,
  onClose,
  title = 'Pilih Gambar Contoh',
}: PlaceholderImagePickerModalProps) {
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSelect = async (imageUri: string, index: number) => {
    setSelectedIndex(index);
    setLoading(true);
    
    // Small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setLoading(false);
    onSelect(imageUri);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Image Grid */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.imageGrid}
            showsVerticalScrollIndicator={false}
          >
            {images.map((imageUri, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.imageContainer,
                  selectedIndex === index && styles.imageContainerSelected,
                ]}
                onPress={() => handleSelect(imageUri, index)}
                disabled={loading}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={styles.image}
                  resizeMode="cover"
                />
                {selectedIndex === index && loading && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}
                {selectedIndex === index && !loading && (
                  <View style={styles.selectedOverlay}>
                    <Ionicons name="checkmark-circle" size={32} color="#007AFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {images.length} gambar tersedia
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    justifyContent: 'space-between',
  },
  imageContainer: {
    width: '48%',
    aspectRatio: 4 / 3,
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#f0f0f0',
  },
  imageContainerSelected: {
    borderColor: '#007AFF',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
