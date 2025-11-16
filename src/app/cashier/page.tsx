"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CashierProvider } from "@/contexts/CashierContext";
import { TopBar } from "@/components/cashier/TopBar";
import { Sidebar } from "@/components/cashier/Sidebar";
import { FooterStatusBar } from "@/components/cashier/FooterStatusBar";
import { FloorPlan } from "@/components/cashier/FloorPlan";
import { PaidOrdersSidebar } from "@/components/cashier/PaidOrdersSidebar";
import { HotkeysOverlay } from "@/components/cashier/HotkeysOverlay";
import { OrderDetailPanel } from "@/components/cashier/OrderDetailPanel";
import { ManualOrderModal } from "@/components/cashier/ManualOrderModal";
import { RefundModal } from "@/components/cashier/RefundModal";
import { AdminNotesPanel } from "@/components/cashier/AdminNotesPanel";

export default function CashierDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showHotkeys, setShowHotkeys] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [showManualOrder, setShowManualOrder] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [paidOrdersExpanded, setPaidOrdersExpanded] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem("cashier_session");
    if (!session) {
      router.push("/cashier/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // F1 - Search (placeholder)
      if (e.key === "F1") {
        e.preventDefault();
        console.log("F1 - Search");
      }
      // F2 - New Manual Order
      if (e.key === "F2") {
        e.preventDefault();
        setShowManualOrder(true);
      }
      // F3 - Toggle Paid Orders
      if (e.key === "F3") {
        e.preventDefault();
        setPaidOrdersExpanded(prev => !prev);
      }
      // F4 - Audit Trail (placeholder)
      if (e.key === "F4") {
        e.preventDefault();
        console.log("F4 - Audit Trail");
      }
      // F5 - Refresh
      if (e.key === "F5") {
        e.preventDefault();
        window.location.reload();
      }
      // Escape - Close modals
      if (e.key === "Escape") {
        setShowHotkeys(false);
        setSelectedTableId(null);
        setShowManualOrder(false);
        setShowRefund(false);
      }
      // ? or Ctrl+/ - Show hotkeys
      if (e.key === "?" || (e.ctrlKey && e.key === "/")) {
        e.preventDefault();
        setShowHotkeys(prev => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0ddb6]">
        <div className="w-6 h-6 border-3 border-[#563315]/30 border-t-[#563315] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <CashierProvider>
      <div className="h-screen flex flex-col bg-[#faf7f0] overflow-hidden">
        {/* Top Bar */}
        <TopBar onToggleSidebar={() => setSidebarCollapsed(prev => !prev)} />

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <Sidebar
            collapsed={sidebarCollapsed}
            onCollapse={setSidebarCollapsed}
            onShowManualOrder={() => setShowManualOrder(true)}
          />

          {/* Main Floor Plan Area */}
          <div className="flex-1 overflow-auto relative">
            <FloorPlan onSelectTable={setSelectedTableId} />
          </div>

          {/* Right Paid Orders Sidebar */}
          <PaidOrdersSidebar
            expanded={paidOrdersExpanded}
            onToggle={() => setPaidOrdersExpanded(prev => !prev)}
          />
        </div>

        {/* Footer Status Bar */}
        <FooterStatusBar />

        {/* Hotkeys Toggle Button */}
        <button
          onClick={() => setShowHotkeys(true)}
          className="fixed bottom-4 left-4 w-12 h-12 bg-[#563315] text-[#f0ddb6] rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center text-xl font-bold z-40"
          aria-label="Show keyboard shortcuts"
        >
          ?
        </button>

        {/* Modals and Overlays */}
        {showHotkeys && <HotkeysOverlay onClose={() => setShowHotkeys(false)} />}
        
        {selectedTableId && (
          <OrderDetailPanel
            tableId={selectedTableId}
            onClose={() => setSelectedTableId(null)}
            onRefund={() => {
              setShowRefund(true);
              setSelectedTableId(null);
            }}
          />
        )}

        {showManualOrder && (
          <ManualOrderModal onClose={() => setShowManualOrder(false)} />
        )}

        {showRefund && (
          <RefundModal
            orderId={selectedTableId || ""}
            onClose={() => setShowRefund(false)}
          />
        )}

        {/* Admin Notes Panel */}
        <AdminNotesPanel />
      </div>
    </CashierProvider>
  );
}
