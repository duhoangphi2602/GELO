import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";

export default function RootIndex() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth/login", { replace: true });
      return;
    }

    if (isAdmin) {
      navigate("/admin/dashboard", { replace: true });
    } else {
      navigate("/patient/dashboard", { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/20" />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Initializing Gelo AI...</p>
      </div>
    </div>
  );
}
