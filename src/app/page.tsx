"use client";

import { useState, Suspense, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { CartProvider } from "@/contexts/CartContext";
import { LaunchScreen } from "@/components/LaunchScreen";
import { AuthScreen } from "@/components/AuthScreen";
import { MenuScreen } from "@/components/MenuScreen";
import { CartScreen } from "@/components/CartScreen";
import { CheckoutScreen } from "@/components/CheckoutScreen";
import { OrderTrackingScreen } from "@/components/OrderTrackingScreen";
import { validateAndRefreshSession, startSessionMonitoring, getCustomerSession } from "@/lib/customerSession";

type AppScreen = "launch" | "auth" | "menu" | "cart" | "checkout" | "tracking";

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("launch");
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = getCustomerSession();
        
        if (session) {
          // Validate session (checks expiration and table status)
          const isValid = await validateAndRefreshSession();
          
          if (isValid) {
            // Session is valid, skip auth and go to menu
            setCurrentScreen("menu");
          } else {
            // Session expired or table is idle, show auth
            setCurrentScreen("auth");
          }
        } else {
          // No session, show auth
          setCurrentScreen("auth");
        }
      } catch (error) {
        console.error("Error checking session:", error);
        setCurrentScreen("auth");
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();

    // Start session monitoring
    const cleanup = startSessionMonitoring();

    // Listen for session expiration events
    const handleSessionExpired = () => {
      setCurrentScreen("auth");
    };
    window.addEventListener("customer_session_expired", handleSessionExpired);

    // Listen for logout events
    const handleLogout = () => {
      setCurrentScreen("auth");
    };
    window.addEventListener("customer_logout", handleLogout);

    return () => {
      cleanup();
      window.removeEventListener("customer_session_expired", handleSessionExpired);
      window.removeEventListener("customer_logout", handleLogout);
    };
  }, []);

  // Show loading while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cafe-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cafe-dark/70">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <CartProvider>
      <div className="relative min-h-screen overflow-hidden">
        <AnimatePresence mode="wait">
          {currentScreen === "launch" && (
            <LaunchScreen
              key="launch"
              onComplete={async () => {
                // Check session after launch screen
                const session = getCustomerSession();
                if (session) {
                  const isValid = await validateAndRefreshSession();
                  if (isValid) {
                    setCurrentScreen("menu");
                  } else {
                    setCurrentScreen("auth");
                  }
                } else {
                  setCurrentScreen("auth");
                }
              }}
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
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
              <CheckoutScreen
                key="checkout"
                onBack={() => setCurrentScreen("cart")}
                onComplete={() => setCurrentScreen("tracking")}
              />
            </Suspense>
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