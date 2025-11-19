"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, CreditCard, Smartphone, Wallet, Banknote, Check } from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

interface PaymentConfirmationModalProps {
  orderId: string;
  orderTotal: number;
  customerName?: string;
  customerPhone?: string;
  onClose: () => void;
  onSuccess: () => void;
  confirmedBy: string;
  initialPaymentMethod?: string;
}

const paymentMethods = [
  { id: "Cash", label: "Cash", icon: Banknote, color: "bg-green-500" },
  { id: "Card", label: "Card", icon: CreditCard, color: "bg-blue-500" },
  { id: "UPI - GPay", label: "UPI (GPay)", icon: Smartphone, color: "bg-purple-500" },
  { id: "UPI - PhonePe", label: "UPI (PhonePe)", icon: Smartphone, color: "bg-indigo-500" },
  { id: "UPI - Paytm", label: "UPI (Paytm)", icon: Smartphone, color: "bg-cyan-500" },
  { id: "Wallet", label: "Wallet", icon: Wallet, color: "bg-orange-500" },
];

export const PaymentConfirmationModal: React.FC<PaymentConfirmationModalProps> = ({
  orderId,
  orderTotal,
  customerName,
  customerPhone,
  onClose,
  onSuccess,
  confirmedBy,
  initialPaymentMethod,
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(initialPaymentMethod || "");
  const [isManualFlag, setIsManualFlag] = useState(false);
  const [cardMachineUsed, setCardMachineUsed] = useState(false);
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (initialPaymentMethod) {
      setSelectedPaymentMethod(initialPaymentMethod);
    }
  }, [initialPaymentMethod]);

  const handleConfirmPayment = async () => {
    if (!selectedPaymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await apiClient.confirmPayment(orderId, {
        paymentMethod: selectedPaymentMethod,
        isManualFlag,
        cardMachineUsed,
        notes: notes || undefined,
        confirmedBy,
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to confirm payment");
      }

      toast.success("Payment confirmed successfully");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to confirm payment");
    } finally {
      setIsProcessing(false);
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
        className="bg-white rounded-xl w-full max-w-md shadow-2xl"
      >
        {/* Header */}
        <div className="h-16 bg-[#f0ddb6] border-b border-[#563315]/20 px-6 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-bold text-[#563315]">Confirm Payment</h2>
          <button
            onClick={onClose}
            className="text-[#563315]/60 hover:text-[#563315] transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Order Info */}
          <div className="bg-[#faf7f0] rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-[#563315]/70">Order Total</span>
              <span className="text-2xl font-bold text-[#563315]">₹{orderTotal.toFixed(2)}</span>
            </div>
            {customerName && (
              <div className="text-sm text-[#563315]/70">
                Customer: <span className="font-semibold">{customerName}</span>
              </div>
            )}
            {customerPhone && (
              <div className="text-sm text-[#563315]/70">
                Phone: <span className="font-semibold">{customerPhone}</span>
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="text-sm font-semibold text-[#563315] mb-3">Select Payment Method</h3>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      selectedPaymentMethod === method.id
                        ? "border-[#b88933] bg-[#f0ddb6]/30"
                        : "border-[#e0e0e0] hover:border-[#b88933]/50"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full ${method.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-[#563315] text-center">{method.label}</span>
                    {selectedPaymentMethod === method.id && (
                      <Check className="w-4 h-4 text-[#b88933]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card Machine Options */}
          {selectedPaymentMethod === "Card" && (
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cardMachineUsed}
                  onChange={(e) => setCardMachineUsed(e.target.checked)}
                  className="w-4 h-4 text-[#b88933] rounded"
                />
                <span className="text-sm text-[#563315]">Card machine used</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isManualFlag}
                  onChange={(e) => setIsManualFlag(e.target.checked)}
                  className="w-4 h-4 text-[#b88933] rounded"
                />
                <span className="text-sm text-[#563315]">Manual payment flag</span>
              </label>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-[#563315] mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about the payment..."
              className="w-full h-20 px-3 py-2 border border-[#b88933]/30 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#b88933] resize-none"
              maxLength={200}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-[#e0e0e0] flex gap-3 rounded-b-xl">
          <button
            onClick={onClose}
            className="h-12 flex-1 border border-[#b88933] text-[#563315] rounded-md font-medium text-sm hover:bg-[#f0ddb6]/30 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmPayment}
            disabled={!selectedPaymentMethod || isProcessing}
            className="h-12 flex-1 bg-[#563315] text-[#f0ddb6] rounded-md font-medium text-sm hover:bg-[#6d4522] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isProcessing ? "Processing..." : "Confirm Payment"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};


