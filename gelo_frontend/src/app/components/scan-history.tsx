import { useState, useEffect } from "react";
import { History, Search, Activity, ChevronRight, AlertTriangle, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import api from "../lib/api";
import { Layout } from "./layout/Layout";

export function ScanHistory() {
  const navigate = useNavigate();
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const patientId = localStorage.getItem("patientId");
      if (!patientId) return;

      const res = await api.get(`/scans/patient/${patientId}`);
      setScans(res.data || []);
    } catch (e) {
      console.error("Failed to fetch scan history", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: any, scanId: number) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this scan history?")) return;
    try {
      await api.delete(`/scans/${scanId}`);
      fetchHistory();
    } catch (err) {
      console.error("Failed to delete scan", err);
    }
  };

  const handleDeleteAllHistory = async () => {
    if (!confirm("WARNING: This will permanently delete ALL your scan history. This action cannot be undone. Are you sure?")) return;

    setLoading(true);
    try {
      await api.delete("/scans/history/all");
      setScans([]);
    } catch (err) {
      console.error("Failed to delete all scans", err);
      alert("Failed to clear history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const navigateToResult = (scanId: number) => {
    localStorage.setItem("currentScanId", scanId.toString());
    navigate("/results");
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/20">
                <History className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Scan History</h2>
            </div>
            <p className="text-slate-500 font-medium">Review your past medical imaging assessments and AI diagnostic results.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDeleteAllHistory}
              disabled={loading || scans.length === 0}
              className="flex items-center gap-2 cursor-pointer bg-white border border-red-200 text-red-600 px-4 py-2 rounded-xl hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm font-semibold text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete All History
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200/60 shadow-sm">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-[#2a64ad] rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-semibold">Loading scan history...</p>
          </div>
        ) : scans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scans.map((scan: any) => {
              const diagnosis = scan.diagnosis;
              const decision = diagnosis?.decision || "unknown";

              let statusTheme = "bg-slate-100 text-slate-600 border-slate-200";
              let label = "Unknown Status";

              if (decision === 'emergency' || diagnosis?.isEmergency) {
                statusTheme = "bg-red-50 text-red-700 border-red-200";
                label = "Emergency Warning";
              } else if (decision === 'positive') {
                statusTheme = "bg-emerald-50 text-emerald-700 border-emerald-200";
                label = "Condition Detected";
              } else if (decision === 'uncertain') {
                statusTheme = "bg-amber-50 text-amber-700 border-amber-200";
                label = "Uncertain Diagnosis";
              } else if (decision === 'unknown') {
                statusTheme = "bg-slate-50 text-slate-600 border-slate-200";
                label = "No Match Found";
              }

              return (
                <div
                  key={scan.id}
                  onClick={() => navigateToResult(scan.id)}
                  className="bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-[#2a64ad]/30 transition-all cursor-pointer overflow-hidden flex flex-col group"
                >
                  <div className="h-48 bg-slate-100 relative overflow-hidden">
                    {/* Placeholder or actual image */}
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                      <Activity className="w-12 h-12 text-slate-600 opacity-50" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60"></div>
                    </div>
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border shadow-sm backdrop-blur-md ${statusTheme}`}>
                        {label}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4 z-10">
                      <button
                        onClick={(e) => handleDelete(e, scan.id)}
                        className="cursor-pointer p-2 bg-white/70 hover:bg-red-500 hover:text-white text-slate-500 rounded-lg shadow-sm backdrop-blur-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-slate-800 text-lg group-hover:text-[#2a64ad] transition-colors line-clamp-1">
                        {diagnosis?.predictedDisease?.name || "Pending Review"}
                      </h3>
                    </div>

                    <div className="flex-1 space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Match Score</span>
                        <span className="font-black text-[#2a64ad]">{diagnosis?.normalizedScore ? `${(diagnosis.normalizedScore * 100).toFixed(0)}%` : 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Date</span>
                        <span className="font-semibold text-slate-700">
                          {new Date(scan.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center text-[#2a64ad] font-semibold text-sm">
                      View Full Report <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-slate-200/60 border-dashed rounded-2xl py-16 flex flex-col items-center justify-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No Scans Found</h3>
            <p className="text-slate-500 font-medium mb-6 text-center max-w-sm">You haven't performed any medical imaging assessments yet.</p>
            <button
              onClick={() => navigate("/scan")}
              className="cursor-pointer bg-[#2a64ad] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#1e4e8c] transition-all shadow-md hover:shadow-blue-500/20"
            >
              Start New Scan
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
