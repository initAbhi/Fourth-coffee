"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import { socketService } from "@/lib/socket";
import { toast } from "sonner";

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
  customerName?: string;
  customerNotes?: string;
  paymentMethod?: string;
  isPaid: boolean;
  paymentStatus?: string;
  orderStatus?: string; // Original order status from backend ('pending', 'approved', 'served', etc.)
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
  isLoading: boolean;
  confirmPaidOrder: (orderId: string, tableNumber: string) => Promise<void>;
  sendToKitchen: (tableId: string) => Promise<void>;
  markServed: (tableId: string) => Promise<void>;
  markTableIdle: (tableId: string) => Promise<void>;
  addManualOrder: (order: {
    tableNumber: string;
    items: TableOrder["items"];
    total: number;
    paymentMethod?: string;
    customerName?: string;
    customerPhone?: string;
    notes?: string;
  }) => Promise<void>;
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

// Helper to map backend order status to frontend table status
const mapOrderStatusToTableStatus = (orderStatus: string, startTime?: number): OrderStatus => {
  if (orderStatus === "served") return "served";
  if (orderStatus === "rejected") return "idle";
  
  // Pending orders should show as "idle" so cashier can see "Send to Kitchen" button
  // This allows cashier to approve and send to kitchen
  if (orderStatus === "pending") return "idle";
  
  // Approved orders show as preparing/aging/critical based on time
  if (orderStatus === "approved" && startTime) {
    const elapsed = Date.now() - startTime;
    const minutes = Math.floor(elapsed / 60000);
    if (minutes >= 10) return "critical";
    if (minutes >= 5) return "aging";
    return "preparing";
  }
  
  // Default for approved orders without startTime
  if (orderStatus === "approved") return "preparing";
  
  return "preparing";
};

// Helper to convert backend order to PaidOrder
const convertToPaidOrder = (order: any): PaidOrder => {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    items: order.items,
    total: order.total,
    customerPhone: order.customerPhone,
    customerName: order.customerName,
    tableNumber: order.tableNumber,
    paymentMethod: order.paymentMethod || "Cash",
    receivedAt: order.createdAt,
    isPrinted: false,
  };
};

// Helper to convert backend table + order to TableOrder
const convertToTableOrder = (table: any, order?: any): TableOrder => {
  // Always create a table order, even if no order exists
  const baseTable = {
    id: table.id || table.table_id,
    tableNumber: table.tableNumber || table.table_number,
    items: [],
    status: "idle" as OrderStatus,
    total: 0,
    isPaid: false,
  };

  const tableStatus = table.status || table.table_status;
  
  // CRITICAL: If table status is 'idle' in database, always return idle (unless there's an active order)
  // But if there's an order, we should show it even if table status is idle (handles edge cases)
  if (!order) {
    // No order exists - return idle table
    return baseTable;
  }

  // If order exists, use order status to determine display status
  // This ensures orders are visible even if table status hasn't been updated yet
  const approvedAt = order.approvedAt || order.createdAt;
  const status = mapOrderStatusToTableStatus(order.status, approvedAt);
  
  // Store original order status for reference
  const orderStatus = order.status;

  return {
    ...baseTable,
    items: order.items || [],
    status, // Use mapped status (pending → idle, approved → preparing/aging/critical, served → served)
    total: order.total || 0,
    startTime: approvedAt ? (typeof approvedAt === 'string' ? new Date(approvedAt).getTime() : approvedAt) : (order.createdAt ? (typeof order.createdAt === 'string' ? new Date(order.createdAt).getTime() : order.createdAt) : Date.now()),
    servedTime: order.servedAt ? (typeof order.servedAt === 'string' ? new Date(order.servedAt).getTime() : order.servedAt) : undefined,
    customerPhone: order.customerPhone,
    customerName: order.customerName,
    customerNotes: order.customerNotes,
    paymentMethod: order.paymentMethod,
    isPaid: order.paymentStatus === "paid" || order.status !== "pending",
    // Store order status for UI logic
    orderStatus: orderStatus, // 'pending', 'approved', 'served', etc.
  };
};

