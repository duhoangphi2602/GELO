import { Link, useLocation } from "react-router";
import { LayoutDashboard, FileUp, History, FileBarChart, User, Settings } from "lucide-react";

export function Sidebar() {
  const location = useLocation();

  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "New Scan", href: "/scan", icon: FileUp },
    { name: "Scan History", href: "/history", icon: History },
    { name: "Reports", href: "/reports", icon: FileBarChart },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20">
      <div className="flex items-center px-6 h-16 border-b border-slate-800">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-emerald-500/20">
          <span className="text-white font-bold text-lg">G</span>
        </div>
        <h1 className="text-xl font-bold tracking-wider text-white">GELO</h1>
      </div>
      
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-3">
          Main Menu
        </div>
        {navLinks.map((link) => {
          const isActive = location.pathname === link.href;
          const Icon = link.icon;
          
          return (
            <Link
              key={link.name}
              to={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                isActive 
                  ? "bg-slate-800 text-emerald-400" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-white"}`} />
              <span className="font-medium text-sm">{link.name}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-auto" />
              )}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-xl p-4 flex flex-col items-center border border-slate-700/50">
          <p className="text-xs font-medium text-slate-300 text-center mb-2">Gelo Health System</p>
          <span className="text-[10px] bg-slate-700/50 px-2 py-1 rounded-md text-emerald-400 border border-slate-600">
            Enterprise v2.0
          </span>
        </div>
      </div>
    </aside>
  );
}
