"use client";

import { motion } from "framer-motion";
import { BrewingAnimation } from "./LoadingSpinner";

interface LaunchScreenProps {
  onComplete: () => void;
}

export function LaunchScreen({ onComplete }: LaunchScreenProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center cafe-gradient"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.5 }}
      transition={{ duration: 0.6 }}
      onAnimationComplete={() => {
        setTimeout(onComplete, 2500);
      }}
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, type: "spring" }}
        className="mb-8"
      >
        <div className="w-32 h-32 bg-cafe-dark rounded-full flex items-center justify-center text-6xl cafe-shadow-lg">
          ☕
        </div>
      </motion.div>

      <motion.h1
        className="text-5xl font-bold text-cafe-dark mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        Café Bliss
      </motion.h1>

      <motion.p
        className="text-cafe-dark/70 text-lg mb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        Premium Coffee Experience
      </motion.p>

      <BrewingAnimation />
    </motion.div>
  );
}
