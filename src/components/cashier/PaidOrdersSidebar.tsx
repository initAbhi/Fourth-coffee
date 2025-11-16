"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Check, Eye, X, Printer } from "lucide-react";
import { useCashier } from "@/contexts/CashierContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface PaidOrdersSidebarProps {
  expanded: boolean;
  onToggle: () => void;
}

export const PaidOrdersSidebar: React.FC<PaidOrdersSidebarProps> = ({
  expanded,
  onToggle,
}) => {
  const { paidOrders, confirmPaidOrder, tables } = useCashier();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedTables, setSelectedTables] = useState<Record<string, string>>({});

  const handleConfirm = (orderId: string) => {
    const selectedTable = selectedTables[orderId];
    if (!selectedTable) {
      toast.error("Please select a table for this order");
      return;
    }

    confirmPaidOrder(orderId, selectedTable);
    toast.success(`Order sent to kitchen - KOT printed ✓`);
    setSelectedTables(prev => {
      const newState = { ...prev };
      delete newState[orderId];
      return newState;
    });
  };

  const formatTimeAgo = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return "Just now";
    if (minutes === 1) return "1 min ago";
    return `${minutes} min ago`;
  };

  if (!expanded) {
    return (
      <div className="w-16 bg-[#f0ddb6] border-l border-[#563315]/10 flex flex-col items-center py-4 relative">
        <div className="writing-mode-vertical text-sm font-medium text-[#563315] mb-4 rotate-180">
          Paid Orders
        </div>
        
        {paidOrders.length > 0 && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-8 h-8 rounded-full bg-[#d32f2f] text-white text-base font-bold flex items-center justify-center"
          >
            {paidOrders.length}
          </motion.div>
        )}

        <button
          onClick={onToggle}
          className="absolute bottom-4 p-2 hover:bg-[#b88933]/20 rounded transition-colors"
        >
          <ChevronLeft size={20} className="text-[#563315]" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-[360px] bg-white border-l border-[#e0e0e0] flex flex-col">
      {/* Header */}
      <div className="h-14 bg-white border-b border-[#e0e0e0] flex items-center justify-between px-4">
        <h2 className="text-base font-bold text-[#563315]">
          Incoming Orders
        </h2>
        <button
          onClick={onToggle}
          className="p-2 hover:bg-[#f0ddb6]/30 rounded transition-colors"
        >
          <ChevronRight size={20} className="text-[#563315]" />
        </button>
      </div>

      {/* Order List */}
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {paidOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="text-6xl mb-4 opacity-30">☕</div>
            <p className="text-sm font-medium text-[#563315]/60">No pending orders</p>
            <p className="text-xs text-[#563315]/50 mt-1">
              New paid orders will appear here
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {paidOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-lg shadow-[0_2px_8px_rgba(86,51,21,0.08)] p-4 space-y-3"
              >
                {/* Top Row */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-base font-bold text-[#563315]">
                      {order.orderNumber}
                    </div>
                    <div className="text-xs text-[#563315]/60">
                      {formatTimeAgo(order.receivedAt)}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      toast.error("Order rejected");
                    }}
                    className="text-[#d32f2f]/70 hover:text-[#d32f2f] transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Item Summary */}
                <div className="text-sm text-[#563315]/80 line-clamp-2">
                  {order.items.map((item) => 
                    `${item.quantity}× ${item.name}${item.modifiers ? ` (${item.modifiers.join(", ")})` : ""}`
                  ).join(", ")}
                </div>

                {/* Customer Info */}
                {order.customerPhone && (
                  <div className="text-xs text-[#563315]/70">
                    📞 {order.customerPhone}
                  </div>
                )}

                {/* Table Assignment */}
                <div>
                  <label className="block text-xs font-medium text-[#563315] mb-1">
                    Assign Table
                  </label>
                  <select
                    value={selectedTables[order.id] || ""}
                    onChange={(e) => setSelectedTables(prev => ({ ...prev, [order.id]: e.target.value }))}
                    className="w-full h-9 px-2 text-sm border border-[#b88933]/30 rounded focus:outline-none focus:ring-2 focus:ring-[#b88933]"
                  >
                    <option value="">Select table...</option>
                    {tables
                      .filter((t) => t.status === "idle")
                      .map((table) => (
                        <option key={table.id} value={table.tableNumber}>
                          {table.tableNumber}
                        </option>
                      ))}
                    <option value="Takeaway">🛍️ Takeaway</option>
                  </select>
                </div>

                {/* Payment Info */}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-[#563315]/70">
                    💳 {order.paymentMethod}
                  </div>
                  <div className="text-lg font-bold text-[#2e7d32]">
                    ₹{order.total}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleConfirm(order.id)}
                    disabled={!selectedTables[order.id]}
                    className="flex-1 h-10 bg-[#2e7d32] text-white rounded-md font-medium text-sm hover:bg-[#256029] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    <Check size={16} />
                    Confirm & Send to Kitchen
                  </button>
                  <button
                    onClick={() => setExpandedOrderId(
                      expandedOrderId === order.id ? null : order.id
                    )}
                    className="h-10 px-3 border border-[#b88933] text-[#563315] rounded-md hover:bg-[#f0ddb6]/30 transition-colors"
                  >
                    <Eye size={16} />
                  </button>
                </div>

                {/* Expanded Details */}
                {expandedOrderId === order.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-[#f0ddb6]/30 rounded-md p-3 space-y-2"
                  >
                    <div className="text-xs font-semibold text-[#563315]">
                      Full Item List:
                    </div>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="text-xs text-[#563315] flex justify-between">
                        <span>
                          {item.quantity}× {item.name}
                          {item.modifiers && ` - ${item.modifiers.join(", ")}`}
                        </span>
                        <span className="font-semibold">₹{item.price}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-[#563315]/20 text-xs">
                      <div className="font-semibold">Order Timeline:</div>
                      <div className="text-[#563315]/70">
                        Placed at: {new Date(order.receivedAt).toLocaleTimeString()}
                      </div>
                      <div className="text-[#563315]/70">
                        Payment confirmed: {new Date(order.receivedAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
