"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MessageSquare, Send, Plus, Search } from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

export default function CommunicationPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCafe, setSelectedCafe] = useState("");
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeData, setComposeData] = useState({
    toUser: "",
    subject: "",
    message: "",
    priority: "medium",
  });
  const [cafes, setCafes] = useState<any[]>([]);

  useEffect(() => {
    loadMessages();
    loadCafes();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getMessages();
      if (response.success && response.data) {
        setMessages(response.data);
      } else {
        toast.error("Failed to load messages");
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Error loading messages");
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

  const handleSendMessage = async () => {
    if (!composeData.toUser || !composeData.subject || !composeData.message) {
      toast.error("Please fill in all fields");
      return;
    }

    const session = localStorage.getItem("admin_session");
    if (!session) {
      toast.error("Session not found");
      return;
    }

    const sessionData = JSON.parse(session);

    try {
      const response = await apiClient.createMessage({
        fromUser: sessionData.name || "Admin",
        toUser: composeData.toUser,
        subject: composeData.subject,
        message: composeData.message,
        priority: composeData.priority as "low" | "medium" | "high",
      });

      if (response.success) {
        toast.success("Message sent successfully!");
        setShowComposeModal(false);
        setComposeData({ toUser: "", subject: "", message: "", priority: "medium" });
        loadMessages();
      } else {
        toast.error(response.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Error sending message");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-amber-100 text-amber-800";
      case "low":
        return "bg-blue-100 text-blue-800";
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
              <h1 className="text-2xl font-bold text-gray-900">Communication</h1>
              <p className="text-sm text-gray-600">Communicate with café staff</p>
            </div>
            <button
              onClick={() => setShowComposeModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
            >
              <Plus size={18} />
              New Message
            </button>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
            <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
            <p className="text-gray-600 mb-4">Start a conversation with café staff</p>
            <button
              onClick={() => setShowComposeModal(true)}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
            >
              New Message
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{message.from_user}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-gray-700">{message.to_user}</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">{message.subject}</h3>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                        message.priority
                      )}`}
                    >
                      {message.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{message.message}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{new Date(message.created_at).toLocaleString()}</span>
                    {message.read && (
                      <span className="text-green-600">✓ Read</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Compose Message</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To
                </label>
                <select
                  value={composeData.toUser}
                  onChange={(e) => setComposeData({ ...composeData, toUser: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                >
                  <option value="">Select recipient...</option>
                  <option value="All Cashiers">All Cashiers</option>
                  <option value="All Staff">All Staff</option>
                  {cafes.map((cafe) => (
                    <option key={cafe.id} value={cafe.manager_name}>
                      {cafe.manager_name} ({cafe.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="Enter subject..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={composeData.priority}
                  onChange={(e) => setComposeData({ ...composeData, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={composeData.message}
                  onChange={(e) => setComposeData({ ...composeData, message: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="Enter your message..."
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleSendMessage}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
              >
                <Send size={18} />
                Send Message
              </button>
              <button
                onClick={() => {
                  setShowComposeModal(false);
                  setComposeData({ toUser: "", subject: "", message: "", priority: "medium" });
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

