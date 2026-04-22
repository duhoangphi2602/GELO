import { Cpu, Info, CheckCircle2 } from "lucide-react";

interface Disease {
  id: number;
  name: string;
}

interface SupportedDiseasesProps {
  diseases: Disease[];
  loading: boolean;
}

export function SupportedDiseases({ diseases, loading }: SupportedDiseasesProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm animate-pulse">
        <div className="h-6 w-48 bg-slate-100 rounded mb-4"></div>
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-slate-100 rounded-full"></div>
          <div className="h-8 w-24 bg-slate-100 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
          <Cpu className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">AI Diagnostic Capabilities</h2>
        <div className="ml-auto group relative">
          <Info className="w-4 h-4 text-slate-400 cursor-help" />
          <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-slate-800 text-white text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            These are the medical conditions our AI model is currently trained and optimized to detect in real-time.
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        Our GELO Engine is currently active and can identify the following conditions:
      </p>

      <div className="flex flex-wrap gap-2">
        {diseases.length > 0 ? (
          diseases.map((disease) => (
            <div 
              key={disease.id}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-xs font-bold"
            >
              <CheckCircle2 className="w-3 h-3" />
              {disease.name}
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-400 italic">No specific diseases are currently enabled for detection.</p>
        )}
      </div>
    </div>
  );
}
