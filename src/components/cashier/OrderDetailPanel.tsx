"use client";

import { motion } from "framer-motion";
import { X, Clock, Printer, CheckCircle, Trash2, RefreshCw } from "lucide-react";
import { useCashier } from "@/contexts/CashierContext";
import { toast } from "sonner";

interface OrderDetailPanelProps {
  tableId: string;
  onClose: () => void;
  onRefund: () => void;
}

export const OrderDetailPanel: React.FC<OrderDetailPanelProps> = ({
  tableId,
  onClose,
  onRefund,
}) => {
  const { tables, sendToKitchen, markServed } = useCashier();
  const table = tables.find((t) => t.id === tableId);

  if (!table) return null;

  const formatTime = (startTime?: number) => {
    if (!startTime) return null;
    const elapsed = Date.now() - startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const getStatusBadge = () => {
    const statusMap = {
      idle: { bg: "bg-[#e0e0e0]", text: "text-[#563315]", label: "Idle" },
      preparing: { bg: "bg-[#f9a825]", text: "text-[#563315]", label: "Preparing" },
      aging: { bg: "bg-[#f57c00]", text: "text-white", label: "Aging" },
      critical: { bg: "bg-[#d32f2f]", text: "text-white", label: "Critical" },
      served: { bg: "bg-[#2e7d32]", text: "text-white", label: "Served" },
    };
    
    const status = statusMap[table.status] || statusMap.idle;
    return (
      <span className={`${status.bg} ${status.text} px-3 py-1 rounded-full text-xs font-medium`}>
        {status.label}
      </span>
    );
  };

  const handleSendToKitchen = () => {
    sendToKitchen(tableId);
    toast.success(`Order sent to kitchen - KOT printing...`);
  };

  const handleMarkServed = () => {
    if (confirm(`Confirm served at ${table.tableNumber}?`)) {
      markServed(tableId);
      toast.success(`${table.tableNumber} marked as served`);
      onClose();
    }
  };

  const handleReprint = () => {
    toast.info("Reprinting KOT...");
  };

  const timer = formatTime(table.startTime);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-end z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        className="w-[480px] h-full bg-white shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="h-18 bg-[#f0ddb6] border-b border-[#563315]/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-[#563315]">{table.tableNumber}</h2>
            {getStatusBadge()}
          </div>
          <button
            onClick={onClose}
            className="text-[#563315]/60 hover:text-[#563315] transition-colors"
          >
            <X size={28} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Timeline Section */}
          {table.startTime && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-[#563315]/70">
                <Clock size={20} />
                <span>
                  Placed at: {new Date(table.startTime).toLocaleTimeString()}
                </span>
              </div>
              {timer && (
                <div className={`text-3xl font-mono font-bold ${
                  table.status === "critical" ? "text-[#d32f2f]" :
                  table.status === "aging" ? "text-[#f57c00]" :
                  "text-[#f9a825]"
                }`}>
                  {timer}
                  <span className="text-sm ml-2 font-normal">Preparing since</span>
                </div>
              )}
            </div>
          )}

          {/* Order Items */}
          {table.items.length > 0 && (
            <div className="bg-[#f0ddb6]/30 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-[#563315]">Order Items</h3>
              {table.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-white border border-[#b88933] flex items-center justify-center text-xs font-bold text-[#563315]">
                        {item.quantity}×
                      </span>
                      <span className="text-sm font-semibold text-[#563315]">
                        {item.name}
                      </span>
                    </div>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="ml-8 text-xs italic text-[#563315]/70">
                        {item.modifiers.join(", ")}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-[#b88933]">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              ))}

              <div className="pt-3 border-t border-[#563315]/20 space-y-1">
                <div className="flex justify-between text-sm text-[#563315]">
                  <span>Subtotal</span>
                  <span>₹{table.total}</span>
                </div>
                <div className="flex justify-between text-xs text-[#563315]/70">
                  <span>Taxes & Fees</span>
                  <span>₹{Math.round(table.total * 0.05)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-[#563315] pt-2 border-t border-[#563315]/20">
                  <span>Total</span>
                  <span>₹{table.total + Math.round(table.total * 0.05)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Customer Info */}
          {table.customerPhone && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-[#563315]">Customer Information</h3>
              <a
                href={`tel:${table.customerPhone}`}
                className="flex items-center gap-2 text-sm text-[#563315] hover:text-[#b88933] transition-colors"
              >
                📞 {table.customerPhone}
              </a>
            </div>
          )}

          {/* Payment Info */}
          {table.isPaid && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-[#563315]">Payment Info</h3>
              <div className="text-sm text-[#2e7d32] flex items-center gap-2">
                💳 Paid via {table.paymentMethod || "UPI"}
              </div>
              <div className="text-xs text-[#563315]/60">
                Confirmed at {table.startTime ? new Date(table.startTime).toLocaleTimeString() : "N/A"}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-[#e0e0e0] bg-white p-4 space-y-3">
          {/* Action Buttons Grid */}
          <div className="grid grid-cols-2 gap-3">
            {table.status === "idle" && table.items.length > 0 && (
              <button
                onClick={handleSendToKitchen}
                className="h-12 bg-[#2e7d32] text-white rounded-md font-medium text-sm hover:bg-[#256029] transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                Send to Kitchen
              </button>
            )}

            {(table.status === "preparing" || table.status === "aging" || table.status === "critical") && (
              <button
                onClick={handleMarkServed}
                className="h-12 bg-[#2e7d32] text-white rounded-md font-medium text-sm hover:bg-[#256029] transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                Mark Served
              </button>
            )}

            <button
              onClick={() => {
                toast.info("Wastage flag feature coming soon");
              }}
              className="h-12 bg-[#d32f2f] text-white rounded-md font-medium text-sm hover:bg-[#b71c1c] transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={18} />
              Flag Wastage
            </button>

            <button
              onClick={onRefund}
              className="h-12 border-2 border-[#d32f2f] text-[#d32f2f] rounded-md font-medium text-sm hover:bg-[#d32f2f]/10 transition-all flex items-center justify-center gap-2 col-span-2"
            >
              <RefreshCw size={18} />
              Refund
            </button>
          </div>

          {/* Reprint Button */}
          <button
            onClick={handleReprint}
            className="w-full h-10 text-[#563315]/60 hover:text-[#563315] text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Printer size={16} />
            Reprint Kitchen Order Ticket
          </button>

          {/* View Audit Trail Link */}
          <div className="text-center">
            <button
              onClick={() => toast.info("Audit trail feature coming soon")}
              className="text-sm text-[#b88933] hover:underline"
            >
              View Audit Trail
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
