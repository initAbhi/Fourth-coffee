"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus, Minus, Search } from "lucide-react";
import { useCashier } from "@/contexts/CashierContext";
import { toast } from "sonner";
import { mockProducts as sampleProducts } from "@/lib/cashier-mock-data";

interface ManualOrderModalProps {
  onClose: () => void;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  modifiers?: string[];
  notes?: string;
}

export const ManualOrderModal: React.FC<ManualOrderModalProps> = ({ onClose }) => {
  const { tables, addManualOrder } = useCashier();
  const [selectedTable, setSelectedTable] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const availableTables = tables.filter((t) => t.status === "idle");

  const filteredProducts = sampleProducts.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addItem = (product: typeof sampleProducts[0]) => {
    setOrderItems([
      ...orderItems,
      { name: product.name, quantity: 1, price: product.price, modifiers: [] },
    ]);
    setEditingItemIndex(orderItems.length);
  };

  const updateQuantity = (index: number, delta: number) => {
    setOrderItems(
      orderItems.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  const handleProcessBilling = () => {
    if (!selectedTable) {
      toast.error("Please select a table");
      return;
    }
    if (orderItems.length === 0) {
      toast.error("Please add items to the order");
      return;
    }

    addManualOrder({
      tableNumber: selectedTable,
      items: orderItems,
      status: "idle",
      total: subtotal,
      isPaid: true,
      paymentMethod: "Cash",
    });

    toast.success(`Order created for ${selectedTable}`);
    onClose();
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
        className="bg-white rounded-xl w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="h-16 bg-[#f0ddb6] border-b border-[#563315]/20 px-6 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-bold text-[#563315]">New Manual Order</h2>
          <button
            onClick={onClose}
            className="text-[#563315]/60 hover:text-[#563315] transition-colors"
          >
            <X size={28} />
          </button>
        </div>

        {/* Body - Two Column Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column - Product Selection */}
          <div className="w-[60%] border-r border-[#e0e0e0] flex flex-col">
            {/* Table Selection */}
            <div className="h-16 bg-white border-b border-[#e0e0e0] px-5 flex items-center gap-4">
              <label className="text-sm font-medium text-[#563315]">Table:</label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="h-10 px-3 border border-[#b88933]/30 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#b88933] flex-1 max-w-xs"
              >
                <option value="">Select table or Takeaway</option>
                {availableTables.map((table) => (
                  <option key={table.id} value={table.tableNumber}>
                    {table.tableNumber}
                  </option>
                ))}
                <option value="Takeaway">🛍️ Takeaway</option>
              </select>
            </div>

            {/* Search Bar */}
            <div className="px-5 py-4">
              <div className="relative">
                <Search
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#563315]/40"
                />
                <input
                  type="text"
                  placeholder="Search product name or SKU (F1)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-10 pr-4 border border-[#b88933]/30 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#b88933]"
                />
              </div>
            </div>

            {/* Category Tabs */}
            <div className="h-12 border-b border-[#e0e0e0] px-5 flex items-center gap-4">
              {["all", "coffee", "pastries", "cookies"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 text-sm font-medium transition-all ${
                    selectedCategory === cat
                      ? "text-[#563315] border-b-3 border-[#b88933]"
                      : "text-[#563315]/60 hover:text-[#563315]"
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-auto p-5">
              <div className="grid grid-cols-3 gap-3">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => addItem(product)}
                    className="bg-white border border-[#e0e0e0] rounded-lg p-3 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all"
                  >
                    <div className="aspect-square bg-[#f0ddb6]/30 rounded-md mb-2 flex items-center justify-center text-4xl">
                      ☕
                    </div>
                    <div className="text-sm font-semibold text-[#563315] truncate">
                      {product.name}
                    </div>
                    <div className="text-sm font-bold text-[#b88933]">₹{product.price}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="w-[40%] flex flex-col bg-[#faf7f0]">
            {/* Header */}
            <div className="h-12 bg-[#563315] text-white px-4 flex items-center justify-between">
              <h3 className="text-base font-bold">Current Order</h3>
              <span className="text-sm opacity-70">({orderItems.length} items)</span>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-auto p-3 space-y-2">
              {orderItems.length === 0 ? (
                <div className="text-center py-12 text-sm text-[#563315]/60">
                  No items added yet
                </div>
              ) : (
                orderItems.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-md p-3 border border-[#e0e0e0] space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(index, -1)}
                          className="w-7 h-7 border border-[#b88933]/30 rounded text-[#563315] hover:bg-[#f0ddb6]/30 transition-colors"
                        >
                          <Minus size={14} className="mx-auto" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-[#563315]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(index, 1)}
                          className="w-7 h-7 border border-[#b88933]/30 rounded text-[#563315] hover:bg-[#f0ddb6]/30 transition-colors"
                        >
                          <Plus size={14} className="mx-auto" />
                        </button>
                      </div>

                      {/* Item Name */}
                      <div className="flex-1 mx-3">
                        <div className="text-sm font-semibold text-[#563315]">{item.name}</div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(index)}
                        className="text-[#d32f2f]/70 hover:text-[#d32f2f] transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right text-sm font-bold text-[#b88933]">
                      ₹{item.price * item.quantity}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Summary */}
            <div className="bg-[#f0ddb6]/40 p-4 space-y-2 border-t border-[#563315]/20">
              <div className="flex justify-between text-sm text-[#563315]">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-xs text-[#563315]/70">
                <span>Taxes (5%)</span>
                <span>₹{tax}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-[#563315] pt-2 border-t border-[#563315]/20">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 bg-white border-t border-[#e0e0e0] flex gap-3">
              <button
                onClick={onClose}
                className="h-12 flex-[0.35] border border-[#b88933] text-[#563315] rounded-md font-medium text-sm hover:bg-[#f0ddb6]/30 transition-all"
              >
                Save as Draft
              </button>
              <button
                onClick={handleProcessBilling}
                disabled={!selectedTable || orderItems.length === 0}
                className="h-12 flex-[0.6] bg-[#563315] text-[#f0ddb6] rounded-md font-medium text-sm hover:bg-[#6d4522] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Process Billing
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
