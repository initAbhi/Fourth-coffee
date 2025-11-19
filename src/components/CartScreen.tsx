"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Minus, Trash2, CreditCard, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import Image from "next/image";

interface CartScreenProps {
  onBack: () => void;
  onCheckout: () => void;
}

export function CartScreen({ onBack, onCheckout }: CartScreenProps) {
  const { items, updateQuantity, removeItem, total, itemCount } = useCart();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-cafe-dark">Your Cart</h1>
            <p className="text-sm text-cafe-dark/70">{itemCount} items</p>
          </div>
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 px-6 py-6 overflow-y-auto">
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <div className="text-8xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-cafe-dark mb-2">Your cart is empty</h2>
            <p className="text-cafe-dark/70 mb-6">Add some delicious items to get started!</p>
            <Button
              onClick={onBack}
              className="bg-cafe-dark hover:bg-cafe-gold rounded-xl"
            >
              Browse Menu
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4 pb-32">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  layout
                >
                  <Card className="p-4 cafe-shadow-sm">
                    <div className="flex gap-4">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-cafe-dark">{item.name}</h3>
                        {item.size && (
                          <p className="text-xs text-cafe-dark/70">
                            {item.size} • {item.milk}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-xs text-cafe-dark/60 line-clamp-1">
                            Note: {item.notes}
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 rounded-full"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center font-semibold">
                              {item.quantity}
                            </span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 rounded-full"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-cafe-gold">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-500 hover:text-red-600"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Checkout Footer */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border px-6 py-4 cafe-shadow-lg">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-cafe-dark/70">Subtotal</span>
                <span className="font-semibold">₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-cafe-dark/70">Tax (8%)</span>
                <span className="font-semibold">₹{(total * 0.08).toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-bold text-cafe-dark">Total</span>
                <span className="text-2xl font-bold text-cafe-gold">
                  ₹{(total * 1.08).toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full h-14 bg-cafe-dark hover:bg-cafe-gold text-white text-lg font-semibold rounded-xl transition-smooth"
              onClick={onCheckout}
            >
              Proceed to Checkout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
