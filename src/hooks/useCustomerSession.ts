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

    // Extend session on user interactions with debouncing
    let activityTimeout: NodeJS.Timeout | null = null;
    const handleUserActivity = () => {
      const currentSession = getCustomerSession();
      if (currentSession) {
        // Debounce activity updates to avoid too frequent localStorage writes
        if (activityTimeout) {
          clearTimeout(activityTimeout);
        }
        activityTimeout = setTimeout(() => {
          extendSession();
        }, 1000); // Update every second max
      }
    };

    // Listen to various user activity events
    const events = ["mousedown", "keydown", "scroll", "touchstart", "click", "focus"];
    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
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

