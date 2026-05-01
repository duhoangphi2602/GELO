import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/admin-layout";
import { adminService } from "@/services/admin.service";
import { ShieldCheck, Download, Table, ExternalLink, Filter, Search, AlertCircle } from "lucide-react";
import { useToastContext } from "@/components/ui/ToastContext";

export function AdminDataManagement() {
  const toast = useToastContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDiseaseId, setFilterDiseaseId] = useState("");

  const { data: diseases = [] } = useQuery({
    queryKey: ["admin", "diseases"],
    queryFn: () => adminService.getDiseases(),
  });

  const { data: verifiedData = [], isLoading } = useQuery({
    queryKey: ["admin", "verifiedData", searchTerm, filterDiseaseId],
    queryFn: () => adminService.getVerifiedData({
      search: searchTerm || undefined,
      diseaseId: filterDiseaseId || undefined
    }),
  });

  const handleExportCsv = async () => {
    try {
      const blob = await adminService.exportCsv();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `gelo_training_data_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Success", "Training data exported successfully.");
    } catch (err) {
      toast.error("Export Failed", "Could not generate CSV file.");
    }
  };

  return (
    <AdminLayout title="Data Management" subtitle="Manage clinical training datasets and export for AI retraining">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ID, Patient, or Disease..."
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm outline-none focus:border-[#2a64ad]"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <select
                value={filterDiseaseId}
                onChange={(e) => setFilterDiseaseId(e.target.value)}
                className="pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-xs font-bold outline-none cursor-pointer"
              >
                <option value="">All Conditions</option>
                {diseases.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <button
              onClick={handleExportCsv}
              disabled={isLoading || verifiedData.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#2a64ad] text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Scan</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Predicted</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Verified</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  [1, 2, 3].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-6"><div className="h-6 bg-muted rounded w-full" /></td>
                    </tr>
                  ))
                ) : verifiedData.length > 0 ? (
                  verifiedData.map((item: any) => (
                    <tr key={item.feedbackId} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted overflow-hidden border border-border">
                            <img src={item.imageUrl} alt="Scan" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[10px] font-bold font-mono">#{item.scanId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-muted-foreground">{item.predictedDisease}</td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-[#2a64ad] bg-[#2a64ad]/5 px-2 py-1 rounded">{item.actualDisease}</span>
                      </td>
                      <td className="px-6 py-4">
                        {item.isCorrect ? (
                          <div className="flex items-center gap-1 text-emerald-600 font-bold text-[10px] uppercase">
                            <ShieldCheck size={14} /> Confirmed
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-rose-600 font-bold text-[10px] uppercase">
                            <AlertCircle size={14} /> Corrected
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[10px] font-bold text-muted-foreground">{new Date(item.reviewedAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <a href={item.imageUrl} target="_blank" rel="noreferrer" className="inline-flex p-2 hover:bg-[#2a64ad]/10 rounded-lg text-muted-foreground hover:text-[#2a64ad] transition-all"><ExternalLink size={14} /></a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-muted-foreground italic">
                      <Table size={40} className="mx-auto mb-4 opacity-10" />
                      No verified clinical data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-muted/20 rounded-2xl border border-border p-6 flex flex-col md:flex-row justify-around gap-8 text-center">
          <div><p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Dataset</p><p className="text-2xl font-black text-foreground">{verifiedData.length}</p></div>
          <div className="hidden md:block w-px bg-border h-12 self-center" />
          <div><p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Accurate AI</p><p className="text-2xl font-black text-emerald-600">{verifiedData.filter((d: any) => d.isCorrect).length}</p></div>
          <div className="hidden md:block w-px bg-border h-12 self-center" />
          <div><p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Refined by Human</p><p className="text-2xl font-black text-rose-600">{verifiedData.filter((d: any) => !d.isCorrect).length}</p></div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminDataManagement;
