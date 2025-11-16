import { TableOrder, PaidOrder, OrderStatus } from "@/contexts/CashierContext";

// Mock Tables Data
export const mockTables: TableOrder[] = [
  {
    id: "t1",
    tableNumber: "T-01",
    items: [],
    status: "idle",
    total: 0,
    isPaid: false,
  },
  {
    id: "t2",
    tableNumber: "T-02",
    items: [
      { name: "Cappuccino", quantity: 2, price: 150, modifiers: ["Soy Milk", "Large"] },
      { name: "Butter Croissant", quantity: 1, price: 100 }
    ],
    status: "preparing",
    total: 400,
    startTime: Date.now() - 180000, // 3 minutes ago
    isPaid: true,
    paymentMethod: "UPI - GPay",
    customerPhone: "+91 98765-43210",
  },
  {
    id: "t3",
    tableNumber: "T-03",
    items: [
      { name: "Classic Espresso", quantity: 1, price: 120 },
      { name: "Chocolate Chip Cookie", quantity: 2, price: 80 }
    ],
    status: "aging",
    total: 280,
    startTime: Date.now() - 360000, // 6 minutes ago
    isPaid: true,
    paymentMethod: "Card",
    customerPhone: "+91 98765-43211",
  },
  {
    id: "t4",
    tableNumber: "T-04",
    items: [
      { name: "Cold Brew", quantity: 1, price: 180, modifiers: ["Extra Ice"] },
      { name: "Butter Croissant", quantity: 1, price: 100 }
    ],
    status: "critical",
    total: 280,
    startTime: Date.now() - 660000, // 11 minutes ago
    isPaid: true,
    paymentMethod: "UPI - PhonePe",
    customerPhone: "+91 98765-43212",
    customerNotes: "Customer waiting, please prioritize",
  },
  {
    id: "t5",
    tableNumber: "T-05",
    items: [],
    status: "idle",
    total: 0,
    isPaid: false,
  },
  {
    id: "t6",
    tableNumber: "T-06",
    items: [
      { name: "Cappuccino", quantity: 1, price: 150 },
    ],
    status: "served",
    total: 150,
    startTime: Date.now() - 720000, // 12 minutes ago
    servedTime: Date.now() - 120000, // 2 minutes ago
    isPaid: true,
    paymentMethod: "Cash",
  },
  {
    id: "t7",
    tableNumber: "T-07",
    items: [],
    status: "idle",
    total: 0,
    isPaid: false,
  },
  {
    id: "t8",
    tableNumber: "T-08",
    items: [
      { name: "Latte", quantity: 2, price: 150, modifiers: ["Oat Milk"] },
      { name: "Chocolate Chip Cookie", quantity: 1, price: 80 }
    ],
    status: "preparing",
    total: 380,
    startTime: Date.now() - 120000, // 2 minutes ago
    isPaid: true,
    paymentMethod: "UPI - GPay",
    customerPhone: "+91 98765-43213",
  },
  {
    id: "t9",
    tableNumber: "T-09",
    items: [],
    status: "idle",
    total: 0,
    isPaid: false,
  },
  {
    id: "t10",
    tableNumber: "T-10",
    items: [
      { name: "Classic Espresso", quantity: 1, price: 120 },
    ],
    status: "preparing",
    total: 120,
    startTime: Date.now() - 60000, // 1 minute ago
    isPaid: true,
    paymentMethod: "Card",
  },
  {
    id: "t11",
    tableNumber: "T-11",
    items: [],
    status: "idle",
    total: 0,
    isPaid: false,
  },
  {
    id: "t12",
    tableNumber: "T-12",
    items: [
      { name: "Cold Brew", quantity: 1, price: 180 },
      { name: "Butter Croissant", quantity: 2, price: 100 }
    ],
    status: "aging",
    total: 380,
    startTime: Date.now() - 420000, // 7 minutes ago
    isPaid: true,
    paymentMethod: "UPI - PhonePe",
    customerPhone: "+91 98765-43214",
  },
];

// Mock Paid Orders (Incoming Orders)
export const mockPaidOrders: PaidOrder[] = [
  {
    id: "po1",
    orderNumber: "#12345",
    items: [
      { name: "Cappuccino", quantity: 1, price: 150, modifiers: ["Oat Milk"] },
      { name: "Butter Croissant", quantity: 1, price: 100 }
    ],
    total: 250,
    customerPhone: "+91 98765-43220",
    customerName: "Rajesh Kumar",
    paymentMethod: "UPI - GPay",
    receivedAt: Date.now() - 120000, // 2 minutes ago
    isPrinted: false
  },
  {
    id: "po2",
    orderNumber: "#12346",
    items: [
      { name: "Classic Espresso", quantity: 2, price: 120 },
    ],
    total: 240,
    customerPhone: "+91 98765-43221",
    customerName: "Priya Sharma",
    paymentMethod: "Card",
    receivedAt: Date.now() - 60000, // 1 minute ago
    isPrinted: false
  },
  {
    id: "po3",
    orderNumber: "#12347",
    items: [
      { name: "Cold Brew", quantity: 1, price: 180, modifiers: ["Extra Ice"] },
      { name: "Chocolate Chip Cookie", quantity: 2, price: 80 }
    ],
    total: 340,
    customerPhone: "+91 98765-43222",
    customerName: "Amit Patel",
    paymentMethod: "UPI - PhonePe",
    receivedAt: Date.now() - 30000, // 30 seconds ago
    isPrinted: false
  },
  {
    id: "po4",
    orderNumber: "#12348",
    items: [
      { name: "Latte", quantity: 1, price: 150, modifiers: ["Soy Milk", "Large"] },
    ],
    total: 150,
    customerPhone: "+91 98765-43223",
    paymentMethod: "UPI - GPay",
    receivedAt: Date.now() - 15000, // 15 seconds ago
    isPrinted: false
  },
];

// Mock Products for Manual Order
export const mockProducts = [
  { id: "1", name: "Classic Espresso", price: 120, category: "coffee" },
  { id: "2", name: "Cappuccino", price: 150, category: "coffee" },
  { id: "3", name: "Latte", price: 150, category: "coffee" },
  { id: "4", name: "Cold Brew", price: 180, category: "coffee" },
  { id: "5", name: "Americano", price: 100, category: "coffee" },
  { id: "6", name: "Butter Croissant", price: 100, category: "pastries" },
  { id: "7", name: "Chocolate Chip Cookie", price: 80, category: "cookies" },
  { id: "8", name: "Muffin", price: 90, category: "pastries" },
  { id: "9", name: "Bagel", price: 95, category: "pastries" },
  { id: "10", name: "Brownie", price: 110, category: "cookies" },
];

