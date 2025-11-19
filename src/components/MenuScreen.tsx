"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Plus, ShoppingCart, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { milkOptions, sizeOptions } from "@/lib/products";
import { useCart } from "@/contexts/CartContext";
import Image from "next/image";
import { ProductDetailModal } from "./ProductDetailModal";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  calories: number;
  category: string;
  popular?: boolean;
  new?: boolean;
}

interface MenuScreenProps {
  onCartClick: () => void;
}

export function MenuScreen({ onCartClick }: MenuScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{id: string; name: string}>>([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem, addItemWithQuantity, itemCount, total } = useCart();

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load products
        const productsRes = await apiClient.getProducts();
        if (productsRes.success && productsRes.data) {
          setProducts(productsRes.data);
        }
        
        // Load categories
        const categoriesRes = await apiClient.getCategories();
        if (categoriesRes.success && categoriesRes.data) {
          const allCategories = [{ id: "All", name: "All" }, ...categoriesRes.data];
          setCategories(allCategories);
        }
        
        // Load customer loyalty points
        const sessionStr = localStorage.getItem("customer_session");
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          if (session.loyaltyPoints) {
            setLoyaltyPoints(session.loyaltyPoints.points || 0);
          }
        }
      } catch (error) {
        toast.error("Failed to load menu");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const recommendedProducts = products.filter((p) => p.popular).slice(0, 3);

  const handleQuickAdd = (product: Product) => {
    addItem({
      id: `${product.id}-Regular-Regular`,
      name: product.name,
      price: product.price,
      image: product.image,
    });
  };

  const handleAddToCart = (product: Product, quantity: number, milkType: string, size: string, note: string, sugarLevel?: string, temperature?: string) => {
    const milkPrice = milkOptions.find((m) => m.name === milkType)?.price || 0;
    const sizePrice = sizeOptions.find((s) => s.name === size)?.price || 0;
    const finalPrice = product.price + milkPrice + sizePrice;

    const itemId = `${product.id}-${size}-${milkType}-${sugarLevel || 'medium'}-${temperature || 'hot'}`;
    
    // Add the item with the specified quantity in a single call
    addItemWithQuantity({
      id: itemId,
      name: product.name,
      price: finalPrice,
      image: product.image,
      size: size,
      milk: milkType,
      notes: note || undefined,
      sugarLevel: sugarLevel || 'medium',
      temperature: temperature || 'hot',
    }, quantity);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cafe-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cafe-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-cafe-dark/70">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cafe-light pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-cafe-cream shadow-md h-[72px] flex items-center justify-between px-4">
        <div className="relative w-20 h-20">
          <Image
            src="/logo.png"
            alt="Fourth Coffee"
            fill
            className="object-contain"
            sizes="80px"
            priority
          />
        </div>
        
        <Button
          variant="ghost"
          onClick={() => window.location.href = "/points"}
          className="bg-cafe-gold text-white px-4 py-2 rounded-full font-semibold hover:bg-cafe-gold/90"
        >
          <Star className="w-4 h-4 mr-1 fill-current" />
          {loyaltyPoints} pts
        </Button>
      </header>

      {/* Search Bar */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cafe-dark/50" />
          <Input
            type="search"
            placeholder="Search for coffee, pastry, or combo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-12 bg-white border-2 border-cafe-gold/30 focus:border-cafe-gold rounded-xl"
          />
        </div>
      </div>

      {/* Recommended Section */}
      {!searchQuery && (
        <div className="px-4 py-4">
          <h2 className="text-xl font-bold text-cafe-dark mb-4">Recommended for You</h2>
          
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {recommendedProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="shrink-0 w-[280px] bg-white rounded-xl shadow-md hover:shadow-lg cursor-pointer transition-shadow"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="relative">
                  <div className="relative w-full h-[280px]">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover rounded-t-xl"
                      sizes="280px"
                    />
                  </div>
                  <Badge className="absolute top-2 right-2 bg-cafe-cream/90 text-cafe-dark text-xs">
                    {product.calories} cal
                  </Badge>
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-cafe-dark text-base mb-1">{product.name}</h3>
                  <p className="text-sm text-cafe-dark/70 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-cafe-gold">₹{product.price}</span>
                    <Button
                      size="icon"
                      variant="default"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAdd(product);
                      }}
                      className="hover:scale-110 bg-cafe-dark hover:bg-cafe-gold rounded-full h-10 w-10"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="px-4 py-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 min-w-max">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-5 py-2.5 rounded-full font-medium transition-all duration-200 whitespace-nowrap ${
                selectedCategory === category.id
                  ? "bg-cafe-dark text-white shadow-md"
                  : "bg-white text-cafe-dark/60 hover:bg-cafe-cream/50"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Menu Grid */}
      <div className="px-4 py-4">
        <h2 className="text-xl font-bold text-cafe-dark mb-4">
          {searchQuery ? "Search Results" : "All Items"}
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-md hover:shadow-lg cursor-pointer overflow-hidden transition-shadow"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="relative">
                <div className="relative w-full aspect-square">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </div>
                <Badge className="absolute top-2 right-2 bg-cafe-cream/90 text-cafe-dark text-xs">
                  {product.calories} cal
                </Badge>
              </div>
              
              <div className="p-3 bg-white">
                <h3 className="font-semibold text-cafe-dark text-sm mb-1 line-clamp-1">
                  {product.name}
                </h3>
                <span className="text-base font-bold text-cafe-gold">₹{product.price}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Floating Cart Button - Only show when cart is empty */}
      {itemCount === 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-6 right-6 z-30"
        >
          <Button
            size="icon"
            className="relative bg-cafe-dark hover:bg-cafe-gold rounded-full h-16 w-16 shadow-2xl hover:scale-110 transition-transform"
            onClick={onCartClick}
          >
            <ShoppingCart className="w-6 h-6" />
          </Button>
        </motion.div>
      )}

      {/* Sticky Cart Bar - Show when items are in cart */}
      {itemCount > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-4 left-4 right-4 h-16 bg-cafe-dark text-white flex items-center justify-between px-4 rounded-2xl shadow-2xl z-30"
          style={{ zIndex: 30 }}
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold">{itemCount} items</span>
          </div>
          <span className="text-lg font-bold">₹{total}</span>
          <Button
            variant="secondary"
            size="sm"
            className="font-semibold bg-cafe-gold hover:bg-cafe-gold/90 text-white rounded-xl"
            onClick={onCartClick}
          >
            View Cart
          </Button>
        </motion.div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
}
