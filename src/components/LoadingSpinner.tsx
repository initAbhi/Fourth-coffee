"use client";

import { motion } from "framer-motion";

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <motion.div
        className="w-12 h-12 border-4 border-cafe-cream border-t-cafe-gold rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

export function BrewingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <motion.div
        className="relative w-24 h-32"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Coffee cup */}
        <motion.div
          className="absolute bottom-0 w-24 h-24 bg-gradient-to-b from-cafe-cream to-cafe-gold rounded-b-3xl border-4 border-cafe-dark"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        />
        
        {/* Coffee liquid pouring */}
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-20 bg-gradient-to-b from-cafe-dark to-cafe-gold origin-top"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Steam */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute -top-2 w-3 h-3 bg-cafe-cream rounded-full blur-sm"
            style={{ left: `${30 + i * 15}%` }}
            animate={{
              y: [-10, -30],
              opacity: [0, 0.6, 0],
              scale: [1, 1.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </motion.div>
      
      <motion.p
        className="text-cafe-dark font-medium"
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Brewing your experience...
      </motion.p>
    </div>
  );
}
