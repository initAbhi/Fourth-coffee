/**
 * Hook to manage customer session
 * Automatically extends session on component mount and user activity
 */

import { useEffect } from "react";
import { getCustomerSession, extendSession, validateAndRefreshSession } from "@/lib/customerSession";

export function useCustomerSession() {
  useEffect(() => {
    // Extend session when component mounts (user activity)
    const session = getCustomerSession();
    if (session) {
      extendSession();
    }

    // Extend session on user interactions
    const handleUserActivity = () => {
      const currentSession = getCustomerSession();
      if (currentSession) {
        extendSession();
      }
    };

    // Listen to various user activity events
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, []);

  return {
    getSession: getCustomerSession,
    extendSession,
    validateSession: validateAndRefreshSession,
  };
}

