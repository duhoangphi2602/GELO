import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Activity, CheckCircle, AlertTriangle, Heart, Stethoscope, ChevronRight, MessageSquareHeart } from "lucide-react";
import axios from "axios";
import { Layout } from "./layout/Layout";

export function DiagnosticResult() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"care" | "lifestyle" | "warning">("care");
  const [resultData, setResultData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const scanId = localStorage.getItem("currentScanId");
    if (!scanId) {
      alert("No assessment data found. Please run a scan first.");
      navigate("/dashboard");
      return;
    }

    axios.get(`http://localhost:3000/results/${scanId}`)
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
          <div className="w-16 h-16 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mb-6" />
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Analyzing Diagnostic Data...</h2>
          <p className="text-slate-500 mt-2 font-medium">Please wait while the AI generates your report.</p>
        </div>
      </Layout>
    );
  }

  const confidence = resultData?.confidence !== undefined ? resultData.confidence : 0;
  const diseaseName = resultData?.disease || "Unknown Condition";
  const diseaseDescription = resultData?.description || "Please consult a medical professional for an accurate diagnosis.";
  const uploadedImage = resultData?.images?.[0];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        
        <div className="flex flex-col mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center border border-emerald-200">
              <Stethoscope className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">AI Diagnostic Report</h2>
          </div>
          <p className="text-slate-500">
            Review your AI assessment results and recommended medical actions.
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
                  <p className="font-semibold text-slate-500">Skin Assessment Image</p>
                  <p className="text-xs font-medium mt-1 uppercase tracking-wider">Analysis complete</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Diagnosis & Confidence */}
          <div className="space-y-6">
            {/* Diagnosis */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-8 -mt-8" />
              <h3 className="mb-2 text-sm font-semibold text-slate-500 relative z-10">Preliminary Diagnosis</h3>
              <p className="text-3xl font-black text-slate-800 mb-3 tracking-tight relative z-10">{diseaseName}</p>
              <p className="text-slate-600 leading-relaxed font-medium text-sm relative z-10">
                {diseaseDescription}
              </p>
            </div>

            {/* Confidence Score */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700">Model Confidence Level</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-emerald-500 tracking-tight">{confidence}</span>
                  <span className="text-lg font-bold text-slate-400">%</span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner mb-4">
                <div
                  className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.max(0, confidence)}%` }}
                />
              </div>

              <p className="text-xs font-medium text-slate-500 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>
                  Our AI model analyzed your image with {confidence}% confidence.{' '}
                  {confidence === 0 ? "Default validation threshold." : "This indicates a highly reliable assessment."}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section - Tabs with Advice and Action Buttons */}
        <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
              {/* Tab Headers */}
              <div className="flex border-b border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => setActiveTab("care")}
                  className={`flex-1 py-4 px-6 flex items-center justify-center gap-2 text-sm font-bold transition-colors ${
                    activeTab === "care"
                      ? "bg-white text-emerald-600 border-t-2 border-t-emerald-500 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 hover:bg-white/50 border-t-2 border-t-transparent"
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  <span>Medical Care</span>
                </button>
                <button
                  onClick={() => setActiveTab("lifestyle")}
                  className={`flex-1 py-4 px-6 flex items-center justify-center gap-2 text-sm font-bold transition-colors ${
                    activeTab === "lifestyle"
                      ? "bg-white text-emerald-600 border-t-2 border-t-emerald-500 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 hover:bg-white/50 border-t-2 border-t-transparent"
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Lifestyle Tips</span>
                </button>
                <button
                  onClick={() => setActiveTab("warning")}
                  className={`flex-1 py-4 px-6 flex items-center justify-center gap-2 text-sm font-bold transition-colors ${
                    activeTab === "warning"
                      ? "bg-white text-red-600 border-t-2 border-t-red-500 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 hover:bg-white/50 border-t-2 border-t-transparent"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Warning Signs</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-8">
                {activeTab === "care" && (
                  <div className="animate-in slide-in-from-bottom-2 duration-300">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Recommended Treatment & Care</h3>
                    <div className="grid gap-4">
                      {[
                        "Apply a gentle, fragrance-free moisturizer twice daily to affected areas",
                        "Use mild, hypoallergenic soaps and avoid harsh chemicals",
                        "Consider over-the-counter hydrocortisone cream for inflammation",
                        "Keep the affected area clean and dry at all times",
                        "Avoid scratching the area to prevent secondary bacterial infection"
                      ].map((text, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-emerald-200 transition-colors">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-emerald-700">{i + 1}</span>
                          </div>
                          <p className="text-slate-700 font-medium text-sm leading-relaxed">{text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "lifestyle" && (
                  <div className="animate-in slide-in-from-bottom-2 duration-300">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Lifestyle Changes & Recommendations</h3>
                    <div className="grid gap-4">
                      {[
                        "Identify and avoid triggers such as certain fabrics, detergents, or plants",
                        "Wear breathable, loose-fitting cotton clothing to reduce friction",
                        "Maintain a healthy diet rich in anti-inflammatory foods",
                        "Stay completely hydrated by drinking plenty of water throughout the day",
                        "Manage daily stress through relaxation techniques or gentle exercise"
                      ].map((text, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-emerald-200 transition-colors">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                          </div>
                          <p className="text-slate-700 font-medium text-sm leading-relaxed">{text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "warning" && (
                  <div className="animate-in slide-in-from-bottom-2 duration-300">
                    <h3 className="text-lg font-bold text-red-700 mb-6 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" /> Urgent Warning Signs
                    </h3>
                    <div className="bg-red-50 border border-red-200/60 rounded-xl p-5 mb-6">
                      <p className="text-red-800 font-bold text-sm">
                        Seek immediate emergency medical attention if you experience any of the following:
                      </p>
                    </div>
                    <div className="grid gap-4">
                      {[
                        "Severe swelling, blistering, or a rapidly spreading rash",
                        "Signs of severe infection (high fever, yellow pus, intensely hot to touch)",
                        "Difficulty breathing, swallowing, or sudden facial swelling",
                        "No improvement after 2 full weeks of standard home treatment",
                        "Symptoms rapidly expanding to affect large areas of your body"
                      ].map((text, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-red-50/30 border border-red-100 hover:border-red-200 transition-colors">
                          <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                          <p className="text-red-900 font-medium text-sm leading-relaxed">{text}</p>
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
                className="flex-1 bg-emerald-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-emerald-700 transition-all shadow-sm hover:shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <span>Start Recovery Diary</span>
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate("/feedback")}
                className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-4 px-6 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 shadow-sm"
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
