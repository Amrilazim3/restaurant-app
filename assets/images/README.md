# Adding Local Placeholder Images

This folder contains local images that can be used as placeholders for foods and menus in the admin forms.

## Folder Structure

```
assets/images/
├── foods/          # Placeholder images for food items
├── menus/          # Placeholder images for menu categories
└── README.md       # This file
```

## How to Add Local Images

1. **Add your image files** to the appropriate folder:
   - Food images → `assets/images/foods/`
   - Menu images → `assets/images/menus/`

2. **Supported image formats**: `.jpg`, `.jpeg`, `.png`, `.webp`

3. **Update `services/imageService.ts`**:
   - Open `services/imageService.ts`
   - Find the `PLACEHOLDER_IMAGES` constant
   - Add your local images using `require()`:

   ```typescript
   foods: [
     // Existing remote images...
     'https://images.unsplash.com/...',
     
     // Add your local images here:
     require('@/assets/images/foods/food1.jpg'),
     require('@/assets/images/foods/food2.jpg'),
     require('@/assets/images/foods/food3.png'),
   ],
   menus: [
     // Existing remote images...
     'https://images.unsplash.com/...',
     
     // Add your local images here:
     require('@/assets/images/menus/menu1.jpg'),
     require('@/assets/images/menus/menu2.jpg'),
   ]
   ```

## How It Works

- The system supports **both remote URLs and local images**
- Local images are automatically resolved to URIs using `Image.resolveAssetSource()`
- When `usePlaceholderImage()` is called, it randomly selects from all available images (both remote and local)
- The selected image works seamlessly with the existing `Image` component using `{ uri: ... }`

## Example

After adding images, when you click "Guna Gambar Contoh" (Use Example Image) in the admin forms, it will randomly pick from:
- All remote Unsplash images
- All your local images

Both types work the same way - no code changes needed in the form components!
