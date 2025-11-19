"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Phone, ArrowRight } from "lucide-react";
import Image from "next/image";
import { CoffeePouringScreen } from "./CoffeePouringScreen";
import { apiClient } from "@/lib/api";

interface AuthScreenProps {
  onComplete: () => void;
}

export function AuthScreen({ onComplete }: AuthScreenProps) {
  const [step, setStep] = useState<"phone" | "otp" | "pouring">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }
    setIsLoading(true);
    
    try {
      // Format phone number (add +91 if not present)
      let formattedPhone = phone.trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = formattedPhone.startsWith('91') ? `+${formattedPhone}` : `+91${formattedPhone}`;
      }
      
      // For now, skip OTP and directly login (in production, implement OTP)
      const response = await apiClient.customerLogin(formattedPhone);
      
      if (response.success && response.data) {
        // Store customer session
        localStorage.setItem("customer_session", JSON.stringify({
          sessionId: response.data.sessionId,
          customerId: response.data.customer.id,
          phone: response.data.customer.phone,
          name: response.data.customer.name,
          loyaltyPoints: response.data.loyaltyPoints,
          loginTime: new Date().toISOString()
        }));
        
        setIsLoading(false);
        // Skip OTP for now, go directly to pouring screen
        setStep("pouring");
        toast.success("Welcome to Fourth Coffee! 🎉");
      } else {
        throw new Error(response.error || "Login failed");
      }
    } catch (error) {
      setIsLoading(false);
      toast.error(error instanceof Error ? error.message : "Failed to login");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-submit when all filled
    if (index === 5 && value) {
      handleOtpSubmit(newOtp.join(""));
    }
  };

  const handleOtpSubmit = async (code: string) => {
    if (code.length !== 6) return;
    
    setIsLoading(true);
    
    // In production, verify OTP here
    // For now, just proceed
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    setIsLoading(false);
    toast.success("Welcome to Fourth Coffee! 🎉");
    setStep("pouring");
  };

  // Show coffee pouring screen after verification
  if (step === "pouring") {
    return (
      <CoffeePouringScreen onComplete={onComplete} />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 cafe-gradient">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-8">
          <motion.div
            className="inline-block mb-4"
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative w-40 h-24 sm:w-48 sm:h-32">
              <Image
                src="/logo.png"
                alt="Fourth Coffee"
                fill
                sizes="(max-width: 640px) 160px, 192px"
                className="object-contain"
                priority
              />
            </div>
          </motion.div>
          <h1 className="text-4xl font-bold text-cafe-dark mb-2">Welcome!</h1>
          <p className="text-cafe-dark/70">
            {step === "phone" 
              ? "Enter your phone to get started" 
              : "Enter the verification code"}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === "phone" ? (
            <motion.form
              key="phone"
              onSubmit={handlePhoneSubmit}
              className="bg-white rounded-3xl p-8 cafe-shadow-lg"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone" className="text-cafe-dark font-medium">
                    Phone Number
                  </Label>
                  <div className="relative mt-2">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cafe-gold" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-11 h-14 text-lg border-cafe-cream focus:border-cafe-gold"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 bg-cafe-dark hover:bg-cafe-gold text-white text-lg font-semibold rounded-xl transition-smooth"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "Sending..."
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>

              <p className="text-sm text-cafe-dark/60 text-center mt-6">
                We'll send you a verification code via SMS
              </p>
            </motion.form>
          ) : (
            <motion.div
              key="otp"
              className="bg-white rounded-3xl p-8 cafe-shadow-lg"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="space-y-6">
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      className="w-12 h-14 text-center text-2xl font-bold border-cafe-cream focus:border-cafe-gold"
                      disabled={isLoading}
                    />
                  ))}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-cafe-gold hover:text-cafe-dark"
                  onClick={() => setStep("phone")}
                  disabled={isLoading}
                >
                  Use a different number
                </Button>
              </div>

              {isLoading && (
                <motion.p
                  className="text-cafe-dark/70 text-center mt-4"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Verifying...
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
