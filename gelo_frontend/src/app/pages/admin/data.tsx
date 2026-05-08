import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/admin-layout";
import { adminService } from "@/services/admin.service";
import { Download, Filter, Search, Trash2 } from "lucide-react";
import { useToastContext } from "@/components/shared/ui/ToastContext";
import { useSelection } from "@/hooks/useSelection";
import { VerifiedDataTable } from "@/components/admin/verified-data-table";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';

export function AdminDataManagement() {
  const toast = useToastContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDiseaseId, setFilterDiseaseId] = useState("");

  const { data: diseases = [] } = useQuery({
    queryKey: ["admin", "diseases"],
    queryFn: () => adminService.getDiseases(),
  });

  const { data: verifiedData = [], isLoading, refetch } = useQuery({
    queryKey: ["admin", "verifiedData", searchTerm, filterDiseaseId],
    queryFn: () => adminService.getVerifiedData({
      search: searchTerm || undefined,
      diseaseId: filterDiseaseId || undefined
    }),
  });

  const { 
    selectedIds, 
    toggleSelectAll, 
    toggleSelectOne, 
    clearSelection, 
    isSelectedAll, 
    isSomeSelected 
  } = useSelection(verifiedData, "scanId");

  // Process data for AreaChart (Global scan trend - Last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => startOfDay(subDays(new Date(), 6 - i)));
  const trendData = last7Days.map(date => {
    const count = verifiedData.filter((s: any) => isSameDay(new Date(s.reviewedAt), date)).length;
    return {
      date: format(date, 'MMM dd'),
      count: count
    };
  });

  // Process data for PieChart (Global Disease Distribution)
  const diseaseCounts: Record<string, number> = {};
  verifiedData.forEach((s: any) => {
    const name = s.actualDisease || "Other / No Finding";
    diseaseCounts[name] = (diseaseCounts[name] || 0) + 1;
  });

  const pieData = Object.entries(diseaseCounts).map(([name, value]) => ({ name, value }));
  const COLORS = ['#2a64ad', '#fb7185', '#10b981', '#f59e0b', '#8b5cf6'];

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const isConfirmed = window.confirm(`Are you sure you want to delete ${selectedIds.length} selected records? This data will be permanently removed.`);
    if (!isConfirmed) return;

    try {
      await adminService.bulkDeleteScans(selectedIds);
      toast.success("Success", `${selectedIds.length} records deleted successfully.`);
      clearSelection();
      refetch();
    } catch (err) {
      toast.error("Error", "Failed to delete selected records.");
    }
  };

  const handleExportCsv = async () => {
    try {
      const blob = await adminService.exportCsv();
      const url = window.URL.createObjectURL(blob);
      const link = document.body.appendChild(document.createElement('a'));
      
      link.href = url;
      link.download = `gelo_training_data_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      window.URL.revokeObjectURL(url);
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
            {isSomeSelected ? (
               <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                 <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all cursor-pointer shadow-sm"
                  >
                    <Trash2 size={14} /> Delete ({selectedIds.length})
                  </button>
               </div>
            ) : (
              <button
                onClick={handleExportCsv}
                disabled={isLoading || verifiedData.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#2a64ad] text-white rounded-xl text-xs font-bold hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
              >
                <Download size={14} /> Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Integrated Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-card rounded-[2rem] border border-border p-6 shadow-sm">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6">Recent Review Activity</h4>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2a64ad" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2a64ad" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}}
                    itemStyle={{fontSize: '11px', fontWeight: 800, color: '#2a64ad'}}
                  />
                  <Area type="monotone" dataKey="count" stroke="#2a64ad" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="lg:col-span-4 bg-card rounded-[2rem] border border-border p-6 shadow-sm">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6">Diagnosis Mix</h4>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <VerifiedDataTable 
          data={verifiedData}
          isLoading={isLoading}
          selectedIds={selectedIds}
          isSelectedAll={isSelectedAll}
          onToggleAll={toggleSelectAll}
          onToggleOne={toggleSelectOne}
          onDelete={() => {}} // Placeholder if needed
        />

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
