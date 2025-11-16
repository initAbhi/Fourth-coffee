"use client";

import { X } from "lucide-react";
import { motion } from "framer-motion";

interface HotkeysOverlayProps {
  onClose: () => void;
}

export const HotkeysOverlay: React.FC<HotkeysOverlayProps> = ({ onClose }) => {
  const shortcuts = [
    {
      category: "Global Shortcuts",
      items: [
        { key: "F1", description: "Search item / Focus product search" },
        { key: "F2", description: "New Manual Order" },
        { key: "F3", description: "Toggle Paid Orders Sidebar" },
        { key: "F4", description: "Open Audit Trail" },
        { key: "F5", description: "Refresh / Re-sync" },
        { key: "Esc", description: "Close modal / Cancel action" },
      ],
    },
    {
      category: "Floor Plan Shortcuts",
      items: [
        { key: "Arrow Keys", description: "Navigate table grid" },
        { key: "Enter", description: "Open order detail for selected table" },
        { key: "Spacebar", description: "Open quick action menu" },
      ],
    },
    {
      category: "Order Actions (contextual)",
      items: [
        { key: "S", description: "Send to Kitchen / Confirm paid order" },
        { key: "M", description: "Mark Served" },
        { key: "W", description: "Flag Wastage" },
        { key: "R", description: "Refund" },
        { key: "U", description: "Undo (within undo window)" },
      ],
    },
    {
      category: "Manual Order",
      items: [
        { key: "Ctrl+Enter", description: "Add item to order" },
        { key: "+/-", description: "Adjust quantity" },
        { key: "Tab", description: "Navigate modifiers" },
      ],
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#563315]/85 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#563315]/20 px-8 py-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#563315]">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-[#563315]/60 hover:text-[#563315] transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="text-base font-semibold text-[#563315] mb-3">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((shortcut) => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between py-2"
                  >
                    <kbd className="px-3 py-1.5 bg-[#f0ddb6] text-[#563315] font-mono text-sm rounded border border-[#b88933]/30 font-medium">
                      {shortcut.key}
                    </kbd>
                    <span className="text-sm text-[#563315]/80 flex-1 ml-4">
                      {shortcut.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#f0ddb6]/30 px-8 py-4 text-center text-xs text-[#563315]/60 border-t border-[#563315]/10">
          Press <kbd className="px-2 py-0.5 bg-[#f0ddb6] rounded text-[#563315] font-mono">Esc</kbd> to close
        </div>
      </motion.div>
    </motion.div>
  );
};
