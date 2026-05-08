import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useToastContext } from "@/components/shared/ui/ToastContext";

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function SessionManager({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToastContext();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogout = () => {
    logout();
    navigate("/");
    toast.error("Session Expired", "You have been logged out due to inactivity.");
  };

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isAuthenticated) {
      timerRef.current = setTimeout(handleLogout, INACTIVITY_TIMEOUT);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Set initial timer
    resetTimer();

    // Event listeners for activity
    const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];
    events.forEach(event => window.addEventListener(event, resetTimer));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [isAuthenticated]);

  return <>{children}</>;
}
