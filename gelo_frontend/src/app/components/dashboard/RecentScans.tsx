import { useNavigate } from "react-router";
import { ChevronRight, FileImage, ShieldCheck, MoreVertical } from "lucide-react";

export function RecentScans({ loading, scanHistory }: { loading: boolean, scanHistory: any[] }) {
  const navigate = useNavigate();

  // Show only up to 5 items
  const recentScansPreview = scanHistory.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 flex flex-col overflow-hidden h-full">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Recent Scans History</h3>
          <p className="text-sm text-slate-500 mt-1">Review your latest medical diagnostic assessments</p>
        </div>
      </div>

      <div className="flex-1 w-full overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold border-b border-slate-100">Scan Result</th>
              <th className="px-6 py-4 font-semibold border-b border-slate-100">Date</th>
              <th className="px-6 py-4 font-semibold border-b border-slate-100">AI Confidence</th>
              <th className="px-6 py-4 font-semibold border-b border-slate-100 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mb-4" />
                    <p className="font-medium">Loading your medical history...</p>
                  </div>
                </td>
              </tr>
            ) : scanHistory.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                      <FileImage className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-800 font-bold text-lg">No scans found</p>
                    <p className="text-slate-500 text-sm max-w-sm mt-1">
                      You haven't performed any scans yet. Start a new scan to get AI-powered insights.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              recentScansPreview.map((scan) => {
                const result = scan.diagnosis?.predictedDisease?.name || "Pending Validation";
                const isDanger = result !== "Normal" && result !== "Pending Validation";

                return (
                  <tr key={scan.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDanger ? 'bg-red-100' : 'bg-blue-100'}`}>
                          <ShieldCheck className={`w-5 h-5 ${isDanger ? 'text-red-600' : 'text-blue-600'}`} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{result}</p>
                          <p className="text-xs text-slate-500 font-medium">Skin Assessment</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium whitespace-nowrap">
                      {new Date(scan.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.random() * 20 + 75}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700">98%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Ngăn sự kiện click lan ra hàng <tr>
                          localStorage.setItem("currentScanId", scan.id.toString());
                          navigate("/results");
                        }}
                        className="cursor-pointer text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
                      >
                        View Report
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div
        onClick={() => navigate("/history")}
        className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
      >
        <button className="cursor-pointer text-sm font-semibold text-emerald-600 flex items-center gap-1 group">
          View all scan history <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}