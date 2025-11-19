"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Check, Eye, X } from "lucide-react";
import { useCashier } from "@/contexts/CashierContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";

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

  const handleConfirm = async (orderId: string, defaultTableNumber?: string) => {
    // Use selected table if changed, otherwise use the order's table number
    const tableNumber = selectedTables[orderId] || defaultTableNumber;
    
    if (!tableNumber) {
      toast.error("Please select a table for this order");
      return;
    }

    try {
      await confirmPaidOrder(orderId, tableNumber);
      // Order will be removed from list automatically via context
      setSelectedTables(prev => {
        const newState = { ...prev };
        delete newState[orderId];
        return newState;
      });
      setExpandedOrderId(null);
    } catch (error) {
      console.error("Error confirming order:", error);
      toast.error("Failed to confirm order");
    }
  };

  const handleReject = async (orderId: string) => {
    if (!confirm("Are you sure you want to reject this order?")) {
      return;
    }
    
    try {
      // TODO: Implement reject order API call
      toast.error("Order rejection not yet implemented");
      // For now, just remove from list
      // setPaidOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (error) {
      console.error("Error rejecting order:", error);
      toast.error("Failed to reject order");
    }
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
        <div className="writing-mode-vertical text-sm font-medium text-[#563315] mb-4 rotate-180" style={{ writingMode: 'vertical-rl' }}>
          Paid Orders
        </div>
        
        {paidOrders.length > 0 && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-8 h-8 rounded-full bg-[#d32f2f] text-white text-base font-bold flex items-center justify-center shadow-lg cursor-pointer"
            onClick={onToggle}
            title={`${paidOrders.length} pending order${paidOrders.length > 1 ? 's' : ''}`}
          >
            {paidOrders.length}
          </motion.div>
        )}

        <button
          onClick={onToggle}
          className="absolute bottom-4 p-2 hover:bg-[#b88933]/20 rounded transition-colors"
          title="Expand paid orders"
        >
          <ChevronLeft size={20} className="text-[#563315]" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-[380px] bg-white border-l border-[#e0e0e0] flex flex-col shadow-lg">
      {/* Header */}
      <div className="h-14 bg-[#563315] text-white flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold">
            Paid Orders
          </h2>
          {paidOrders.length > 0 && (
            <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
              {paidOrders.length}
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-2 hover:bg-white/20 rounded transition-colors"
          title="Collapse sidebar"
        >
          <ChevronRight size={20} className="text-white" />
        </button>
      </div>

      {/* Order List */}
      <div className="flex-1 overflow-auto">
        {paidOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
            <div className="text-6xl mb-4 opacity-30">☕</div>
            <p className="text-sm font-medium text-[#563315]/60">No pending orders</p>
            <p className="text-xs text-[#563315]/50 mt-1">
              New paid orders will appear here automatically
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-3">
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
                    onClick={() => handleReject(order.id)}
                    className="text-[#d32f2f]/70 hover:text-[#d32f2f] transition-colors p-1 rounded hover:bg-[#d32f2f]/10"
                    title="Reject order"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Item Summary */}
                <div className="text-sm text-[#563315]/80">
                  <div className="line-clamp-2">
                    {order.items.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="mb-1">
                        {item.quantity}× {item.name}
                        {item.modifiers && item.modifiers.length > 0 && (
                          <span className="text-[#563315]/60"> ({item.modifiers.join(", ")})</span>
                        )}
                      </div>
                    ))}
                  </div>
                  {order.items.length > 2 && (
                    <div className="text-xs text-[#563315]/60 mt-1">
                      +{order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {/* Customer Info */}
                {order.customerPhone && (
                  <div className="text-xs text-[#563315]/70">
                    📞 {order.customerPhone}
                  </div>
                )}

                {/* Table Information */}
                {order.tableNumber ? (
                  <div className="p-2 bg-[#f0ddb6]/30 rounded">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-[#563315]/70">Table</div>
                      <div className="text-sm font-semibold text-[#563315]">
                        {order.tableNumber}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedTables(prev => ({ ...prev, [order.id]: "" }))}
                      className="text-xs text-[#563315]/60 hover:text-[#563315] mt-1 underline"
                    >
                      Change table
                    </button>
                    {selectedTables[order.id] === "" && (
                      <select
                        value={selectedTables[order.id] || order.tableNumber || ""}
                        onChange={(e) => setSelectedTables(prev => ({ ...prev, [order.id]: e.target.value }))}
                        className="w-full h-9 px-2 text-sm border border-[#b88933]/30 rounded focus:outline-none focus:ring-2 focus:ring-[#b88933] mt-2"
                      >
                        <option value={order.tableNumber}>{order.tableNumber}</option>
                        {tables
                          .filter((t) => t.status === "idle" && t.tableNumber !== order.tableNumber)
                          .map((table) => (
                            <option key={table.id} value={table.tableNumber}>
                              {table.tableNumber}
                            </option>
                          ))}
                        <option value="Takeaway">🛍️ Takeaway</option>
                      </select>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-[#563315] mb-1">
                      Assign Table *
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
                )}

                {/* Payment Info */}
                <div className="flex items-center justify-between p-2 bg-[#f0ddb6]/20 rounded">
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-[#563315]/70">
                      💳 {order.paymentMethod}
                    </div>
                    {order.customerName && (
                      <div className="text-xs text-[#563315]/60">
                        👤 {order.customerName}
                      </div>
                    )}
                  </div>
                  <div className="text-lg font-bold text-[#2e7d32]">
                    ₹{typeof order.total === 'number' ? order.total.toFixed(2) : order.total}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleConfirm(order.id, order.tableNumber)}
                    disabled={!order.tableNumber && !selectedTables[order.id]}
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
                    <div className="pt-2 border-t border-[#563315]/20 text-xs space-y-1">
                      <div className="font-semibold text-[#563315]">Order Timeline:</div>
                      <div className="text-[#563315]/70">
                        Placed: {format(new Date(order.receivedAt), "MMM dd, yyyy HH:mm:ss")}
                      </div>
                      <div className="text-[#563315]/70">
                        Payment: {order.paymentMethod} - Confirmed
                      </div>
                      {order.tableNumber && (
                        <div className="text-[#563315]/70">
                          Table: {order.tableNumber}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

