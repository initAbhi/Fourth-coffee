"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  Store,
  Settings,
  Bell,
  Search,
  BarChart3,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

interface GlobalMetrics {
  profitability: { score: number; delta: number; revenue: number; profit: number };
  inventory: { score: number; avgFreshness: number; lowStockCount: number; totalSKUs: number };
  satisfaction: { score: number; avgRating: number; feedbackCount: number };
}

interface Cafe {
  id: string;
  name: string;
  location: string;
  managerName: string;
  profitabilityScore: number;
  inventoryScore: number;
  satisfactionScore: number;
  overallHealth: number;
  revenue: number;
  profit: number;
  orderCount: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [globalMetrics, setGlobalMetrics] = useState<GlobalMetrics | null>(null);
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
    // Refresh every 5 minutes
    const interval = setInterval(loadDashboard, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAdminDashboard();
      if (response.success && response.data) {
        setGlobalMetrics(response.data.globalMetrics);
        setCafes(response.data.cafes || []);
      } else {
        toast.error("Failed to load dashboard data");
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Error loading dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getHealthBorderColor = (score: number) => {
    if (score >= 80) return "border-green-500";
    if (score >= 60) return "border-amber-500";
    return "border-red-500";
  };

  if (loading && !globalMetrics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-amber-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-amber-900">Dashboard</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search cafés..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <Bell size={20} className="text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition">
              <Settings size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Global Health Snapshot */}
        {globalMetrics && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Global Health Snapshot</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Profitability Health */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-white rounded-xl p-6 border-2 ${getHealthBorderColor(globalMetrics.profitability.score)} shadow-lg cursor-pointer hover:shadow-xl transition`}
                onClick={() => router.push("/admin/dashboard?view=profitability")}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Profitability Health</h3>
                  <BarChart3 className="text-amber-600" size={24} />
                </div>
                <div className="flex items-center justify-center mb-4">
                  <div className={`relative w-32 h-32 rounded-full border-8 ${getHealthBorderColor(globalMetrics.profitability.score)} flex items-center justify-center`}>
                    <span className="text-3xl font-bold">{Math.round(globalMetrics.profitability.score)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2">
                  {globalMetrics.profitability.delta >= 0 ? (
                    <TrendingUp className="text-green-600" size={18} />
                  ) : (
                    <TrendingDown className="text-red-600" size={18} />
                  )}
                  <span className={`text-sm font-medium ${globalMetrics.profitability.delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {globalMetrics.profitability.delta >= 0 ? '+' : ''}{Math.round(globalMetrics.profitability.delta * 10) / 10}% vs last week
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
                  <div>Revenue: ₹{Math.round(globalMetrics.profitability.revenue).toLocaleString()}</div>
                  <div>Profit: ₹{Math.round(globalMetrics.profitability.profit).toLocaleString()}</div>
                </div>
              </motion.div>

              {/* Inventory Health */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className={`bg-white rounded-xl p-6 border-2 ${getHealthBorderColor(globalMetrics.inventory.score)} shadow-lg cursor-pointer hover:shadow-xl transition`}
                onClick={() => router.push("/admin/dashboard?view=inventory")}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Inventory Health</h3>
                  <Package className="text-amber-600" size={24} />
                </div>
                <div className="flex items-center justify-center mb-4">
                  <div className={`relative w-32 h-32 rounded-full border-8 ${getHealthBorderColor(globalMetrics.inventory.score)} flex items-center justify-center`}>
                    <span className="text-3xl font-bold">{Math.round(globalMetrics.inventory.score)}</span>
                  </div>
                </div>
                <div className="text-center text-sm text-gray-600 mb-4">
                  Avg Freshness: {Math.round(globalMetrics.inventory.avgFreshness)}%
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
                  <div>Total SKUs: {globalMetrics.inventory.totalSKUs}</div>
                  <div className={globalMetrics.inventory.lowStockCount > 0 ? 'text-red-600 font-medium' : ''}>
                    Low Stock: {globalMetrics.inventory.lowStockCount}
                  </div>
                </div>
              </motion.div>

              {/* Customer Satisfaction */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className={`bg-white rounded-xl p-6 border-2 ${getHealthBorderColor(globalMetrics.satisfaction.score)} shadow-lg cursor-pointer hover:shadow-xl transition`}
                onClick={() => router.push("/admin/dashboard?view=satisfaction")}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Customer Satisfaction</h3>
                  <Users className="text-amber-600" size={24} />
                </div>
                <div className="flex items-center justify-center mb-4">
                  <div className={`relative w-32 h-32 rounded-full border-8 ${getHealthBorderColor(globalMetrics.satisfaction.score)} flex items-center justify-center`}>
                    <span className="text-3xl font-bold">{Math.round(globalMetrics.satisfaction.score)}</span>
                  </div>
                </div>
                <div className="text-center text-sm text-gray-600 mb-4">
                  Avg Rating: {Math.round(globalMetrics.satisfaction.avgRating * 10) / 10}/5
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
                  <div>Feedback Count: {globalMetrics.satisfaction.feedbackCount}</div>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Café Grid */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Café Network</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cafes.map((cafe, index) => (
              <motion.div
                key={cafe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-xl p-6 border-2 ${getHealthBorderColor(cafe.overallHealth)} shadow-lg cursor-pointer hover:shadow-xl transition`}
                onClick={() => router.push(`/admin/cafes/${cafe.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{cafe.name}</h3>
                    <p className="text-sm text-gray-600">{cafe.location}</p>
                    <p className="text-xs text-gray-500 mt-1">Manager: {cafe.managerName}</p>
                  </div>
                  <Store className="text-amber-600" size={24} />
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center">
                    <div className={`text-xs font-medium ${getHealthColor(cafe.profitabilityScore).split(' ')[0]}`}>
                      Profit
                    </div>
                    <div className="text-lg font-bold">{cafe.profitabilityScore}</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-xs font-medium ${getHealthColor(cafe.inventoryScore).split(' ')[0]}`}>
                      Inventory
                    </div>
                    <div className="text-lg font-bold">{cafe.inventoryScore}</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-xs font-medium ${getHealthColor(cafe.satisfactionScore).split(' ')[0]}`}>
                      Satisfaction
                    </div>
                    <div className="text-lg font-bold">{cafe.satisfactionScore}</div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Overall Health</span>
                    <span className={`font-bold text-lg ${getHealthColor(cafe.overallHealth).split(' ')[0]}`}>
                      {Math.round(cafe.overallHealth)}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Revenue: ₹{Math.round(cafe.revenue).toLocaleString()} • Orders: {cafe.orderCount}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

