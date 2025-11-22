"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Package, Search, Plus } from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

export default function CentralInventoryPage() {
  const router = useRouter();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedCafe, setSelectedCafe] = useState("");
  const [dispatchItems, setDispatchItems] = useState<Array<{ sku: string; quantity: number }>>([]);
  const [cafes, setCafes] = useState<any[]>([]);
  const [dispatchLoading, setDispatchLoading] = useState(false);

  useEffect(() => {
    loadInventory();
    loadCafes();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getCentralInventory({
        search: searchTerm || undefined,
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
      });
      if (response.success && response.data) {
        setInventory(response.data);
      } else {
        toast.error("Failed to load inventory");
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
      toast.error("Error loading inventory");
    } finally {
      setLoading(false);
    }
  };

  const loadCafes = async () => {
    try {
      const response = await apiClient.getCafes();
      if (response.success && response.data) {
        setCafes(response.data);
      }
    } catch (error) {
      console.error("Error loading cafes:", error);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [searchTerm, categoryFilter, statusFilter]);

  const handleCreateDispatch = () => {
    if (!selectedCafe) {
      toast.error("Please select a café");
      return;
    }
    if (dispatchItems.length === 0) {
      toast.error("Please add items to dispatch");
      return;
    }

    const session = localStorage.getItem("admin_session");
    if (!session) {
      toast.error("Session not found");
      return;
    }

    const sessionData = JSON.parse(session);

    setDispatchLoading(true);
    apiClient
      .createDispatchOrder({
        cafeId: selectedCafe,
        items: dispatchItems,
        createdBy: sessionData.name || "Admin",
      })
      .then((response) => {
        if (response.success) {
          toast.success("Dispatch order created successfully!");
          setShowDispatchModal(false);
          setDispatchItems([]);
          setSelectedCafe("");
          loadInventory();
        } else {
          toast.error(response.error || "Failed to create dispatch order");
        }
      })
      .catch((error) => {
        console.error("Error creating dispatch:", error);
        toast.error("Error creating dispatch order");
      })
      .finally(() => {
        setDispatchLoading(false);
      });
  };

  const addDispatchItem = (item: any) => {
    const existing = dispatchItems.find((i) => i.sku === item.sku);
    if (existing) {
      setDispatchItems(
        dispatchItems.map((i) =>
          i.sku === item.sku ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setDispatchItems([...dispatchItems, { sku: item.sku, quantity: 1 }]);
    }
  };

  const removeDispatchItem = (sku: string) => {
    setDispatchItems(dispatchItems.filter((i) => i.sku !== sku));
  };

  const updateDispatchQuantity = (sku: string, quantity: number) => {
    if (quantity <= 0) {
      removeDispatchItem(sku);
      return;
    }
    setDispatchItems(
      dispatchItems.map((i) => (i.sku === sku ? { ...i, quantity } : i))
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ok":
        return "bg-green-100 text-green-800";
      case "low_stock":
        return "bg-amber-100 text-amber-800";
      case "expiring":
        return "bg-orange-100 text-orange-800";
      case "out_of_stock":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const categories = Array.from(new Set(inventory.map((item) => item.category)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50">
      {/* Header */}
      <div className="bg-white border-b border-amber-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Central Inventory</h1>
              <p className="text-sm text-gray-600">Manage and dispatch inventory to cafés</p>
            </div>
            <button
              onClick={() => setShowDispatchModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
            >
              <Plus size={18} />
              Create Dispatch Order
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by SKU or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
            >
              <option value="">All Status</option>
              <option value="ok">OK</option>
              <option value="low_stock">Low Stock</option>
              <option value="expiring">Expiring</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">SKU</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Item Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Quantity</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Cost Price</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Freshness</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : inventory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      No inventory items found
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => (
                    <tr key={item.sku} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{item.sku}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{item.item_name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{item.category}</td>
                      <td className="py-3 px-4 text-sm text-right text-gray-900">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-900">₹{item.cost_price}</td>
                      <td className="py-3 px-4 text-sm text-right text-gray-900">
                        {Math.round(item.freshness_percentage)}%
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {item.status.replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => addDispatchItem(item)}
                          className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                        >
                          Add to Dispatch
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dispatch Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Dispatch Order</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Café
              </label>
              <select
                value={selectedCafe}
                onChange={(e) => setSelectedCafe(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              >
                <option value="">Select a café...</option>
                {cafes.map((cafe) => (
                  <option key={cafe.id} value={cafe.id}>
                    {cafe.name}
                  </option>
                ))}
              </select>
            </div>

            {dispatchItems.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Items to Dispatch</h3>
                <div className="space-y-2">
                  {dispatchItems.map((item) => {
                    const invItem = inventory.find((i) => i.sku === item.sku);
                    return (
                      <div
                        key={item.sku}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-gray-900">{invItem?.item_name}</div>
                          <div className="text-sm text-gray-600">{item.sku}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateDispatchQuantity(item.sku, parseInt(e.target.value) || 0)
                            }
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <span className="text-sm text-gray-600">{invItem?.unit}</span>
                          <button
                            onClick={() => removeDispatchItem(item.sku)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleCreateDispatch}
                disabled={dispatchLoading || !selectedCafe || dispatchItems.length === 0}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {dispatchLoading ? "Creating..." : "Create Dispatch Order"}
              </button>
              <button
                onClick={() => {
                  setShowDispatchModal(false);
                  setDispatchItems([]);
                  setSelectedCafe("");
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

