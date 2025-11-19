"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus, Minus, Search, CreditCard, Smartphone, Wallet, Banknote } from "lucide-react";
import { useCashier } from "@/contexts/CashierContext";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { PaymentConfirmationModal } from "./PaymentConfirmationModal";
import { useEffect } from "react";

interface ManualOrderModalProps {
  onClose: () => void;
  confirmedBy: string;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  modifiers?: string[];
  notes?: string;
  customizations?: Array<{ type: string; value: string }>;
}

const sugarOptions = ["none", "less", "medium", "extra"];
const temperatureOptions = ["hot", "iced", "room"];

const paymentMethods = [
  { id: "Cash", label: "Cash", icon: Banknote, color: "bg-green-500" },
  { id: "Card", label: "Card", icon: CreditCard, color: "bg-blue-500" },
  { id: "UPI - GPay", label: "UPI (GPay)", icon: Smartphone, color: "bg-purple-500" },
  { id: "UPI - PhonePe", label: "UPI (PhonePe)", icon: Smartphone, color: "bg-indigo-500" },
  { id: "UPI - Paytm", label: "UPI (Paytm)", icon: Smartphone, color: "bg-cyan-500" },
  { id: "Wallet", label: "Wallet", icon: Wallet, color: "bg-orange-500" },
];

export const ManualOrderModal: React.FC<ManualOrderModalProps> = ({ onClose, confirmedBy }) => {
  const { tables } = useCashier();
  const [selectedTable, setSelectedTable] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("");

  const availableTables = tables.filter((t) => t.status === "idle");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoadingProducts(true);
        const response = await apiClient.getProducts();
        if (response.success && response.data) {
          setProducts(response.data);
          // Extract unique categories
          const uniqueCategories = Array.from(new Set(response.data.map((p: any) => p.category.toLowerCase())));
          setCategories(["all", ...uniqueCategories]);
        }
      } catch (error) {
        toast.error("Failed to load products");
        console.error(error);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    loadProducts();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const addItem = (product: any) => {
    const newItem: OrderItem = {
      name: product.name,
      quantity: 1,
      price: product.price,
      modifiers: [],
      customizations: [
        { type: "sugar", value: "medium" },
        { type: "temperature", value: "hot" },
      ],
    };
    setOrderItems([...orderItems, newItem]);
    setEditingItemIndex(orderItems.length);
  };

  const updateItemCustomization = (index: number, type: string, value: string) => {
    setOrderItems(orderItems.map((item, i) => {
      if (i === index) {
        const customizations = item.customizations || [];
        const existingIndex = customizations.findIndex(c => c.type === type);
        const updated = existingIndex >= 0
          ? customizations.map((c, idx) => idx === existingIndex ? { type, value } : c)
          : [...customizations, { type, value }];
        return { ...item, customizations: updated };
      }
      return item;
    }));
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

  const handleProcessBilling = async () => {
    if (!selectedTable) {
      toast.error("Please select a table");
      return;
    }
    if (orderItems.length === 0) {
      toast.error("Please add items to the order");
      return;
    }
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    // Create order first, then show payment confirmation modal
    handleCreateOrder();
  };

  const handleCreateOrder = async () => {
    try {
      // Collect all customizations
      const allCustomizations: Array<{ type: string; value: string }> = [];
      orderItems.forEach(item => {
        if (item.customizations) {
          allCustomizations.push(...item.customizations);
        }
      });

      const response = await apiClient.createOrder({
        table: selectedTable,
        items: orderItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          modifiers: item.modifiers || [],
        })),
        total: total,
        paymentMethod: paymentMethod, // Payment method is required for cashier orders
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        customerNotes: customerNotes || undefined,
        customizations: allCustomizations,
        isCashierOrder: true,
        confirmedBy,
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to create order");
      }

      // Store order ID and show payment modal
      setCreatedOrderId(response.data.id);
      setShowPaymentModal(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create order");
    }
  };

  const handlePaymentSuccess = () => {
    toast.success(`Order created and payment confirmed for ${selectedTable}`);
    setShowPaymentModal(false);
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

            {/* Customer Info */}
            <div className="px-5 py-3 bg-white border-b border-[#e0e0e0] space-y-2">
              <input
                type="text"
                placeholder="Customer Name (Optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full h-10 px-3 border border-[#b88933]/30 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#b88933]"
              />
              <input
                type="tel"
                placeholder="Customer Phone (Optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full h-10 px-3 border border-[#b88933]/30 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#b88933]"
              />
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
            <div className="h-12 border-b border-[#e0e0e0] px-5 flex items-center gap-4 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
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
              {isLoadingProducts ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-[#b88933] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-[#563315]/70">Loading products...</p>
                  </div>
                </div>
              ) : (
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
              )}
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

                    {/* Customizations */}
                    {item.customizations && item.customizations.length > 0 && (
                      <div className="text-xs text-[#563315]/60 space-y-1">
                        {item.customizations.map((custom, idx) => (
                          <div key={idx}>
                            {custom.type === "sugar" && `Sugar: ${custom.value}`}
                            {custom.type === "temperature" && `Temp: ${custom.value}`}
                            {custom.type === "milk" && `Milk: ${custom.value}`}
                          </div>
                        ))}
                      </div>
                    )}

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

            {/* Payment Method Selection */}
            <div className="bg-white p-4 border-t border-[#e0e0e0]">
              <label className="block text-sm font-semibold text-[#563315] mb-3">
                Payment Method <span className="text-[#d32f2f]">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1.5 ${
                        paymentMethod === method.id
                          ? "border-[#b88933] bg-[#f0ddb6]/30"
                          : "border-[#e0e0e0] hover:border-[#b88933]/50"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full ${method.color} flex items-center justify-center`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-medium text-[#563315] text-center leading-tight">
                        {method.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              {!paymentMethod && (
                <p className="text-xs text-[#d32f2f] mt-2">Payment method is required for cashier orders</p>
              )}
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
                disabled={!selectedTable || orderItems.length === 0 || !paymentMethod}
                className="h-12 flex-[0.6] bg-[#563315] text-[#f0ddb6] rounded-md font-medium text-sm hover:bg-[#6d4522] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Process Billing
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Payment Confirmation Modal */}
      {showPaymentModal && createdOrderId && (
        <PaymentConfirmationModal
          orderId={createdOrderId}
          orderTotal={total}
          customerName={customerName}
          customerPhone={customerPhone}
          onClose={() => {
            setShowPaymentModal(false);
            setCreatedOrderId("");
          }}
          onSuccess={handlePaymentSuccess}
          confirmedBy={confirmedBy}
          initialPaymentMethod={paymentMethod}
        />
      )}
    </motion.div>
  );
};
