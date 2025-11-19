"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  FileSpreadsheet, 
  Mail, 
  Calendar,
  DollarSign,
  Users,
  RefreshCw,
  TrendingUp,
  CheckCircle,
  Clock,
  Gift
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ReportData {
  reportType: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  revenue: {
    totalOrders: number;
    totalRevenue: number;
    paidRevenue: number;
    unpaidRevenue: number;
  };
  paymentMethods: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
  tables: {
    paidTables: number;
    unpaidTables: number;
    totalTablesWithOrders: number;
  };
  loyaltyPoints: {
    totalEarned: number;
    totalRedeemed: number;
    earnedTransactions: number;
    redeemedTransactions: number;
  };
  wallet: {
    totalTopups: number;
    pendingTopups: number;
    approvedTopups: number;
    totalTopupAmount: number;
    totalPayments: number;
    totalRefunds: number;
  };
  customizations: Record<string, number>;
}


interface Transaction {
  id: string;
  orderNumber: string;
  tableNumber: string;
  customerName?: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  paymentMethod: string;
  createdAt: string;
  status: string;
}

export const ReportsView: React.FC = () => {
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const [autoEmailEnabled, setAutoEmailEnabled] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      let response;
      if (reportType === "daily") {
        response = await apiClient.generateDailyReport(selectedDate);
      } else if (reportType === "weekly") {
        const weekStart = startOfWeek(parseISO(selectedDate));
        response = await apiClient.generateWeeklyReport(format(weekStart, "yyyy-MM-dd"));
      } else {
        const [year, month] = selectedMonth.split("-");
        response = await apiClient.generateMonthlyReport(parseInt(year), parseInt(month));
      }

      if (response.success && response.data) {
        setReportData(response.data);
        toast.success("Report generated successfully");
      } else {
        toast.error(response.error || "Failed to generate report");
      }
    } catch (error) {
      console.error("Error loading report:", error);
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    setTransactionsLoading(true);
    try {
      let startDate: string;
      let endDate: string;

      if (reportType === "daily") {
        startDate = `${selectedDate}T00:00:00.000Z`;
        endDate = `${selectedDate}T23:59:59.999Z`;
      } else if (reportType === "weekly") {
        const weekStart = startOfWeek(parseISO(selectedDate));
        const weekEnd = endOfWeek(parseISO(selectedDate));
        startDate = `${format(weekStart, "yyyy-MM-dd")}T00:00:00.000Z`;
        endDate = `${format(weekEnd, "yyyy-MM-dd")}T23:59:59.999Z`;
      } else {
        const [year, month] = selectedMonth.split("-");
        startDate = `${year}-${month}-01T00:00:00.000Z`;
        // Get last day of the month (month is 1-indexed in Date constructor)
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        endDate = `${year}-${month}-${lastDay.toString().padStart(2, '0')}T23:59:59.999Z`;
      }

      const response = await apiClient.getOrders({
        paymentStatus: "paid",
        startDate,
        endDate,
        limit: 1000, // Get up to 1000 transactions
      });

      if (response.success && response.data) {
        setTransactions(response.data);
      } else {
        toast.error(response.error || "Failed to load transactions");
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, selectedDate, selectedMonth]);

  const exportToPDF = async () => {
    if (!reportData) return;
    try {
      // Create a printable HTML content
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error("Please allow popups to export PDF");
        return;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Report - ${reportType} - ${format(new Date(), "yyyy-MM-dd")}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h1 { color: #563315; border-bottom: 2px solid #563315; padding-bottom: 10px; }
            h2 { color: #563315; margin-top: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #563315; color: white; }
            .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
            .card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
            .card-title { font-weight: bold; color: #563315; }
            .card-value { font-size: 24px; font-weight: bold; margin-top: 5px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</h1>
          <p><strong>Period:</strong> ${format(parseISO(reportData.periodStart), "MMM dd, yyyy")} - ${format(parseISO(reportData.periodEnd), "MMM dd, yyyy")}</p>
          <p><strong>Generated:</strong> ${format(parseISO(reportData.generatedAt), "MMM dd, yyyy HH:mm")}</p>
          
          <h2>Revenue Summary</h2>
          <div class="summary">
            <div class="card">
              <div class="card-title">Total Revenue</div>
              <div class="card-value">₹${reportData.revenue.totalRevenue.toFixed(2)}</div>
            </div>
            <div class="card">
              <div class="card-title">Total Orders</div>
              <div class="card-value">${reportData.revenue.totalOrders}</div>
            </div>
            <div class="card">
              <div class="card-title">Paid Revenue</div>
              <div class="card-value">₹${reportData.revenue.paidRevenue.toFixed(2)}</div>
            </div>
          </div>

          <h2>Payment Methods</h2>
          <table>
            <tr><th>Method</th><th>Count</th><th>Amount (₹)</th></tr>
            ${reportData.paymentMethods.map(pm => `<tr><td>${pm.method}</td><td>${pm.count}</td><td>${pm.amount.toFixed(2)}</td></tr>`).join('')}
          </table>

          <h2>Tables Summary</h2>
          <table>
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Paid Tables</td><td>${reportData.tables.paidTables}</td></tr>
            <tr><td>Unpaid Tables</td><td>${reportData.tables.unpaidTables}</td></tr>
            <tr><td>Total Tables with Orders</td><td>${reportData.tables.totalTablesWithOrders}</td></tr>
          </table>

          <h2>Loyalty Points</h2>
          <table>
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Total Earned</td><td>${reportData.loyaltyPoints.totalEarned}</td></tr>
            <tr><td>Total Redeemed</td><td>${reportData.loyaltyPoints.totalRedeemed}</td></tr>
            <tr><td>Earned Transactions</td><td>${reportData.loyaltyPoints.earnedTransactions}</td></tr>
            <tr><td>Redeemed Transactions</td><td>${reportData.loyaltyPoints.redeemedTransactions}</td></tr>
          </table>

          <h2>Wallet</h2>
          <table>
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Total Topups</td><td>${reportData.wallet.totalTopups}</td></tr>
            <tr><td>Pending Topups</td><td>${reportData.wallet.pendingTopups}</td></tr>
            <tr><td>Approved Topups</td><td>${reportData.wallet.approvedTopups}</td></tr>
            <tr><td>Total Topup Amount</td><td>₹${reportData.wallet.totalTopupAmount.toFixed(2)}</td></tr>
            <tr><td>Total Wallet Payments</td><td>₹${reportData.wallet.totalPayments.toFixed(2)}</td></tr>
            <tr><td>Total Wallet Refunds</td><td>₹${reportData.wallet.totalRefunds.toFixed(2)}</td></tr>
          </table>

          ${Object.keys(reportData.customizations).length > 0 ? `
          <h2>Customization Usage</h2>
          <table>
            <tr><th>Customization</th><th>Usage Count</th></tr>
            ${Object.entries(reportData.customizations).map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`).join('')}
          </table>
          ` : ''}
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load, then print
      setTimeout(() => {
        printWindow.print();
      }, 250);
      
      toast.success("PDF export opened in new window");
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      toast.error("Failed to export PDF");
    }
  };

  const exportToExcel = async () => {
    if (!reportData) return;
    try {
      // Create CSV content
      const csvContent = generateCSV(reportData);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `report-${reportType}-${format(new Date(), "yyyy-MM-dd")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Report exported to CSV");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export report");
    }
  };

  const generateCSV = (data: ReportData): string => {
    const lines: string[] = [];
    lines.push(`Report Type,${data.reportType}`);
    lines.push(`Period Start,${data.periodStart}`);
    lines.push(`Period End,${data.periodEnd}`);
    lines.push(`Generated At,${data.generatedAt}`);
    lines.push("");
    lines.push("Revenue Summary");
    lines.push(`Total Orders,${data.revenue.totalOrders}`);
    lines.push(`Total Revenue,${data.revenue.totalRevenue}`);
    lines.push(`Paid Revenue,${data.revenue.paidRevenue}`);
    lines.push("");
    lines.push("Payment Methods");
    lines.push("Method,Count,Amount");
    data.paymentMethods.forEach(pm => {
      lines.push(`${pm.method},${pm.count},${pm.amount}`);
    });
    lines.push("");
    lines.push("Tables");
    lines.push(`Paid Tables,${data.tables.paidTables}`);
    lines.push(`Unpaid Tables,${data.tables.unpaidTables}`);
    lines.push(`Total Tables with Orders,${data.tables.totalTablesWithOrders}`);
    lines.push("");
    lines.push("Loyalty Points");
    lines.push(`Total Earned,${data.loyaltyPoints.totalEarned}`);
    lines.push(`Total Redeemed,${data.loyaltyPoints.totalRedeemed}`);
    lines.push(`Earned Transactions,${data.loyaltyPoints.earnedTransactions}`);
    lines.push(`Redeemed Transactions,${data.loyaltyPoints.redeemedTransactions}`);
    lines.push("");
    lines.push("Wallet");
    lines.push(`Total Topups,${data.wallet.totalTopups}`);
    lines.push(`Pending Topups,${data.wallet.pendingTopups}`);
    lines.push(`Approved Topups,${data.wallet.approvedTopups}`);
    lines.push(`Total Topup Amount,${data.wallet.totalTopupAmount}`);
    lines.push(`Total Wallet Payments,${data.wallet.totalPayments}`);
    lines.push(`Total Wallet Refunds,${data.wallet.totalRefunds}`);
    return lines.join("\n");
  };

  const sendEmailSummary = async () => {
    if (!reportData) return;
    try {
      // For now, we'll use mailto link. In production, this would call a backend endpoint
      const subject = encodeURIComponent(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - ${format(parseISO(reportData.periodStart), "MMM dd, yyyy")}`);
      const body = encodeURIComponent(`
Report Summary:
- Total Revenue: ₹${reportData.revenue.totalRevenue.toFixed(2)}
- Total Orders: ${reportData.revenue.totalOrders}
- Paid Revenue: ₹${reportData.revenue.paidRevenue.toFixed(2)}

Period: ${format(parseISO(reportData.periodStart), "MMM dd, yyyy")} - ${format(parseISO(reportData.periodEnd), "MMM dd, yyyy")}
Generated: ${format(parseISO(reportData.generatedAt), "MMM dd, yyyy HH:mm")}
      `);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
      toast.success("Email client opened with report summary");
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to open email client");
    }
  };

  const paymentMethodChartData = reportData?.paymentMethods.map(pm => ({
    name: pm.method,
    value: pm.amount,
    count: pm.count,
  })) || [];


  const customizationData = reportData ? Object.entries(reportData.customizations).map(([key, value]) => ({
    name: key,
    count: value,
  })) : [];

  return (
    <div className="h-full overflow-auto bg-[#faf7f0] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#563315]">Reports</h1>
            <p className="text-[#563315]/70 mt-1">View and export business reports</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={loadReport}
              disabled={loading}
              className="bg-white border-[#563315]/20"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              Refresh
            </Button>
            {reportData && (
              <>
                <Button
                  variant="outline"
                  onClick={exportToPDF}
                  className="bg-white border-[#563315]/20"
                >
                  <FileText size={18} />
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={exportToExcel}
                  className="bg-white border-[#563315]/20"
                >
                  <FileSpreadsheet size={18} />
                  Export Excel
                </Button>
                {autoEmailEnabled && (
                  <Button
                    variant="outline"
                    onClick={sendEmailSummary}
                    className="bg-white border-[#563315]/20"
                  >
                    <Mail size={18} />
                    Email Summary
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Report Type Selection */}
        <Card className="bg-white border-[#563315]/20">
          <CardContent className="p-6">
            <Tabs value={reportType} onValueChange={(v) => setReportType(v as typeof reportType)}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-4 mb-4">
                {reportType === "daily" && (
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-[#563315]" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-2 border border-[#563315]/20 rounded-md text-sm"
                    />
                  </div>
                )}
                {reportType === "weekly" && (
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-[#563315]" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-2 border border-[#563315]/20 rounded-md text-sm"
                    />
                    <span className="text-sm text-[#563315]/70">
                      (Week starting from selected date)
                    </span>
                  </div>
                )}
                {reportType === "monthly" && (
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-[#563315]" />
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="px-3 py-2 border border-[#563315]/20 rounded-md text-sm"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <input
                    type="checkbox"
                    id="autoEmail"
                    checked={autoEmailEnabled}
                    onChange={(e) => setAutoEmailEnabled(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="autoEmail" className="text-sm text-[#563315]/70">
                    Auto-email summary
                  </label>
                </div>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Report Content */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="animate-spin text-[#563315]" size={32} />
          </div>
        )}

        {!loading && reportData && (
          <div className="space-y-6">
            {/* Revenue Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="bg-white border-[#563315]/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#563315]/70">Total Revenue</p>
                      <p className="text-2xl font-bold text-[#563315] mt-1">
                        ₹{reportData.revenue.totalRevenue.toFixed(2)}
                      </p>
                    </div>
                    <DollarSign className="text-[#b88933]" size={32} />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-[#563315]/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#563315]/70">Total Orders</p>
                      <p className="text-2xl font-bold text-[#563315] mt-1">
                        {reportData.revenue.totalOrders}
                      </p>
                    </div>
                    <TrendingUp className="text-[#b88933]" size={32} />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-[#563315]/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#563315]/70">Paid Revenue</p>
                      <p className="text-2xl font-bold text-[#563315] mt-1">
                        ₹{reportData.revenue.paidRevenue.toFixed(2)}
                      </p>
                    </div>
                    <CheckCircle className="text-green-600" size={32} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Methods Chart */}
            <Card className="bg-white border-[#563315]/20">
              <CardHeader>
                <CardTitle className="text-[#563315]">Payment Methods</CardTitle>
                <CardDescription>Revenue breakdown by payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={paymentMethodChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#563315" name="Amount (₹)" />
                    <Bar dataKey="count" fill="#b88933" name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tables Summary */}
            <Card className="bg-white border-[#563315]/20">
              <CardHeader>
                <CardTitle className="text-[#563315]">Tables Summary</CardTitle>
                <CardDescription>Paid vs unpaid tables</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="text-green-600" size={24} />
                      <div>
                        <p className="font-semibold text-[#563315]">Paid Tables</p>
                        <p className="text-sm text-[#563315]/70">{reportData.tables.paidTables} tables</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-green-600">
                      {reportData.tables.paidTables}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="text-orange-600" size={24} />
                      <div>
                        <p className="font-semibold text-[#563315]">Unpaid Tables</p>
                        <p className="text-sm text-[#563315]/70">{reportData.tables.unpaidTables} tables</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-orange-600">
                      {reportData.tables.unpaidTables}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#f0ddb6]/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="text-[#563315]" size={24} />
                      <div>
                        <p className="font-semibold text-[#563315]">Total Tables with Orders</p>
                        <p className="text-sm text-[#563315]/70">{reportData.tables.totalTablesWithOrders} tables</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-[#563315]">
                      {reportData.tables.totalTablesWithOrders}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loyalty Points and Wallet */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Loyalty Points */}
              <Card className="bg-white border-[#563315]/20">
                <CardHeader>
                  <CardTitle className="text-[#563315]">Loyalty Points</CardTitle>
                  <CardDescription>Points earned and redeemed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="text-green-600" size={24} />
                        <div>
                          <p className="font-semibold text-[#563315]">Points Earned</p>
                          <p className="text-sm text-[#563315]/70">{reportData.loyaltyPoints.earnedTransactions} transactions</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-green-600">
                        {reportData.loyaltyPoints.totalEarned}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Gift className="text-blue-600" size={24} />
                        <div>
                          <p className="font-semibold text-[#563315]">Points Redeemed</p>
                          <p className="text-sm text-[#563315]/70">{reportData.loyaltyPoints.redeemedTransactions} transactions</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">
                        {reportData.loyaltyPoints.totalRedeemed}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Wallet Summary */}
              <Card className="bg-white border-[#563315]/20">
                <CardHeader>
                  <CardTitle className="text-[#563315]">Wallet Summary</CardTitle>
                  <CardDescription>Wallet top-ups and payments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#f0ddb6]/30 rounded-lg">
                      <div>
                        <p className="font-semibold text-[#563315]">Total Topups</p>
                        <p className="text-sm text-[#563315]/70">
                          {reportData.wallet.approvedTopups} approved, {reportData.wallet.pendingTopups} pending
                        </p>
                      </div>
                      <span className="text-2xl font-bold text-[#563315]">
                        ₹{reportData.wallet.totalTopupAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-[#563315]/70">Wallet Payments</p>
                        <p className="text-lg font-bold text-blue-600">
                          ₹{reportData.wallet.totalPayments.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg">
                        <p className="text-xs text-[#563315]/70">Wallet Refunds</p>
                        <p className="text-lg font-bold text-red-600">
                          ₹{reportData.wallet.totalRefunds.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transaction History */}
            <Card className="bg-white border-[#563315]/20">
              <CardHeader>
                <CardTitle className="text-[#563315]">Transaction History</CardTitle>
                <CardDescription>All paid transactions for the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="animate-spin text-[#563315]" size={32} />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-12 text-[#563315]/70">
                    No transactions found for the selected period
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[#563315]">Order #</TableHead>
                          <TableHead className="text-[#563315]">Date & Time</TableHead>
                          <TableHead className="text-[#563315]">Table</TableHead>
                          <TableHead className="text-[#563315]">Customer</TableHead>
                          <TableHead className="text-[#563315]">Items</TableHead>
                          <TableHead className="text-[#563315]">Payment Method</TableHead>
                          <TableHead className="text-[#563315] text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium text-[#563315]">
                              {transaction.orderNumber}
                            </TableCell>
                            <TableCell className="text-[#563315]/70">
                              {format(parseISO(transaction.createdAt), "MMM dd, yyyy HH:mm")}
                            </TableCell>
                            <TableCell className="text-[#563315]">
                              {transaction.tableNumber || "N/A"}
                            </TableCell>
                            <TableCell className="text-[#563315]/70">
                              {transaction.customerName || "Guest"}
                            </TableCell>
                            <TableCell className="text-[#563315]/70">
                              {transaction.items?.length || 0} item(s)
                            </TableCell>
                            <TableCell className="text-[#563315]">
                              {transaction.paymentMethod || "N/A"}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-[#563315]">
                              ₹{transaction.total?.toFixed(2) || "0.00"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customization Usage Trends */}
            {customizationData.length > 0 && (
              <Card className="bg-white border-[#563315]/20">
                <CardHeader>
                  <CardTitle className="text-[#563315]">Customization Usage Trends</CardTitle>
                  <CardDescription>Most popular customizations</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={customizationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#563315" name="Usage Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Report Metadata */}
            <Card className="bg-white border-[#563315]/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between text-sm text-[#563315]/70">
                  <div>
                    <p>Report Period: {format(parseISO(reportData.periodStart), "MMM dd, yyyy")} - {format(parseISO(reportData.periodEnd), "MMM dd, yyyy")}</p>
                  </div>
                  <div>
                    <p>Generated: {format(parseISO(reportData.generatedAt), "MMM dd, yyyy HH:mm")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!loading && !reportData && (
          <Card className="bg-white border-[#563315]/20">
            <CardContent className="p-12 text-center">
              <p className="text-[#563315]/70">No report data available. Select a date range and generate a report.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

