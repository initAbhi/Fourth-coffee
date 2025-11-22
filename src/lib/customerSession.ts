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
const TABLE_CHECK_INTERVAL = 30 * 1000; // Check table status every 30 seconds (balanced between responsiveness and performance)
const LAST_ACTIVITY_KEY = "customer_last_activity";

/**
 * Track last user activity timestamp
 */
function updateLastActivity(): void {
  localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
}

function getLastActivity(): number {
  try {
    const timestamp = localStorage.getItem(LAST_ACTIVITY_KEY);
    return timestamp ? parseInt(timestamp, 10) : Date.now();
  } catch {
    return Date.now();
  }
}

/**
 * Check if user has been active recently (within last 5 minutes)
 * This helps prevent session expiration during active use
 */
function isUserActiveRecently(): boolean {
  const lastActivity = getLastActivity();
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  return lastActivity > fiveMinutesAgo;
}

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
  // Initialize last activity timestamp
  updateLastActivity();
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
  localStorage.removeItem(LAST_ACTIVITY_KEY);
}

/**
 * Logout customer - clears session and dispatches logout event
 */
export function logoutCustomer(): void {
  clearCustomerSession();
  // Dispatch custom event to trigger navigation to auth screen
  window.dispatchEvent(new CustomEvent("customer_logout"));
}

/**
 * Extend session expiration (refresh on activity)
 */
export function extendSession(): void {
  const session = getCustomerSession();
  if (session) {
    session.expiresAt = Date.now() + SESSION_DURATION;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    // Update last activity timestamp
    updateLastActivity();
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

    // CRITICAL: If table status is 'idle' in database, check if session should expire
    // The table status is the source of truth - if cashier marked it idle, session expires
    if (table.status === "idle") {
      console.log(`[Session] Table ${table.tableNumber || table.id} is marked idle, checking for active orders...`);
      
      // Double-check: only maintain session if there are truly active orders (not served/completed)
      // Check for orders that are pending or approved (not served, not rejected)
      try {
        const ordersResponse = await apiClient.getOrders({ 
          tableId: table.id
        });
        
        if (ordersResponse.success && ordersResponse.data) {
          // Filter for truly active orders (pending or approved, not served/completed/rejected)
          const activeOrders = ordersResponse.data.filter((order: any) => 
            order.status !== "served" && 
            order.status !== "rejected" && 
            order.status !== "completed" &&
            (order.status === "pending" || order.status === "approved")
          );
          
          console.log(`[Session] Found ${activeOrders.length} active orders for table ${table.tableNumber || table.id}`);
          
          // If there are active orders, maintain session even if table is marked idle
          // (This handles edge cases where table was marked idle but order is still processing)
          if (activeOrders.length > 0) {
            console.log(`[Session] Maintaining session due to active orders`);
            return true;
          }
        }
      } catch (orderError) {
        console.error("[Session] Error checking orders:", orderError);
        // On error checking orders, DON'T expire session - maintain it
        // This prevents false logouts due to network/API errors
        // Only expire if we can successfully verify there are no active orders
        console.log(`[Session] Error checking orders - maintaining session to avoid false logout`);
        return true;
      }
      
      // Table is idle and no active orders - expire session
      console.log(`[Session] Table is idle with no active orders - expiring session`);
      return false;
    }
    
    // Table is not idle - maintain session
    return true;
  } catch (error) {
    console.error("Error checking table status:", error);
    // On error, maintain session to avoid disrupting user
    return true;
  }
}

/**
 * Validate and refresh session if needed
 * Returns true if session is valid, false if expired
 * This is a lenient check - only expires if we're CERTAIN the session should expire
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

  // IMPORTANT: Don't check table status during validation - only check during monitoring
  // This prevents false logouts when user is actively using the app
  // Table status checks should only happen in background monitoring, not during user activity

  // Extend session on activity
  extendSession();
  return true;
}

/**
 * Manually trigger session check (useful for immediate validation)
 * Extends session if valid
 * This is a lenient check - only expires if session time has expired
 */
export async function checkSessionNow(): Promise<boolean> {
  const session = getCustomerSession();
  if (!session) {
    return false;
  }

  // Check if session expired by time
  if (!isSessionValid(session)) {
    clearCustomerSession();
    window.dispatchEvent(new CustomEvent("customer_session_expired"));
    return false;
  }

  // IMPORTANT: Don't check table status here during active use
  // Table status checks should only happen in background monitoring
  // This prevents false logouts when user is actively browsing/cart/checkout

  // Session is valid - extend it
  extendSession();
  return true;
}


/**
 * Start session monitoring - checks table status periodically
 * Only expires session if table is idle AND user is not actively using the app
 */
export function startSessionMonitoring(): () => void {
  let isChecking = false; // Prevent concurrent checks
  let lastCheckTime = 0;
  const MIN_CHECK_INTERVAL = 10 * 1000; // Minimum 10 seconds between checks
  
  const checkSession = async () => {
    // Prevent too frequent checks
    const now = Date.now();
    if (isChecking || (now - lastCheckTime) < MIN_CHECK_INTERVAL) {
      return;
    }
    
    isChecking = true;
    lastCheckTime = now;
    
    try {
      const session = getCustomerSession();
      if (!session) {
        isChecking = false;
        return;
      }

      // First check: Is session expired by time?
      if (!isSessionValid(session)) {
        clearCustomerSession();
        window.dispatchEvent(new CustomEvent("customer_session_expired"));
        isChecking = false;
        return;
      }

      // Second check: Has user been active recently (within last 5 minutes)?
      const userActiveRecently = isUserActiveRecently();
      if (userActiveRecently) {
        // User is active - extend session and skip table status check
        // Don't expire session while user is actively shopping/browsing
        console.log("[Session] User has been active recently - maintaining session");
        extendSession();
        isChecking = false;
        return;
      }

      // Third check: Table status (only if user is not actively using app)
      // This prevents expiration during active shopping but allows expiration when table is idle
      if (session.tableSlug || session.tableNumber) {
        try {
          const tableActive = await checkTableStatus(
            session.tableSlug,
            session.tableNumber
          );
          
          if (!tableActive) {
            // Table is idle and user is not active - expire session
            console.log("[Session] Table is idle and user is not active - expiring session");
            clearCustomerSession();
            window.dispatchEvent(new CustomEvent("customer_session_expired"));
            isChecking = false;
            return;
          }
        } catch (error) {
          console.error("[Session] Error checking table status:", error);
          // On error, maintain session - don't expire
          extendSession();
          isChecking = false;
          return;
        }
      }

      // Session is valid - extend it
      extendSession();
    } catch (error) {
      console.error("[Session] Error in session monitoring:", error);
      // On error, don't expire session - maintain it
      // Extend session to prevent accidental expiration
      const session = getCustomerSession();
      if (session) {
        extendSession();
      }
    } finally {
      isChecking = false;
    }
  };

  // Don't check immediately on start - give user time to interact
  // First check after initial delay
  const initialTimeout = setTimeout(() => {
    checkSession();
  }, 10000); // Wait 10 seconds before first check to allow user to start shopping
  
  // Then check periodically
  const intervalId = setInterval(checkSession, TABLE_CHECK_INTERVAL);

  // Return cleanup function
  return () => {
    clearTimeout(initialTimeout);
    clearInterval(intervalId);
  };
}

