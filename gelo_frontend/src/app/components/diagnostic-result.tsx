import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
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
  AlertCircle,
  Clock,
  ExternalLink
} from "lucide-react";
import api from "../lib/api";
import { Layout } from "./layout/Layout";
import { useToastContext } from "./ui/ToastContext";

export function DiagnosticResult() {
  const navigate = useNavigate();
  const toast = useToastContext();
  const [activeTab, setActiveTab] = useState<"care" | "lifestyle" | "prevention">("care");
  const [resultData, setResultData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const scanId = localStorage.getItem("currentScanId");
    if (!scanId) {
      toast.warning("No scan data found", "Please run a scan first before viewing results.");
      navigate("/dashboard");
      return;
    }

    api.get(`/results/${scanId}`)
      .then(res => {
        setResultData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load results", err);
        toast.error("Error", "Could not retrieve diagnostic results.");
        setLoading(false);
      });
  }, [navigate]);

  if (loading) {
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

  // Theme generation based on status & decision
  const getTheme = () => {
    // 1. Unknown / Inconclusive Case
    if (diagnosticStatus === 'UNKNOWN') return {
      color: "slate",
      bg: "bg-slate-50/50",
      border: "border-slate-100",
      text: "text-slate-600",
      fill: "bg-slate-400",
      pill: "bg-slate-100 text-slate-600",
      title: "Analysis Inconclusive",
      icon: ActivitySquare,
      status: "AI Engine - Unidentifiable"
    };

    // 2. Healthy / Clear Case
    if (diagnosticStatus === 'HEALTHY') return {
      color: "sky",
      bg: "bg-sky-50/50",
      border: "border-sky-100",
      text: "text-sky-700",
      fill: "bg-sky-500",
      pill: "bg-sky-100 text-sky-700",
      title: "Healthy Skin Detected",
      icon: Heart,
      status: "AI Engine - No Abnormalities"
    };

    // 3. High Confidence Disease
    if (decision === 'high_confidence') return {
      color: "emerald",
      bg: "bg-emerald-50/50",
      border: "border-emerald-100",
      text: "text-emerald-700",
      fill: "bg-emerald-500",
      pill: "bg-emerald-100 text-emerald-700",
      title: disease,
      icon: CheckCircle,
      status: "Confirmed with High Confidence"
    };

    // 4. Low Confidence Disease
    return {
      color: "amber",
      bg: "bg-amber-50/50",
      border: "border-amber-100",
      text: "text-amber-700",
      fill: "bg-amber-500",
      pill: "bg-amber-100 text-amber-700",
      title: `Potential ${disease}`,
      icon: AlertTriangle,
      status: "Low Confidence Flag"
    };
  };

  const theme = getTheme();
  const Icon = theme.icon;

  const displayDescription = () => {
    // 1. Handling Inconclusive (Unknown)
    if (diagnosticStatus === 'UNKNOWN') {
      return (
        <span>
          The AI model could not identify a specific condition with high certainty from the provided image (Model Confidence: <strong className="font-extrabold">{aiConfidence}%</strong>).
          This may be due to image quality or conditions outside our current dataset.
          <strong className="block mt-2 text-rose-600">Please consult a professional dermatologist for an accurate assessment.</strong>
        </span>
      );
    }

    // 2. Handling Healthy
    if (diagnosticStatus === 'HEALTHY') {
      return (
        <span>
          No significant skin abnormalities were detected in the analyzed area (Model Confidence: <strong className="font-extrabold">{aiConfidence}%</strong>).
          Maintain your skin health and continue with regular checkups.
        </span>
      );
    }

    // 3. Handling Detected Disease
    if (decision === 'high_confidence') {
      return (
        <span>
          Based on AI analysis, there is a <strong className="font-extrabold">{aiConfidence}%</strong> probability that this lesion matches <strong className="font-extrabold">{disease}</strong> characteristics.
          If you experience signs consistent with this condition, please seek medical attention promptly.
        </span>
      );
    }
    return (
      <span>
        Our model detected patterns that may match <strong className="font-extrabold">{disease}</strong>, but with low certainty (AI Confidence: <strong className="font-extrabold">{aiConfidence}%</strong>).
        Please rescan with a clearer image or consult a doctor for a definitive diagnosis.
      </span>
    );
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Section */}
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

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Model Version</p>
              <p className="text-sm font-bold text-slate-700">GELO-Vision V2.4</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Main Panel - 8 Columns */}
          <div className="lg:col-span-8 space-y-8">

            {/* Analysis Result Card */}
            <div className={`relative overflow-hidden rounded-[2.5rem] border-2 shadow-2xl shadow-slate-200/50 p-8 md:p-12 transition-all duration-500 ${theme.bg} ${theme.border}`}>
              <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12">
                <Icon className="w-64 h-64" />
              </div>

              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-4">
                  <span className={`px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm ${theme.pill}`}>
                    {theme.status}
                  </span>
                  {aiConfidence > 90 && (
                    <span className="flex items-center gap-1.5 px-5 py-2 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg">
                      <ActivitySquare className="w-3.5 h-3.5 text-emerald-400" />
                      Clinical Accuracy Flag
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none">
                    {theme.title}
                  </h2>
                  <p className="text-xl text-slate-600 leading-relaxed font-medium max-w-2xl">
                    {displayDescription()}
                  </p>
                  {description && (
                    <p className="text-sm text-slate-500 italic bg-white/40 p-4 rounded-2xl border border-white/50 backdrop-blur-sm max-w-2xl">
                      <BadgeInfo className="w-4 h-4 inline-block mr-2 -mt-0.5" />
                      {description}
                    </p>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-200/50">
                  <button
                    onClick={() => window.open("https://www.cancer.gov", "_blank")}
                    className="cursor-pointer group flex items-center gap-2 text-[#2a64ad] font-black uppercase tracking-widest text-xs hover:text-[#1e4e8c] transition-colors"
                  >
                    Detailed Medical Documentation
                    <ExternalLink className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>

            {/* Treatment & Advice Tabs */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden">
              <div className="flex bg-slate-50/50 p-2 gap-2">
                <button
                  onClick={() => setActiveTab("care")}
                  className={`cursor-pointer flex-1 py-4 px-6 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${activeTab === "care" ? "bg-white text-[#2a64ad] shadow-lg shadow-slate-200" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <Heart className="w-4 h-4" />
                  Medical Care
                </button>
                <button
                  onClick={() => setActiveTab("lifestyle")}
                  className={`cursor-pointer flex-1 py-4 px-6 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${activeTab === "lifestyle" ? "bg-white text-emerald-600 shadow-lg shadow-slate-200" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <ActivitySquare className="w-4 h-4" />
                  Lifestyle & Routine
                </button>
                <button
                  onClick={() => setActiveTab("prevention")}
                  className={`cursor-pointer flex-1 py-4 px-6 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${activeTab === "prevention" ? "bg-white text-rose-600 shadow-lg shadow-slate-200" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  Prevention
                </button>
              </div>

              <div className="p-8 md:p-12">
                {activeTab === "care" && (
                  <div className="space-y-8">
                    <div className="grid gap-6">
                      {advices.filter((a: any) => a.type === 'care').map((ad: any, i: number) => (
                        <div key={i} className="group p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-white transition-all shadow-sm hover:shadow-xl hover:shadow-blue-500/5">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-white shadow-md flex items-center justify-center font-black text-[#2a64ad] group-hover:bg-[#2a64ad] group-hover:text-white transition-all">
                              {i + 1}
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-black text-slate-800 uppercase tracking-widest text-[11px] opacity-50">{ad.title || "Recommendation"}</h4>
                              <p className="text-lg font-bold text-slate-700 leading-snug">{ad.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {advices.filter((a: any) => a.type === 'care').length === 0 && (
                        <p className="text-slate-400 italic font-medium">No specific medical care provided for this result.</p>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "lifestyle" && (
                  <div className="space-y-8">
                    <div className="grid gap-6">
                      {advices.filter((a: any) => a.type === 'lifestyle').map((ad: any, i: number) => (
                        <div key={i} className="group p-6 rounded-3xl bg-emerald-50/20 border border-emerald-100 hover:border-emerald-300 hover:bg-white transition-all shadow-sm">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-white shadow-md flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                              <CheckCircle className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-black text-emerald-800 uppercase tracking-widest text-[11px] opacity-50">{ad.title || "Self-Care Tip"}</h4>
                              <p className="text-lg font-bold text-slate-700 leading-snug">{ad.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "prevention" && (
                  <div className="space-y-8">
                    <div className="grid gap-6">
                      {advices.filter((a: any) => a.type === 'emergency' || a.type === 'prevention').map((ad: any, i: number) => (
                        <div key={i} className="p-6 rounded-3xl bg-rose-50/30 border border-rose-100 italic font-medium text-rose-900 leading-relaxed flex gap-4">
                          <AlertCircle className="w-6 h-6 shrink-0 text-rose-500" />
                          {ad.content}
                        </div>
                      ))}
                      {advices.filter((a: any) => a.type === 'emergency' || a.type === 'prevention').length === 0 && (
                        <p className="text-slate-400 italic">No specific emergency precautions for this level of detection.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - 4 Columns */}
          <div className="lg:col-span-4 space-y-8">

            {/* Visual Evidence Card */}
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 space-y-6">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Input Data
              </h3>
              <div className="aspect-square rounded-[2rem] overflow-hidden border-4 border-slate-50 shadow-2xl relative group">
                {uploadedImage ? (
                  <>
                    <img src={uploadedImage} alt="Analysis Source" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute inset-0 bg-blue-900/10 group-hover:bg-transparent transition-colors" />
                    <div className="absolute bottom-6 right-6 px-4 py-2 bg-white/90 backdrop-blur rounded-2xl text-[10px] font-black uppercase text-slate-800 shadow-xl border border-white">
                      Original Upload
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                    <BadgeInfo className="w-12 h-12 text-slate-200" />
                  </div>
                )}
              </div>
            </div>

            {/* AI Confidence Gauge */}
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-8 shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-1000" />

              <div className="space-y-2 relative z-10">
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">AI Reliability Gauge</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-black tracking-tighter">{aiConfidence}</span>
                  <span className="text-2xl font-black text-blue-400 tracking-tighter">%</span>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <div className="h-4 bg-white/10 rounded-full overflow-hidden p-1">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${aiConfidence > 70 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                    style={{ width: `${aiConfidence}%` }}
                  />
                </div>
                <p className="text-xs font-medium text-slate-400 leading-relaxed">
                  This score reflects the neural network's visual alignment with established clinical patterns of {disease}.
                </p>
              </div>

              <div className="pt-6 border-t border-white/10 relative z-10">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400">
                  <ActivitySquare className="w-3.5 h-3.5" />
                  In-House Validation: 98.2%
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={() => navigate(`/feedback?scanId=${localStorage.getItem("currentScanId")}`)}
                className="cursor-pointer w-full py-5 bg-white border-2 border-slate-900 text-slate-900 font-black rounded-[1.5rem] hover:bg-slate-900 hover:text-white transition-all group flex items-center justify-center gap-3"
              >
                <MessageSquareHeart className="w-5 h-5" />
                Correct AI Diagnosis
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}