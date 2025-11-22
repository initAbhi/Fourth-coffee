"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, AlertCircle } from "lucide-react";

interface AdminMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: number;
  priority: "normal" | "high";
  acknowledged: boolean;
}

export const AdminNotesPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages] = useState<AdminMessage[]>([
    {
      id: "1",
      sender: "Admin HQ",
      message: "New policy: All refunds above ₹500 need manager approval. Please ensure proper documentation.",
      timestamp: Date.now() - 300000, // 5 min ago
      priority: "high",
      acknowledged: false,
    },
    {
      id: "2",
      sender: "Manager",
      message: "Staff meeting at 3 PM today. Please ensure shift coverage.",
      timestamp: Date.now() - 3600000, // 1 hour ago
      priority: "normal",
      acknowledged: true,
    },
  ]);

  const unreadCount = messages.filter((m) => !m.acknowledged).length;

  const formatTimeAgo = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  if (!isExpanded) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-4 right-4 z-40"
      >
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-white border-2 border-[#1976d2] rounded-lg shadow-lg p-4 flex items-center gap-3 hover:shadow-xl transition-all cursor-pointer min-w-[280px]"
        >
          <div className="relative">
            <MessageSquare size={24} className="text-[#1976d2]" />
            {unreadCount > 0 && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-[#d32f2f] rounded-full"
              />
            )}
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-[#563315] line-clamp-1">
              {messages[0].message}
            </div>
            <div className="text-xs text-[#563315]/60">
              {formatTimeAgo(messages[0].timestamp)}
            </div>
          </div>
          {unreadCount > 0 && (
            <button className="px-3 py-1 bg-[#1976d2] text-white text-xs rounded-full font-medium">
              Ack
            </button>
          )}
        </button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 w-[400px] bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="h-14 bg-[#1976d2] text-white px-6 flex items-center justify-between">
          <h3 className="text-lg font-bold">Admin Messages</h3>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`border rounded-lg p-4 space-y-3 ${
                msg.priority === "high"
                  ? "border-l-4 border-l-[#d32f2f] bg-[#d32f2f]/5"
                  : "border-[#e0e0e0]"
              } ${msg.acknowledged ? "opacity-60" : ""}`}
            >
              {/* Sender and Time */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-bold text-[#563315]">
                    {msg.sender}
                    {msg.priority === "high" && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-[#d32f2f]">
                        <AlertCircle size={14} />
                        Priority
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#563315]/60">
                    {formatTimeAgo(msg.timestamp)}
                  </div>
                </div>
                {msg.acknowledged && (
                  <span className="text-xs text-[#2e7d32] font-medium">✓ Read</span>
                )}
              </div>

              {/* Message Body */}
              <p className="text-sm text-[#563315] leading-relaxed">{msg.message}</p>

              {/* Acknowledge Button */}
              {!msg.acknowledged && (
                <button
                  onClick={() => {
                    // Handle acknowledgment
                  }}
                  className="w-full h-9 bg-[#1976d2] text-white text-sm font-medium rounded-md hover:bg-[#1565c0] transition-colors"
                >
                  Acknowledge
                </button>
              )}
            </div>
          ))}

          {messages.every((m) => m.acknowledged) && (
            <div className="text-center py-8 text-sm text-[#2e7d32] font-medium">
              ✓ All caught up
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="border-t border-[#e0e0e0] px-6 py-3 text-xs text-[#563315]/60 text-center">
          Press <kbd className="px-2 py-0.5 bg-[#f0ddb6] rounded text-[#563315] font-mono">Ctrl+N</kbd> to open this panel
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
