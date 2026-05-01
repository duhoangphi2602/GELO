import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ReportTable } from "@/components/scan/ReportTable";
import { scanService } from "@/services/scan.service";
import { useAuth } from "@/hooks/useAuth";

export function Reports() {
  const { patientId } = useAuth();
  
  const { data: scans = [], isLoading } = useQuery({
    queryKey: ["scans", patientId],
    queryFn: () => scanService.getPatientScans(patientId || 1),
  });

  const totalScans = scans.length;
  const flaggedCases = scans.filter(s => s.diagnosis?.diagnosticStatus === 'DISEASE').length;
  const successRate = totalScans > 0 ? ((totalScans - flaggedCases) / totalScans * 100).toFixed(0) : "100";

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
        <div className="mb-2">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Reports & Analytics</h1>
          <p className="text-slate-500 font-medium mt-1">Detailed overview of your dermatological health trends.</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 transition-all duration-300">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Scans</p>
            <h3 className="text-3xl font-black text-slate-800">{isLoading ? "..." : totalScans}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 transition-all duration-300">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Normal Rate</p>
            <h3 className="text-3xl font-black text-emerald-500">{isLoading ? "..." : `${successRate}%`}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 transition-all duration-300">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Flagged Cases</p>
            <h3 className="text-3xl font-black text-rose-500">{isLoading ? "..." : flaggedCases}</h3>
          </div>
        </div>

        {/* Chart Placeholder */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 h-64 flex flex-col items-center justify-center">
          <div className="w-full h-full border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center bg-slate-50/50">
             <div className="flex items-end gap-2 h-20 mb-4">
                {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                  <div key={i} className="w-6 bg-[#2a64ad]/20 rounded-t-sm" style={{ height: `${h}%` }}></div>
                ))}
             </div>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Growth Trend Visualization</p>
          </div>
        </div>

        {/* Report Table */}
        <ReportTable scans={scans} loading={isLoading} />
      </div>
    </Layout>
  );
}
export default Reports;
