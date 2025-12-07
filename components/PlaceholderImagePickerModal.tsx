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
// import { Text } from './Themed';

// Type for image sources (can be URL string or local require() object)
type ImageSource = string | number;

interface PlaceholderImagePickerModalProps {
  visible: boolean;
  images: ImageSource[];
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
  const [failedImages, setFailedImages] = React.useState<Set<number>>(new Set());

  // Reset failed images when modal opens
  React.useEffect(() => {
    if (visible) {
      setFailedImages(new Set());
    }
  }, [visible]);

  // Helper function to resolve image source to URI string
  const resolveImageUri = (source: ImageSource): string => {
    if (typeof source === 'string') {
      // It's already a URL string
      return source;
    }
    // It's a local require() object, resolve it to URI
    const resolved = Image.resolveAssetSource(source);
    return resolved?.uri || '';
  };

  const handleSelect = async (imageSource: ImageSource, index: number) => {
    setSelectedIndex(index);
    setLoading(true);
    
    // Small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setLoading(false);
    // Resolve to URI string for the callback
    const imageUri = resolveImageUri(imageSource);
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
            {images.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Tiada gambar tersedia</Text>
              </View>
            ) : (
              images
                .map((imageSource, index) => ({ imageSource, index }))
                .filter(({ index }) => !failedImages.has(index))
                .map(({ imageSource, index }) => {
                  // Handle both string URIs and local require() objects
                  // For strings: use { uri: string }
                  // For numbers (require()): resolve to URI using Image.resolveAssetSource
                  let imageSourceProp;
                  if (typeof imageSource === 'string') {
                    imageSourceProp = { uri: imageSource };
                  } else {
                    // For require() results (numbers), resolve to URI
                    const resolved = Image.resolveAssetSource(imageSource);
                    imageSourceProp = resolved ? { uri: resolved.uri } : imageSource;
                  }

                  return (
                    <TouchableOpacity
                      key={`image-${index}-${typeof imageSource === 'string' ? imageSource : imageSource}`}
                      style={[
                        styles.imageContainer,
                        selectedIndex === index && styles.imageContainerSelected,
                      ]}
                      onPress={() => handleSelect(imageSource, index)}
                      disabled={loading}
                    >
                      <Image
                        source={imageSourceProp}
                        style={styles.image}
                        resizeMode="cover"
                        onError={() => {
                          // Silently track failed images and hide them
                          setFailedImages(prev => new Set(prev).add(index));
                        }}
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
                  );
                })
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {images.length - failedImages.size} gambar tersedia
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
    flex: 1,
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
    minHeight: 200,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
