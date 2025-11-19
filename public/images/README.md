# Product Images Guide

## Current Images
The following images are already in this directory:
- `coffee-espresso.jpg` - Used for Espresso Solo, Espresso Doppio
- `coffee-cappuccino.jpg` - Used for Cappuccino
- `coffee-coldbrew.jpg` - Used for Cold Brew variants
- `pastry-croissant.jpg` - Used for Butter Croissant
- `cookie-chocolate.jpg` - Used for cookies

## Adding New Images

### Step 1: Add Image Files
Place your product images in this directory (`/public/images/`) with descriptive names:
- `coffee-latte.jpg`
- `matcha-latte-hot.jpg`
- `pizza-margherita.jpg`
- `dessert-tiramisu.jpg`
- etc.

**Recommended specifications:**
- Format: JPG, PNG, or WebP
- Size: 400x400px minimum (square aspect ratio works best)
- Quality: High quality, well-lit product photos

### Step 2: Update Image Mapping
Edit `/src/lib/product-images.ts` and update the `productImages` object:

```typescript
export const productImages: Record<string, string> = {
  "Cafe Latte": "/images/coffee-latte.jpg",  // Your new image
  "Japanese Matcha Latte (Hot)": "/images/matcha-latte-hot.jpg",
  // ... etc
};
```

### Step 3: Test
After adding images, restart your dev server and check that images load correctly.

## Image Naming Convention
For consistency, use this naming pattern:
- Coffee items: `coffee-{name}.jpg` (e.g., `coffee-latte.jpg`)
- Matcha items: `matcha-{name}.jpg` (e.g., `matcha-latte-hot.jpg`)
- Pizzas: `pizza-{name}.jpg` (e.g., `pizza-margherita.jpg`)
- Desserts: `dessert-{name}.jpg` (e.g., `dessert-tiramisu.jpg`)
- Pastries: `pastry-{name}.jpg` (e.g., `pastry-cinnamon-roll.jpg`)

## Current Status
Most products are using Unsplash placeholder images. Replace them with your actual product photos for the best user experience.


