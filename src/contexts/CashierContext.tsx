"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type OrderStatus = "idle" | "preparing" | "aging" | "critical" | "served";

export interface TableOrder {
  id: string;
  tableNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    modifiers?: string[];
  }>;
  status: OrderStatus;
  total: number;
  startTime?: number;
  servedTime?: number;
  customerPhone?: string;
  customerNotes?: string;
  paymentMethod?: string;
  isPaid: boolean;
}

export interface PaidOrder {
  id: string;
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    modifiers?: string[];
  }>;
  total: number;
  customerPhone?: string;
  customerName?: string;
  tableNumber?: string;
  paymentMethod: string;
  receivedAt: number;
  isPrinted?: boolean;
}

interface CashierContextType {
  tables: TableOrder[];
  paidOrders: PaidOrder[];
  confirmPaidOrder: (orderId: string, tableNumber: string) => void;
  sendToKitchen: (tableId: string) => void;
  markServed: (tableId: string) => void;
  addManualOrder: (order: Omit<TableOrder, "id">) => void;
  updateOrderStatus: (tableId: string, status: OrderStatus) => void;
  undoLastAction: () => void;
  lastAction: { type: string; data: any } | null;
  canUndo: boolean;
}

const CashierContext = createContext<CashierContextType | undefined>(undefined);

export const useCashier = () => {
  const context = useContext(CashierContext);
  if (!context) {
    throw new Error("useCashier must be used within CashierProvider");
  }
  return context;
};

