"use client";

import { useState } from "react";
import { FloorPlan } from "@/components/cashier/FloorPlan";
import { OrderDetailPanel } from "@/components/cashier/OrderDetailPanel";
import { RefundModal } from "@/components/cashier/RefundModal";

export default function CashierDashboard() {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [showRefund, setShowRefund] = useState(false);

  return (
    <>
      <FloorPlan onSelectTable={setSelectedTableId} />
      
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

      {showRefund && (
        <RefundModal
          orderId={selectedTableId || ""}
          onClose={() => setShowRefund(false)}
        />
      )}
    </>
  );
}
