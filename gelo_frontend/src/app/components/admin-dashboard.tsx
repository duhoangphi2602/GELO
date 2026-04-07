import { useState, useEffect } from "react";
import { AdminLayout } from "./admin-layout";
import { TrendingUp, Users, FileCheck, AlertCircle, Clock, ChevronRight, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { AdminReviewModal } from "./admin-review-modal";

export function AdminDashboard() {
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patientCount, setPatientCount] = useState(0);
  const [selectedDisease, setSelectedDisease] = useState("Atopic Dermatitis");
  const [careAdvice, setCareAdvice] = useState("");
  const [lifestyleAdvice, setLifestyleAdvice] = useState("");
  const [emergencyWarnings, setEmergencyWarnings] = useState("");

  const loadExistingAdvice = () => {
    if (selectedDisease === "Atopic Dermatitis") {
      setCareAdvice("• Apply a gentle, fragrance-free moisturizer twice daily to affected areas\n• Use mild, hypoallergenic soaps and avoid harsh chemicals\n• Use lukewarm water for bathing, not hot water\n• Avoid scratching the skin to prevent secondary infection\n• Wear soft, breathable cotton clothing");
      setLifestyleAdvice("• Identify and avoid triggers (specific detergents, dust, or pets)\n• Keep indoor environment cool and at a stable humidity\n• Manage stress through relaxation techniques\n• Stay hydrated by drinking plenty of water\n• Avoid food allergens that may cause flare-ups");
      setEmergencyWarnings("• Signs of skin infection (yellow crusts, pus, or extreme warmth)\n• Severe swelling or rapidly spreading rash\n• High fever accompanied by skin flare-ups\n• Difficulty sleeping due to intense itching\n• No improvement after 2 weeks of compliant home care");
    }
  };

  const fetchDashboardData = () => {
    setLoading(true);
    
    // Fetch Pending Reviews
    fetch("http://localhost:3000/scans/admin/pending-reviews")
      .then(res => res.json())
      .then(data => setPendingReviews(data))
      .catch(err => console.error("Error fetching reviews", err));

    // Fetch Patients for stats
    fetch("http://localhost:3000/scans/admin/patients")
      .then(res => res.json())
      .then(data => {
        setPatientCount(data.length);
      })
      .catch(err => console.error("Error fetching patients", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
    loadExistingAdvice();
  }, []);

  const openReview = (scan: any) => {
    setSelectedScan(scan);
    setIsModalOpen(true);
  };

  const handleReviewSuccess = () => {
    fetchDashboardData();
  };

  const diseases = [
    "Atopic Dermatitis",
  ];

  const stats = [
    {
      label: "Total Diagnoses",
      value: "1,280", // Could be dynamic if we add more endpoints
      change: "+4.5%",
      trend: "up",
      icon: FileCheck,
    },
    {
      label: "Total Patients",
      value: patientCount.toString(),
      change: "+12.3%",
      trend: "up",
      icon: Users,
    },
    {
      label: "Model Accuracy",
      value: "92.1%",
      change: "+1.2%",
      trend: "up",
      icon: TrendingUp,
    },
    {
      label: "Pending Reviews",
      value: pendingReviews.length.toString(),
      change: pendingReviews.length > 5 ? "+14%" : "-2.5%",
      trend: pendingReviews.length > 5 ? "up" : "down",
      icon: AlertCircle,
    },
  ];

  return (
    <AdminLayout
      title="Admin Dashboard"
      subtitle="Monitor AI performance, manage patients, and review low-confidence diagnoses"
    >
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#2a64ad]/10 flex items-center justify-center text-[#2a64ad] group-hover:bg-[#2a64ad] group-hover:text-white transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${stat.trend === "up" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      }`}
                  >
                    {stat.change}
                  </span>
                </div>
                <p className="text-3xl font-black text-foreground mb-1 tracking-tight">{stat.value}</p>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider text-[10px]">{stat.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Area: Pending Reviews */}
          <div className="xl:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Pending AI Reviews
              </h3>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                {pendingReviews.length} Cases Need Review
              </span>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Scan Info</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">AI Prediction</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Confidence</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                       Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="px-6 py-4"><div className="h-10 bg-muted rounded w-32"></div></td>
                          <td className="px-6 py-4"><div className="h-5 bg-muted rounded w-24"></div></td>
                          <td className="px-6 py-4"><div className="h-2 bg-muted rounded-full w-20 mx-auto"></div></td>
                          <td className="px-6 py-4"><div className="h-8 bg-muted rounded w-16 ml-auto"></div></td>
                        </tr>
                      ))
                    ) : pendingReviews.length > 0 ? (
                      pendingReviews.map((scan) => (
                        <tr key={scan.scanId} className="group hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-border">
                                {scan.imageUrl ? (
                                  <img src={scan.imageUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                                ) : (
                                  <ImageIcon className="w-5 h-5 text-muted-foreground opacity-30" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-foreground">#{scan.scanId}</p>
                                <p className="text-xs text-muted-foreground">{scan.patientName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-[#2a64ad] bg-blue-50 w-fit px-2 py-0.5 rounded leading-4">
                                {scan.predictedDisease}
                              </span>
                              <span className="text-[10px] text-muted-foreground mt-1">Ver: {scan.modelVersion}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              <span className={`text-xs font-bold ${scan.confidence < 0.6 ? 'text-rose-500' : 'text-amber-500'}`}>
                                {(scan.confidence * 100).toFixed(0)}%
                              </span>
                              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${scan.confidence < 0.6 ? 'bg-rose-500' : 'bg-amber-500'}`} 
                                  style={{ width: `${scan.confidence * 100}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => openReview(scan)}
                              className="px-4 py-1.5 text-xs font-bold bg-[#2a64ad] text-white rounded-lg hover:bg-[#1e4e8c] transition-all shadow-md shadow-blue-500/10 active:scale-95"
                            >
                              Review
                            </button>
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

          {/* Sidebar Area: System Status */}
          <div className="space-y-6">
             <h3 className="text-xl font-bold px-2">Diagnostic Performance</h3>
             <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
                <div>
                   <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground font-medium underline font-bold underline-offset-4 decoration-[#2a64ad]/30">Atopic Dermatitis Precision</span>
                      <span className="font-bold text-[#2a64ad]">94.2%</span>
                   </div>
                   <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="w-[94%] h-full bg-[#2a64ad]" />
                   </div>
                </div>

                <div>
                   <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground font-medium">Model Recall Rate</span>
                      <span className="font-bold text-emerald-500">88.5%</span>
                   </div>
                   <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="w-[88%] h-full bg-emerald-500" />
                   </div>
                </div>

                <div className="pt-4 border-t border-border">
                   <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-4">Focused Analysis</h4>
                   <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                      The core AI model is currently specialized for **Atopic Dermatitis** with a high sensitivity toward pediatric cases.
                   </p>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                         <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Weekly Scans</p>
                         <p className="text-xl font-black">426</p>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                         <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">New Positives</p>
                         <p className="text-xl font-black">12</p>
                      </div>
                   </div>
                </div>

                <button className="w-full py-3 bg-muted hover:bg-muted/80 text-foreground font-bold text-sm rounded-xl transition-all border border-border group flex items-center justify-center gap-2">
                    Advanced Analytics <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </button>
             </div>
          </div>
        </div>
      </div>

      <AdminReviewModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        scan={selectedScan}
        onReviewSuccess={handleReviewSuccess}
      />
    </AdminLayout>
  );
}