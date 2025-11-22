"use client";

import { useEffect, useState } from "react";
import { useCashier } from "@/contexts/CashierContext";

export const FooterStatusBar: React.FC = () => {
  const { tables, lastAction, undoLastAction, canUndo } = useCashier();
  const [undoCountdown, setUndoCountdown] = useState(7);
  const [tip, setTip] = useState("Press F1 to search products");
  const [lastActionMessage, setLastActionMessage] = useState("");

  // Update undo countdown
  useEffect(() => {
    if (!canUndo) return;

    setUndoCountdown(7);
    const interval = setInterval(() => {
      setUndoCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [canUndo, lastAction]);

  // Calculate active timers
  const preparingCount = tables.filter((t) => t.status === "preparing").length;
  const delayedCount = tables.filter(
    (t) => t.status === "aging" || t.status === "critical"
  ).length;

  // Contextual tips
  useEffect(() => {
    const tips = [
      "Press F1 to search products",
      "Use arrow keys to navigate tables",
      "Press F2 to create a new manual order",
      "Press F3 to toggle paid orders sidebar",
      "Press Spacebar on a table for quick actions",
    ];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    setTip(randomTip);
  }, []);

  // Handle undo keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "u" || e.key === "U") {
        if (canUndo) {
          undoLastAction();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canUndo, undoLastAction]);

  return (
    <div className="h-10 bg-[#f0ddb6] border-t border-[#563315]/10 flex items-center px-4 text-xs">
      {/* Left: Contextual Tips */}
      <div className="w-[40%] text-[#563315]/70 italic">{tip}</div>

      {/* Center: Active Timers */}
      <div className="w-[30%] text-center">
        <span className="text-[#563315] font-bold">
          ⏱️ {preparingCount} preparing
          {delayedCount > 0 && (
            <span className="text-[#f57c00] ml-2">| {delayedCount} delayed</span>
          )}
        </span>
      </div>

      {/* Right: Undo/Last Action */}
      <div className="w-[30%] text-right text-[#563315]/80">
        {canUndo && undoCountdown > 0 ? (
          <span className="font-medium">
            ↩️ Undo: {lastAction?.type === "confirmOrder" ? "Confirm Order" : "Send to Kitchen"}{" "}
            <span className="text-[#d32f2f] font-bold">({undoCountdown}s)</span>
          </span>
        ) : lastActionMessage ? (
          <span className="text-[#2e7d32]">✓ {lastActionMessage}</span>
        ) : null}
      </div>
    </div>
  );
};
