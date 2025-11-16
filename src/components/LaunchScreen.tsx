"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface LaunchScreenProps {
  onComplete: () => void;
}

export function LaunchScreen({ onComplete }: LaunchScreenProps) {

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      onAnimationComplete={() => {
        setTimeout(onComplete, 1800);
      }}
    >
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src="/coffeebeans.mp4" type="video/mp4" />
        </video>
        
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="mb-6"
        >
          <div className="relative w-48 h-32 sm:w-64 sm:h-40 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Fourth Coffee"
              fill
              sizes="(max-width: 640px) 192px, 256px"
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          className="text-white/90 text-base sm:text-lg md:text-xl mb-8 font-medium drop-shadow-lg max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Premium Coffee Experience
        </motion.p>

        {/* Loading Indicator */}
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-white/80 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
