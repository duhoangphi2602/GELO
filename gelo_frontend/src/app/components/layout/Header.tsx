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
      case "/dashboard": return "Dashboard Overview";
      case "/assessment": return "Start New Scan";
      case "/diary": return "Scan History";
      case "/results": return "Diagnostic Report";
      default: return "Dashboard Overview";
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
        <div className="relative group">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2a64ad] transition-colors" />
          <input
            type="text"
            placeholder="Search patients, results..."
            className="cursor-text pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#2a64ad]/20 focus:border-[#2a64ad] transition-all w-64 md:w-80"
          />
        </div>

        <div className="flex items-center gap-4">
          <button className="cursor-pointer relative p-2 text-slate-400 hover:bg-slate-50 hover:text-[#2a64ad] rounded-full transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
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