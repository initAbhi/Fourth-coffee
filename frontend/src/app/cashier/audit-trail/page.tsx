"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, Search, Calendar, User, FileText, RefreshCw } from "lucide-react";
import { format, parseISO } from "date-fns";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

interface AuditLog {
  id: string;
  action: string;
  actor: string;
  entity_type: string;
  entity_id: string;
  details: string;
  created_at: string;
  ip_address?: string;
}

export default function AuditTrailPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterActor, setFilterActor] = useState<string>("all");
  const [filterOptions, setFilterOptions] = useState<{
    actions: string[];
    actors: string[];
    entityTypes: string[];
  }>({ actions: [], actors: [], entityTypes: [] });

  useEffect(() => {
    loadAuditLogs();
    loadFilterOptions();
  }, []);

  useEffect(() => {
    loadAuditLogs();
  }, [searchTerm, filterAction, filterActor]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (filterAction !== "all") params.action = filterAction;
      if (filterActor !== "all") params.actor = filterActor;

      const response = await apiClient.getAuditLogs(params);
      if (response.success && response.data) {
        setAuditLogs(response.data);
      } else {
        toast.error(response.error || "Failed to load audit logs");
      }
    } catch (error) {
      console.error("Error loading audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const response = await apiClient.getAuditFilterOptions();
      if (response.success && response.data) {
        setFilterOptions(response.data);
      }
    } catch (error) {
      console.error("Error loading filter options:", error);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes("Created")) return "bg-blue-100 text-blue-800";
    if (action.includes("Approved")) return "bg-green-100 text-green-800";
    if (action.includes("Rejected")) return "bg-red-100 text-red-800";
    if (action.includes("Served")) return "bg-purple-100 text-purple-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="h-full overflow-auto bg-[#faf7f0] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#563315]">Audit Trail</h1>
            <p className="text-[#563315]/70 mt-1">View system activity logs</p>
          </div>
          <Button
            variant="outline"
            onClick={loadAuditLogs}
            disabled={loading}
            className="bg-white border-[#563315]/20"
          >
            <RefreshCw size={18} className={loading ? "animate-spin mr-2" : "mr-2"} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-white border-[#563315]/20">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#563315]/50" size={18} />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-[#563315]/20"
                />
              </div>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="border-[#563315]/20">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {filterOptions.actions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterActor} onValueChange={setFilterActor}>
                <SelectTrigger className="border-[#563315]/20">
                  <SelectValue placeholder="Filter by actor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actors</SelectItem>
                  {filterOptions.actors.map((actor) => (
                    <SelectItem key={actor} value={actor}>
                      {actor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="animate-spin text-[#563315]" size={32} />
          </div>
        ) : auditLogs.length === 0 ? (
          <Card className="bg-white border-[#563315]/20">
            <CardContent className="p-12 text-center">
              <ClipboardList className="text-6xl mb-4 opacity-30 mx-auto" />
              <p className="text-lg font-medium text-[#563315]">No audit logs found</p>
              <p className="text-sm text-[#563315]/70 mt-2">
                {searchTerm || filterAction !== "all" || filterActor !== "all"
                  ? "Try adjusting your filters"
                  : "System activity will appear here"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {auditLogs.map((log) => (
              <Card key={log.id} className="bg-white border-[#563315]/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#f0ddb6]/30 flex items-center justify-center">
                      <FileText className="text-[#563315]" size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                        <span className="text-sm text-[#563315]/70">{log.entity_type}</span>
                        <span className="text-sm font-medium text-[#563315]">{log.entity_id}</span>
                      </div>
                      <p className="text-sm text-[#563315] mb-2">{log.details || "No details"}</p>
                      <div className="flex items-center gap-4 text-xs text-[#563315]/70">
                        <div className="flex items-center gap-1">
                          <User size={14} />
                          <span>{log.actor}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>{format(parseISO(log.created_at), "MMM dd, yyyy HH:mm:ss")}</span>
                        </div>
                        {log.ip_address && (
                          <span className="text-[#563315]/50">IP: {log.ip_address}</span>
                        )}
                      </div>
                    </div>
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

