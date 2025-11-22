"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MessageSquare, Send, Calendar, Users, Plus } from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

export default function MarketingPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    message: "",
    audienceSegment: "all",
    scheduledAt: "",
  });

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getMarketingCampaigns();
      if (response.success && response.data) {
        setCampaigns(response.data);
      } else {
        toast.error("Failed to load campaigns");
      }
    } catch (error) {
      console.error("Error loading campaigns:", error);
      toast.error("Error loading campaigns");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!formData.name || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    const session = localStorage.getItem("admin_session");
    if (!session) {
      toast.error("Session not found");
      return;
    }

    const sessionData = JSON.parse(session);

    try {
      const response = await apiClient.createMarketingCampaign({
        name: formData.name,
        message: formData.message,
        audienceSegment: formData.audienceSegment,
        scheduledAt: formData.scheduledAt || undefined,
        createdBy: sessionData.name || "Admin",
      });

      if (response.success) {
        toast.success("Campaign created successfully!");
        setShowCreateModal(false);
        setFormData({ name: "", message: "", audienceSegment: "all", scheduledAt: "" });
        loadCampaigns();
      } else {
        toast.error(response.error || "Failed to create campaign");
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.error("Error creating campaign");
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    try {
      const response = await apiClient.sendMarketingCampaign(campaignId);
      if (response.success) {
        toast.success(`Campaign sent to ${response.data.sentCount} customers!`);
        loadCampaigns();
      } else {
        toast.error(response.error || "Failed to send campaign");
      }
    } catch (error) {
      console.error("Error sending campaign:", error);
      toast.error("Error sending campaign");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50">
      {/* Header */}
      <div className="bg-white border-b border-amber-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Marketing & WhatsApp</h1>
              <p className="text-sm text-gray-600">Create and manage customer campaigns</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
            >
              <Plus size={18} />
              Create Campaign
            </button>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading campaigns...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
            <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-gray-600 mb-4">Create your first marketing campaign to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
            >
              Create Campaign
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      campaign.status
                    )}`}
                  >
                    {campaign.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{campaign.message}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users size={16} />
                    <span>Audience: {campaign.audience_segment}</span>
                  </div>
                  {campaign.sent_count > 0 && (
                    <div className="text-sm text-gray-600">
                      Sent: {campaign.sent_count} • Delivered: {campaign.delivered_count || 0} • Read:{" "}
                      {campaign.read_count || 0}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {campaign.status === "draft" && (
                    <button
                      onClick={() => handleSendCampaign(campaign.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition text-sm"
                    >
                      <Send size={16} />
                      Send Now
                    </button>
                  )}
                  {campaign.status === "scheduled" && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={16} />
                      <span>
                        {new Date(campaign.scheduled_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Marketing Campaign</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="e.g., New Menu Launch"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="Enter your message here..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Audience Segment
                </label>
                <select
                  value={formData.audienceSegment}
                  onChange={(e) => setFormData({ ...formData, audienceSegment: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                >
                  <option value="all">All Customers</option>
                  <option value="frequent">Frequent Customers</option>
                  <option value="dormant">Dormant Customers</option>
                  <option value="vip">VIP Customers</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleCreateCampaign}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
              >
                Create Campaign
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ name: "", message: "", audienceSegment: "all", scheduledAt: "" });
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

