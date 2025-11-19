"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Coffee, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Image from "next/image";

interface OrderTrackingScreenProps {
  onBackHome: () => void;
}

type OrderStatus = "preparing" | "ready" | "completed";

export function OrderTrackingScreen({ onBackHome }: OrderTrackingScreenProps) {
  const [orderStatus] = useState<OrderStatus>("preparing");

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
          <div className="relative w-24 h-24 mx-auto cafe-shadow-lg animate-float">
            <Image
              src="/logo.png"
              alt="Fourth Coffee"
              fill
              className="object-contain"
              sizes="96px"
              priority
            />
          </div>
        </motion.div>

        <h1 className="text-3xl font-bold text-cafe-dark mb-2">
          {orderStatus === "preparing" && "Order Received"}
          {orderStatus === "ready" && "Order Ready! 🎉"}
          {orderStatus === "completed" && "Enjoy Your Coffee! ☕"}
        </h1>
        <p className="text-cafe-dark/70">Order #12345</p>
      </div>

      <div className="px-6 space-y-6">
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
                    className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-smooth ${
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
                    <span className="font-semibold">₹5.25</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-cafe-dark/70">Croissant</span>
                    <span className="font-semibold">₹3.75</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between">
                    <span className="font-bold text-cafe-dark">Total</span>
                    <span className="font-bold text-cafe-gold">₹9.72</span>
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
