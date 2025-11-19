"use client";

import { useState } from "react";
import { useCashier } from "@/contexts/CashierContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, X, Eye, Printer, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function PaidOrdersPage() {
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

    await confirmPaidOrder(orderId, tableNumber);
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

  return (
    <div className="h-full overflow-auto bg-[#faf7f0] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#563315]">Paid Orders</h1>
            <p className="text-[#563315]/70 mt-1">Manage incoming paid orders</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="text-[#563315]" size={20} />
            <span className="text-sm text-[#563315]/70">
              {format(new Date(), "MMM dd, yyyy HH:mm")}
            </span>
          </div>
        </div>

        {/* Orders Grid */}
        {paidOrders.length === 0 ? (
          <Card className="bg-white border-[#563315]/20">
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4 opacity-30">☕</div>
              <p className="text-lg font-medium text-[#563315]">No pending orders</p>
              <p className="text-sm text-[#563315]/70 mt-2">
                New paid orders will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paidOrders.map((order) => (
              <Card key={order.id} className="bg-white border-[#563315]/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-[#563315]">{order.orderNumber}</CardTitle>
                      <CardDescription className="mt-1">
                        {formatTimeAgo(order.receivedAt)}
                      </CardDescription>
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
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Item Summary */}
                  <div className="text-sm text-[#563315]/80">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="mb-1">
                        {item.quantity}× {item.name}
                        {item.modifiers && ` (${item.modifiers.join(", ")})`}
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="text-xs text-[#563315]/60 mt-1">
                        +{order.items.length - 3} more items
                      </div>
                    )}
                  </div>

                  {/* Customer Info */}
                  {order.customerPhone && (
                    <div className="text-xs text-[#563315]/70 flex items-center gap-1">
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
                  <div className="flex items-center justify-between p-2 bg-[#f0ddb6]/30 rounded">
                    <div className="text-xs text-[#563315]/70">
                      💳 {order.paymentMethod}
                    </div>
                    <div className="text-lg font-bold text-[#2e7d32]">
                      ₹{order.total}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleConfirm(order.id, order.tableNumber)}
                      disabled={!order.tableNumber && !selectedTables[order.id]}
                      className="flex-1 bg-[#2e7d32] hover:bg-[#256029]"
                      size="sm"
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Confirm
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setExpandedOrderId(
                        expandedOrderId === order.id ? null : order.id
                      )}
                      size="sm"
                    >
                      <Eye size={16} />
                    </Button>
                  </div>

                  {/* Expanded Details */}
                  {expandedOrderId === order.id && (
                    <div className="bg-[#f0ddb6]/30 rounded-md p-3 space-y-2 mt-2">
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
                          Placed: {format(new Date(order.receivedAt), "MMM dd, yyyy HH:mm")}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

