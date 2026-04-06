import { useNavigate } from "react-router";
import { FileUp, FileBarChart, User, ChevronRight, ActivitySquare } from "lucide-react";

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 flex flex-col h-full">
      <h3 className="text-lg font-bold text-slate-800 mb-1">Quick Actions</h3>
      <p className="text-sm text-slate-500 mb-6">Common tasks and shortcuts</p>

      {/* Start New Scan CTA - Prominent */}
      <div 
        onClick={() => navigate("/scan")}
        className="bg-emerald-600 rounded-xl p-5 mb-4 text-white cursor-pointer hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-500/20 group relative overflow-hidden flex flex-col"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 relative z-10 backdrop-blur-sm">
          <ActivitySquare className="w-6 h-6 text-white" />
        </div>
        <h4 className="font-bold text-lg mb-1 relative z-10">Start New AI Scan</h4>
        <p className="text-emerald-50 text-xs font-medium mb-4 relative z-10">Upload medical images for instant analysis</p>
        
        <button className="flex items-center gap-1 font-bold text-sm bg-white text-emerald-600 py-2.5 px-4 rounded-lg w-fit mt-auto relative z-10 shadow-sm">
          Go to Scan Page <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3 mt-auto">
        <button 
          onClick={() => navigate("/reports")}
          className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <FileBarChart className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-700 text-sm">View Reports</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
        </button>
        
        <button 
          onClick={() => navigate("/profile")}
          className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <User className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-700 text-sm">Edit Profile</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
        </button>
      </div>

    </div>
  );
}
