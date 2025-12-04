import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Image } from 'react-native';
import { ImageUploadResult, ImageUploadOptions } from '@/types/image';

// Type for image sources (can be URL string or local require() object)
type ImageSource = string | number;

// Helper function to resolve image source to URI string
// Handles both remote URLs (strings) and local images (require() objects)
const resolveImageUri = (source: ImageSource): string => {
  if (typeof source === 'string') {
    // It's already a URL string
    return source;
  }
  // It's a local require() object, resolve it to URI
  const resolved = Image.resolveAssetSource(source);
  return resolved?.uri || '';
};

// Predefined placeholder images for different categories
// Can include both remote URLs (strings) and local images (require() objects)
// To add local images, use: require('@/assets/images/foods/your-image.jpg')
const PLACEHOLDER_IMAGES: { menus: ImageSource[]; foods: ImageSource[] } = {
  menus: [
    // Remote images (existing)
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=300&fit=crop&crop=center',
    // Local images - Add your local menu images here
    // Example: require('@/assets/images/menus/menu1.jpg'),
    // Example: require('@/assets/images/menus/menu2.jpg'),
  ],
  foods: [
    // Remote images (existing)
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400&h=300&fit=crop&crop=center',
    // Local images - Add your local food images here
    // Example: require('@/assets/images/foods/food1.jpg'),
    // Example: require('@/assets/images/foods/food2.jpg'),
  ]
};

export const imageService = {
  // Request camera and media library permissions
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      return cameraStatus === 'granted' && mediaStatus === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  },

  // Pick image from camera
  async pickFromCamera(options: ImageUploadOptions = {}): Promise<ImagePicker.ImagePickerResult> {
    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      throw new Error('Camera permissions are required to take photos');
    }

    return await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: options.quality || 0.8,
    });
  },

  // Pick image from gallery
  async pickFromGallery(options: ImageUploadOptions = {}): Promise<ImagePicker.ImagePickerResult> {
    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      throw new Error('Media library permissions are required to select photos');
    }

    return await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: options.quality || 0.8,
    });
  },

  // Get random placeholder image for testing
  // Returns a URI string that works with Image component's { uri: ... } prop
  getRandomPlaceholderImage(folder: 'menus' | 'foods'): string {
    const images = PLACEHOLDER_IMAGES[folder];
    if (images.length === 0) {
      // Fallback to a default placeholder if no images available
      return 'https://via.placeholder.com/400x300?text=No+Image';
    }
    const randomIndex = Math.floor(Math.random() * images.length);
    const selectedImage = images[randomIndex];
    return resolveImageUri(selectedImage);
  },

  // Get all placeholder images for a category
  // Returns an array of URI strings that can be displayed in a picker
  getAllPlaceholderImages(folder: 'menus' | 'foods'): string[] {
    const images = PLACEHOLDER_IMAGES[folder];
    if (images.length === 0) {
      return ['https://via.placeholder.com/400x300?text=No+Image'];
    }
    return images.map(image => resolveImageUri(image));
  },

  // Simulate image upload with placeholder (no actual upload needed)
  async uploadImage(
    uri: string,
    folder: 'menus' | 'foods',
    fileName: string,
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult> {
    try {
      console.log('🎭 Using placeholder image system (no storage required)');
      console.log('Original URI:', uri);
      
      // For development: return a random placeholder image
      // This maintains the same API while not requiring storage
      const placeholderUrl = this.getRandomPlaceholderImage(folder);
      const placeholderPath = `${folder}/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
      
      // Simulate upload delay for realistic UX
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('✅ Placeholder image assigned:', placeholderUrl);

      return {
        url: placeholderUrl,
        path: placeholderPath,
      };
    } catch (error) {
      console.error('Error in placeholder image system:', error);
      throw new Error('Failed to assign placeholder image. Please try again.');
    }
  },

  // Delete image (no-op for placeholder system)
  async deleteImage(imagePath: string): Promise<void> {
    try {
      console.log('🗑️ Placeholder delete (no action needed):', imagePath);
      // No actual deletion needed for placeholder system
    } catch (error) {
      console.error('Error in placeholder delete:', error);
      // Don't throw error for deletion failures
    }
  },

  // Validate image
  validateImage(uri: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!uri || uri.trim() === '') {
      errors.push('Image is required');
      return { isValid: false, errors };
    }

    // Check if it's a valid URI format
    try {
      new URL(uri);
    } catch {
      // For local file URIs, check if it starts with file://
      if (!uri.startsWith('file://') && !uri.startsWith('content://')) {
        errors.push('Invalid image format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Get image picker options
  getImagePickerOptions(): { title: string; options: string[] } {
    return {
      title: 'Select Image',
      options: ['Take Photo', 'Choose from Gallery', 'Random Placeholder', 'Cancel']
    };
  },

  // Handle image picker result with placeholder option
  async handleImagePickerResult(
    result: ImagePicker.ImagePickerResult,
    folder: 'menus' | 'foods',
    fileName: string,
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult | null> {
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      return await this.uploadImage(asset.uri, folder, fileName, options);
    }
    return null;
  },

  // Get a specific placeholder by category and index
  getPlaceholderImage(folder: 'menus' | 'foods', index?: number): string {
    const images = PLACEHOLDER_IMAGES[folder];
    if (images.length === 0) {
      return 'https://via.placeholder.com/400x300?text=No+Image';
    }
    const targetIndex = index !== undefined ? index % images.length : Math.floor(Math.random() * images.length);
    return resolveImageUri(images[targetIndex]);
  },

  // Get default image URLs for fallback
  getDefaultImageUrls(): { menu: string; food: string } {
    return {
      menu: this.getPlaceholderImage('menus', 0),
      food: this.getPlaceholderImage('foods', 0)
    };
  },

  // Future upgrade path: Real storage implementation
  // When ready to implement real storage, replace uploadImage method with:
  /*
  async uploadImageToStorage(
    uri: string,
    folder: 'menus' | 'foods',
    fileName: string,
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult> {
    // TODO: Implement with Firebase Storage, Cloudinary, or other service
    // This will maintain the same API structure
  }
  */
}; 