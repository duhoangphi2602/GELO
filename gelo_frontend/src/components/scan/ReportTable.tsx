import { Download, Activity } from "lucide-react";

export function ReportTable({ scans = [], loading }: { scans: any[], loading: boolean }) {
  const handleExport = () => {
     // Logic for CSV export can go here if needed
     alert("Exporting current view to CSV...");
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800">Detailed History Report</h3>
        <button 
          onClick={handleExport}
          disabled={loading || scans.length === 0}
          className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
              <th className="px-6 py-4 border-b border-slate-100">Scan Context</th>
              <th className="px-6 py-4 border-b border-slate-100">AI Result</th>
              <th className="px-6 py-4 border-b border-slate-100">Confidence</th>
              <th className="px-6 py-4 border-b border-slate-100">Status</th>
              <th className="px-6 py-4 border-b border-slate-100 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
               [1, 2, 3].map(i => (
                 <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-full" /></td>
                 </tr>
               ))
            ) : scans.length === 0 ? (
               <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No diagnostic data found.</td>
               </tr>
            ) : (
              scans.map((scan: any) => {
                const result = scan.diagnosis?.predictedDisease?.name || "Normal";
                const conf = scan.diagnosis?.aiConfidence || 0;
                const status = scan.diagnosis?.diagnosticStatus || "UNKNOWN";

                return (
                  <tr key={scan.id} className="cursor-pointer hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <Activity size={14} className="text-blue-500" />
                          <span className="font-bold text-slate-700">Scan #{scan.id}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">{result}</td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-500" style={{ width: `${conf}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600">{conf}%</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[9px] font-black tracking-widest uppercase border ${
                        status === 'DISEASE' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}>
                        {status === 'DISEASE' ? 'Risk Detected' : 'Clear'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-400 font-bold text-[10px]">
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