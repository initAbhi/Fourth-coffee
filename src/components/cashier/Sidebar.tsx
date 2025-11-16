"use client";

import { useState } from "react";
import {
  Grid,
  List,
  Plus,
  RefreshCw,
  Trash2,
  ClipboardList,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  CheckCircle
} from "lucide-react";
import { useCashier } from "@/contexts/CashierContext";

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  onShowManualOrder: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onCollapse,
  onShowManualOrder
}) => {
  const { paidOrders } = useCashier();
  const [activeItem, setActiveItem] = useState("floor");

  const menuItems = [
    { id: "floor", icon: Grid, label: "Floor Plan", shortcut: "Home", badge: null },
    { id: "paid", icon: CheckCircle, label: "Paid Orders", shortcut: "F3", badge: paidOrders.length },
    { id: "manual", icon: Plus, label: "New Manual Order", shortcut: "F2", badge: null, onClick: onShowManualOrder },
    { id: "refunds", icon: RefreshCw, label: "Refunds", shortcut: "", badge: null },
    { id: "wastage", icon: Trash2, label: "Wastage Log", shortcut: "", badge: null },
    { id: "audit", icon: ClipboardList, label: "Audit Trail", shortcut: "F4", badge: null },
    { id: "notes", icon: MessageSquare, label: "Admin Messages", shortcut: "", badge: 0 },
  ];

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
          const isActive = activeItem === item.id;

          return (
            <div
              key={item.id}
              onClick={() => {
                setActiveItem(item.id);
                if (item.onClick) item.onClick();
              }}
              className={`relative flex items-center gap-3 px-4 py-3 cursor-pointer transition-all group ${
                isActive
                  ? "bg-[#b88933]/15 border-l-3 border-[#b88933]"
                  : "hover:bg-[#f0ddb6]/30"
              }`}
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
