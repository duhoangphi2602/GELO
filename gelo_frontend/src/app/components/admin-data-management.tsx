import { useState, useEffect } from "react";
import { AdminLayout } from "./admin-layout";
import api from "../lib/api";
import { ShieldCheck, Download, Table, ExternalLink, Filter, Search } from "lucide-react";
import { useToastContext } from "./ui/ToastContext";

export function AdminDataManagement() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToastContext();

  useEffect(() => {
    fetchVerifiedData();
  }, []);

  const fetchVerifiedData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/scans/admin/verified-data");
      setData(res.data || []);
    } catch (err) {
      console.error("Error fetching verified data", err);
      toast.error("Error", "Failed to load clinical dataset.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await api.get("/scans/admin/export-csv", { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `gelo_training_data_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Success", "Training data exported successfully.");
    } catch (err) {
      console.error("Export failed", err);
      toast.error("Export Failed", "Could not generate CSV file.");
    }
  };

  return (
    <AdminLayout
      title="Data Management"
      subtitle="Manage gold-standard clinical data and export for AI model retraining"
    >
      <div className="space-y-6">
        {/* Action Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Scan ID or Disease..."
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center cursor-pointer gap-2 px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button
              onClick={handleExportCsv}
              disabled={loading || data.length === 0}
              className="flex items-center cursor-pointer gap-2 px-6 py-2 bg-[#2a64ad] text-white rounded-xl text-sm font-bold hover:bg-[#1e4e8c] transition-all shadow-lg shadow-blue-500/10 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Scan</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Predicted</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Verified (Actual)</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reviewed At</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-4"><div className="h-10 bg-muted/50 rounded-lg w-full" /></td>
                    </tr>
                  ))
                ) : data.length > 0 ? (
                  data.map((item) => (
                    <tr key={item.feedbackId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-muted overflow-hidden border border-border">
                            <img src={item.imageUrl} alt="Scan" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-xs font-bold font-mono">#{item.scanId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-muted-foreground">{item.predictedDisease}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-[#2a64ad] bg-blue-50 px-2 py-0.5 rounded">
                          {item.actualDisease}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {item.isCorrect ? (
                            <div className="flex items-center gap-1 text-emerald-600">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-black uppercase">Confirmed</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-rose-600">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-black uppercase">Corrected</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.reviewedAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a
                          href={item.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <Table className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="font-medium">No verified clinical data available yet.</p>
                      <p className="text-xs">Start reviewing pending cases from the dashboard.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dataset Stats */}
        <div className="bg-muted/30 rounded-2xl border border-border p-6 flex flex-col md:flex-row justify-around gap-8">
          <div className="text-center">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Dataset Size</p>
            <p className="text-2xl font-black text-foreground">{data.length}</p>
          </div>
          <div className="h-px md:h-8 md:w-px bg-border self-center" />
          <div className="text-center">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Correct Preds</p>
            <p className="text-2xl font-black text-emerald-600">{data.filter(d => d.isCorrect).length}</p>
          </div>
          <div className="h-px md:h-8 md:w-px bg-border self-center" />
          <div className="text-center">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Human Refined</p>
            <p className="text-2xl font-black text-rose-600">{data.filter(d => !d.isCorrect).length}</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function AlertCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}
