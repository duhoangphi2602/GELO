import { Cpu, Info, CheckCircle2, ShieldCheck } from "lucide-react";

interface Disease {
  id: number;
  name: string;
}

interface SupportedDiseasesProps {
  diseases: Disease[];
  loading: boolean;
}

export function SupportedDiseases({ diseases = [], loading }: SupportedDiseasesProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm animate-pulse">
        <div className="h-4 w-32 bg-slate-100 rounded-full mb-4"></div>
        <div className="space-y-2">
          <div className="h-8 w-full bg-slate-50 rounded-xl"></div>
          <div className="h-8 w-full bg-slate-50 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm group hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 tracking-tight">AI Capabilities</h2>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">GELO Engine v1.0</span>
            </div>
          </div>
        </div>

        <div className="group/info relative">
          <Info className="w-4 h-4 text-slate-300 cursor-help hover:text-slate-500 transition-colors" />
          <div className="absolute bottom-full right-0 mb-3 w-64 p-3 bg-slate-900 text-white text-[10px] rounded-2xl shadow-2xl opacity-0 group-hover/info:opacity-100 transition-all pointer-events-none z-20 translate-y-2 group-hover/info:translate-y-0 font-medium leading-relaxed">
            These are the specific medical conditions our AI model is currently trained and optimized to detect with clinical-grade accuracy.
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {diseases.length > 0 ? (
          diseases.map((disease) => (
            <div
              key={disease.id}
              className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100 group/item hover:bg-emerald-50/50 hover:border-emerald-100 transition-all cursor-default"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                <span className="text-xs font-bold text-slate-600 group-hover/item:text-emerald-700 transition-colors">
                  {disease.name}
                </span>
              </div>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 opacity-0 group-hover/item:opacity-100 transition-opacity" />
            </div>
          ))
        ) : (
          <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <ShieldCheck className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-4 leading-relaxed">No conditions are currently enabled in the engine.</p>
          </div>
        )}
      </div>
    </div>
  );
}

