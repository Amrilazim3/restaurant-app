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
import { menuService } from '@/services/menuService';
import { Food, Menu } from '@/types/menu';
import { imageService } from '@/services/imageService';

interface FoodFormData {
  name: string;
  description: string;
  price: string;
  menuId: string;
  image?: string;
  imagePath?: string;
  ingredients: string[];
  allergens: string[];
  isAvailable: boolean;
  isActive: boolean;
}

interface FormErrors {
  name?: string;
  description?: string;
  price?: string;
  menuId?: string;
  ingredients?: string;
  allergens?: string;
  general?: string;
}

export default function AdminFoodFormScreen() {
  const { id, menuId } = useLocalSearchParams<{ id?: string; menuId?: string }>();
  const isEditing = !!id;

  const [formData, setFormData] = useState<FoodFormData>({
    name: '',
    description: '',
    price: '',
    menuId: menuId || '',
    image: '',
    imagePath: '',
    ingredients: [],
    allergens: [],
    isAvailable: true,
    isActive: true,
  });
  
  const [menus, setMenus] = useState<Menu[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);
  const [newIngredient, setNewIngredient] = useState('');
  const [newAllergen, setNewAllergen] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setInitialLoading(true);
      
      // Load menus
      const allMenus = await menuService.getActiveMenus();
      setMenus(allMenus);
      
      // Load food data if editing
      if (isEditing && id) {
        const food = await menuService.getFoodById(id);
        if (food) {
          setFormData({
            name: food.name,
            description: food.description,
            price: food.price.toString(),
            menuId: food.menuId,
            image: food.image || '',
            imagePath: '',
            ingredients: food.ingredients || [],
            allergens: food.allergens || [],
            isAvailable: food.isAvailable,
            isActive: food.isActive,
          });
        } else {
          Alert.alert('Ralat', 'Makanan tidak dijumpai');
          router.back();
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Ralat', 'Gagal memuatkan data');
      router.back();
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (field: keyof FoodFormData, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const validation = menuService.validateFoodData({
      ...formData,
      price: parseFloat(formData.price),
    });
    
    const fieldErrors: FormErrors = {};
    
    if (!validation.isValid) {
      validation.errors.forEach(error => {
        if (error.includes('name')) fieldErrors.name = error;
        else if (error.includes('description')) fieldErrors.description = error;
        else if (error.includes('price')) fieldErrors.price = error;
        else if (error.includes('Menu')) fieldErrors.menuId = error;
        else fieldErrors.general = error;
      });
    }
    
    // Additional validation for price
    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      fieldErrors.price = 'Sila masukkan harga yang sah';
    }
    
    setErrors(fieldErrors);
    return Object.keys(fieldErrors).length === 0;
  };

  const handleImagePicker = () => {
    const options = ['Ambil Gambar', 'Pilih dari Galeri', 'Guna Gambar Contoh', 'Batal'];
    
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
      Alert.alert('Pilih Gambar', 'Pilih sumber gambar:', [
        { text: 'Ambil Gambar', onPress: () => pickImage('camera') },
        { text: 'Pilih dari Galeri', onPress: () => pickImage('gallery') },
        { text: 'Guna Gambar Contoh', onPress: () => usePlaceholderImage() },
        { text: 'Batal', style: 'cancel' },
      ]);
    }
  };

  const usePlaceholderImage = async () => {
    try {
      setImageUploading(true);
      
      const fileName = `food_${Date.now()}`;
      const placeholderUrl = imageService.getRandomPlaceholderImage('foods');
      const placeholderPath = `foods/${Date.now()}_${fileName}.jpg`;
      
      // Simulate upload delay for UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setFormData(prev => ({
        ...prev,
        image: placeholderUrl,
        imagePath: placeholderPath,
      }));
    } catch (error) {
      console.error('Error setting placeholder image:', error);
      Alert.alert('Ralat', 'Gagal menetapkan gambar contoh. Sila cuba lagi.');
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
        const fileName = `food_${Date.now()}`;
        
        const uploadResult = await imageService.uploadImage(
          asset.uri,
          'foods',
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
      Alert.alert('Ralat', 'Gagal memuat naik gambar. Sila cuba lagi.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = () => {
    Alert.alert(
      'Buang Gambar',
      'Adakah anda pasti mahu membuang gambar ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Buang',
          style: 'destructive',
          onPress: async () => {
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

  const addIngredient = () => {
    if (newIngredient.trim()) {
      const ingredients = [...formData.ingredients, newIngredient.trim()];
      handleInputChange('ingredients', ingredients);
      setNewIngredient('');
    }
  };

  const removeIngredient = (index: number) => {
    const ingredients = formData.ingredients.filter((_, i) => i !== index);
    handleInputChange('ingredients', ingredients);
  };

  const addAllergen = () => {
    if (newAllergen.trim()) {
      const allergens = [...formData.allergens, newAllergen.trim()];
      handleInputChange('allergens', allergens);
      setNewAllergen('');
    }
  };

  const removeAllergen = (index: number) => {
    const allergens = formData.allergens.filter((_, i) => i !== index);
    handleInputChange('allergens', allergens);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const foodData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        menuId: formData.menuId,
        image: formData.image || undefined,
        ingredients: formData.ingredients,
        allergens: formData.allergens,
        isAvailable: formData.isAvailable,
        isActive: formData.isActive,
      };
      
      if (isEditing) {
        await menuService.updateFood(id!, foodData);
        Alert.alert('Berjaya', 'Makanan berjaya dikemas kini');
      } else {
        await menuService.createFood(foodData);
        Alert.alert('Berjaya', 'Makanan berjaya dicipta');
      }
      
      router.back();
    } catch (error) {
      console.error('Error saving food:', error);
      Alert.alert('Ralat', 'Gagal menyimpan makanan. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Buang Perubahan',
      'Adakah anda pasti mahu membuang perubahan anda?',
      [
        { text: 'Teruskan Sunting', style: 'cancel' },
        {
          text: 'Buang',
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
        <Text style={styles.loadingText}>Memuatkan...</Text>
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
          <Text style={styles.cancelButtonText}>Batal</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditing ? 'Sunting Makanan' : 'Cipta Makanan'}
        </Text>
        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Simpan</Text>
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

        {/* Food Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Nama Makanan *</Text>
                      <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Masukkan nama makanan"
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              maxLength={100}
            />
          {errors.name && (
            <Text style={styles.fieldError}>{errors.name}</Text>
          )}
          <Text style={styles.charCount}>
            {formData.name.length}/100
          </Text>
        </View>

        {/* Menu Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Menu *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {menus.map(menu => (
              <TouchableOpacity
                key={menu.id}
                style={[
                  styles.menuOption,
                  formData.menuId === menu.id && styles.menuOptionSelected
                ]}
                onPress={() => handleInputChange('menuId', menu.id)}
              >
                <Text style={[
                  styles.menuOptionText,
                  formData.menuId === menu.id && styles.menuOptionTextSelected
                ]}>
                  {menu.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {errors.menuId && (
            <Text style={styles.fieldError}>{errors.menuId}</Text>
          )}
        </View>

        {/* Price */}
        <View style={styles.section}>
          <Text style={styles.label}>Harga *</Text>
          <TextInput
            style={[styles.input, errors.price && styles.inputError]}
            placeholder="0.00"
            value={formData.price}
            onChangeText={(text) => handleInputChange('price', text)}
            keyboardType="decimal-pad"
          />
          {errors.price && (
            <Text style={styles.fieldError}>{errors.price}</Text>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Penerangan *</Text>
                      <TextInput
              style={[styles.textArea, errors.description && styles.inputError]}
              placeholder="Masukkan penerangan makanan"
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          {errors.description && (
            <Text style={styles.fieldError}>{errors.description}</Text>
          )}
          <Text style={styles.charCount}>
            {formData.description.length}/500
          </Text>
        </View>

        {/* Food Image */}
        <View style={styles.section}>
          <Text style={styles.label}>Gambar Makanan</Text>
          
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
                    Sentuh untuk tambah gambar
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
                {imageUploading ? 'Memuat naik...' : 'Tukar Gambar'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <Text style={styles.label}>Bahan-bahan</Text>
          <View style={styles.tagInputContainer}>
                          <TextInput
                style={styles.tagInput}
                placeholder="Tambah bahan"
                value={newIngredient}
                onChangeText={setNewIngredient}
                onSubmitEditing={addIngredient}
              />
            <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
              <Ionicons name="add" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.tagsContainer}>
            {formData.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{ingredient}</Text>
                <TouchableOpacity onPress={() => removeIngredient(index)}>
                  <Ionicons name="close" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Allergens */}
        <View style={styles.section}>
          <Text style={styles.label}>Alergen</Text>
          <View style={styles.tagInputContainer}>
                          <TextInput
                style={styles.tagInput}
                placeholder="Tambah alergen"
                value={newAllergen}
                onChangeText={setNewAllergen}
                onSubmitEditing={addAllergen}
              />
            <TouchableOpacity style={styles.addButton} onPress={addAllergen}>
              <Ionicons name="add" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.tagsContainer}>
            {formData.allergens.map((allergen, index) => (
              <View key={index} style={[styles.tag, styles.allergenTag]}>
                <Text style={styles.tagText}>{allergen}</Text>
                <TouchableOpacity onPress={() => removeAllergen(index)}>
                  <Ionicons name="close" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Availability */}
        <View style={styles.section}>
          <View style={styles.switchContainer}>
            <Text style={styles.label}>Tersedia</Text>
            <Switch
              value={formData.isAvailable}
              onValueChange={(value) => handleInputChange('isAvailable', value)}
              trackColor={{ false: '#767577', true: '#007AFF' }}
            />
          </View>
          <Text style={styles.switchDescription}>
            {formData.isAvailable 
              ? 'Makanan tersedia untuk tempahan' 
              : 'Makanan tidak tersedia buat sementara'
            }
          </Text>
        </View>

        {/* Active Status */}
        <View style={styles.section}>
          <View style={styles.switchContainer}>
            <Text style={styles.label}>Status Aktif</Text>
            <Switch
              value={formData.isActive}
              onValueChange={(value) => handleInputChange('isActive', value)}
              trackColor={{ false: '#767577', true: '#007AFF' }}
            />
          </View>
          <Text style={styles.switchDescription}>
            {formData.isActive 
              ? 'Makanan kelihatan kepada pelanggan' 
              : 'Makanan disembunyikan dari pelanggan'
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
  menuOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  menuOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  menuOptionText: {
    fontSize: 14,
    color: '#666',
  },
  menuOptionTextSelected: {
    color: '#fff',
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
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  allergenTag: {
    backgroundColor: '#fff3cd',
  },
  tagText: {
    fontSize: 14,
    color: '#333',
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