"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

interface Refund {
  id: string;
  order_id: string;
  order_number?: string;
  amount: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requested_by: string;
  created_at: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
}

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadRefunds();
  }, [filter]);

  const loadRefunds = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filter !== "all") {
        params.status = filter;
      }
      const response = await apiClient.getRefunds(params);
      if (response.success && response.data) {
        setRefunds(response.data);
      } else {
        toast.error(response.error || "Failed to load refunds");
      }
    } catch (error) {
      console.error("Error loading refunds:", error);
      toast.error("Failed to load refunds");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (refundId: string) => {
    try {
      const sessionStr = localStorage.getItem("cashier_session");
      const session = sessionStr ? JSON.parse(sessionStr) : null;
      const approvedBy = session?.name || "Cashier";

      const response = await apiClient.approveRefund(refundId, approvedBy);
      if (response.success) {
        toast.success("Refund approved");
        loadRefunds();
      } else {
        toast.error(response.error || "Failed to approve refund");
      }
    } catch (error) {
      console.error("Error approving refund:", error);
      toast.error("Failed to approve refund");
    }
  };

  const handleReject = async (refundId: string, reason: string) => {
    if (!reason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      const sessionStr = localStorage.getItem("cashier_session");
      const session = sessionStr ? JSON.parse(sessionStr) : null;
      const rejectedBy = session?.name || "Cashier";

      const response = await apiClient.rejectRefund(refundId, rejectedBy, reason);
      if (response.success) {
        toast.success("Refund rejected");
        loadRefunds();
      } else {
        toast.error(response.error || "Failed to reject refund");
      }
    } catch (error) {
      console.error("Error rejecting refund:", error);
      toast.error("Failed to reject refund");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-600">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-600">Rejected</Badge>;
      default:
        return <Badge className="bg-orange-600">Pending</Badge>;
    }
  };

  const filteredRefunds = refunds.filter(r => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  return (
    <div className="h-full overflow-auto bg-[#faf7f0] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#563315]">Refunds</h1>
            <p className="text-[#563315]/70 mt-1">Manage refund requests</p>
          </div>
          <Button
            variant="outline"
            onClick={loadRefunds}
            disabled={loading}
            className="bg-white border-[#563315]/20"
          >
            <RefreshCw size={18} className={loading ? "animate-spin mr-2" : "mr-2"} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className={filter === f ? "bg-[#563315] text-white" : "bg-white"}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        {/* Refunds List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="animate-spin text-[#563315]" size={32} />
          </div>
        ) : filteredRefunds.length === 0 ? (
          <Card className="bg-white border-[#563315]/20">
            <CardContent className="p-12 text-center">
              <RefreshCw className="text-6xl mb-4 opacity-30 mx-auto" />
              <p className="text-lg font-medium text-[#563315]">No refunds found</p>
              <p className="text-sm text-[#563315]/70 mt-2">
                {filter === "all" ? "No refund requests yet" : `No ${filter} refunds`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredRefunds.map((refund) => (
              <Card key={refund.id} className="bg-white border-[#563315]/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-[#563315]">
                        Refund #{refund.id.slice(0, 8)}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Order: {refund.order_number || refund.order_id?.slice(0, 8) || "N/A"}
                      </CardDescription>
                    </div>
                    {getStatusBadge(refund.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[#563315]/70">Amount</p>
                      <p className="text-lg font-bold text-[#563315]">₹{refund.amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#563315]/70">Requested By</p>
                      <p className="text-sm font-medium text-[#563315]">{refund.requested_by}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-[#563315]/70 mb-1">Reason</p>
                    <p className="text-sm text-[#563315]">{refund.reason}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#563315]/70">
                    <Clock size={14} />
                    <span>Requested: {format(parseISO(refund.created_at), "MMM dd, yyyy HH:mm")}</span>
                  </div>

                  {refund.status === "pending" && (
                    <div className="flex gap-2 pt-2 border-t border-[#563315]/20">
                      <Button
                        onClick={() => handleApprove(refund.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <CheckCircle size={16} className="mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const reason = prompt("Enter rejection reason:");
                          if (reason) handleReject(refund.id, reason);
                        }}
                        className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
                        size="sm"
                      >
                        <XCircle size={16} className="mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {refund.status === "approved" && refund.approved_by && (
                    <div className="pt-2 border-t border-[#563315]/20 text-xs text-[#563315]/70">
                      Approved by {refund.approved_by} on {refund.approved_at ? format(parseISO(refund.approved_at), "MMM dd, yyyy HH:mm") : "N/A"}
                    </div>
                  )}

                  {refund.status === "rejected" && refund.rejected_by && (
                    <div className="pt-2 border-t border-[#563315]/20 text-xs text-[#563315]/70">
                      Rejected by {refund.rejected_by} on {refund.rejected_at ? format(parseISO(refund.rejected_at), "MMM dd, yyyy HH:mm") : "N/A"}
                      {refund.rejection_reason && (
                        <div className="mt-1 text-red-600">Reason: {refund.rejection_reason}</div>
                      )}
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

