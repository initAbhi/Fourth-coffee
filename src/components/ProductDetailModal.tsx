"use client";

import { useState, useEffect } from "react";
import { X, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { apiClient } from "@/lib/api";

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

interface ProductDetailModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, milkType: string, size: string, note: string, sugarLevel?: string, temperature?: string) => void;
}

const sugarOptions = [
  { name: "No Sugar", value: "none" },
  { name: "Less Sugar", value: "less" },
  { name: "Medium Sugar", value: "medium" },
  { name: "Extra Sugar", value: "extra" },
];

const temperatureOptions = [
  { name: "Hot", value: "hot" },
  { name: "Iced", value: "iced" },
  { name: "Room Temperature", value: "room" },
];

export function ProductDetailModal({ product, isOpen, onClose, onAddToCart }: ProductDetailModalProps) {
  const [milkType, setMilkType] = useState("Regular");
  const [size, setSize] = useState("Regular");
  const [sugarLevel, setSugarLevel] = useState("medium");
  const [temperature, setTemperature] = useState("hot");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [milkOptions, setMilkOptions] = useState<Array<{name: string; price: number}>>([]);
  const [sizeOptions, setSizeOptions] = useState<Array<{name: string; price: number}>>([]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const milkRes = await apiClient.getProductOptions("milk");
        if (milkRes.success && milkRes.data) {
          setMilkOptions(milkRes.data);
        }
        const sizeRes = await apiClient.getProductOptions("size");
        if (sizeRes.success && sizeRes.data) {
          setSizeOptions(sizeRes.data);
        }
      } catch (error) {
        console.error("Failed to load options");
      }
    };
    if (isOpen) {
      loadOptions();
    }
  }, [isOpen]);

  const calculatePrice = () => {
    const milkPrice = milkOptions.find((m) => m.name === milkType)?.price || 0;
    const sizePrice = sizeOptions.find((s) => s.name === size)?.price || 0;
    return (product.price + milkPrice + sizePrice) * quantity;
  };

  const handleAddToCart = () => {
    onAddToCart(product, quantity, milkType, size, note, sugarLevel, temperature);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom duration-300 max-w-[420px] mx-auto">
        <div className="bg-white rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-border/10 p-4 flex items-start gap-3 z-10">
            <div className="relative w-[72px] h-[72px] rounded-full overflow-hidden border-4 border-cafe-cream shrink-0">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="72px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-cafe-dark">{product.name}</h2>
              <p className="text-base text-cafe-gold font-semibold">₹{product.price}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-cafe-cream/50 flex items-center justify-center transition-colors shrink-0"
            >
              <X className="w-5 h-5 text-cafe-dark/60" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-6">
            {/* Description */}
            <p className="text-sm text-cafe-dark/80">{product.description}</p>

            {/* Milk Type */}
            <div>
              <h3 className="text-base font-semibold text-cafe-dark mb-3">Choose your milk</h3>
              <div className="space-y-2">
                {milkOptions.map((option) => (
                  <button
                    key={option.name}
                    onClick={() => setMilkType(option.name)}
                    className={`w-full h-12 rounded-lg border-2 transition-all duration-200 flex items-center justify-between px-4 ${
                      milkType === option.name
                        ? "border-cafe-gold bg-cafe-gold/10"
                        : "border-cafe-gold/30 hover:border-cafe-gold/50"
                    }`}
                  >
                    <span className="text-sm font-medium text-cafe-dark">
                      {option.name}
                      {option.price > 0 && ` (+₹${option.price})`}
                    </span>
                    {milkType === option.name && (
                      <div className="w-5 h-5 rounded-full bg-cafe-gold flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div>
              <h3 className="text-base font-semibold text-cafe-dark mb-3">Size</h3>
              <div className="space-y-2">
                {sizeOptions.map((option) => (
                  <button
                    key={option.name}
                    onClick={() => setSize(option.name)}
                    className={`w-full h-12 rounded-lg border-2 transition-all duration-200 flex items-center justify-between px-4 ${
                      size === option.name
                        ? "border-cafe-gold bg-cafe-gold/10"
                        : "border-cafe-gold/30 hover:border-cafe-gold/50"
                    }`}
                  >
                    <span className="text-sm font-medium text-cafe-dark">
                      {option.name}
                      {option.price !== 0 && ` (${option.price > 0 ? "+" : ""}₹${option.price})`}
                    </span>
                    {size === option.name && (
                      <div className="w-5 h-5 rounded-full bg-cafe-gold flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Sugar Level */}
            <div>
              <h3 className="text-base font-semibold text-cafe-dark mb-3">Sugar Level</h3>
              <div className="space-y-2">
                {sugarOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSugarLevel(option.value)}
                    className={`w-full h-12 rounded-lg border-2 transition-all duration-200 flex items-center justify-between px-4 ${
                      sugarLevel === option.value
                        ? "border-cafe-gold bg-cafe-gold/10"
                        : "border-cafe-gold/30 hover:border-cafe-gold/50"
                    }`}
                  >
                    <span className="text-sm font-medium text-cafe-dark">{option.name}</span>
                    {sugarLevel === option.value && (
                      <div className="w-5 h-5 rounded-full bg-cafe-gold flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Temperature */}
            <div>
              <h3 className="text-base font-semibold text-cafe-dark mb-3">Temperature</h3>
              <div className="space-y-2">
                {temperatureOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTemperature(option.value)}
                    className={`w-full h-12 rounded-lg border-2 transition-all duration-200 flex items-center justify-between px-4 ${
                      temperature === option.value
                        ? "border-cafe-gold bg-cafe-gold/10"
                        : "border-cafe-gold/30 hover:border-cafe-gold/50"
                    }`}
                  >
                    <span className="text-sm font-medium text-cafe-dark">{option.name}</span>
                    {temperature === option.value && (
                      <div className="w-5 h-5 rounded-full bg-cafe-gold flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Barista Notes */}
            <div>
              <h3 className="text-base font-semibold text-cafe-dark mb-3">
                Add a note for your barista
              </h3>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 100))}
                placeholder="e.g., Extra hot, less sugar..."
                className="min-h-[80px] border-2 border-cafe-gold/30 focus:border-cafe-gold rounded-lg resize-none"
                maxLength={100}
              />
              <p className="text-xs text-cafe-dark/50 text-right mt-1">
                {note.length}/100
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-border/10 p-4 flex items-center gap-4">
            {/* Quantity Selector */}
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity === 1}
                className="h-10 w-10"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-lg font-bold text-cafe-dark w-8 text-center">
                {quantity}
              </span>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setQuantity(Math.min(10, quantity + 1))}
                disabled={quantity === 10}
                className="h-10 w-10"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Add to Cart Button */}
            <Button
              size="lg"
              className="flex-1 font-semibold bg-cafe-dark hover:bg-cafe-gold text-white"
              onClick={handleAddToCart}
            >
              Add to Cart - ₹{calculatePrice()}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

