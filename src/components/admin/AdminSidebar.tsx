"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  MessageSquare,
  Megaphone,
  FileText,
  LogOut,
  Store,
} from "lucide-react";
import { useState, useEffect } from "react";

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    const session = localStorage.getItem("admin_session");
    if (session) {
      try {
        const sessionData = JSON.parse(session);
        setAdminName(sessionData.name || "Admin");
      } catch (e) {
        console.error("Error parsing session:", e);
      }
    }
  }, []);

  const handleLogout = () => {
    const session = localStorage.getItem("admin_session");
    if (session) {
      try {
        const sessionData = JSON.parse(session);
        // Call logout API if needed
        fetch("/api/admin-auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sessionData.sessionId }),
        }).catch(console.error);
      } catch (e) {
        console.error("Error logging out:", e);
      }
    }
    localStorage.removeItem("admin_session");
    router.push("/admin/login");
  };

  const menuItems = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Cafés",
      href: "/admin/cafes",
      icon: Store,
    },
    {
      name: "Central Inventory",
      href: "/admin/inventory",
      icon: Package,
    },
    {
      name: "Marketing",
      href: "/admin/marketing",
      icon: Megaphone,
    },
    {
      name: "Communication",
      href: "/admin/communication",
      icon: MessageSquare,
    },
    {
      name: "Audit Logs",
      href: "/admin/audit",
      icon: FileText,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === "/admin/dashboard" || pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col shadow-sm">
      {/* Logo/Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-amber-900">Smart Café Admin</h1>
        <p className="text-xs text-gray-600 mt-1">Command Center</p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                active
                  ? "bg-amber-50 text-amber-700 border-l-4 border-amber-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon
                size={20}
                className={active ? "text-amber-600" : "text-gray-500"}
              />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-200">
        <div className="px-4 py-2 mb-2">
          <p className="text-sm font-medium text-gray-900">{adminName}</p>
          <p className="text-xs text-gray-500">Administrator</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}

