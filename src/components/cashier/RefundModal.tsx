"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";
import { useCashier } from "@/contexts/CashierContext";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

interface RefundModalProps {
  orderId: string;
  onClose: () => void;
}

export const RefundModal: React.FC<RefundModalProps> = ({ orderId, onClose }) => {
  const { tables } = useCashier();
  const table = tables.find((t) => t.id === orderId);

  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [refundReason, setRefundReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [refundMethod, setRefundMethod] = useState("original");
  const [managerPassword, setManagerPassword] = useState("");
  const [showManagerAuth, setShowManagerAuth] = useState(false);

  if (!table) return null;

  const refundReasons = [
    "Wrong Item Served",
    "Double Charge",
    "Customer Complaint",
    "Item Not Available",
    "Order Cancelled",
    "Quality Issue",
    "Other",
  ];

  const calculateRefundAmount = () => {
    if (refundType === "full") {
      return table.total;
    }
    return selectedItems.reduce(
      (sum, idx) => sum + table.items[idx].price * table.items[idx].quantity,
      0
    );
  };

  const refundAmount = calculateRefundAmount();

  const handleConfirmRefund = async () => {
    if (!refundReason) {
      toast.error("Please select a refund reason");
      return;
    }

    if (refundReason === "Other" && !customReason.trim()) {
      toast.error("Please provide a custom reason");
      return;
    }

    if (!table.items.length) {
      toast.error("No order found for this table");
      return;
    }
    
    // Get the actual order ID from backend
    let actualOrderId: string | null = null;
    try {
      const ordersRes = await apiClient.getOrders({ tableId: table.id });
      if (ordersRes.success && ordersRes.data) {
        // Find the most recent non-rejected order for this table
        const activeOrder = ordersRes.data.find((o: any) => 
          o.tableId === table.id && o.status !== "rejected" && o.status !== "served"
        );
        if (activeOrder) {
          actualOrderId = activeOrder.id;
        }
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
    
    if (!actualOrderId) {
      toast.error("Could not find order for this table. Please try again.");
      return;
    }

    const finalReason = refundReason === "Other" ? customReason.trim() : refundReason;

    if (confirm(`Create refund request for ₹${refundAmount}? This will be sent to the manager for approval.`)) {
      try {
        // Get cashier session for requestedBy
        const sessionStr = localStorage.getItem("cashier_session");
        const session = sessionStr ? JSON.parse(sessionStr) : null;
        const requestedBy = session?.name || session?.userId || "Cashier";

        // Create refund request (will be pending until manager approves)
        const response = await apiClient.createRefundRequest({
          orderId: actualOrderId,
          amount: refundAmount,
          reason: finalReason,
          requestedBy,
        });

        if (response.success) {
          toast.success("Refund request created successfully. Waiting for manager approval.");
          onClose();
        } else {
          toast.error(response.error || "Failed to create refund request");
        }
      } catch (error) {
        console.error("Refund request error:", error);
        toast.error("Failed to create refund request. Please try again.");
      }
    }
  };

  const toggleItemSelection = (index: number) => {
    if (selectedItems.includes(index)) {
      setSelectedItems(selectedItems.filter((i) => i !== index));
    } else {
      setSelectedItems([...selectedItems, index]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl max-w-lg w-full shadow-2xl"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-[#e0e0e0]">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#d32f2f]/10 flex items-center justify-center">
              <AlertTriangle size={24} className="text-[#d32f2f]" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-[#563315]">Process Refund</h2>
              <p className="text-sm text-[#563315]/70">
                Order {table.tableNumber}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-[#563315]/60 hover:text-[#563315] transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6 max-h-[60vh] overflow-auto space-y-6">
          {/* Refund Type */}
          <div>
            <label className="block text-sm font-medium text-[#563315] mb-2">
              Refund Type
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 h-12 border-2 border-[#b88933]/30 rounded-lg px-4 cursor-pointer transition-all hover:bg-[#f0ddb6]/20">
                <input
                  type="radio"
                  name="refundType"
                  value="full"
                  checked={refundType === "full"}
                  onChange={() => setRefundType("full")}
                  className="w-4 h-4 text-[#b88933] focus:ring-[#b88933]"
                />
                <span className="text-sm font-medium text-[#563315]">
                  Full Refund (₹{table.total})
                </span>
              </label>

              <label className="flex items-center gap-3 h-12 border-2 border-[#b88933]/30 rounded-lg px-4 cursor-pointer transition-all hover:bg-[#f0ddb6]/20">
                <input
                  type="radio"
                  name="refundType"
                  value="partial"
                  checked={refundType === "partial"}
                  onChange={() => setRefundType("partial")}
                  className="w-4 h-4 text-[#b88933] focus:ring-[#b88933]"
                />
                <span className="text-sm font-medium text-[#563315]">
                  Partial Refund (Select items)
                </span>
              </label>
            </div>
          </div>

          {/* Partial Refund Item Selection */}
          {refundType === "partial" && (
            <div className="bg-[#f0ddb6]/20 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold text-[#563315] mb-3">
                Select Items to Refund
              </h4>
              {table.items.map((item, idx) => (
                <label
                  key={idx}
                  className="flex items-center gap-3 p-2 hover:bg-white/50 rounded cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(idx)}
                    onChange={() => toggleItemSelection(idx)}
                    className="w-5 h-5 text-[#2e7d32] rounded focus:ring-[#2e7d32]"
                  />
                  <span className="flex-1 text-sm text-[#563315]">
                    {item.quantity}× {item.name}
                  </span>
                  <span className="text-sm font-semibold text-[#563315]">
                    ₹{item.price * item.quantity}
                  </span>
                </label>
              ))}
              {selectedItems.length > 0 && (
                <div className="pt-2 mt-2 border-t border-[#563315]/20 text-sm font-semibold text-[#563315]">
                  Refund amount: ₹{refundAmount}
                </div>
              )}
            </div>
          )}

          {/* Refund Reason */}
          <div>
            <label className="block text-sm font-medium text-[#563315] mb-2">
              Reason for Refund <span className="text-[#d32f2f]">*</span>
            </label>
            <select
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="w-full h-12 px-3 border border-[#b88933]/30 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#b88933]"
            >
              <option value="">Select a reason...</option>
              {refundReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>

            {refundReason === "Other" && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter custom reason..."
                maxLength={200}
                className="w-full mt-2 min-h-20 px-3 py-2 border border-[#b88933]/30 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#b88933] resize-none"
              />
            )}
          </div>

          {/* Refund Amount Display */}
          <div className="bg-[#d32f2f]/5 border border-[#d32f2f]/20 rounded-lg p-4">
            <div className="text-sm text-[#563315]/70 mb-1">Refund Amount</div>
            <div className="text-3xl font-bold text-[#d32f2f]">₹{refundAmount}</div>
            <div className="text-xs text-[#563315]/60 mt-1">
              Original amount: ₹{table.total}
            </div>
          </div>

          {/* Refund Method */}
          <div>
            <label className="block text-sm font-medium text-[#563315] mb-2">
              Refund To
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 h-12 border-2 border-[#b88933]/30 rounded-lg px-4 cursor-pointer transition-all hover:bg-[#f0ddb6]/20">
                <input
                  type="radio"
                  name="refundMethod"
                  value="original"
                  checked={refundMethod === "original"}
                  onChange={() => setRefundMethod("original")}
                  className="w-4 h-4 text-[#b88933] focus:ring-[#b88933]"
                />
                <span className="text-sm font-medium text-[#563315]">
                  Original Payment Method (Recommended)
                </span>
              </label>

              <label className="flex items-center gap-3 h-12 border-2 border-[#b88933]/30 rounded-lg px-4 cursor-pointer transition-all hover:bg-[#f0ddb6]/20">
                <input
                  type="radio"
                  name="refundMethod"
                  value="store_credit"
                  checked={refundMethod === "store_credit"}
                  onChange={() => setRefundMethod("store_credit")}
                  className="w-4 h-4 text-[#b88933] focus:ring-[#b88933]"
                />
                <span className="text-sm font-medium text-[#563315]">
                  Store Credit (Issue voucher)
                </span>
              </label>

              <label className="flex items-center gap-3 h-12 border-2 border-[#b88933]/30 rounded-lg px-4 cursor-pointer transition-all hover:bg-[#f0ddb6]/20">
                <input
                  type="radio"
                  name="refundMethod"
                  value="cash"
                  checked={refundMethod === "cash"}
                  onChange={() => setRefundMethod("cash")}
                  className="w-4 h-4 text-[#b88933] focus:ring-[#b88933]"
                />
                <span className="text-sm font-medium text-[#563315]">Cash</span>
              </label>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-[#f9a825]/10 border border-[#f9a825]/30 rounded-lg p-3 flex items-start gap-3">
            <AlertTriangle size={20} className="text-[#f9a825] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-[#563315] font-semibold mb-1">
                ⚠️ Manager Approval Required
              </p>
              <p className="text-xs text-[#563315] italic">
                All refunds require manager approval. This request will be sent to the manager for review.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-[#e0e0e0] flex gap-3">
          <button
            onClick={onClose}
            className="h-12 flex-[40] border border-[#563315]/30 text-[#563315] rounded-md font-medium text-sm hover:bg-[#f0ddb6]/30 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmRefund}
            disabled={!refundReason || (refundType === "partial" && selectedItems.length === 0)}
            className="h-12 flex-[55] bg-[#d32f2f] text-white rounded-md font-medium text-sm hover:bg-[#b71c1c] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Confirm Refund
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
