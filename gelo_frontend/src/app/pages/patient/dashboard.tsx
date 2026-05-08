import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { scanService } from "@/services/scan.service";
import { diseaseService } from "@/services/disease.service";
import { diaryService } from "@/services/diary.service";
import { Layout } from "@/components/shared/layout/Layout";
import { StatsCards } from "@/components/patient/dashboard/StatsCards";
import { RecentScans } from "@/components/patient/dashboard/RecentScans";
import { SupportedDiseases } from "@/components/patient/dashboard/SupportedDiseases";
import { ActivitySquare, ChevronRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router";


export function Dashboard() {
  const navigate = useNavigate();
  const { fullName, patientId } = useAuth();

  const { data: scanHistory = [], isLoading: loadingScans } = useQuery({
    queryKey: ["scans", patientId],
    queryFn: () => scanService.getPatientScans(patientId || 1),
    enabled: !!patientId || true,
  });

  const { data: supportedDiseases = [], isLoading: loadingDiseases } = useQuery({
    queryKey: ["diseases"],
    queryFn: () => diseaseService.getSupportedDiseases(),
  });

  const { data: diaries = [] } = useQuery({
    queryKey: ["diaries", patientId],
    queryFn: () => diaryService.getPatientDiaries(patientId || 1),
    enabled: !!patientId,
  });

  // Calculate Health Score
  const diseaseFoundCount = scanHistory.filter(s => s.diagnosis?.diagnosticStatus === 'DISEASE').length;
  let healthRate = 100;
  let healthLabel = "Excellent";

  if (diaries.length > 0) {
    const totalScore = diaries.reduce((acc: number, curr: any) => acc + curr.conditionScore, 0);
    healthRate = Math.round((totalScore / diaries.length) * 10);
    if (healthRate < 50) healthLabel = "Needs Care";
    else if (healthRate < 80) healthLabel = "Improving";
    else healthLabel = "Healthy";
  } else if (diseaseFoundCount > 0) {
    healthRate = 0;
    healthLabel = "Action Required";
  }


  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Welcome Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">Live Engine</span>
              <span className="text-slate-400 font-bold text-[10px] uppercase">GELO v1.0 Active</span>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              Welcome back, <span className="text-[#2a64ad]">{fullName}</span>
            </h1>
            <p className="text-slate-500 font-medium text-sm">Monitoring your dermatological health with AI precision.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/patient/reports")}
              className="hidden sm:flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 pr-4 hover:bg-slate-100 transition-colors cursor-pointer group"
            >
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-[#2a64ad] group-hover:bg-[#2a64ad] group-hover:text-white transition-all">
                <ActivitySquare className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Health Status</span>
                <span className="text-sm font-black text-slate-800">{healthRate}% {healthLabel}</span>
              </div>
            </button>

            <button
              onClick={() => navigate("/patient/scan")}
              className="flex items-center gap-2 px-6 py-3 bg-[#2a64ad] text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:bg-[#1e4e8c] hover:shadow-xl transition-all cursor-pointer group"
            >
              <Sparkles className="w-4 h-4" />
              Start New AI Scan
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>


        {/* Stats Grid */}
        <StatsCards scans={scanHistory} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            <RecentScans scans={scanHistory} loading={loadingScans} />
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            <SupportedDiseases diseases={supportedDiseases} loading={loadingDiseases} />
          </div>
        </div>

      </div>
    </Layout>
  );
}

export default Dashboard;