export const CashierProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tables, setTables] = useState<TableOrder[]>([]);
  const [paidOrders, setPaidOrders] = useState<PaidOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastAction, setLastAction] = useState<{ type: string; data: any } | null>(null);
  const [undoTimer, setUndoTimer] = useState<NodeJS.Timeout | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Try to load tables with payment status first
        let tablesWithPaymentRes;
        try {
          tablesWithPaymentRes = await apiClient.getTablesWithPaymentStatus();
        } catch (error) {
          console.warn("Failed to load tables with payment status, falling back to basic tables:", error);
          tablesWithPaymentRes = { success: false };
        }

        // Load orders
        const ordersRes = await apiClient.getOrders();
        const orders = ordersRes.success && ordersRes.data ? ordersRes.data : [];
        
        // Separate pending orders (paid orders sidebar)
        const pendingOrders = orders
          .filter((o: any) => o.status === "pending" && o.paymentStatus === "paid")
          .map(convertToPaidOrder);
        setPaidOrders(pendingOrders);

        if (tablesWithPaymentRes.success && tablesWithPaymentRes.data && tablesWithPaymentRes.data.length > 0) {
          // Map tables with their orders and payment status
          const tableOrders: TableOrder[] = tablesWithPaymentRes.data.map((tableData: any) => {
            // CRITICAL: If table status is 'idle' in database, always show as idle
            // This is the source of truth - table status takes precedence over orders
            if (tableData.status === 'idle') {
              return {
                id: tableData.id,
                tableNumber: tableData.tableNumber,
                items: [],
                status: "idle" as OrderStatus,
                total: 0,
                isPaid: false,
                paymentStatus: "unpaid",
              };
            }
            
            // Only process orders if table status is NOT idle (i.e., 'occupied')
            // Find order - check both the order from tableData and from orders list
            // Priority: use order from tableData if it exists (includes served orders)
            let tableOrder = undefined;
            
            if (tableData.orderId && tableData.orderStatus) {
              // Only use order data if it's NOT served - served orders shouldn't show on floor plan
              if (tableData.orderStatus !== "served") {
                tableOrder = {
                  id: tableData.orderId,
                  tableId: tableData.id,
                  status: tableData.orderStatus,
                  items: tableData.orderItems || [], // Use items from tableData
                  total: tableData.total || 0,
                  paymentStatus: tableData.paymentStatus,
                  customerPhone: tableData.customerPhone,
                  customerName: tableData.customerName,
                  servedAt: tableData.orderServedAt,
                  createdAt: tableData.orderCreatedAt,
                  approvedAt: tableData.orderApprovedAt,
                };
                
                // Try to get full order details from orders list (for additional fields)
                const fullOrder = orders.find((o: any) => o.id === tableData.orderId && o.status !== "served");
                if (fullOrder) {
                  // Merge but prioritize tableData for status and items
                  tableOrder = { 
                    ...fullOrder, 
                    ...tableOrder,
                    status: tableData.orderStatus, // Keep orderStatus from tableData
                    items: tableData.orderItems || fullOrder.items || [],
                  };
                }
              }
            } else {
              // Fallback: find order from orders list
              // Exclude rejected and served orders - only show active orders (pending/approved)
              tableOrder = orders.find((o: any) => 
                o.tableId === tableData.id && 
                o.status !== "rejected" && 
                o.status !== "served"
              );
            }
            
            const tableOrderData = convertToTableOrder(tableData, tableOrder);
            // Add payment status and order status
            return {
              ...tableOrderData,
              isPaid: tableData.isPaid || false,
              paymentStatus: tableData.paymentStatus || "unpaid",
              orderStatus: tableData.orderStatus || tableOrder?.status, // Store original order status
            };
          });
          setTables(tableOrders);
        } else {
          // Fallback: load tables directly
          const tablesRes = await apiClient.getTables();
          if (tablesRes.success && tablesRes.data) {
            const fallbackTables = tablesRes.data.map((table: any) => {
              // If table status is 'idle' in database, show as idle regardless of orders
              if (table.status === 'idle') {
                return {
                  id: table.id,
                  tableNumber: table.tableNumber,
                  items: [],
                  status: "idle" as OrderStatus,
                  total: 0,
                  isPaid: false,
                  paymentStatus: "unpaid",
                };
              }
              // Exclude rejected and served orders - only show active orders (pending/approved)
              const tableOrder = orders.find((o: any) => 
                o.tableId === table.id && 
                o.status !== "rejected" && 
                o.status !== "served"
              );
              const tableOrderData = convertToTableOrder(table, tableOrder);
              return {
                ...tableOrderData,
                orderStatus: tableOrder?.status, // Store original order status
              };
            });
            setTables(fallbackTables);
          } else {
            console.error("Failed to load tables");
            setTables([]);
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        toast.error("Failed to load data from server");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Set up Socket.IO connection and listeners
  useEffect(() => {
    socketService.connect();

    const handleNewOrder = async (order: any) => {
      console.log("New order received via socket:", order);
      console.log("Order details:", {
        id: order.id,
        tableId: order.tableId,
        tableNumber: order.tableNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        items: order.items,
        total: order.total
      });
      
      // If order has payment status 'paid', add to paid orders sidebar
      if (order.status === "pending" && order.paymentStatus === "paid") {
        setPaidOrders(prev => {
          // Avoid duplicates
          if (prev.some(o => o.id === order.id)) return prev;
          return [convertToPaidOrder(order), ...prev];
        });
      }
      
      // Always reload tables from backend when new order arrives
      // This ensures we get the latest table status and order data
      try {
        const tablesWithPaymentRes = await apiClient.getTablesWithPaymentStatus();
        if (tablesWithPaymentRes.success && tablesWithPaymentRes.data) {
          const ordersRes = await apiClient.getOrders();
          const orders = ordersRes.success && ordersRes.data ? ordersRes.data : [];
          
          const tableOrders: TableOrder[] = tablesWithPaymentRes.data.map((tableData: any) => {
            // Find order for this table
            let tableOrder = undefined;
            
            if (tableData.orderId && tableData.orderStatus) {
              // Only use order data if it's NOT served - served orders shouldn't show on floor plan
              if (tableData.orderStatus !== "served") {
                tableOrder = {
                  id: tableData.orderId,
                  tableId: tableData.id,
                  status: tableData.orderStatus,
                  items: tableData.orderItems || [],
                  total: tableData.total || 0,
                  paymentStatus: tableData.paymentStatus,
                  customerPhone: tableData.customerPhone,
                  customerName: tableData.customerName,
                  servedAt: tableData.orderServedAt,
                  createdAt: tableData.orderCreatedAt,
                  approvedAt: tableData.orderApprovedAt,
                };
                
                // Try to get full order details from orders list (for additional fields)
                const fullOrder = orders.find((o: any) => o.id === tableData.orderId && o.status !== "served");
                if (fullOrder) {
                  // Merge but prioritize tableData for status and items
                  tableOrder = { 
                    ...fullOrder, 
                    ...tableOrder,
                    status: tableData.orderStatus, // Keep orderStatus from tableData
                    items: tableData.orderItems || fullOrder.items || [],
                  };
                }
              }
            } else {
              // Fallback: find order from orders list
              // Exclude rejected and served orders - only show active orders (pending/approved)
              tableOrder = orders.find((o: any) => 
                o.tableId === tableData.id && 
                o.status !== "rejected" && 
                o.status !== "served"
              );
            }
            
            // CRITICAL: If table status is 'idle' AND no active order exists, show as idle
            // BUT if there's an active order (not served), show it even if table status is idle (handles race conditions)
            if (tableData.status === 'idle' && !tableOrder) {
              return {
                id: tableData.id,
                tableNumber: tableData.tableNumber,
                items: [],
                status: "idle" as OrderStatus,
                total: 0,
                isPaid: false,
                paymentStatus: "unpaid",
              };
            }
            
            // Don't show served orders on floor plan - they should be cleared/reset
            if (tableOrder && (tableOrder.status === "served" || tableData.orderStatus === "served")) {
              return {
                id: tableData.id,
                tableNumber: tableData.tableNumber,
                items: [],
                status: "idle" as OrderStatus,
                total: 0,
                isPaid: false,
                paymentStatus: "unpaid",
              };
            }
            
            // Convert table + order to TableOrder
            const tableOrderData = convertToTableOrder(tableData, tableOrder);
            // Add payment status and order status
            return {
              ...tableOrderData,
              isPaid: tableData.isPaid || false,
              paymentStatus: tableData.paymentStatus || "unpaid",
              orderStatus: tableData.orderStatus || tableOrder?.status, // Store original order status
            };
          });
          
          console.log("Updated tables after new order:", tableOrders.length);
          setTables(tableOrders);
        }
      } catch (error) {
        console.error("Failed to reload tables after new order:", error);
        // Fallback: try to update local state optimistically
        if (order.tableId || order.tableNumber) {
          setTables(prev => {
            const table = prev.find(t => 
              t.id === order.tableId || t.tableNumber === order.tableNumber
            );
            
            if (table) {
              // Create updated table object with order
              const tableWithOrder = {
                ...table,
                status: "preparing" as OrderStatus,
                items: order.items || [],
                total: order.total || 0,
                startTime: order.createdAt ? new Date(order.createdAt).getTime() : Date.now(),
                customerPhone: order.customerPhone,
                customerName: order.customerName,
                customerNotes: order.customerNotes,
                paymentMethod: order.paymentMethod,
                isPaid: order.paymentStatus === "paid",
              };
              
              return prev.map(t => 
                t.id === table.id ? tableWithOrder : t
              );
            }
            return prev;
          });
        }
      }
      
      toast.info(`New order received: ${order.orderNumber || order.id}`);
    };

    const handleOrderUpdate = async (order: any) => {
      console.log("Order update received via socket:", order);
      
      // Update paid orders if status changed
      if (order.status === "pending" && order.paymentStatus === "paid") {
        setPaidOrders(prev => {
          const existing = prev.findIndex(o => o.id === order.id);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = convertToPaidOrder(order);
            return updated;
          }
          return [convertToPaidOrder(order), ...prev];
        });
      } else {
        // Remove from paid orders if no longer pending
        setPaidOrders(prev => prev.filter(o => o.id !== order.id));
      }

      // Always update table order when order updates
      if (order.tableId || order.tableNumber) {
        setTables(prev => {
          const table = prev.find(t => 
            t.id === order.tableId || t.tableNumber === order.tableNumber
          );
          
          if (table) {
            // Update existing table with updated order
            const updatedTable = convertToTableOrder(table, order);
            return prev.map(t => 
              t.id === table.id ? updatedTable : t
            );
          } else {
            // Table not found, reload all tables to ensure consistency
            setTimeout(async () => {
              try {
                const tablesWithPaymentRes = await apiClient.getTablesWithPaymentStatus();
                if (tablesWithPaymentRes.success && tablesWithPaymentRes.data) {
                  const ordersRes = await apiClient.getOrders();
                  const orders = ordersRes.success && ordersRes.data ? ordersRes.data : [];
                  
                  const tableOrders: TableOrder[] = tablesWithPaymentRes.data.map((tableData: any) => {
                    if (tableData.status === 'idle') {
                      return {
                        id: tableData.id,
                        tableNumber: tableData.tableNumber,
                        items: [],
                        status: "idle" as OrderStatus,
                        total: 0,
                        isPaid: false,
                        paymentStatus: "unpaid",
                      };
                    }
                    
                    let tableOrder = undefined;
                    if (tableData.orderId && tableData.orderStatus) {
                      tableOrder = {
                        id: tableData.orderId,
                        tableId: tableData.id,
                        status: tableData.orderStatus,
                        items: tableData.orderItems || [],
                        total: tableData.total || 0,
                        paymentStatus: tableData.paymentStatus,
                        customerPhone: tableData.customerPhone,
                        customerName: tableData.customerName,
                        servedAt: tableData.orderServedAt,
                        createdAt: tableData.orderCreatedAt,
                        approvedAt: tableData.orderApprovedAt,
                      };
                      const fullOrder = orders.find((o: any) => o.id === tableData.orderId);
                      if (fullOrder) {
                        tableOrder = { 
                          ...fullOrder, 
                          ...tableOrder,
                          status: tableData.orderStatus,
                          items: tableData.orderItems || fullOrder.items || [],
                        };
                      }
                    } else {
                      tableOrder = orders.find((o: any) => o.tableId === tableData.id && o.status !== "rejected");
                    }
                    
                    const tableOrderData = convertToTableOrder(tableData, tableOrder);
                    return {
                      ...tableOrderData,
                      isPaid: tableData.isPaid || false,
                      paymentStatus: tableData.paymentStatus || "unpaid",
                    };
                  });
                  setTables(tableOrders);
                }
              } catch (error) {
                console.error("Failed to reload tables after order update:", error);
              }
            }, 100);
          }
          
          return prev;
        });
      }
    };

    socketService.on("order:new", handleNewOrder);
    socketService.on("order:update", handleOrderUpdate);

    return () => {
      socketService.off("order:new", handleNewOrder);
      socketService.off("order:update", handleOrderUpdate);
    };
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

  const confirmPaidOrder = useCallback(async (orderId: string, tableNumber: string) => {
    try {
      const response = await apiClient.confirmOrder(orderId);
      
      if (!response.success) {
        toast.error(response.error || "Failed to confirm order");
        return;
      }

      // Order will be updated via Socket.IO, but we can update optimistically
      setPaidOrders(prev => prev.filter(o => o.id !== orderId));

      setLastAction({ type: "confirmOrder", data: { orderId, tableNumber } });
      
      if (undoTimer) clearTimeout(undoTimer);
      const timer = setTimeout(() => setLastAction(null), 7000);
      setUndoTimer(timer);

      toast.success("Order confirmed and KOT queued for printing");
    } catch (error) {
      toast.error("Failed to confirm order");
      console.error(error);
    }
  }, [undoTimer]);

  const sendToKitchen = useCallback(async (tableId: string) => {
    // Find order for this table
    const table = tables.find(t => t.id === tableId);
    if (!table || !table.items.length) return;

    // Find the order ID from backend
    const ordersRes = await apiClient.getOrders({ tableId });
    if (ordersRes.success && ordersRes.data) {
      const order = ordersRes.data.find((o: any) => o.status !== "served" && o.status !== "rejected");
      if (order) {
        await confirmPaidOrder(order.id, table.tableNumber);
      }
    }
  }, [tables, confirmPaidOrder]);

  const markServed = useCallback(async (tableId: string) => {
    try {
      const table = tables.find(t => t.id === tableId);
      if (!table) return;

      // Find order ID
      const ordersRes = await apiClient.getOrders({ tableId });
      if (ordersRes.success && ordersRes.data) {
        const order = ordersRes.data.find((o: any) => o.status !== "served" && o.status !== "rejected");
        if (order) {
          const response = await apiClient.markOrderServed(order.id);
          if (response.success) {
            // Update local state optimistically
            setTables(prev => prev.map(t => 
              t.id === tableId 
                ? { ...t, status: "served" as OrderStatus }
                : t
            ));
            
            toast.success(`Order marked as served`);
            
            // Reload tables after a short delay to ensure consistency
            setTimeout(async () => {
              try {
                const tablesWithPaymentRes = await apiClient.getTablesWithPaymentStatus();
                if (tablesWithPaymentRes.success && tablesWithPaymentRes.data) {
                  const ordersRes = await apiClient.getOrders();
                  const orders = ordersRes.success && ordersRes.data ? ordersRes.data : [];
                  
                  const tableOrders: TableOrder[] = tablesWithPaymentRes.data.map((tableData: any) => {
                    if (tableData.status === 'idle' && !tableData.orderId) {
                      return {
                        id: tableData.id,
                        tableNumber: tableData.tableNumber,
                        items: [],
                        status: "idle" as OrderStatus,
                        total: 0,
                        isPaid: false,
                        paymentStatus: "unpaid",
                      };
                    }
                    
                    let tableOrder = undefined;
                    if (tableData.orderId && tableData.orderStatus) {
                      tableOrder = {
                        id: tableData.orderId,
                        tableId: tableData.id,
                        status: tableData.orderStatus,
                        items: tableData.orderItems || [],
                        total: tableData.total || 0,
                        paymentStatus: tableData.paymentStatus,
                        customerPhone: tableData.customerPhone,
                        customerName: tableData.customerName,
                        servedAt: tableData.orderServedAt,
                        createdAt: tableData.orderCreatedAt,
                        approvedAt: tableData.orderApprovedAt,
                      };
                      const fullOrder = orders.find((o: any) => o.id === tableData.orderId);
                      if (fullOrder) {
                        tableOrder = { 
                          ...fullOrder, 
                          ...tableOrder,
                          status: tableData.orderStatus,
                          items: tableData.orderItems || fullOrder.items || [],
                        };
                      }
                    } else {
                      tableOrder = orders.find((o: any) => o.tableId === tableData.id && o.status !== "rejected");
                    }
                    
                    const tableOrderData = convertToTableOrder(tableData, tableOrder);
                    return {
                      ...tableOrderData,
                      isPaid: tableData.isPaid || false,
                      paymentStatus: tableData.paymentStatus || "unpaid",
                    };
                  });
                  setTables(tableOrders);
                }
              } catch (error) {
                console.error("Failed to reload tables:", error);
              }
            }, 500);
          } else {
            toast.error(response.error || "Failed to mark order as served");
          }
        }
      }
    } catch (error) {
      toast.error("Failed to mark order as served");
      console.error(error);
    }
  }, [tables]);

  const markTableIdle = useCallback(async (tableId: string) => {
    try {
      const response = await apiClient.resetTable(tableId);
      if (response.success) {
        // Update local state
        setTables(prev => prev.map(t => 
          t.id === tableId 
            ? { ...t, items: [], status: "idle", total: 0, isPaid: false, startTime: undefined, servedTime: undefined }
            : t
        ));
        toast.success("Table reset to idle");
        
        // Reload tables to ensure consistency
        setTimeout(() => {
          const loadData = async () => {
            try {
              const tablesWithPaymentRes = await apiClient.getTablesWithPaymentStatus();
              if (tablesWithPaymentRes.success && tablesWithPaymentRes.data) {
                const ordersRes = await apiClient.getOrders();
                const orders = ordersRes.success && ordersRes.data ? ordersRes.data : [];
                
                const tableOrders: TableOrder[] = tablesWithPaymentRes.data.map((tableData: any) => {
                  if (tableData.status === 'idle') {
                    return {
                      id: tableData.id,
                      tableNumber: tableData.tableNumber,
                      items: [],
                      status: "idle" as OrderStatus,
                      total: 0,
                      isPaid: false,
                      paymentStatus: "unpaid",
                    };
                  }
                  const tableOrder = orders.find((o: any) => o.tableId === tableData.id && o.status !== "rejected");
                  const tableOrderData = convertToTableOrder(tableData, tableOrder);
                  return {
                    ...tableOrderData,
                    isPaid: tableData.isPaid || false,
                    paymentStatus: tableData.paymentStatus || "unpaid",
                  };
                });
                setTables(tableOrders);
              }
            } catch (error) {
              console.error("Failed to reload tables:", error);
            }
          };
          loadData();
        }, 500);
      } else {
        toast.error(response.error || "Failed to reset table");
      }
    } catch (error) {
      toast.error("Failed to reset table");
      console.error(error);
    }
  }, []);

  const addManualOrder = useCallback(async (order: {
    tableNumber: string;
    items: TableOrder["items"];
    total: number;
    paymentMethod?: string;
    customerName?: string;
    customerPhone?: string;
    notes?: string;
  }) => {
    try {
      const response = await apiClient.createOrder({
        table: order.tableNumber,
        items: order.items,
        total: order.total,
        paymentMethod: order.paymentMethod || "Cash",
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerNotes: order.notes,
      });

      if (response.success) {
        toast.success(`Manual order created for ${order.tableNumber}`);
        // Order will appear via Socket.IO
      } else {
        toast.error(response.error || "Failed to create manual order");
      }
    } catch (error) {
      toast.error("Failed to create manual order");
      console.error(error);
    }
  }, []);

  const updateOrderStatus = useCallback((tableId: string, status: OrderStatus) => {
    setTables(prev =>
      prev.map(table => (table.id === tableId ? { ...table, status } : table))
    );
  }, []);

  const undoLastAction = useCallback(() => {
    if (!lastAction) return;

    // Note: Undo is complex with backend - for now, just clear the action
    // In production, you'd need to implement undo API endpoints
    if (undoTimer) clearTimeout(undoTimer);
    setLastAction(null);
    toast.info("Undo not yet implemented for backend operations");
  }, [lastAction, undoTimer]);

  const value = {
    tables,
    paidOrders,
    isLoading,
    confirmPaidOrder,
    sendToKitchen,
    markServed,
    markTableIdle,
    addManualOrder,
    updateOrderStatus,
    undoLastAction,
    lastAction,
    canUndo: lastAction !== null,
  };

  return <CashierContext.Provider value={value}>{children}</CashierContext.Provider>;
};
