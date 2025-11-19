"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Calendar, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { apiClient } from "@/lib/api";

interface WastageEntry {
  id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit: string;
  reason: string;
  recorded_by: string;
  created_at: string;
}

export default function WastagePage() {
  const [wastageEntries, setWastageEntries] = useState<WastageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    itemName: "",
    category: "",
    quantity: "",
    unit: "pieces",
    reason: "",
  });

  useEffect(() => {
    loadWastageEntries();
  }, []);

  const loadWastageEntries = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getWastageEntries();
      if (response.success && response.data) {
        setWastageEntries(response.data);
      } else {
        toast.error(response.error || "Failed to load wastage entries");
      }
    } catch (error) {
      console.error("Error loading wastage entries:", error);
      toast.error("Failed to load wastage entries");
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    "Coffee Beans",
    "Milk",
    "Pastries",
    "Food Items",
    "Beverages",
    "Other",
  ];

  const units = ["pieces", "kg", "liters", "packets", "boxes"];

  const handleAddWastage = async () => {
    if (!formData.itemName || !formData.category || !formData.quantity || !formData.reason) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const sessionStr = localStorage.getItem("cashier_session");
      const session = sessionStr ? JSON.parse(sessionStr) : null;
      const recordedBy = session?.name || "Cashier";

      const response = await apiClient.createWastageEntry({
        itemName: formData.itemName,
        category: formData.category,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        reason: formData.reason,
        recordedBy,
      });

      if (response.success) {
        toast.success("Wastage entry recorded");
        setFormData({
          itemName: "",
          category: "",
          quantity: "",
          unit: "pieces",
          reason: "",
        });
        setShowAddForm(false);
        loadWastageEntries();
      } else {
        toast.error(response.error || "Failed to record wastage");
      }
    } catch (error) {
      console.error("Error creating wastage entry:", error);
      toast.error("Failed to record wastage");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this wastage entry?")) {
      return;
    }

    try {
      const response = await apiClient.deleteWastageEntry(id);
      if (response.success) {
        toast.success("Wastage entry deleted");
        loadWastageEntries();
      } else {
        toast.error(response.error || "Failed to delete wastage entry");
      }
    } catch (error) {
      console.error("Error deleting wastage entry:", error);
      toast.error("Failed to delete wastage entry");
    }
  };

  return (
    <div className="h-full overflow-auto bg-[#faf7f0] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#563315]">Wastage Log</h1>
            <p className="text-[#563315]/70 mt-1">Track inventory wastage</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={loadWastageEntries}
              disabled={loading}
              className="bg-white border-[#563315]/20"
            >
              <RefreshCw size={18} className={loading ? "animate-spin mr-2" : "mr-2"} />
              Refresh
            </Button>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-[#563315] hover:bg-[#563315]/90"
            >
              <Plus size={18} className="mr-2" />
              Add Wastage Entry
            </Button>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <Card className="bg-white border-[#563315]/20">
            <CardHeader>
              <CardTitle className="text-[#563315]">New Wastage Entry</CardTitle>
              <CardDescription>Record inventory wastage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#563315] mb-1">
                    Item Name *
                  </label>
                  <Input
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    placeholder="e.g., Espresso Beans"
                    className="border-[#563315]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#563315] mb-1">
                    Category *
                  </label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="border-[#563315]/20">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#563315] mb-1">
                    Quantity *
                  </label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="0"
                    className="border-[#563315]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#563315] mb-1">
                    Unit
                  </label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  >
                    <SelectTrigger className="border-[#563315]/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#563315] mb-1">
                  Reason *
                </label>
                <Textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g., Expired, Damaged, Spilled"
                  className="border-[#563315]/20"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAddWastage}
                  className="flex-1 bg-[#563315] hover:bg-[#563315]/90"
                >
                  Record Wastage
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({
                      itemName: "",
                      category: "",
                      quantity: "",
                      unit: "pieces",
                      reason: "",
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Wastage Entries */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="animate-spin text-[#563315]" size={32} />
          </div>
        ) : wastageEntries.length === 0 ? (
          <Card className="bg-white border-[#563315]/20">
            <CardContent className="p-12 text-center">
              <Trash2 className="text-6xl mb-4 opacity-30 mx-auto" />
              <p className="text-lg font-medium text-[#563315]">No wastage entries</p>
              <p className="text-sm text-[#563315]/70 mt-2">
                Click "Add Wastage Entry" to record inventory wastage
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {wastageEntries.map((entry) => (
              <Card key={entry.id} className="bg-white border-[#563315]/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-[#563315]">{entry.item_name}</CardTitle>
                      <CardDescription className="mt-1">{entry.category}</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(entry.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-[#563315]/70">Quantity</p>
                      <p className="text-lg font-bold text-[#563315]">
                        {entry.quantity} {entry.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#563315]/70">Recorded By</p>
                      <p className="text-sm font-medium text-[#563315]">{entry.recorded_by}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-[#563315]/70 mb-1">Reason</p>
                    <div className="flex items-start gap-2 p-2 bg-orange-50 rounded">
                      <AlertTriangle className="text-orange-600 mt-0.5" size={16} />
                      <p className="text-sm text-[#563315]">{entry.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#563315]/70 pt-2 border-t border-[#563315]/20">
                    <Calendar size={14} />
                    <span>{format(parseISO(entry.created_at), "MMM dd, yyyy HH:mm")}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

