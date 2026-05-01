import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  Activity,
  Users,
  Database,
  FileText,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SessionManager } from "@/components/auth/SessionManager";
import { Navigate } from "react-router";




interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }



  const navItems = [
    {
      path: "/admin/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      path: "/admin/data",
      icon: ShieldCheck,
      label: "Data Management",
    },
    {
      path: "/admin/diseases",
      icon: Database,
      label: "Disease Management",
    },
    {
      path: "/admin/advice",
      icon: FileText,
      label: "Advice Configuration",
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <SessionManager>
      <div className="flex h-screen bg-background">
        {/* Left Sidebar */}
        <aside className="w-64 bg-card border-r border-border flex flex-col">
          {/* Logo/Brand */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-semibold">HealthAI</h1>
                <p className="text-xs text-muted-foreground">Admin Portal</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.path)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted/50 text-foreground"
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="pt-4 mt-4 border-t border-border">
              <button
                onClick={() => navigate("/admin/patients")}
                className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive("/admin/patients") ? "bg-primary text-primary-foreground" : "hover:bg-muted/50 text-foreground"}`}
              >
                <Users className="w-5 h-5" />
                <span>Patient Management</span>
              </button>
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary">AD</span>
              </div>
              <div className="flex-1">
                <p className="text-sm">Admin User</p>
                <p className="text-xs text-muted-foreground">admin@healthai.com</p>
              </div>
            </div>
            <button
              onClick={() => { logout(); navigate("/"); }}
              className="cursor-pointer w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors mt-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-card border-b border-border px-8 py-6">
            <h2 className="text-2xl">{title}</h2>
            {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-8">{children}</div>
        </main>
      </div>
    </SessionManager>
  );

}