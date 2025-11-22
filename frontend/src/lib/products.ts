export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  calories: number;
  category: string;
  popular?: boolean;
  new?: boolean;
}

export const categories = [
  { id: "All", name: "All" },
  { id: "Coffee", name: "Coffee" },
  { id: "Cold Brew", name: "Cold Brew" },
  { id: "Pastries", name: "Pastries" },
  { id: "Cookies", name: "Cookies" },
];

export const products: Product[] = [
  {
    id: 1,
    name: "Classic Espresso",
    description: "Rich and bold single-origin espresso",
    price: 120,
    image: "/images/coffee-espresso.jpg",
    calories: 5,
    category: "Coffee",
    popular: true,
  },
  {
    id: 2,
    name: "Cappuccino",
    description: "Creamy espresso with steamed milk",
    price: 150,
    image: "/images/coffee-cappuccino.jpg",
    calories: 120,
    category: "Coffee",
    popular: true,
  },
  {
    id: 3,
    name: "Cold Brew",
    description: "Smooth, refreshing cold-steeped coffee",
    price: 180,
    image: "/images/coffee-coldbrew.jpg",
    calories: 15,
    category: "Cold Brew",
    popular: true,
  },
  {
    id: 4,
    name: "Butter Croissant",
    description: "Flaky, buttery French pastry",
    price: 100,
    image: "/images/pastry-croissant.jpg",
    calories: 280,
    category: "Pastries",
    popular: true,
  },
  {
    id: 5,
    name: "Chocolate Chip Cookie",
    description: "Freshly baked with premium chocolate",
    price: 80,
    image: "/images/cookie-chocolate.jpg",
    calories: 220,
    category: "Cookies",
    popular: true,
  },
];

export const milkOptions = [
  { name: "Regular", price: 0 },
  { name: "Soy Milk", price: 10 },
  { name: "Almond Milk", price: 15 },
  { name: "Oat Milk", price: 20 },
];

export const sizeOptions = [
  { name: "Small", price: -20 },
  { name: "Regular", price: 0 },
  { name: "Large", price: 30 },
];
