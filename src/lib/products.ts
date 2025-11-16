export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  popular?: boolean;
  new?: boolean;
}

export const categories = [
  { id: "all", name: "All", icon: "☕" },
  { id: "coffee", name: "Coffee", icon: "☕" },
  { id: "tea", name: "Tea", icon: "🍵" },
  { id: "pastries", name: "Pastries", icon: "🥐" },
  { id: "cold", name: "Cold Drinks", icon: "🧊" },
];

export const products: Product[] = [
  {
    id: "1",
    name: "Espresso",
    description: "Rich and bold, our signature espresso",
    price: 3.50,
    image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80",
    category: "coffee",
    popular: true,
  },
  {
    id: "2",
    name: "Cappuccino",
    description: "Perfectly balanced espresso and steamed milk",
    price: 4.50,
    image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80",
    category: "coffee",
    popular: true,
  },
  {
    id: "3",
    name: "Caramel Latte",
    description: "Smooth latte with sweet caramel syrup",
    price: 5.50,
    image: "https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400&q=80",
    category: "coffee",
    new: true,
  },
  {
    id: "4",
    name: "Flat White",
    description: "Velvety microfoam over double espresso",
    price: 4.75,
    image: "https://images.unsplash.com/photo-1545665225-b23b99e4d45e?w=400&q=80",
    category: "coffee",
  },
  {
    id: "5",
    name: "Matcha Latte",
    description: "Premium Japanese matcha with steamed milk",
    price: 5.25,
    image: "https://images.unsplash.com/photo-1536013406218-29f0e36a2fa3?w=400&q=80",
    category: "tea",
    popular: true,
  },
  {
    id: "6",
    name: "Chai Latte",
    description: "Spiced black tea with frothed milk",
    price: 4.75,
    image: "https://images.unsplash.com/photo-1578899952107-9d7d6f6c2007?w=400&q=80",
    category: "tea",
  },
  {
    id: "7",
    name: "Croissant",
    description: "Buttery, flaky French pastry",
    price: 3.75,
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80",
    category: "pastries",
    popular: true,
  },
  {
    id: "8",
    name: "Chocolate Muffin",
    description: "Double chocolate chip muffin",
    price: 4.25,
    image: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400&q=80",
    category: "pastries",
  },
  {
    id: "9",
    name: "Iced Americano",
    description: "Cold espresso over ice",
    price: 4.00,
    image: "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&q=80",
    category: "cold",
  },
  {
    id: "10",
    name: "Cold Brew",
    description: "Smooth, cold-steeped coffee",
    price: 4.50,
    image: "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400&q=80",
    category: "cold",
    new: true,
  },
  {
    id: "11",
    name: "Mocha",
    description: "Espresso with chocolate and steamed milk",
    price: 5.25,
    image: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&q=80",
    category: "coffee",
  },
  {
    id: "12",
    name: "Almond Croissant",
    description: "Croissant filled with almond cream",
    price: 4.50,
    image: "https://images.unsplash.com/photo-1623334044303-241021148842?w=400&q=80",
    category: "pastries",
    new: true,
  },
];

export const milkOptions = [
  "Whole Milk",
  "Oat Milk",
  "Almond Milk",
  "Soy Milk",
  "Coconut Milk",
];

export const sizeOptions = [
  { name: "Small", price: 0 },
  { name: "Medium", price: 0.75 },
  { name: "Large", price: 1.50 },
];
