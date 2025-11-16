"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CreditCard, Smartphone, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/contexts/CartContext";
import confetti from "canvas-confetti";

interface CheckoutScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

export function CheckoutScreen({ onBack, onComplete }: CheckoutScreenProps) {
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { total, clearCart, itemCount } = useCart();

  const finalTotal = total * 1.08;

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    setShowSuccess(true);

    // Fire confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#563315", "#f0ddb6", "#b88933"],
    });

    // Clear cart and navigate to order tracking
    setTimeout(() => {
      clearCart();
      onComplete();
    }, 3000);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 cafe-gradient">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="text-center"
        >
          <motion.div
            className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.5, repeat: 3 }}
          >
            <Check className="w-16 h-16 text-white" />
          </motion.div>

          <h1 className="text-4xl font-bold text-cafe-dark mb-4">
            Payment Successful! 🎉
          </h1>
          <p className="text-lg text-cafe-dark/70 mb-8">
            Your order is being prepared
          </p>

          <motion.div
            className="inline-block"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <div className="text-6xl">☕</div>
          </motion.div>

          <p className="text-cafe-dark/70 mt-8">
            Redirecting to order tracking...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
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
            <h1 className="text-2xl font-bold text-cafe-dark">Checkout</h1>
            <p className="text-sm text-cafe-dark/70">{itemCount} items</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Order Summary */}
        <Card className="p-6 cafe-shadow-md">
          <h2 className="text-lg font-bold text-cafe-dark mb-4">Order Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-cafe-dark/70">Subtotal</span>
              <span className="font-semibold">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-cafe-dark/70">Tax (8%)</span>
              <span className="font-semibold">${(total * 0.08).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-cafe-dark/70">Service Fee</span>
              <span className="font-semibold">$0.00</span>
            </div>
            <div className="h-px bg-border my-3" />
            <div className="flex justify-between">
              <span className="font-bold text-cafe-dark">Total</span>
              <span className="text-2xl font-bold text-cafe-gold">
                ${finalTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </Card>

        {/* Payment Method */}
        <Card className="p-6 cafe-shadow-md">
          <h2 className="text-lg font-bold text-cafe-dark mb-4">Payment Method</h2>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="space-y-3">
              <Label
                htmlFor="card"
                className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-smooth ${
                  paymentMethod === "card"
                    ? "border-cafe-gold bg-cafe-cream/20"
                    : "border-border"
                }`}
              >
                <RadioGroupItem value="card" id="card" />
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 bg-cafe-dark rounded-full flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-cafe-dark">Credit/Debit Card</p>
                    <p className="text-sm text-cafe-dark/70">Visa, Mastercard, Amex</p>
                  </div>
                </div>
              </Label>

              <Label
                htmlFor="wallet"
                className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-smooth ${
                  paymentMethod === "wallet"
                    ? "border-cafe-gold bg-cafe-cream/20"
                    : "border-border"
                }`}
              >
                <RadioGroupItem value="wallet" id="wallet" />
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 bg-cafe-gold rounded-full flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-cafe-dark">Digital Wallet</p>
                    <p className="text-sm text-cafe-dark/70">Apple Pay, Google Pay</p>
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </Card>

        {/* Loyalty Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-cafe-gold to-cafe-accent text-white cafe-shadow-md"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">⭐</div>
            <div className="flex-1">
              <p className="font-semibold text-lg">Earn 50 Points!</p>
              <p className="text-sm opacity-90">
                Complete this order to earn loyalty rewards
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Payment Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border px-6 py-4 cafe-shadow-lg">
        <Button
          size="lg"
          className="w-full h-14 bg-cafe-dark hover:bg-cafe-gold text-white text-lg font-semibold rounded-xl transition-smooth disabled:opacity-50"
          onClick={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Processing Payment...
            </motion.span>
          ) : (
            `Pay $${finalTotal.toFixed(2)}`
          )}
        </Button>
      </div>
    </div>
  );
}
