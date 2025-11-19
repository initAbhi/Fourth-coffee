/**
 * Product Image Mapping
 * 
 * To add your own images:
 * 1. Place images in /public/images/ directory
 * 2. Update the mapping below with your image paths
 * 3. Images should be in .jpg, .png, or .webp format
 * 4. Recommended size: 400x400px or larger (square aspect ratio)
 */

export const productImages: Record<string, string> = {
  // Coffee Classics - Use local images if available, otherwise Unsplash
  "Espresso Solo": "/images/coffee-espresso.jpg",
  "Espresso Doppio": "/images/coffee-espresso.jpg",
  "Americano": "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&q=80",
  "Cappuccino": "/images/coffee-cappuccino.jpg",
  "Cafe Latte": "https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400&q=80",
  "Flat White": "https://images.unsplash.com/photo-1545665225-b23b99e4d45e?w=400&q=80",
  "Macchiato": "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&q=80",
  "Cortado": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80",
  "Piccolo Latte": "https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400&q=80",
  "Mocha Latte": "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&q=80",
  "Affogato": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80",
  
  // Matcha & Wellness
  "Japanese Matcha Latte (Hot)": "https://images.unsplash.com/photo-1536013406218-29f0e36a2fa3?w=400&q=80",
  "Japanese Matcha Latte (Cold)": "https://images.unsplash.com/photo-1536013406218-29f0e36a2fa3?w=400&q=80",
  "Matcha Vanilla Cloud": "https://images.unsplash.com/photo-1536013406218-29f0e36a2fa3?w=400&q=80",
  "Iced Matcha Espresso fusion": "https://images.unsplash.com/photo-1536013406218-29f0e36a2fa3?w=400&q=80",
  "Matcha Frappe": "https://images.unsplash.com/photo-1536013406218-29f0e36a2fa3?w=400&q=80",
  "Rose Matcha Latte": "https://images.unsplash.com/photo-1536013406218-29f0e36a2fa3?w=400&q=80",
  "Charcoal Latte": "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&q=80",
  "Turmeric Golden Latte": "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&q=80",
  
  // Speciality Brews
  "Cold Brew Black": "/images/coffee-coldbrew.jpg",
  "Cold Brew Sweet Cream": "/images/coffee-coldbrew.jpg",
  "Nitro Cold Brew": "/images/coffee-coldbrew.jpg",
  "Pour Over (Single Origin)": "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&q=80",
  "French Press": "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&q=80",
  "AeroPress": "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&q=80",
  
  // Fourth Signatures
  "The Fourth Blend": "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&q=80",
  "Work Brew Cold Coffee": "/images/coffee-coldbrew.jpg",
  "Midday Mocha Rush": "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&q=80",
  "Hazelnut Harmony": "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&q=80",
  "The Velvet Nitro": "/images/coffee-coldbrew.jpg",
  
  // Chillers & Frappes
  "Classic Cold Coffee": "/images/coffee-coldbrew.jpg",
  "Belgian Chocolate Frappe": "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&q=80",
  "Vanilla Caramel Frappe": "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&q=80",
  "Biscoff Shake": "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&q=80",
  "Mocha Frost": "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&q=80",
  "Iced Hazelnut Frappe": "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&q=80",
  "Tiramisu Shake": "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&q=80",
  
  // Artisan Pizzas
  "Margherita Classico": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80",
  "Truffle Mushroom": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80",
  "Pesto & Sundried Tomatoes": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80",
  "Smoked Chicken BBQ": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80",
  "Pepperoni & Cheese melt": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80",
  
  // Desserts
  "Tiramisu Jar": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80",
  "Biscoff Cheesecake": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80",
  "Nutella Mousse Pot": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80",
  "Banoffee Jar": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80",
  "Chocolate Overload Slice": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80",
  "Hazelnut Crunch": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80",
  "Banana Walnut Cake": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80",
  "Brownie Classic": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80",
  "Brownie Walnut": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80",
  
  // Bakes & Patisserie
  "Butter Croissant": "/images/pastry-croissant.jpg",
  "Almond Croissant": "https://images.unsplash.com/photo-1623334044303-241021148842?w=400&q=80",
  "Pain au Chocolat": "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80",
  "Cinnamon Roll": "https://images.unsplash.com/photo-1611689106307-40c2e65f5e1e?w=400&q=80",
  "Blueberry Muffin": "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400&q=80",
};

/**
 * Get image URL for a product
 * Falls back to a default coffee image if not found
 */
export const getProductImage = (productName: string): string => {
  return productImages[productName] || "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&q=80";
};


