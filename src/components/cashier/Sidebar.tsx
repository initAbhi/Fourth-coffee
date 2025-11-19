"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Grid,
  Plus,
  RefreshCw,
  Trash2,
  ClipboardList,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  QrCode,
  FileText
} from "lucide-react";
import { useCashier } from "@/contexts/CashierContext";

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  onShowManualOrder: () => void;
  activeView?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onCollapse,
  onShowManualOrder,
  activeView
}) => {
  const { paidOrders } = useCashier();
  const pathname = usePathname();

  const menuItems = [
    { id: "floor", href: "/cashier", icon: Grid, label: "Floor Plan", shortcut: "Home", badge: null },
    { id: "paid", href: "/cashier/paid-orders", icon: CheckCircle, label: "Paid Orders", shortcut: "F3", badge: paidOrders.length },
    { id: "manual", icon: Plus, label: "New Manual Order", shortcut: "F2", badge: null, onClick: onShowManualOrder },
    { id: "qr", href: "/cashier/qr-codes", icon: QrCode, label: "QR Codes", shortcut: "", badge: null },
    { id: "reports", href: "/cashier/reports", icon: FileText, label: "Reports", shortcut: "", badge: null },
    { id: "refunds", href: "/cashier/refunds", icon: RefreshCw, label: "Refunds", shortcut: "", badge: null },
    { id: "wastage", href: "/cashier/wastage", icon: Trash2, label: "Wastage Log", shortcut: "", badge: null },
    { id: "audit", href: "/cashier/audit-trail", icon: ClipboardList, label: "Audit Trail", shortcut: "F4", badge: null },
    { id: "notes", href: "/cashier/admin-messages", icon: MessageSquare, label: "Admin Messages", shortcut: "", badge: 0 },
  ];

  const isActive = (href: string | undefined) => {
    if (!href) return false;
    if (href === "/cashier") {
      return pathname === "/cashier" || pathname === "/cashier/";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div
      className={`${
        collapsed ? "w-16" : "w-60"
      } bg-white border-r border-[#e0e0e0] transition-all duration-250 flex flex-col`}
    >
      {/* Menu Items */}
      <div className="flex-1 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const itemIsActive = isActive(item.href);

          const content = (
            <div
              className={`relative flex items-center gap-3 px-4 py-3 cursor-pointer transition-all group ${
                itemIsActive
                  ? "bg-[#b88933]/15 border-l-3 border-[#b88933]"
                  : "hover:bg-[#f0ddb6]/30"
              }`}
              onClick={item.onClick}
            >
              <div className="relative">
                <Icon size={24} className="text-[#563315]" />
                {item.badge !== null && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#d32f2f] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {item.badge}
                  </span>
                )}
              </div>

              {!collapsed && (
                <>
                  <span className="text-sm font-medium text-[#563315] flex-1">
                    {item.label}
                  </span>
                  {item.shortcut && (
                    <span className="text-xs text-[#563315]/50">
                      {item.shortcut}
                    </span>
                  )}
                </>
              )}

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-[#563315] text-[#f0ddb6] text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                  {item.label} {item.shortcut && `(${item.shortcut})`}
                </div>
              )}
            </div>
          );

          if (item.href) {
            return (
              <Link key={item.id} href={item.href}>
                {content}
              </Link>
            );
          }

          return <div key={item.id}>{content}</div>;
        })}
      </div>

      {/* Bottom Section */}
      <div className="border-t border-[#e0e0e0]">
        {/* Toggle Button */}
        <button
          onClick={() => onCollapse(!collapsed)}
          className="w-full flex items-center justify-center py-3 hover:bg-[#f0ddb6]/30 transition-colors"
        >
          {collapsed ? (
            <ChevronRight size={20} className="text-[#563315]" />
          ) : (
            <ChevronLeft size={20} className="text-[#563315]" />
          )}
        </button>

        {/* Settings */}
        <button
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f0ddb6]/30 transition-colors group"
          onClick={() => alert("Settings")}
        >
          <Settings size={24} className="text-[#563315]" />
          {!collapsed && (
            <span className="text-sm font-medium text-[#563315]">Settings</span>
          )}

          {collapsed && (
            <div className="absolute left-full ml-2 px-3 py-2 bg-[#563315] text-[#f0ddb6] text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
              Settings
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
