"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, Coffee, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface OrderTrackingScreenProps {
  onBackHome: () => void;
}

type OrderStatus = "preparing" | "ready" | "completed";

export function OrderTrackingScreen({ onBackHome }: OrderTrackingScreenProps) {
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("preparing");
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes in seconds
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (orderStatus === "preparing") {
            setOrderStatus("ready");
            return 60; // Reset to 1 minute for pickup
          } else if (orderStatus === "ready") {
            setOrderStatus("completed");
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [orderStatus]);

  useEffect(() => {
    if (orderStatus === "preparing") {
      setProgress((1 - timeRemaining / 180) * 50);
    } else if (orderStatus === "ready") {
      setProgress(50 + (1 - timeRemaining / 60) * 50);
    } else {
      setProgress(100);
    }
  }, [timeRemaining, orderStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const orderSteps = [
    {
      id: "preparing",
      title: "Order Received",
      description: "Your order is being prepared",
      icon: Coffee,
      active: orderStatus === "preparing",
      completed: orderStatus === "ready" || orderStatus === "completed",
    },
    {
      id: "ready",
      title: "Ready",
      description: "Your order is ready!",
      icon: CheckCircle2,
      active: orderStatus === "ready",
      completed: orderStatus === "completed",
    },
    {
      id: "completed",
      title: "Completed",
      description: "Enjoy your coffee!",
      icon: Home,
      active: orderStatus === "completed",
      completed: orderStatus === "completed",
    },
  ];

  return (
    <div className="min-h-screen bg-cafe-gradient pb-24">
      {/* Header */}
      <div className="px-6 py-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="inline-block mb-4"
        >
          <div className="w-24 h-24 bg-cafe-dark rounded-full flex items-center justify-center text-5xl cafe-shadow-lg animate-float">
            ☕
          </div>
        </motion.div>

        <h1 className="text-3xl font-bold text-cafe-dark mb-2">
          {orderStatus === "preparing" && "Estimated Time to serve"}
          {orderStatus === "ready" && "Order Ready! 🎉"}
          {orderStatus === "completed" && "Enjoy Your Coffee! ☕"}
        </h1>
        <p className="text-cafe-dark/70">Order #12345</p>
      </div>

      <div className="px-6 space-y-6">
        {/* Timer Card */}
        <AnimatePresence mode="wait">
          {orderStatus !== "completed" && (
            <motion.div
              key={orderStatus}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="p-8 text-center cafe-shadow-lg bg-white">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Clock className="w-6 h-6 text-cafe-gold" />
                  <span className="text-cafe-dark/70 font-medium">
                    {orderStatus === "preparing" ? "Estimated Time" : "Pick up within"}
                  </span>
                </div>
                <motion.div
                  className="text-6xl font-bold text-cafe-dark mb-6"
                  key={timeRemaining}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {formatTime(timeRemaining)}
                </motion.div>
                <Progress value={progress} className="h-3 mb-4" />
                <p className="text-sm text-cafe-dark/70">
                  {orderStatus === "preparing"
                    ? "Our baristas are crafting your perfect cup"
                    : "Your order is waiting for you at the counter"}
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Order Status Steps */}
        <Card className="p-6 cafe-shadow-md bg-white">
          <h2 className="text-lg font-bold text-cafe-dark mb-6">Order Progress</h2>
          <div className="space-y-4">
            {orderSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-smooth ${
                      step.completed
                        ? "bg-green-500 text-white"
                        : step.active
                        ? "bg-cafe-gold text-white animate-pulse-glow"
                        : "bg-cafe-cream text-cafe-dark/50"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 pt-2">
                    <h3
                      className={`font-semibold ${
                        step.active || step.completed
                          ? "text-cafe-dark"
                          : "text-cafe-dark/50"
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p
                      className={`text-sm ${
                        step.active || step.completed
                          ? "text-cafe-dark/70"
                          : "text-cafe-dark/40"
                      }`}
                    >
                      {step.description}
                    </p>
                  </div>
                  {step.completed && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-green-500"
                    >
                      <CheckCircle2 className="w-6 h-6" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </Card>

        {/* Order Details Accordion */}
        <Card className="cafe-shadow-md bg-white">
          <Accordion type="single" collapsible>
            <AccordionItem value="details" className="border-none">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <span className="font-bold text-cafe-dark">Order Details</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-cafe-dark/70">Cappuccino (Medium)</span>
                    <span className="font-semibold">$5.25</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-cafe-dark/70">Croissant</span>
                    <span className="font-semibold">$3.75</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between">
                    <span className="font-bold text-cafe-dark">Total</span>
                    <span className="font-bold text-cafe-gold">$9.72</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          {orderStatus === "completed" && (
            <Button
              size="lg"
              className="w-full h-14 bg-cafe-dark hover:bg-cafe-gold text-white text-lg font-semibold rounded-xl"
              onClick={onBackHome}
            >
              Order Again
            </Button>
          )}
          
          <Button
            size="lg"
            variant="outline"
            className="w-full h-14 border-2 border-cafe-dark text-cafe-dark hover:bg-cafe-cream text-lg font-semibold rounded-xl"
          >
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
}
