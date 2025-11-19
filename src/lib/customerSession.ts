/**
 * Customer Session Management Utility
 * Handles session persistence, expiration, and table status checking
 */

interface CustomerSession {
  sessionId: string;
  customerId: string;
  phone: string;
  name: string;
  loyaltyPoints?: any;
  loginTime: string;
  tableSlug?: string;
  tableNumber?: string;
  expiresAt: number; // Timestamp when session expires
}

const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const SESSION_KEY = "customer_session";
const TABLE_CHECK_INTERVAL = 60 * 1000; // Check table status every minute

/**
 * Save customer session to localStorage
 */
export function saveCustomerSession(
  sessionData: Omit<CustomerSession, "expiresAt">,
  tableSlug?: string,
  tableNumber?: string
): void {
  const session: CustomerSession = {
    ...sessionData,
    tableSlug,
    tableNumber,
    expiresAt: Date.now() + SESSION_DURATION,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/**
 * Get customer session from localStorage
 */
export function getCustomerSession(): CustomerSession | null {
  try {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;

    const session: CustomerSession = JSON.parse(sessionStr);
    return session;
  } catch (error) {
    console.error("Error reading customer session:", error);
    return null;
  }
}

/**
 * Check if session is valid (not expired)
 */
export function isSessionValid(session: CustomerSession | null): boolean {
  if (!session) return false;
  
  // Check if session has expired
  if (Date.now() > session.expiresAt) {
    return false;
  }

  return true;
}

/**
 * Clear customer session
 */
export function clearCustomerSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Extend session expiration (refresh on activity)
 */
export function extendSession(): void {
  const session = getCustomerSession();
  if (session) {
    session.expiresAt = Date.now() + SESSION_DURATION;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

/**
 * Check table status to determine if session should be maintained
 * Returns true if table is still active (not idle), false otherwise
 */
export async function checkTableStatus(
  tableSlug?: string,
  tableNumber?: string
): Promise<boolean> {
  if (!tableSlug && !tableNumber) {
    // No table associated, maintain session based on time only
    return true;
  }

  try {
    const { apiClient } = await import("@/lib/api");
    
    let table;
    if (tableSlug) {
      const response = await apiClient.getTableBySlug(tableSlug);
      if (response.success && response.data) {
        table = response.data;
      }
    } else if (tableNumber) {
      // Get table by number - get all tables and find matching one
      const tablesResponse = await apiClient.getTables();
      if (tablesResponse.success && tablesResponse.data) {
        table = tablesResponse.data.find(
          (t: any) => t.tableNumber === tableNumber
        );
      }
    }

    if (!table) {
      // Table not found, maintain session (might be takeaway order or table was deleted)
      // Don't expire session just because table is not found
      return true;
    }

    // If table is idle, session should expire
    // Otherwise, maintain session (table is occupied or has active orders)
    const isTableActive = table.status !== "idle";
    
    // Also check if there are any active orders for this table
    if (!isTableActive) {
      // Double-check by looking for active orders
      const ordersResponse = await apiClient.getOrders({ 
        tableId: table.id,
        status: "pending" 
      });
      if (ordersResponse.success && ordersResponse.data && ordersResponse.data.length > 0) {
        // Has pending orders, maintain session
        return true;
      }
    }
    
    return isTableActive;
  } catch (error) {
    console.error("Error checking table status:", error);
    // On error, maintain session to avoid disrupting user
    return true;
  }
}

/**
 * Validate and refresh session if needed
 * Returns true if session is valid, false if expired
 */
export async function validateAndRefreshSession(): Promise<boolean> {
  const session = getCustomerSession();
  
  if (!session) {
    return false;
  }

  // Check if session has expired by time
  if (!isSessionValid(session)) {
    clearCustomerSession();
    return false;
  }

  // Check table status if table is associated
  if (session.tableSlug || session.tableNumber) {
    const tableActive = await checkTableStatus(
      session.tableSlug,
      session.tableNumber
    );
    
    if (!tableActive) {
      // Table is idle, expire session
      clearCustomerSession();
      return false;
    }
  }

  // Extend session on activity
  extendSession();
  return true;
}

/**
 * Start session monitoring - checks table status periodically
 */
export function startSessionMonitoring(): () => void {
  const intervalId = setInterval(async () => {
    const session = getCustomerSession();
    if (!session) {
      return;
    }

    // Check if session expired
    if (!isSessionValid(session)) {
      clearCustomerSession();
      // Dispatch event to notify app
      window.dispatchEvent(new CustomEvent("customer_session_expired"));
      return;
    }

    // Check table status if table is associated
    if (session.tableSlug || session.tableNumber) {
      const tableActive = await checkTableStatus(
        session.tableSlug,
        session.tableNumber
      );
      
      if (!tableActive) {
        clearCustomerSession();
        window.dispatchEvent(new CustomEvent("customer_session_expired"));
        return;
      }
    }

    // Extend session on activity
    extendSession();
  }, TABLE_CHECK_INTERVAL);

  // Return cleanup function
  return () => clearInterval(intervalId);
}

