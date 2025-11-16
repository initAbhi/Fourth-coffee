"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Phone, ArrowRight } from "lucide-react";
import Image from "next/image";

interface AuthScreenProps {
  onComplete: () => void;
}

export function AuthScreen({ onComplete }: AuthScreenProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
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
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setIsLoading(false);
    setStep("otp");
    toast.success("Verification code sent!");
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
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    toast.success("Welcome to Fourth Coffee! 🎉");
    onComplete();
  };

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
