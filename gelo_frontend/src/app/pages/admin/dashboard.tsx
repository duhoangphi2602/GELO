import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/admin-layout";
import { adminService } from "@/services/admin.service";
import { TrendingUp, Users, FileCheck, AlertCircle, LayoutDashboard, Settings } from "lucide-react";
import { AdminReviewModal } from "@/components/admin/admin-review-modal";
import { AdminSettings } from "@/components/admin/admin-settings";
import { useToastContext } from "@/components/shared/ui/ToastContext";
import { useSelection } from "@/hooks/useSelection";
import { PendingReviewsTable } from "@/components/admin/pending-reviews-table";

export function AdminDashboard() {
  const toast = useToastContext();
  const [selectedScan, setSelectedScan] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "settings">("overview");

  const { data: pendingReviews = [], isLoading: loadingReviews, refetch: refetchReviews } = useQuery({
    queryKey: ["admin", "pendingReviews"],
    queryFn: () => adminService.getPendingReviews(),
  });

  const { 
    selectedIds, 
    toggleSelectAll, 
    toggleSelectOne, 
    clearSelection, 
    isSelectedAll, 
    isSomeSelected 
  } = useSelection(pendingReviews, "scanId");

  const { data: dashboardStats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminService.getDashboardStats(),
    initialData: { totalDiagnoses: 0, totalPatients: 0, modelAccuracy: 100, diseaseStats: [] },
  });

  const openReview = (scan: any) => {
    setSelectedScan(scan);
    setIsModalOpen(true);
  };

  const handleReviewSuccess = () => {
    refetchReviews();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected scans?`)) return;
    try {
      await adminService.bulkDeleteScans(selectedIds);
      toast.success("Batch Action", `${selectedIds.length} scans deleted successfully`);
      clearSelection();
      refetchReviews();
    } catch (error) {
      toast.error("Error", "Failed to delete selected scans");
    }
  };

  const stats = [
    { label: "Total Diagnoses", value: dashboardStats.totalDiagnoses.toString(), change: "Tracking", trend: "up", icon: FileCheck },
    { label: "Total Patients", value: dashboardStats.totalPatients.toString(), change: "Tracking", trend: "up", icon: Users },
    { label: "Model Accuracy", value: `${dashboardStats.modelAccuracy.toFixed(1)}%`, change: "From feedback", trend: "up", icon: TrendingUp },
    { label: "Pending Reviews", value: pendingReviews.length.toString(), change: pendingReviews.length > 5 ? "+14%" : "-2.5%", trend: pendingReviews.length > 5 ? "up" : "down", icon: AlertCircle },
  ];

  return (
    <AdminLayout title="Admin Dashboard" subtitle="Monitor AI performance, manage patients, and review low-confidence diagnoses">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveTab("overview")} className={`cursor-pointer flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${activeTab === "overview" ? "border-[#2a64ad] text-[#2a64ad]" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <LayoutDashboard size={16} /> Overview
          </button>
          <button onClick={() => setActiveTab("settings")} className={`cursor-pointer flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${activeTab === "settings" ? "border-[#2a64ad] text-[#2a64ad]" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <Settings size={16} /> AI Engine Settings
          </button>
        </div>
      </div>

      {activeTab === "settings" ? (
        <AdminSettings />
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#2a64ad]/10 flex items-center justify-center text-[#2a64ad] group-hover:bg-[#2a64ad] group-hover:text-white transition-colors">
                      <Icon size={24} />
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.trend === "up" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>{stat.change}</span>
                  </div>
                  <p className="text-3xl font-black text-foreground mb-1 tracking-tight">{stat.value}</p>
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider text-[10px]">{stat.label}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            <div className="xl:col-span-3 space-y-6">
              <PendingReviewsTable 
                scans={pendingReviews}
                isLoading={loadingReviews}
                selectedIds={selectedIds}
                isSelectedAll={isSelectedAll}
                isSomeSelected={isSomeSelected}
                onToggleAll={toggleSelectAll}
                onToggleOne={toggleSelectOne}
                onBulkDelete={handleBulkDelete}
                onOpenReview={openReview}
              />
            </div>

            <div className="space-y-6 xl:col-span-1">
              <h3 className="text-sm font-black px-2 text-slate-800 uppercase tracking-widest">AI Performance</h3>
              <div className="bg-white rounded-[1.5rem] border border-slate-100 p-4 shadow-xl shadow-slate-200/40 space-y-4">
                {dashboardStats.diseaseStats.map((d: any) => (
                  <div key={d.diseaseId}>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-slate-500 font-bold">{d.name}</span>
                      <span className="font-black text-[#2a64ad]">{d.accuracy.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-0.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#2a64ad] rounded-full" style={{ width: `${d.accuracy}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <AdminReviewModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} scan={selectedScan} onReviewSuccess={handleReviewSuccess} />
    </AdminLayout>
  );
}

export default AdminDashboard;