export const CashierProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tables, setTables] = useState<TableOrder[]>([]);
  const [paidOrders, setPaidOrders] = useState<PaidOrder[]>([]);
  const [lastAction, setLastAction] = useState<{ type: string; data: any } | null>(null);
  const [undoTimer, setUndoTimer] = useState<NodeJS.Timeout | null>(null);

  // Initialize with sample data
  useEffect(() => {
    const sampleTables: TableOrder[] = [
      {
        id: "t1",
        tableNumber: "T-01",
        items: [],
        status: "idle",
        total: 0,
        isPaid: false
      },
      {
        id: "t2",
        tableNumber: "T-02",
        items: [
          { name: "Cappuccino", quantity: 2, price: 120, modifiers: ["Soy Milk", "Large"] },
          { name: "Croissant", quantity: 1, price: 80 }
        ],
        status: "preparing",
        total: 320,
        startTime: Date.now() - 180000, // 3 minutes ago
        isPaid: true
      },
      {
        id: "t3",
        tableNumber: "T-03",
        items: [
          { name: "Espresso", quantity: 1, price: 90 },
          { name: "Muffin", quantity: 2, price: 70 }
        ],
        status: "aging",
        total: 230,
        startTime: Date.now() - 360000, // 6 minutes ago
        isPaid: true
      },
      {
        id: "t4",
        tableNumber: "T-04",
        items: [],
        status: "idle",
        total: 0,
        isPaid: false
      },
      {
        id: "t5",
        tableNumber: "T-05",
        items: [],
        status: "idle",
        total: 0,
        isPaid: false
      },
      {
        id: "t6",
        tableNumber: "T-06",
        items: [],
        status: "idle",
        total: 0,
        isPaid: false
      },
    ];

    const samplePaidOrders: PaidOrder[] = [
      {
        id: "po1",
        orderNumber: "#12345",
        items: [
          { name: "Latte", quantity: 1, price: 140, modifiers: ["Oat Milk"] },
          { name: "Bagel", quantity: 1, price: 90 }
        ],
        total: 230,
        customerPhone: "+91 98765-43210",
        paymentMethod: "UPI - GPay",
        receivedAt: Date.now() - 120000, // 2 minutes ago
        isPrinted: false
      },
      {
        id: "po2",
        orderNumber: "#12346",
        items: [
          { name: "Americano", quantity: 2, price: 100 },
        ],
        total: 200,
        customerPhone: "+91 98765-43211",
        paymentMethod: "Card",
        receivedAt: Date.now() - 60000, // 1 minute ago
        isPrinted: false
      }
    ];

    setTables(sampleTables);
    setPaidOrders(samplePaidOrders);
  }, []);

  // Update order status based on time elapsed
  useEffect(() => {
    const interval = setInterval(() => {
      setTables(prevTables =>
        prevTables.map(table => {
          if (table.status === "preparing" || table.status === "aging" || table.status === "critical") {
            const elapsed = Date.now() - (table.startTime || 0);
            const minutes = Math.floor(elapsed / 60000);

            let newStatus: OrderStatus = "preparing";
            if (minutes >= 10) {
              newStatus = "critical";
            } else if (minutes >= 5) {
              newStatus = "aging";
            }

            if (newStatus !== table.status) {
              return { ...table, status: newStatus };
            }
          }
          return table;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const confirmPaidOrder = useCallback((orderId: string, tableNumber: string) => {
    const order = paidOrders.find(o => o.id === orderId);
    if (!order) return;

    // Remove from paid orders
    setPaidOrders(prev => prev.filter(o => o.id !== orderId));

    // Update table with order
    setTables(prev =>
      prev.map(table =>
        table.tableNumber === tableNumber
          ? {
              ...table,
              items: order.items,
              total: order.total,
              status: "preparing" as OrderStatus,
              startTime: Date.now(),
              customerPhone: order.customerPhone,
              isPaid: true
            }
          : table
      )
    );

    // Set undo action
    setLastAction({ type: "confirmOrder", data: { orderId, tableNumber, order } });
    
    // Clear previous timer
    if (undoTimer) clearTimeout(undoTimer);
    
    // Set new timer
    const timer = setTimeout(() => {
      setLastAction(null);
    }, 7000);
    setUndoTimer(timer);
  }, [paidOrders, undoTimer]);

  const sendToKitchen = useCallback((tableId: string) => {
    setTables(prev =>
      prev.map(table =>
        table.id === tableId && table.items.length > 0
          ? { ...table, status: "preparing" as OrderStatus, startTime: Date.now() }
          : table
      )
    );

    setLastAction({ type: "sendToKitchen", data: { tableId } });
    
    if (undoTimer) clearTimeout(undoTimer);
    const timer = setTimeout(() => setLastAction(null), 7000);
    setUndoTimer(timer);
  }, [undoTimer]);

  const markServed = useCallback((tableId: string) => {
    setTables(prev =>
      prev.map(table =>
        table.id === tableId
          ? { ...table, status: "served" as OrderStatus, servedTime: Date.now() }
          : table
      )
    );
  }, []);

  const addManualOrder = useCallback((order: Omit<TableOrder, "id">) => {
    const newOrder: TableOrder = {
      ...order,
      id: `manual_${Date.now()}`,
    };
    setTables(prev => prev.map(t => 
      t.tableNumber === order.tableNumber ? newOrder : t
    ));
  }, []);

  const updateOrderStatus = useCallback((tableId: string, status: OrderStatus) => {
    setTables(prev =>
      prev.map(table => (table.id === tableId ? { ...table, status } : table))
    );
  }, []);

  const undoLastAction = useCallback(() => {
    if (!lastAction) return;

    if (lastAction.type === "confirmOrder") {
      const { orderId, tableNumber, order } = lastAction.data;
      // Return to paid orders
      setPaidOrders(prev => [...prev, order]);
      // Clear table
      setTables(prev =>
        prev.map(table =>
          table.tableNumber === tableNumber
            ? { ...table, items: [], status: "idle" as OrderStatus, startTime: undefined, total: 0 }
            : table
        )
      );
    } else if (lastAction.type === "sendToKitchen") {
      const { tableId } = lastAction.data;
      setTables(prev =>
        prev.map(table =>
          table.id === tableId
            ? { ...table, status: "idle" as OrderStatus, startTime: undefined }
            : table
        )
      );
    }

    if (undoTimer) clearTimeout(undoTimer);
    setLastAction(null);
  }, [lastAction, undoTimer]);

  const value = {
    tables,
    paidOrders,
    confirmPaidOrder,
    sendToKitchen,
    markServed,
    addManualOrder,
    updateOrderStatus,
    undoLastAction,
    lastAction,
    canUndo: lastAction !== null,
  };

  return <CashierContext.Provider value={value}>{children}</CashierContext.Provider>;
};
