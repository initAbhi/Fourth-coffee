"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Coffee } from "lucide-react";
import { toast } from "sonner";

export default function CashierLoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showMontage, setShowMontage] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId.trim() || !password.trim()) {
      toast.error("Please enter both User ID and password");
      return;
    }

    setIsLoading(true);

    // Simulate authentication
    setTimeout(() => {
      // For demo: accept any credentials
      if (userId && password) {
        // Store cashier session
        localStorage.setItem("cashier_session", JSON.stringify({
          userId,
          name: "John Doe",
          cashierId: Math.floor(Math.random() * 100) + 1,
          loginTime: new Date().toISOString()
        }));

        // Show brand montage
        setShowMontage(true);
        setIsLoading(false);

        // Navigate to dashboard after montage
        setTimeout(() => {
          router.push("/cashier");
        }, 2500);
      } else {
        setIsLoading(false);
        toast.error("Invalid ID or password. Try again.");
      }
    }, 1000);
  };

  if (showMontage) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-gradient-to-br from-[#563315] to-[#f0ddb6] flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <motion.div
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <Coffee size={80} className="text-[#f0ddb6] mx-auto mb-4" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-2xl font-bold text-[#f0ddb6]"
          >
            Welcome to Café Bliss
          </motion.p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#563315] to-[#f0ddb6] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Coffee size={96} className="text-[#563315]" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-[#563315] text-center mb-2">
          Cashier Login
        </h1>

        {/* Form Container */}
        <div className="bg-white rounded-xl shadow-[0_4px_16px_rgba(86,51,21,0.15)] p-8 mt-6">
          <form onSubmit={handleSubmit}>
            {/* User ID Field */}
            <div className="mb-6">
              <label
                htmlFor="userId"
                className="block text-sm font-medium text-[#563315] mb-1.5"
              >
                User ID
              </label>
              <input
                id="userId"
                type="text"
                placeholder="Enter your ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                autoFocus
                className="w-full h-12 px-3 text-sm border border-[#563315]/30 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88933] focus:border-[#b88933] transition-all"
              />
            </div>

            {/* Password Field */}
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#563315] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 px-3 pr-10 text-sm border border-[#563315]/30 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88933] focus:border-[#b88933] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#563315]/60 hover:text-[#563315] transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !userId.trim() || !password.trim()}
              className="w-full h-13 bg-[#563315] text-[#f0ddb6] font-bold text-base rounded-md hover:bg-[#6d4522] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-3 border-[#f0ddb6]/30 border-t-[#f0ddb6] rounded-full animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>

            {/* Forgot Password */}
            <div className="text-center mt-4">
              <a
                href="#"
                className="text-sm text-[#b88933] hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info("Please contact your manager for password reset");
                }}
              >
                Forgot Password?
              </a>
            </div>

            {/* Footer Text */}
            <p className="text-xs text-[#563315]/50 text-center mt-6">
              Need help? Contact manager
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
