"use client";

import { useState, useEffect, useCallback } from "react";
import { useCashier, OrderStatus } from "@/contexts/CashierContext";
import { motion } from "framer-motion";

interface FloorPlanProps {
  onSelectTable: (tableId: string) => void;
}

export const FloorPlan: React.FC<FloorPlanProps> = ({ onSelectTable }) => {
  const { tables, sendToKitchen, markServed } = useCashier();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filter, setFilter] = useState<"all" | "dine-in" | "takeaway" | "priority">("all");
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const gridCols = window.innerWidth >= 1920 ? 6 : window.innerWidth >= 1280 ? 5 : 4;
      
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, tables.length - 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + gridCols, tables.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - gridCols, 0));
      } else if (e.key === "Enter" && !showQuickActions) {
        e.preventDefault();
        onSelectTable(tables[selectedIndex].id);
      } else if (e.key === " ") {
        e.preventDefault();
        setShowQuickActions((prev) => !prev);
      } else if (e.key === "s" || e.key === "S") {
        if (showQuickActions) {
          sendToKitchen(tables[selectedIndex].id);
          setShowQuickActions(false);
        }
      } else if (e.key === "m" || e.key === "M") {
        if (showQuickActions) {
          markServed(tables[selectedIndex].id);
          setShowQuickActions(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tables, selectedIndex, showQuickActions, onSelectTable, sendToKitchen, markServed]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "idle":
        return "bg-[#e0e0e0] text-[#563315]";
      case "preparing":
        return "bg-[#f9a825] text-[#563315]";
      case "aging":
        return "bg-[#f57c00] text-white";
      case "critical":
        return "bg-[#d32f2f] text-white animate-pulse";
      case "served":
        return "bg-[#2e7d32] text-white";
      default:
        return "bg-[#e0e0e0] text-[#563315]";
    }
  };

  const formatTime = (startTime?: number) => {
    if (!startTime) return null;
    const elapsed = Date.now() - startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Filter Bar */}
      <div className="h-12 bg-white border-b border-[#e0e0e0] flex items-center px-5">
        <div className="flex gap-4">
          {["all", "dine-in", "takeaway", "priority"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as typeof filter)}
              className={`px-5 py-2 text-sm font-medium transition-all ${
                filter === f
                  ? "text-[#563315] border-b-3 border-[#b88933]"
                  : "text-[#563315]/60 hover:text-[#563315]"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "all" && ` (${tables.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Table Grid */}
      <div className="flex-1 overflow-auto p-5">
        <div className="grid grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 max-w-[1800px] mx-auto">
          {tables.map((table, index) => {
            const isSelected = index === selectedIndex;
            const statusColor = getStatusColor(table.status);
            const timer = formatTime(table.startTime);

            return (
              <motion.div
                key={table.id}
                whileHover={{ y: -4 }}
                onClick={() => onSelectTable(table.id)}
                className={`relative aspect-square min-h-[180px] rounded-lg shadow-[0_2px_8px_rgba(86,51,21,0.1)] p-4 cursor-pointer transition-all ${statusColor} ${
                  isSelected ? "ring-2 ring-[#b88933] ring-offset-2" : ""
                }`}
              >
                {/* Top Row */}
                <div className="flex items-start justify-between mb-2">
                  {/* Table Number */}
                  <div className="text-2xl font-bold">
                    {table.tableNumber}
                  </div>

                  {/* Item Count Badge */}
                  {table.items.length > 0 && (
                    <div className="w-7 h-7 rounded-full bg-white/90 border-2 border-current flex items-center justify-center text-sm font-bold">
                      {table.items.length}
                    </div>
                  )}
                </div>

                {/* Order Summary */}
                {table.items.length > 0 && (
                  <div className="text-xs opacity-80 line-clamp-2 mb-2">
                    {table.items.map((item) => item.name).join(", ")}
                  </div>
                )}

                {/* Empty State */}
                {table.status === "idle" && (
                  <div className="absolute inset-0 flex items-center justify-center text-sm opacity-60">
                    Available
                  </div>
                )}

                {/* Bottom Row */}
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  {/* Status Dot */}
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    table.status === "idle" ? "bg-[#9e9e9e]" :
                    table.status === "preparing" ? "bg-[#f57c00]" :
                    table.status === "aging" ? "bg-[#d32f2f]" :
                    table.status === "critical" ? "bg-white" :
                    "bg-white"
                  }`} />

                  {/* Timer */}
                  {timer && (
                    <div className="text-lg font-mono font-bold">
                      {timer}
                    </div>
                  )}

                  {/* Served Status */}
                  {table.status === "served" && (
                    <div className="text-xs">
                      ✓ Served
                    </div>
                  )}
                </div>

                {/* Quick Actions Menu */}
                {isSelected && showQuickActions && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full bg-white rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.2)] py-2 z-10 w-48">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sendToKitchen(table.id);
                        setShowQuickActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-[#563315] hover:bg-[#f0ddb6] transition-colors"
                    >
                      <span className="font-bold">S</span> - Send to Kitchen
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markServed(table.id);
                        setShowQuickActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-[#563315] hover:bg-[#f0ddb6] transition-colors"
                    >
                      <span className="font-bold">M</span> - Mark Served
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowQuickActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-[#563315] hover:bg-[#f0ddb6] transition-colors"
                    >
                      <span className="font-bold">W</span> - Flag Waste
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowQuickActions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-[#563315] hover:bg-[#f0ddb6] transition-colors"
                    >
                      <span className="font-bold">R</span> - Refund
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
