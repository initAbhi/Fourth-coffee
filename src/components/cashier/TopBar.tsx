"use client";

import { useState, useEffect } from "react";
import { Printer, Wifi, LogOut, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface TopBarProps {
  onToggleSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar }) => {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [session, setSession] = useState<any>(null);
  const [printerStatus, setPrinterStatus] = useState<"online" | "warning" | "offline">("online");
  const [networkStatus, setNetworkStatus] = useState<"online" | "offline">("online");

  useEffect(() => {
    const sessionData = localStorage.getItem("cashier_session");
    if (sessionData) {
      setSession(JSON.parse(sessionData));
    }

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    if (confirm("Log out? Unsaved drafts will be lost.")) {
      localStorage.removeItem("cashier_session");
      router.push("/cashier/login");
    }
  };

  const getPrinterStatusColor = () => {
    switch (printerStatus) {
      case "online":
        return "text-[#2e7d32]";
      case "warning":
        return "text-[#f9a825]";
      case "offline":
        return "text-[#d32f2f]";
    }
  };

  const getPrinterTooltip = () => {
    switch (printerStatus) {
      case "online":
        return "Printer Status: Online | Last print: 2 min ago | Queue: 0";
      case "warning":
        return "Warning — Queue: 3";
      case "offline":
        return "Offline — Click to retry";
    }
  };

  return (
    <div className="h-14 bg-[#f0ddb6] border-b border-[#563315]/10 flex items-center px-4 shadow-sm">
      {/* Left Section */}
      <div className="flex items-center gap-3 w-[30%]">
        <div className="relative w-24 h-8">
          <Image
            src="/logo.png"
            alt="Fourth Coffee"
            fill
            className="object-contain"
            priority
          />
        </div>
        <span className="text-base font-medium text-[#563315]">Cashier</span>
        <div className="w-px h-6 bg-[#563315]/20" />
      </div>

      {/* Center Section */}
      <div className="flex flex-col items-center justify-center w-[40%]">
        <div className="text-base font-bold text-[#563315]">
          {currentTime.toLocaleTimeString("en-US", { hour12: false })}
        </div>
        {session && (
          <div className="text-xs text-[#563315]/70">
            Logged in as: {session.name} (Cashier #{session.cashierId})
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center justify-end gap-4 w-[30%]">
        {/* Printer Health */}
        <div
          className="relative group cursor-help"
          title={getPrinterTooltip()}
        >
          <Printer size={28} className={getPrinterStatusColor()} />
          <div className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${
            printerStatus === "online" ? "bg-[#2e7d32]" :
            printerStatus === "warning" ? "bg-[#f9a825]" : "bg-[#d32f2f]"
          }`} />
        </div>

        {/* Network Indicator */}
        <div className="cursor-help" title={networkStatus === "online" ? "Connection: Stable" : "Offline — Actions queued"}>
          {networkStatus === "online" ? (
            <Wifi size={24} className="text-[#2e7d32]" />
          ) : (
            <WifiOff size={24} className="text-[#d32f2f]" />
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="text-[#563315]/60 hover:text-[#563315] transition-colors"
          aria-label="Logout"
        >
          <LogOut size={24} />
        </button>
      </div>
    </div>
  );
};
