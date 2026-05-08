import { Download, Activity, ExternalLink } from "lucide-react";

export function ReportTable({ scans = [], loading }: { scans: any[], loading: boolean }) {
  const handleExport = () => {
     // Logic for CSV export
     alert("Exporting current view to CSV...");
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 tracking-tight">Detailed Scan History</h3>
        <button 
          onClick={handleExport}
          disabled={loading || scans.length === 0}
          className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50 shadow-sm"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <th className="px-6 py-4 border-b border-slate-100">Scan Reference</th>
              <th className="px-6 py-4 border-b border-slate-100">AI Finding</th>
              <th className="px-6 py-4 border-b border-slate-100">Confidence</th>
              <th className="px-6 py-4 border-b border-slate-100">Diagnostic Status</th>
              <th className="px-6 py-4 border-b border-slate-100 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
               [1, 2, 3, 4].map(i => (
                 <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-6"><div className="h-4 bg-slate-100 rounded-full w-full" /></td>
                 </tr>
               ))
            ) : scans.length === 0 ? (
               <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">
                    <div className="flex flex-col items-center">
                      <Activity className="w-12 h-12 mb-4 opacity-10" />
                      <p className="text-xs font-bold uppercase tracking-widest">No diagnostic history found</p>
                    </div>
                  </td>
               </tr>
            ) : (
              scans.map((scan: any) => {
                const diseaseName = scan.diagnosis?.predictedDisease?.name;
                const result = diseaseName || "Other / No Finding";
                const conf = scan.diagnosis?.aiConfidence || 0;
                const status = scan.diagnosis?.diagnosticStatus || "UNKNOWN";

                return (
                  <tr key={scan.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#2a64ad]/5 flex items-center justify-center text-[#2a64ad]">
                            <Activity size={14} />
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-sm">Scan #{scan.id}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Diagnostic Session</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-5 font-black text-slate-700 text-sm">{result}</td>
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div className={`h-full ${conf > 70 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${conf}%` }} />
                          </div>
                          <span className={`text-[10px] font-black ${conf > 70 ? 'text-emerald-600' : 'text-amber-600'}`}>{conf}%</span>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1.5 rounded-full text-[8px] font-black tracking-widest uppercase border ${
                        status === 'DISEASE' 
                          ? 'bg-rose-50 text-rose-600 border-rose-100' 
                          : status === 'UNKNOWN'
                          ? 'bg-amber-50 text-amber-600 border-amber-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}>
                        {status === 'DISEASE' ? 'Risk Detected' : status === 'UNKNOWN' ? 'Pending Review' : 'Healthy / Clear'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right text-slate-400 font-black text-[10px]">
                       {new Date(scan.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
