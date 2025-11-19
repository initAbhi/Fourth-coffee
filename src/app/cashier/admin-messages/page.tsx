"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Calendar, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { apiClient } from "@/lib/api";

interface Message {
  id: string;
  from_user: string;
  to_user: string;
  subject: string;
  message: string;
  created_at: string;
  read: boolean;
  priority: "low" | "medium" | "high";
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({
    to: "",
    subject: "",
    message: "",
    priority: "medium" as "low" | "medium" | "high",
  });

  useEffect(() => {
    loadMessages();
    loadUnreadCount();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getMessages();
      if (response.success && response.data) {
        setMessages(response.data);
      } else {
        toast.error(response.error || "Failed to load messages");
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const sessionStr = localStorage.getItem("cashier_session");
      const session = sessionStr ? JSON.parse(sessionStr) : null;
      const to = session?.name || "Cashier";

      const response = await apiClient.getUnreadMessageCount(to);
      if (response.success && response.data) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!composeData.to || !composeData.subject || !composeData.message) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const sessionStr = localStorage.getItem("cashier_session");
      const session = sessionStr ? JSON.parse(sessionStr) : null;
      const fromUser = session?.name || "Cashier";

      const response = await apiClient.createMessage({
        fromUser,
        toUser: composeData.to,
        subject: composeData.subject,
        message: composeData.message,
        priority: composeData.priority,
      });

      if (response.success) {
        toast.success("Message sent");
        setComposeData({ to: "", subject: "", message: "", priority: "medium" });
        setShowCompose(false);
        loadMessages();
        loadUnreadCount();
      } else {
        toast.error(response.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await apiClient.markMessageAsRead(id);
      if (response.success) {
        loadMessages();
        loadUnreadCount();
      }
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-red-500 bg-red-50";
      case "medium":
        return "border-orange-500 bg-orange-50";
      default:
        return "border-blue-500 bg-blue-50";
    }
  };

  return (
    <div className="h-full overflow-auto bg-[#faf7f0] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#563315]">Admin Messages</h1>
            <p className="text-[#563315]/70 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}` : "No unread messages"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                loadMessages();
                loadUnreadCount();
              }}
              disabled={loading}
              className="bg-white border-[#563315]/20"
            >
              <RefreshCw size={18} className={loading ? "animate-spin mr-2" : "mr-2"} />
              Refresh
            </Button>
            <Button
              onClick={() => setShowCompose(!showCompose)}
              className="bg-[#563315] hover:bg-[#563315]/90"
            >
              <Send size={18} className="mr-2" />
              Compose Message
            </Button>
          </div>
        </div>

        {/* Compose Form */}
        {showCompose && (
          <Card className="bg-white border-[#563315]/20">
            <CardHeader>
              <CardTitle className="text-[#563315]">Compose Message</CardTitle>
              <CardDescription>Send a message to staff members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#563315] mb-1">
                  To *
                </label>
                <Input
                  value={composeData.to}
                  onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                  placeholder="e.g., All Cashiers, Manager, Admin"
                  className="border-[#563315]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#563315] mb-1">
                  Subject *
                </label>
                <Input
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  placeholder="Message subject"
                  className="border-[#563315]/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#563315] mb-1">
                  Message *
                </label>
                <Textarea
                  value={composeData.message}
                  onChange={(e) => setComposeData({ ...composeData, message: e.target.value })}
                  placeholder="Type your message here..."
                  className="border-[#563315]/20"
                  rows={5}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#563315] mb-1">
                  Priority
                </label>
                <select
                  value={composeData.priority}
                  onChange={(e) => setComposeData({ ...composeData, priority: e.target.value as "low" | "medium" | "high" })}
                  className="w-full h-9 px-2 text-sm border border-[#563315]/20 rounded focus:outline-none focus:ring-2 focus:ring-[#563315]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSendMessage}
                  className="flex-1 bg-[#563315] hover:bg-[#563315]/90"
                >
                  <Send size={16} className="mr-2" />
                  Send Message
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCompose(false);
                    setComposeData({ to: "", subject: "", message: "", priority: "medium" });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Messages List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="animate-spin text-[#563315]" size={32} />
          </div>
        ) : messages.length === 0 ? (
          <Card className="bg-white border-[#563315]/20">
            <CardContent className="p-12 text-center">
              <MessageSquare className="text-6xl mb-4 opacity-30 mx-auto" />
              <p className="text-lg font-medium text-[#563315]">No messages</p>
              <p className="text-sm text-[#563315]/70 mt-2">
                Click "Compose Message" to send a message
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <Card
                key={message.id}
                className={`bg-white border-2 ${
                  !message.read ? "border-[#563315]" : "border-[#563315]/20"
                } ${getPriorityColor(message.priority)} cursor-pointer`}
                onClick={() => markAsRead(message.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-[#563315]">{message.subject}</CardTitle>
                        {!message.read && (
                          <span className="w-2 h-2 bg-[#563315] rounded-full"></span>
                        )}
                      </div>
                      <CardDescription>
                        From: {message.from_user} | To: {message.to_user}
                      </CardDescription>
                    </div>
                    {message.priority === "high" && (
                      <AlertCircle className="text-red-600" size={20} />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[#563315] mb-3">{message.message}</p>
                  <div className="flex items-center gap-2 text-xs text-[#563315]/70">
                    <Calendar size={14} />
                    <span>{format(parseISO(message.created_at), "MMM dd, yyyy HH:mm")}</span>
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

