"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { CartProvider } from "@/contexts/CartContext";
import { LaunchScreen } from "@/components/LaunchScreen";
import { AuthScreen } from "@/components/AuthScreen";
import { MenuScreen } from "@/components/MenuScreen";
import { CartScreen } from "@/components/CartScreen";
import { CheckoutScreen } from "@/components/CheckoutScreen";
import { OrderTrackingScreen } from "@/components/OrderTrackingScreen";

type AppScreen = "launch" | "auth" | "menu" | "cart" | "checkout" | "tracking";

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("launch");

  return (
    <CartProvider>
      <div className="relative min-h-screen overflow-hidden">
        <AnimatePresence mode="wait">
          {currentScreen === "launch" && (
            <LaunchScreen
              key="launch"
              onComplete={() => setCurrentScreen("auth")}
            />
          )}

          {currentScreen === "auth" && (
            <AuthScreen
              key="auth"
              onComplete={() => setCurrentScreen("menu")}
            />
          )}

          {currentScreen === "menu" && (
            <MenuScreen
              key="menu"
              onCartClick={() => setCurrentScreen("cart")}
            />
          )}

          {currentScreen === "cart" && (
            <CartScreen
              key="cart"
              onBack={() => setCurrentScreen("menu")}
              onCheckout={() => setCurrentScreen("checkout")}
            />
          )}

          {currentScreen === "checkout" && (
            <CheckoutScreen
              key="checkout"
              onBack={() => setCurrentScreen("cart")}
              onComplete={() => setCurrentScreen("tracking")}
            />
          )}

          {currentScreen === "tracking" && (
            <OrderTrackingScreen
              key="tracking"
              onBackHome={() => setCurrentScreen("menu")}
            />
          )}
        </AnimatePresence>
      </div>
    </CartProvider>
  );
}