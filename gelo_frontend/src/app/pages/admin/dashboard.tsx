import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/admin-layout";
import { adminService } from "@/services/admin.service";
import { TrendingUp, Users, FileCheck, AlertCircle, Clock, Image as ImageIcon, CheckCircle2, LayoutDashboard, Settings } from "lucide-react";
import { AdminReviewModal } from "@/components/admin/admin-review-modal";
import { AdminSettings } from "@/components/admin/admin-settings";

export function AdminDashboard() {
  const [selectedScan, setSelectedScan] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "settings">("overview");

  const { data: pendingReviews = [], isLoading: loadingReviews, refetch: refetchReviews } = useQuery({
    queryKey: ["admin", "pendingReviews"],
    queryFn: () => adminService.getPendingReviews(),
  });

  const { data: dashboardStats, isLoading: loadingStats } = useQuery({
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

  const stats = [
    { label: "Total Diagnoses", value: dashboardStats.totalDiagnoses.toString(), change: "Tracking", trend: "up", icon: FileCheck },
    { label: "Total Patients", value: dashboardStats.totalPatients.toString(), change: "Tracking", trend: "up", icon: Users },
    { label: "Model Accuracy", value: `${dashboardStats.modelAccuracy.toFixed(1)}%`, change: "From feedback", trend: "up", icon: TrendingUp },
    { label: "Pending Reviews", value: pendingReviews.length.toString(), change: pendingReviews.length > 5 ? "+14%" : "-2.5%", trend: pendingReviews.length > 5 ? "up" : "down", icon: AlertCircle },
  ];

  return (
    <AdminLayout title="Admin Dashboard" subtitle="Monitor AI performance, manage patients, and review low-confidence diagnoses">
      <div className="flex items-center gap-2 mb-8 border-b border-border pb-px">
        <button onClick={() => setActiveTab("overview")} className={`cursor-pointer flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${activeTab === "overview" ? "border-[#2a64ad] text-[#2a64ad]" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          <LayoutDashboard size={16} /> Overview
        </button>
        <button onClick={() => setActiveTab("settings")} className={`cursor-pointer flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${activeTab === "settings" ? "border-[#2a64ad] text-[#2a64ad]" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          <Settings size={16} /> AI Engine Settings
        </button>
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

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-bold flex items-center gap-2"><Clock className="w-5 h-5 text-amber-500" /> Pending AI Reviews</h3>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">{pendingReviews.length} Cases Need Review</span>
              </div>
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Scan Info</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">AI Prediction</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground text-center">Reason</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {loadingReviews ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td className="px-6 py-4"><div className="h-10 bg-muted rounded w-32" /></td>
                            <td className="px-6 py-4"><div className="h-5 bg-muted rounded w-24" /></td>
                            <td className="px-6 py-4"><div className="h-2 bg-muted rounded-full w-20 mx-auto" /></td>
                            <td className="px-6 py-4"><div className="h-8 bg-muted rounded w-16 ml-auto" /></td>
                          </tr>
                        ))
                      ) : pendingReviews.length > 0 ? (
                        pendingReviews.map((scan: any) => (
                          <tr key={scan.scanId} className="group hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-border">
                                  {scan.imageUrl ? <img src={scan.imageUrl} alt="Thumbnail" className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-muted-foreground opacity-30" />}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-foreground">#{scan.scanId}</p>
                                  <p className="text-xs text-muted-foreground">{scan.patientName}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-[#2a64ad] bg-blue-50 w-fit px-2 py-0.5 rounded leading-4">{scan.predictedDisease}</span>
                                <span className="text-[10px] text-muted-foreground mt-1">Confidence: {scan.confidence.toFixed(0)}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex flex-col items-center gap-1.5">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scan.reason === "User Reported Error" ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-amber-50 text-amber-600 border border-amber-100"}`}>{scan.reason}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button onClick={() => openReview(scan)} className="cursor-pointer px-4 py-1.5 text-xs font-bold bg-[#2a64ad] text-white rounded-lg hover:bg-[#1e4e8c] transition-all active:scale-95">Review</button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-500 opacity-20" />
                            <p className="font-medium">All clear! No pending reviews.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold px-2">Diagnostic Performance</h3>
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
                {dashboardStats.diseaseStats.map((d: any) => (
                  <div key={d.diseaseId}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground font-bold underline underline-offset-4 decoration-[#2a64ad]/30">{d.name} Precision</span>
                      <span className="font-bold text-[#2a64ad]">{d.accuracy.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-[#2a64ad]" style={{ width: `${d.accuracy}%` }} /></div>
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
