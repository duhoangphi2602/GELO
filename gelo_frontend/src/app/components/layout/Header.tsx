import { Bell, Search, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const fullName = localStorage.getItem("fullName") || "Guest Account";

  // Get initials for avatar (e.g. "John Doe" -> "JD")
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/dashboard": return "Dashboard";
      case "/scan": return "Start New Scan";
      case "/diary": return "Diary Tracking";
      case "/results": return "Diagnostic Report";
      case "/history": return "Scan History";
      case "/profile": return "Profile";
      case "/feedback": return "App Feedback";
      default: return "Dashboard";
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("patientId");
    localStorage.removeItem("fullName");
    localStorage.removeItem("role");
    navigate("/");
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30 shadow-sm">
      <h2 className="text-xl font-bold text-slate-800 tracking-tight">{getPageTitle()}</h2>

      <div className="flex items-center gap-6">
        <div className="hidden">
          {/* Search removed as requested */}
        </div>

        <div className="flex items-center gap-4">
          {/* Notification bell removed as requested */}          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-[#2a64ad] font-bold text-sm border border-blue-200">
              {initials}
            </div>
            <div className="flex flex-col hidden sm:flex">
              <span className="text-sm font-semibold text-slate-800 leading-none">{fullName}</span>
              <span className="text-[11px] text-slate-500 mt-1">Patient</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="cursor-pointer ml-1 p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors flex items-center justify-center"
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}