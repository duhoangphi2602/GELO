import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Activity, CheckCircle, AlertTriangle, Heart, Stethoscope, ChevronRight, MessageSquareHeart, ShieldAlert, BadgeInfo, ActivitySquare, AlertCircle } from "lucide-react";
import api from "../lib/api";
import { Layout } from "./layout/Layout";
import { useToastContext } from "./ui/ToastContext";

export function DiagnosticResult() {
  const navigate = useNavigate();
  const toast = useToastContext();
  const [activeTab, setActiveTab] = useState<"care" | "lifestyle" | "logs">("care");
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
        setLoading(false);
      });
  }, [navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="h-[80vh] flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-[#2a64ad] rounded-full animate-spin mb-6" />
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Compiling Hybrid Analysis...</h2>
          <p className="text-slate-500 mt-2 font-medium">Fusing AI imaging with your clinical symptoms.</p>
        </div>
      </Layout>
    );
  }

  const {
    decision = "unknown",
    normalizedScore = 0,
    disease = "Unknown Condition",
    description = "Please consult a medical professional.",
    images = [],
    advices = [],
    logs = [],
    isEmergency = false
  } = resultData || {};

  const uploadedImage = images[0];

  // Theme generation based on decision
  const getTheme = () => {
    if (decision === 'emergency' || isEmergency) return {
      color: "red", bg: "bg-red-50", border: "border-red-200", text: "text-red-700", fill: "bg-red-600",
      title: "Urgent Medical Attention Required", icon: ShieldAlert
    };
    if (decision === 'positive') return {
      color: "emerald", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", fill: "bg-emerald-600",
      title: disease, icon: CheckCircle
    };
    if (decision === 'uncertain') return {
      color: "amber", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", fill: "bg-amber-500",
      title: "Uncertain Diagnosis", icon: AlertTriangle
    };
    return {
      color: "slate", bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", fill: "bg-slate-500",
      title: "No Matching Condition", icon: BadgeInfo
    };
  };

  const theme = getTheme();
  const Icon = theme.icon;

  const displayDescription = () => {
    if (decision === 'emergency') return "A critical symptom was flagged during your assessment. Please seek immediate professional medical attention.";
    if (decision === 'positive') return description;
    if (decision === 'uncertain') return "Our AI and your reported symptoms show mixed signals. We highly recommend consulting a dermatologist for an accurate physical assessment.";
    return "Your symptoms and image do not strongly map to our supported conditions (Atopic Dermatitis). Please consult a medical professional.";
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">

        <div className="flex flex-col mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-xl ${theme.bg} flex items-center justify-center border ${theme.border}`}>
              <Stethoscope className={`w-5 h-5 ${theme.text}`} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Hybrid Diagnostic Report</h2>
          </div>
          <p className="text-slate-500">
            Powered by Computer Vision and Rule-based Clinical Pathways.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column - Image */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 h-fit">
            <h3 className="mb-4 text-sm font-semibold text-slate-700">Analyzed Image</h3>
            <div className="aspect-square bg-slate-50/50 rounded-xl flex items-center justify-center border border-slate-200 overflow-hidden group relative">
              {uploadedImage ? (
                <img src={uploadedImage} alt="Assessment" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="text-center text-slate-400">
                  <Activity className="w-16 h-16 mx-auto mb-4 text-slate-300 opacity-50" />
                  <p className="font-semibold text-slate-500">No Image Uploaded</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Diagnosis & Score */}
          <div className="space-y-6">
            {/* Diagnosis Panel */}
            <div className={`rounded-2xl shadow-sm border p-6 relative overflow-hidden ${theme.bg} ${theme.border}`}>
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Icon className="w-32 h-32" />
              </div>
              <h3 className={`mb-2 text-sm font-bold uppercase tracking-wider ${theme.text}`}>Final Conclusion</h3>
              <p className="text-3xl font-black text-slate-900 mb-3 tracking-tight relative z-10">{theme.title}</p>
              <p className="text-slate-700 leading-relaxed font-medium text-sm relative z-10">
                {displayDescription()}
              </p>
            </div>

            {/* Hybrid Match Score */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700">Overall Match Score</h3>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-black tracking-tight ${theme.text}`}>{normalizedScore}</span>
                  <span className="text-lg font-bold text-slate-400">%</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner mb-4">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out ${theme.fill}`}
                  style={{ width: `${Math.max(0, normalizedScore)}%` }}
                />
              </div>

              <p className="text-xs font-medium text-slate-500 flex items-center gap-2">
                <ActivitySquare className={`w-4 h-4 ${theme.text}`} />
                <span>
                  This score is a weighted fusion of AI visual analysis and your clinical symptom responses.
                </span>
              </p>
            </div>

            {/* Emergency Warnings Banner - NEW */}
            {advices.some((a: any) => a.type === 'emergency') && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 animate-pulse shadow-md">
                <div className="flex items-center gap-3 mb-3 text-red-700">
                  <AlertCircle className="w-6 h-6" />
                  <h4 className="font-black text-lg uppercase tracking-tight">Emergency Warnings</h4>
                </div>
                <div className="space-y-2">
                  {advices.filter((a: any) => a.type === 'emergency').map((ad: any, i: number) => (
                    <div key={i} className="flex gap-2 text-red-800 text-sm font-bold bg-white/50 p-3 rounded-lg border border-red-100">
                      <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        {ad.title && <p className="mb-0.5 uppercase text-[10px] opacity-70">{ad.title}</p>}
                        {ad.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section - dynamic Tabs */}
        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="flex border-b border-slate-100 bg-slate-50/50">
              {decision === 'positive' && (
                <>
                  <button
                    onClick={() => setActiveTab("care")}
                    className={`cursor-pointer flex-1 py-4 px-6 flex items-center justify-center gap-2 text-sm font-bold transition-colors ${activeTab === "care" ? "bg-white text-[#2a64ad] border-t-2 border-t-[#2a64ad] shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-white/50 border-t-2 border-t-transparent"}`}
                  >
                    <Heart className="w-4 h-4" />
                    <span>Medical Care</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("lifestyle")}
                    className={`cursor-pointer flex-1 py-4 px-6 flex items-center justify-center gap-2 text-sm font-bold transition-colors ${activeTab === "lifestyle" ? "bg-white text-[#2a64ad] border-t-2 border-t-[#2a64ad] shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-white/50 border-t-2 border-t-transparent"}`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Lifestyle Tips</span>
                  </button>
                </>
              )}
              
              <button
                onClick={() => setActiveTab("logs")}
                className={`cursor-pointer flex-1 py-4 px-6 flex items-center justify-center gap-2 text-sm font-bold transition-colors ${activeTab === "logs" ? "bg-white text-slate-800 border-t-2 border-t-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-white/50 border-t-2 border-t-transparent"}`}
              >
                <Stethoscope className="w-4 h-4" />
                <span>Clinical Logic (Explainability)</span>
              </button>
            </div>

            <div className="p-8">
              {(activeTab === "care" && decision === 'positive') && (
                <div className="animate-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-lg font-bold text-slate-800 mb-6">Recommended Treatment & Care</h3>
                  <div className="grid gap-4">
                    {advices.filter((a: any) => a.type === 'care').map((ad: any, i: number) => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-[#2a64ad]">{i + 1}</span>
                        </div>
                        <div>
                          <p className="text-slate-800 font-bold text-sm mb-1">{ad.title}</p>
                          <p className="text-slate-600 font-medium text-sm leading-relaxed">{ad.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(activeTab === "lifestyle" && decision === 'positive') && (
                <div className="animate-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-lg font-bold text-slate-800 mb-6">Lifestyle Changes</h3>
                  <div className="grid gap-4">
                    {advices.filter((a: any) => a.type === 'lifestyle').map((ad: any, i: number) => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-emerald-50/30 border border-emerald-100">
                         <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                           <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                         </div>
                        <div>
                          <p className="text-emerald-900 font-bold text-sm mb-1">{ad.title}</p>
                          <p className="text-slate-700 font-medium text-sm leading-relaxed">{ad.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "logs" && (
                <div className="animate-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">How we reached this conclusion</h3>
                  <p className="text-slate-500 text-sm mb-6 font-medium">The system cross-referenced your answers with medical guidelines for Atopic Dermatitis.</p>
                  
                  <div className="grid gap-3">
                    {logs.map((log: any, i: number) => (
                      <div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${log.isMatch ? 'bg-emerald-50/30 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center gap-3">
                          {log.isMatch ? (
                            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-slate-400 flex-shrink-0" />
                          )}
                          <p className={`text-sm font-semibold ${log.isMatch ? 'text-emerald-900' : 'text-slate-600'}`}>{log.questionText}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Your Answer</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${log.isMatch ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                            {log.patientAnswer}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 pb-8">
            <button
              onClick={() => navigate("/diary")}
              className="cursor-pointer flex-1 bg-[#2a64ad] text-white font-bold py-4 px-6 rounded-xl hover:bg-[#1e4e8c] transition-all shadow-sm hover:shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              <span>Track in Diary</span>
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                const scanId = localStorage.getItem("currentScanId");
                navigate(`/feedback?scanId=${scanId}`);
              }}
              className="cursor-pointer flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-4 px-6 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <MessageSquareHeart className="w-5 h-5 text-slate-400" />
              <span>Provide Feedback</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}