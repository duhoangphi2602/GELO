import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  Heart,
  ChevronRight,
  MessageSquareHeart,
  ShieldAlert,
  BadgeInfo,
  ActivitySquare,
  Clock,
  ExternalLink,
  AlertCircle,
  BookOpen
} from "lucide-react";
import { scanService } from "@/services/scan.service";
import { Layout } from "@/components/shared/layout/Layout";
import { useToastContext } from "@/components/shared/ui/ToastContext";

export function DiagnosticResult() {
  const navigate = useNavigate();
  const toast = useToastContext();
  const [activeTab, setActiveTab] = useState<"care" | "lifestyle" | "prevention">("care");

  const scanId = Number(localStorage.getItem("currentScanId"));

  const { data: resultData, isLoading } = useQuery({
    queryKey: ["scanResults", scanId],
    queryFn: () => scanService.getResults(scanId),
    enabled: !!scanId,
    retry: 2,
  });

  if (!scanId) {
    toast.warning("No scan data found", "Please run a scan first before viewing results.");
    navigate("/patient/dashboard");
    return null;
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="h-[80vh] flex flex-col items-center justify-center space-y-8">
          <div className="relative">
            <div className="w-24 h-24 border-8 border-slate-100 border-t-[#2a64ad] rounded-full animate-spin" />
            <Activity className="absolute inset-0 m-auto w-8 h-8 text-[#2a64ad] animate-pulse" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Processing AI Vision...</h2>
            <p className="text-slate-500 font-medium">Analyzing morphological features using EfficientNet-V2-S</p>
          </div>
        </div>
      </Layout>
    );
  }

  const {
    diagnosticStatus = "UNKNOWN",
    decision = "low_confidence",
    aiConfidence = 0,
    disease = "Condition Detected",
    description = "Please consult a medical professional for a verified diagnosis.",
    images = [],
    advices = [],
    scannedAt
  } = resultData || {};

  const uploadedImage = images[0];

  const getTheme = () => {
    if (diagnosticStatus === 'UNKNOWN') return {
      color: "slate", bg: "bg-slate-50/50", border: "border-slate-100", text: "text-slate-600",
      fill: "bg-slate-400", pill: "bg-slate-100 text-slate-600", title: "Analysis Inconclusive",
      icon: ActivitySquare, status: "AI Engine - Unidentifiable"
    };
    if (decision === 'high_confidence') return {
      color: "emerald", bg: "bg-emerald-50/50", border: "border-emerald-100", text: "text-emerald-700",
      fill: "bg-emerald-500", pill: "bg-emerald-100 text-emerald-700", title: disease,
      icon: CheckCircle, status: "Confirmed with High Confidence"
    };
    return {
      color: "amber", bg: "bg-amber-50/50", border: "border-amber-100", text: "text-amber-700",
      fill: "bg-amber-500", pill: "bg-amber-100 text-amber-700", title: `Potential ${disease}`,
      icon: AlertTriangle, status: "Low Confidence Flag"
    };
  };

  const theme = getTheme();
  const Icon = theme.icon;

  const displayDescription = () => {
    if (diagnosticStatus === 'UNKNOWN') {
      return (
        <span>
          The AI model could not identify a specific condition with high certainty (Model Confidence: <strong className="font-extrabold">{aiConfidence}%</strong>).
          <strong className="block mt-2 text-rose-600">Please consult a professional dermatologist for an accurate assessment.</strong>
        </span>
      );
    }
    if (decision === 'high_confidence') {
      return (
        <span>
          Based on AI analysis, there is a <strong className="font-extrabold">{aiConfidence}%</strong> probability that this lesion matches <strong className="font-extrabold">{disease}</strong> characteristics.
        </span>
      );
    }
    return (
      <span>
        Our model detected patterns that may match <strong className="font-extrabold">{disease}</strong>, but with low certainty (AI Confidence: <strong className="font-extrabold">{aiConfidence}%</strong>).
      </span>
    );
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-slate-200">
                AI Diagnostic Report
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                <Clock className="w-3.5 h-3.5" />
                {scannedAt ? new Date(scannedAt).toLocaleString() : "Recently Analyzed"}
              </div>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Diagnostic Conclusion</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <div className={`relative overflow-hidden rounded-[2.5rem] border-2 shadow-2xl shadow-slate-200/50 p-8 md:p-12 ${theme.bg} ${theme.border}`}>
              <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12"><Icon className="w-64 h-64" /></div>
              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-4">
                  <span className={`px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm ${theme.pill}`}>{theme.status}</span>
                  {aiConfidence > 90 && (
                    <span className="flex items-center gap-1.5 px-5 py-2 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg">
                      <ActivitySquare className="w-3.5 h-3.5 text-emerald-400" /> Clinical Accuracy Flag
                    </span>
                  )}
                </div>
                <div className="space-y-4">
                  <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none">{theme.title}</h2>
                  <p className="text-xl text-slate-600 leading-relaxed font-medium max-w-2xl">{displayDescription()}</p>
                  {description && (
                    <p className="text-sm text-slate-500 italic bg-white/40 p-4 rounded-2xl border border-white/50 backdrop-blur-sm max-w-2xl">
                      <BadgeInfo className="w-4 h-4 inline-block mr-2 -mt-0.5" /> {description}
                    </p>
                  )}
                </div>
                <div className="pt-6 border-t border-slate-200/50">
                  <button onClick={() => window.open("https://www.cancer.gov", "_blank")} className="cursor-pointer flex items-center gap-2 text-[#2a64ad] font-black uppercase tracking-widest text-xs">
                    Detailed Medical Documentation <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
              <div className="flex bg-slate-50/50 p-2 gap-2">
                <button onClick={() => setActiveTab("care")} className={`cursor-pointer flex-1 py-4 rounded-2xl font-black text-sm ${activeTab === "care" ? "bg-white text-[#2a64ad] shadow-lg" : "text-slate-400"}`}><Heart size={16} className="inline mr-2" /> Medical Care</button>
                <button onClick={() => setActiveTab("lifestyle")} className={`cursor-pointer flex-1 py-4 rounded-2xl font-black text-sm ${activeTab === "lifestyle" ? "bg-white text-emerald-600 shadow-lg" : "text-slate-400"}`}><ActivitySquare size={16} className="inline mr-2" /> Lifestyle</button>
                <button onClick={() => setActiveTab("prevention")} className={`cursor-pointer flex-1 py-4 rounded-2xl font-black text-sm ${activeTab === "prevention" ? "bg-white text-rose-600 shadow-lg" : "text-slate-400"}`}><ShieldAlert size={16} className="inline mr-2" /> Prevention</button>
              </div>
              <div className="p-8 md:p-12">
                {activeTab === "care" && (
                  <div className="grid gap-6">
                    {advices.filter((a: any) => a.type === 'care').map((ad: any, i: number) => (
                      <div key={i} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-white shadow-md flex items-center justify-center font-black text-[#2a64ad]">{i + 1}</div>
                        <div className="space-y-1"><h4 className="font-black text-slate-800 uppercase text-[11px] opacity-50">{ad.title}</h4><p className="text-lg font-bold text-slate-700">{ad.content}</p></div>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === "lifestyle" && (
                  <div className="grid gap-6">
                    {advices.filter((a: any) => a.type === 'lifestyle').map((ad: any, i: number) => (
                      <div key={i} className="p-6 rounded-3xl bg-emerald-50/20 border border-emerald-100 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-white shadow-md flex items-center justify-center text-emerald-600"><CheckCircle size={20} /></div>
                        <div className="space-y-1"><h4 className="font-black text-emerald-800 uppercase text-[11px] opacity-50">{ad.title}</h4><p className="text-lg font-bold text-slate-700">{ad.content}</p></div>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === "prevention" && (
                  <div className="grid gap-6">
                    {advices.filter((a: any) => a.type === 'emergency' || a.type === 'prevention').map((ad: any, i: number) => (
                      <div key={i} className="p-6 rounded-3xl bg-rose-50/30 border border-rose-100 flex gap-4 text-rose-900 font-medium">
                        <AlertCircle size={24} className="shrink-0 text-rose-500" /> {ad.content}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 space-y-6">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Activity size={16} /> Input Data</h3>
              <div className="aspect-square rounded-[2rem] overflow-hidden border-4 border-slate-50 shadow-2xl relative group">
                {uploadedImage ? <img src={uploadedImage} alt="Analysis Source" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" /> : <div className="w-full h-full bg-slate-50 flex items-center justify-center"><BadgeInfo size={48} className="text-slate-200" /></div>}
              </div>
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-8 shadow-2xl shadow-blue-900/20">
              <div className="space-y-2">
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">AI Reliability Gauge</h3>
                <div className="flex items-baseline gap-2"><span className="text-6xl font-black">{aiConfidence}</span><span className="text-2xl font-black text-blue-400">%</span></div>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-white/10 rounded-full overflow-hidden p-1"><div className={`h-full rounded-full transition-all duration-1000 ${aiConfidence > 70 ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{ width: `${aiConfidence}%` }} /></div>
                <p className="text-xs font-medium text-slate-400 opacity-80 leading-relaxed">Neural network's visual alignment with established clinical patterns of {disease}.</p>
              </div>
            </div>

            {resultData?.hasFeedback ? (
              <button
                onClick={() => {
                   localStorage.setItem("currentScanId", scanId.toString());
                   navigate("/patient/diary");
                }}
                className="cursor-pointer w-full py-5 bg-emerald-600 text-white font-black rounded-[1.5rem] hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-200"
              >
                <BookOpen size={20} /> Track Progress in Diary <ChevronRight size={20} />
              </button>
            ) : (
              <button
                onClick={() => navigate(`/patient/feedback?scanId=${scanId}`)}
                className="cursor-pointer w-full py-5 bg-white border-2 border-slate-900 text-slate-900 font-black rounded-[1.5rem] hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-3"
              >
                <MessageSquareHeart size={20} /> Correct AI Diagnosis <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default DiagnosticResult;
