"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Search } from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

export default function CafesPage() {
  const router = useRouter();
  const [cafes, setCafes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadCafes();
  }, []);

  const loadCafes = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getCafes();
      if (response.success && response.data) {
        setCafes(response.data);
      } else {
        toast.error("Failed to load cafés");
      }
    } catch (error) {
      console.error("Error loading cafés:", error);
      toast.error("Error loading cafés");
    } finally {
      setLoading(false);
    }
  };

  const filteredCafes = cafes.filter((cafe) =>
    cafe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cafe.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-amber-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-amber-900">Cafés</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search cafés..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cafés List */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading cafés...</p>
          </div>
        ) : filteredCafes.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
            <Store className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No cafés found</h3>
            <p className="text-gray-600">No cafés match your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCafes.map((cafe) => (
              <div
                key={cafe.id}
                onClick={() => router.push(`/admin/cafes/${cafe.id}`)}
                className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg cursor-pointer hover:shadow-xl transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{cafe.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{cafe.address}</p>
                  </div>
                  <Store className="text-amber-600" size={24} />
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Manager: {cafe.manager_name}</p>
                  <p>Employees: {cafe.total_employees}</p>
                  <p>Region: {cafe.region}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

