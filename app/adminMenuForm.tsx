import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Image,
  ActionSheetIOS,
  Platform,
  Switch,
  KeyboardAvoidingView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import { menuService, Menu } from '@/services/menuService';
import { imageService } from '@/services/imageService';

interface MenuFormData {
  name: string;
  description: string;
  image?: string;
  imagePath?: string;
  isActive: boolean;
}

interface FormErrors {
  name?: string;
  description?: string;
  image?: string;
  general?: string;
}

export default function AdminMenuFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [formData, setFormData] = useState<MenuFormData>({
    name: '',
    description: '',
    image: '',
    imagePath: '',
    isActive: true,
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    if (isEditing && id) {
      loadMenu();
    }
  }, [isEditing, id]);

  const loadMenu = async () => {
    try {
      setInitialLoading(true);
      const menu = await menuService.getMenuById(id!);
      
      if (menu) {
        setFormData({
          name: menu.name,
          description: menu.description,
          image: menu.image || '',
          imagePath: '', // We don't store the path for existing images
          isActive: menu.isActive,
        });
      } else {
        Alert.alert('Error', 'Menu not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading menu:', error);
      Alert.alert('Error', 'Failed to load menu details');
      router.back();
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (field: keyof MenuFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const validation = menuService.validateMenuData(formData);
    
    if (!validation.isValid) {
      const fieldErrors: FormErrors = {};
      
      validation.errors.forEach(error => {
        if (error.includes('name')) fieldErrors.name = error;
        else if (error.includes('description')) fieldErrors.description = error;
        else fieldErrors.general = error;
      });
      
      setErrors(fieldErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleImagePicker = () => {
    const options = ['Take Photo', 'Choose from Gallery', 'Use Placeholder', 'Cancel'];
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 3,
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            await pickImage('camera');
          } else if (buttonIndex === 1) {
            await pickImage('gallery');
          } else if (buttonIndex === 2) {
            await usePlaceholderImage();
          }
        }
      );
    } else {
      Alert.alert('Select Image', 'Choose image source:', [
        { text: 'Take Photo', onPress: () => pickImage('camera') },
        { text: 'Choose from Gallery', onPress: () => pickImage('gallery') },
        { text: 'Use Placeholder', onPress: () => usePlaceholderImage() },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const usePlaceholderImage = async () => {
    try {
      setImageUploading(true);
      
      const fileName = `menu_${Date.now()}`;
      const placeholderUrl = imageService.getRandomPlaceholderImage('menus');
      const placeholderPath = `menus/${Date.now()}_${fileName}.jpg`;
      
      // Simulate upload delay for UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setFormData(prev => ({
        ...prev,
        image: placeholderUrl,
        imagePath: placeholderPath,
      }));
    } catch (error) {
      console.error('Error setting placeholder image:', error);
      Alert.alert('Error', 'Failed to set placeholder image. Please try again.');
    } finally {
      setImageUploading(false);
    }
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    try {
      setImageUploading(true);
      
      const result = source === 'camera' 
        ? await imageService.pickFromCamera()
        : await imageService.pickFromGallery();

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = `menu_${Date.now()}`;
        
        const uploadResult = await imageService.uploadImage(
          asset.uri,
          'menus',
          fileName,
          { maxWidth: 800, maxHeight: 600, quality: 0.8 }
        );
        
        // Delete old image if editing and has previous image
        if (isEditing && formData.imagePath) {
          await imageService.deleteImage(formData.imagePath);
        }
        
        setFormData(prev => ({
          ...prev,
          image: uploadResult.url,
          imagePath: uploadResult.path,
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = () => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            // Delete image from storage if it was uploaded in this session
            if (formData.imagePath) {
              await imageService.deleteImage(formData.imagePath);
            }
            
            setFormData(prev => ({
              ...prev,
              image: '',
              imagePath: '',
            }));
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      if (isEditing) {
        await menuService.updateMenu(id!, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          image: formData.image || undefined,
          isActive: formData.isActive,
        });
        
        Alert.alert('Success', 'Menu updated successfully');
      } else {
        await menuService.createMenu({
          name: formData.name.trim(),
          description: formData.description.trim(),
          image: formData.image || undefined,
          isActive: formData.isActive,
        });
        
        Alert.alert('Success', 'Menu created successfully');
      }
      
      router.back();
    } catch (error) {
      console.error('Error saving menu:', error);
      Alert.alert('Error', 'Failed to save menu. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Continue Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            // Clean up uploaded image if canceling
            if (!isEditing && formData.imagePath) {
              await imageService.deleteImage(formData.imagePath);
            }
            router.back();
          },
        },
      ]
    );
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditing ? 'Edit Menu' : 'Create Menu'}
        </Text>
        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {/* General Error */}
        {errors.general && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color="#dc3545" />
            <Text style={styles.errorText}>{errors.general}</Text>
          </View>
        )}

        {/* Menu Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Menu Name *</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="Enter menu name"
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            maxLength={50}
          />
          {errors.name && (
            <Text style={styles.fieldError}>{errors.name}</Text>
          )}
          <Text style={styles.charCount}>
            {formData.name.length}/50
          </Text>
        </View>

        {/* Menu Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.textArea, errors.description && styles.inputError]}
            placeholder="Enter menu description"
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            multiline
            numberOfLines={4}
            maxLength={200}
          />
          {errors.description && (
            <Text style={styles.fieldError}>{errors.description}</Text>
          )}
          <Text style={styles.charCount}>
            {formData.description.length}/200
          </Text>
        </View>

        {/* Menu Image */}
        <View style={styles.section}>
          <Text style={styles.label}>Menu Image</Text>
          
          {formData.image ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: formData.image }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={handleRemoveImage}
              >
                <Ionicons name="close-circle" size={24} color="#dc3545" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.imagePlaceholder}
              onPress={handleImagePicker}
              disabled={imageUploading}
            >
              {imageUploading ? (
                <ActivityIndicator size="small" color="#666" />
              ) : (
                <>
                  <Ionicons name="camera" size={32} color="#666" />
                  <Text style={styles.imagePlaceholderText}>
                    Tap to add image
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
          
          {formData.image && (
            <TouchableOpacity
              style={styles.changeImageButton}
              onPress={handleImagePicker}
              disabled={imageUploading}
            >
              <Text style={styles.changeImageText}>
                {imageUploading ? 'Uploading...' : 'Change Image'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Menu Status */}
        <View style={styles.section}>
          <View style={styles.switchContainer}>
            <Text style={styles.label}>Active Status</Text>
            <Switch
              value={formData.isActive}
              onValueChange={(value) => handleInputChange('isActive', value)}
              trackColor={{ false: '#767577', true: '#007AFF' }}
              thumbColor={formData.isActive ? '#fff' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.switchDescription}>
            {formData.isActive 
              ? 'Menu is visible to customers' 
              : 'Menu is hidden from customers'
            }
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 16,
  },
  errorText: {
    color: '#721c24',
    fontSize: 14,
    marginLeft: 8,
  },
  fieldError: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  imageContainer: {
    position: 'relative',
    alignSelf: 'center',
  },
  image: {
    width: 200,
    height: 150,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: 200,
    height: 150,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#f9f9f9',
  },
  imagePlaceholderText: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
  changeImageButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  changeImageText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  bottomPadding: {
    height: 40,
  },
}); 