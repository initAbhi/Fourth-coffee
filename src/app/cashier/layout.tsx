"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CashierProvider } from "@/contexts/CashierContext";
import { TopBar } from "@/components/cashier/TopBar";
import { Sidebar } from "@/components/cashier/Sidebar";
import { FooterStatusBar } from "@/components/cashier/FooterStatusBar";
import { PaidOrdersSidebar } from "@/components/cashier/PaidOrdersSidebar";
import { HotkeysOverlay } from "@/components/cashier/HotkeysOverlay";
import { ManualOrderModal } from "@/components/cashier/ManualOrderModal";
import { apiClient } from "@/lib/api";

export default function CashierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showHotkeys, setShowHotkeys] = useState(false);
  const [showManualOrder, setShowManualOrder] = useState(false);
  const [paidOrdersExpanded, setPaidOrdersExpanded] = useState(false);
  const [cashierName, setCashierName] = useState("");

  useEffect(() => {
    const verifySession = async () => {
      const sessionStr = localStorage.getItem("cashier_session");
      if (!sessionStr) {
        router.push("/cashier/login");
        return;
      }

      try {
        const session = JSON.parse(sessionStr);
        if (session.sessionId) {
          // Check if we just logged in - skip verification to avoid race condition
          const justLoggedInStr = localStorage.getItem("cashier_just_logged_in");
          if (justLoggedInStr) {
            try {
              const justLoggedIn = JSON.parse(justLoggedInStr);
              // Check if flag is recent (within last 10 seconds) and matches current session
              const isRecent = justLoggedIn.timestamp && (Date.now() - justLoggedIn.timestamp) < 10000;
              const matchesSession = justLoggedIn.sessionId === session.sessionId;
              
              if (justLoggedIn.flag && isRecent && matchesSession) {
                // Clear the flag
                localStorage.removeItem("cashier_just_logged_in");
                // Allow access immediately without verification
                console.log("Skipping verification - just logged in");
                setIsAuthenticated(true);
                setCashierName(session.name || "Cashier");
                return;
              } else {
                // Flag is stale or doesn't match, remove it
                localStorage.removeItem("cashier_just_logged_in");
              }
            } catch (e) {
              // Invalid flag format, remove it
              localStorage.removeItem("cashier_just_logged_in");
            }
          }

          // Verify session with backend
          console.log("Verifying session:", session.sessionId);
          
          try {
            const response = await apiClient.verifySession(session.sessionId);
            
            if (response.success) {
              console.log("Session verified successfully");
              setIsAuthenticated(true);
              setCashierName(session.name || "Cashier");
            } else {
              // Session verification failed - check error type
              console.error("Session verification failed:", response.error);
              
              // Always allow cached session if verification fails
              // This prevents logout on temporary backend issues or network problems
              console.log("Verification failed, using cached session");
              setIsAuthenticated(true);
              setCashierName(session.name || "Cashier");
              
              // Only redirect if error explicitly says session is invalid (not network/connection errors)
              if (response.error && 
                  response.error.includes('Invalid or expired session') && 
                  !response.error.includes('Network') &&
                  !response.error.includes('Failed to fetch')) {
                // Check if session was created recently (within last hour)
                const loginTime = session.loginTime ? new Date(session.loginTime).getTime() : 0;
                const timeSinceLogin = Date.now() - loginTime;
                
                // Only redirect if session is old (more than 1 hour) and explicitly invalid
                if (timeSinceLogin > 3600000) {
                  console.log("Session expired and old, redirecting to login");
                  localStorage.removeItem("cashier_session");
                  router.push("/cashier/login");
                } else {
                  console.log("Session verification failed but session is recent, allowing access");
                }
              }
            }
          } catch (error) {
            // Network error or exception - always allow cached session
            console.error("Session verification error (network/exception):", error);
            console.log("Using cached session due to error");
            setIsAuthenticated(true);
            setCashierName(session.name || "Cashier");
          }
        } else {
          // Old session format, redirect to login
          localStorage.removeItem("cashier_session");
          router.push("/cashier/login");
        }
      } catch (error) {
        console.error("Session verification error:", error);
        // On network error, still allow access if session exists in localStorage
        // This prevents logout on temporary network issues
        const sessionStr = localStorage.getItem("cashier_session");
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr);
            if (session.sessionId && session.name) {
              // Allow access with cached session if network fails
              console.log("Using cached session due to error");
              setIsAuthenticated(true);
              setCashierName(session.name || "Cashier");
              return;
            }
          } catch (e) {
            // Invalid session format
            console.error("Invalid session format:", e);
          }
        }
        localStorage.removeItem("cashier_session");
        router.push("/cashier/login");
      }
    };

    verifySession();
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
      // F4 - Audit Trail
      if (e.key === "F4") {
        e.preventDefault();
        router.push("/cashier/audit-trail");
      }
      // F5 - Refresh
      if (e.key === "F5") {
        e.preventDefault();
        window.location.reload();
      }
      // Escape - Close modals
      if (e.key === "Escape") {
        setShowHotkeys(false);
        setShowManualOrder(false);
      }
      // ? or Ctrl+/ - Show hotkeys
      if (e.key === "?" || (e.ctrlKey && e.key === "/")) {
        e.preventDefault();
        setShowHotkeys(prev => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthenticated, router]);

  // Get current active view from pathname
  const getActiveView = () => {
    if (pathname === "/cashier" || pathname === "/cashier/") return "floor";
    if (pathname === "/cashier/qr-codes") return "qr";
    if (pathname === "/cashier/reports") return "reports";
    return pathname.split("/").pop() || "floor";
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0ddb6]">
        <div className="w-6 h-6 border-3 border-[#563315]/30 border-t-[#563315] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <CashierProvider>
      <div className="h-screen flex flex-col bg-[#faf7f0] overflow-hidden min-w-[1280px]">
        {/* Top Bar */}
        <TopBar onToggleSidebar={() => setSidebarCollapsed(prev => !prev)} />

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <Sidebar
            collapsed={sidebarCollapsed}
            onCollapse={setSidebarCollapsed}
            onShowManualOrder={() => setShowManualOrder(true)}
            activeView={getActiveView()}
          />

          {/* Main Content Area */}
          <div className="flex-1 overflow-auto relative">
            {children}
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
        
        {showManualOrder && (
          <ManualOrderModal 
            onClose={() => setShowManualOrder(false)} 
            confirmedBy={cashierName}
          />
        )}
      </div>
    </CashierProvider>
  );
}

