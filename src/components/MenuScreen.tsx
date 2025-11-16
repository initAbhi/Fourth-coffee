"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingCart, X, Plus, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { products, categories, milkOptions, sizeOptions, type Product } from "@/lib/products";
import { useCart } from "@/contexts/CartContext";
import Image from "next/image";

interface MenuScreenProps {
  onCartClick: () => void;
}

export function MenuScreen({ onCartClick }: MenuScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState("Small");
  const [selectedMilk, setSelectedMilk] = useState("Whole Milk");
  const [notes, setNotes] = useState("");
  const { addItem, itemCount } = useCart();

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const popularProducts = products.filter((p) => p.popular);

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    const sizePrice = sizeOptions.find((s) => s.name === selectedSize)?.price || 0;
    const finalPrice = selectedProduct.price + sizePrice;

    addItem({
      id: `${selectedProduct.id}-${selectedSize}-${selectedMilk}`,
      name: selectedProduct.name,
      price: finalPrice,
      image: selectedProduct.image,
      size: selectedSize,
      milk: selectedMilk,
      notes: notes || undefined,
    });

    setSelectedProduct(null);
    setNotes("");
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-cafe-dark">Café Bliss</h1>
              <p className="text-cafe-dark/70 text-sm">Choose your perfect brew</p>
            </div>
            <Button
              size="icon"
              className="relative bg-cafe-dark hover:bg-cafe-gold rounded-full h-12 w-12"
              onClick={onCartClick}
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold"
                >
                  {itemCount}
                </motion.div>
              )}
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cafe-gold" />
            <Input
              type="search"
              placeholder="Search coffee, tea, pastries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 border-cafe-cream focus:border-cafe-gold rounded-xl"
            />
          </div>
        </div>
      </div>

      <div className="px-6 pt-6">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-6">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              className={`rounded-full whitespace-nowrap transition-smooth ${
                selectedCategory === category.id
                  ? "bg-cafe-dark text-white hover:bg-cafe-gold"
                  : "border-cafe-cream hover:border-cafe-gold"
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </Button>
          ))}
        </div>

        {/* Popular Carousel */}
        {selectedCategory === "all" && !searchQuery && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-cafe-dark mb-4">Popular Picks ⭐</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {popularProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="min-w-[280px] cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  <Card className="overflow-hidden cafe-shadow-md hover:cafe-shadow-lg transition-smooth">
                    <div className="relative h-40">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                      {product.new && (
                        <Badge className="absolute top-2 right-2 bg-cafe-gold">
                          New
                        </Badge>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-cafe-dark">{product.name}</h3>
                      <p className="text-sm text-cafe-dark/70 line-clamp-1">{product.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-lg font-bold text-cafe-gold">${product.price.toFixed(2)}</span>
                        <Button size="sm" className="rounded-full bg-cafe-dark hover:bg-cafe-gold">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div>
          <h2 className="text-xl font-bold text-cafe-dark mb-4">
            {searchQuery ? "Search Results" : "All Items"}
          </h2>
          <div className="grid grid-cols-2 gap-4 pb-6">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedProduct(product)}
                className="cursor-pointer"
              >
                <Card className="overflow-hidden cafe-shadow-sm hover:cafe-shadow-md transition-smooth">
                  <div className="relative h-32">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                    {product.new && (
                      <Badge className="absolute top-2 right-2 bg-cafe-gold text-xs">
                        New
                      </Badge>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-cafe-dark text-sm line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-cafe-dark/70 line-clamp-1 mb-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-cafe-gold">
                        ${product.price.toFixed(2)}
                      </span>
                      <Button size="sm" className="h-7 w-7 p-0 rounded-full bg-cafe-dark hover:bg-cafe-gold">
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="sr-only">{selectedProduct.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative h-64 -mx-6 -mt-6 mb-4">
                  <Image
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-cafe-dark mb-2">
                    {selectedProduct.name}
                  </h2>
                  <p className="text-cafe-dark/70">{selectedProduct.description}</p>
                </div>

                {/* Size Selection */}
                {selectedProduct.category === "coffee" || selectedProduct.category === "tea" ? (
                  <>
                    <div>
                      <Label className="text-cafe-dark font-semibold mb-2 block">Size</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {sizeOptions.map((size) => (
                          <Button
                            key={size.name}
                            variant={selectedSize === size.name ? "default" : "outline"}
                            className={`${
                              selectedSize === size.name
                                ? "bg-cafe-dark text-white"
                                : "border-cafe-cream"
                            }`}
                            onClick={() => setSelectedSize(size.name)}
                          >
                            {size.name}
                            {size.price > 0 && (
                              <span className="text-xs ml-1">+${size.price}</span>
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Milk Selection */}
                    <div>
                      <Label className="text-cafe-dark font-semibold mb-2 block">Milk Type</Label>
                      <Select value={selectedMilk} onValueChange={setSelectedMilk}>
                        <SelectTrigger className="border-cafe-cream">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {milkOptions.map((milk) => (
                            <SelectItem key={milk} value={milk}>
                              {milk}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : null}

                {/* Notes */}
                <div>
                  <Label className="text-cafe-dark font-semibold mb-2 block">
                    Special Instructions (Optional)
                  </Label>
                  <Textarea
                    placeholder="e.g., Extra hot, no foam..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="border-cafe-cream resize-none"
                    rows={3}
                  />
                </div>

                {/* Price & Add Button */}
                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-sm text-cafe-dark/70">Total</p>
                    <p className="text-3xl font-bold text-cafe-gold">
                      $
                      {(
                        selectedProduct.price +
                        (sizeOptions.find((s) => s.name === selectedSize)?.price || 0)
                      ).toFixed(2)}
                    </p>
                  </div>
                  <Button
                    size="lg"
                    className="bg-cafe-dark hover:bg-cafe-gold text-white px-8 rounded-xl"
                    onClick={handleAddToCart}
                  >
                    Add to Cart
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
