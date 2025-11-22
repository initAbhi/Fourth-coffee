"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Package, Users, BarChart3, Download } from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Tab = "profitability" | "inventory" | "satisfaction";

export default function CafeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const cafeId = params.cafeId as string;
  const [activeTab, setActiveTab] = useState<Tab>("profitability");
  const [cafeData, setCafeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month">("week");

  useEffect(() => {
    loadCafeData();
  }, [cafeId, period]);

  const loadCafeData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getCafeDetail(cafeId, period);
      if (response.success && response.data) {
        setCafeData(response.data);
      } else {
        toast.error("Failed to load café data");
      }
    } catch (error) {
      console.error("Error loading café data:", error);
      toast.error("Error loading café data");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !cafeData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading café data...</p>
        </div>
      </div>
    );
  }

  if (!cafeData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Café not found</p>
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const profitabilityData = cafeData.profitability;
  const inventoryData = cafeData.inventory;
  const satisfactionData = cafeData.satisfaction;

  // Prepare chart data
  const revenueTrendData = profitabilityData.revenueTrend || [];
  const topProducts = profitabilityData.productPerformance?.slice(0, 5) || [];
  const bottomProducts = profitabilityData.productPerformance?.slice(-5) || [];

  const COLORS = ['#d97706', '#f59e0b', '#fbbf24', '#fcd34d', '#fde68a'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50">
      {/* Header */}
      <div className="bg-white border-b border-amber-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{cafeData.cafe.name}</h1>
              <p className="text-sm text-gray-600">{cafeData.cafe.address}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Manager: {cafeData.cafe.managerName}</span>
            <span>•</span>
            <span>Employees: {cafeData.cafe.totalEmployees}</span>
            <span>•</span>
            <span>Last Sync: {cafeData.cafe.lastSync ? new Date(cafeData.cafe.lastSync).toLocaleString() : 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("profitability")}
            className={`px-6 py-3 font-medium transition ${
              activeTab === "profitability"
                ? "border-b-2 border-amber-600 text-amber-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <BarChart3 className="inline mr-2" size={18} />
            Profitability Health
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-6 py-3 font-medium transition ${
              activeTab === "inventory"
                ? "border-b-2 border-amber-600 text-amber-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Package className="inline mr-2" size={18} />
            Inventory Health
          </button>
          <button
            onClick={() => setActiveTab("satisfaction")}
            className={`px-6 py-3 font-medium transition ${
              activeTab === "satisfaction"
                ? "border-b-2 border-amber-600 text-amber-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Users className="inline mr-2" size={18} />
            Customer Satisfaction
          </button>
        </div>

        {/* Period Selector */}
        <div className="mb-6 flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Period:</span>
          <button
            onClick={() => setPeriod("week")}
            className={`px-4 py-2 rounded-lg transition ${
              period === "week"
                ? "bg-amber-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setPeriod("month")}
            className={`px-4 py-2 rounded-lg transition ${
              period === "month"
                ? "bg-amber-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Month
          </button>
        </div>

        {/* Profitability Tab */}
        {activeTab === "profitability" && (
          <div className="space-y-6">
            {/* Overview Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
                <div className="text-2xl font-bold text-gray-900">
                  ₹{Math.round(profitabilityData.overview.totalRevenue).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {profitabilityData.overview.revenueDelta >= 0 ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <TrendingUp size={12} />
                      +{Math.round(profitabilityData.overview.revenueDelta * 10) / 10}%
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <TrendingDown size={12} />
                      {Math.round(profitabilityData.overview.revenueDelta * 10) / 10}%
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Total Profit</div>
                <div className="text-2xl font-bold text-gray-900">
                  ₹{Math.round(profitabilityData.overview.totalProfit).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {profitabilityData.overview.profitDelta >= 0 ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <TrendingUp size={12} />
                      +{Math.round(profitabilityData.overview.profitDelta * 10) / 10}%
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <TrendingDown size={12} />
                      {Math.round(profitabilityData.overview.profitDelta * 10) / 10}%
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">AOV</div>
                <div className="text-2xl font-bold text-gray-900">
                  ₹{Math.round(profitabilityData.overview.aov)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {profitabilityData.overview.aovDelta >= 0 ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <TrendingUp size={12} />
                      +{Math.round(profitabilityData.overview.aovDelta * 10) / 10}%
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <TrendingDown size={12} />
                      {Math.round(profitabilityData.overview.aovDelta * 10) / 10}%
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Orders</div>
                <div className="text-2xl font-bold text-gray-900">
                  {profitabilityData.overview.orderCount}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {profitabilityData.overview.totalItemsSold} items sold
                </div>
              </div>
            </div>

            {/* Revenue Trend */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#d97706" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Product Performance */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Product Performance</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition">
                  <Download size={16} />
                  Export Report
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Rank</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Product</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">SKU</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Units Sold</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Avg Price</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Margin %</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitabilityData.productPerformance?.map((product: any) => (
                      <tr key={product.name} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">{product.rank}</td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{product.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{product.sku}</td>
                        <td className="py-3 px-4 text-sm text-right text-gray-900">{product.unitsSold}</td>
                        <td className="py-3 px-4 text-sm text-right text-gray-900">₹{Math.round(product.avgPrice)}</td>
                        <td className="py-3 px-4 text-sm text-right text-gray-900">{Math.round(product.marginPercent)}%</td>
                        <td className="py-3 px-4 text-sm text-right font-medium text-gray-900">₹{Math.round(product.profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === "inventory" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Freshness Score</div>
                <div className="text-2xl font-bold text-gray-900">{inventoryData.freshnessScore}%</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Wastage Score</div>
                <div className="text-2xl font-bold text-gray-900">{inventoryData.wastageScore}%</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Active SKUs</div>
                <div className="text-2xl font-bold text-gray-900">{inventoryData.activeSKUs}</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Low Stock</div>
                <div className={`text-2xl font-bold ${inventoryData.lowStockAlerts > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {inventoryData.lowStockAlerts}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Expiring Soon</div>
                <div className={`text-2xl font-bold ${inventoryData.expiringSoon > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                  {inventoryData.expiringSoon}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Management</h3>
              <p className="text-gray-600">Inventory details will be displayed here. This section can be expanded with a full inventory table.</p>
            </div>
          </div>
        )}

        {/* Satisfaction Tab */}
        {activeTab === "satisfaction" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Satisfaction Score</div>
                <div className="text-2xl font-bold text-gray-900">{satisfactionData.score}</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Avg Rating</div>
                <div className="text-2xl font-bold text-gray-900">{satisfactionData.avgRating}/5</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Feedback Count</div>
                <div className="text-2xl font-bold text-gray-900">{satisfactionData.feedbackCount}</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Complaints/100 Orders</div>
                <div className="text-2xl font-bold text-gray-900">{satisfactionData.complaintsPer100Orders}</div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Feedback</h3>
              <p className="text-gray-600">Feedback details will be displayed here. This section can be expanded with a feedback table.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

