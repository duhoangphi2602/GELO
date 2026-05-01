import { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SessionManager } from "@/components/auth/SessionManager";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router";



interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <SessionManager>

      <div className="min-h-screen bg-[#f8fafc] flex font-sans text-slate-900">
        <Sidebar />

        <div className="flex-1 ml-64 flex flex-col min-h-screen relative z-10">
          <Header />

          <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto w-full max-w-[1600px] mx-auto">
            {children}
          </main>
        </div>
      </div>
    </SessionManager>
  );
}
