import { useState, useEffect } from "react";
import { X, CheckCircle2, AlertTriangle, Image as ImageIcon, Activity } from "lucide-react";
import { useToastContext } from "@/components/shared/ui/ToastContext";
import api from "@/api/axiosClient";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  scan: any;
  onReviewSuccess: () => void;
}

interface Disease {
  id: number;
  name: string;
}

export function AdminReviewModal({ isOpen, onClose, scan, onReviewSuccess }: ReviewModalProps) {
  const toast = useToastContext();
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [actualDiseaseId, setActualDiseaseId] = useState<string | number>("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.get("/admin/diseases")
        .then(res => setDiseases(Array.isArray(res.data) ? res.data : []))
        .catch(err => console.error("Failed to fetch diseases", err));

      // Reset form
      setIsCorrect(null);
      setActualDiseaseId("");
      setNote("");
    }
  }, [isOpen]);

  if (!isOpen || !scan) return null;

  const handleSubmit = async () => {
    if (isCorrect === null) {
      toast.warning("Please confirm if the AI prediction is correct or not.");
      return;
    }
    if (isCorrect === false && !actualDiseaseId) {
      toast.warning("Please select the correct disease.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/admin/review/${scan.scanId}`, {
        isCorrect,
        actualDiseaseId: (isCorrect || actualDiseaseId === "UNKNOWN" || !actualDiseaseId) ? undefined : Number(actualDiseaseId),
        actualStatus: (actualDiseaseId === "UNKNOWN") ? "UNKNOWN" : undefined,
        note
      });

      toast.success("Review submitted successfully");
      onReviewSuccess();
      onClose();
    } catch (error) {
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-border animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#2a64ad]" />
              AI Diagnosis Review
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Scan ID: #{scan.scanId} • Patient: {scan.patientName}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-[70vh]">
          {/* Left: Scan Content */}
          <div className="flex-1 overflow-y-auto p-6 border-r border-border">
            <div className="space-y-6">
              {/* Image Preview */}
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-3 flex items-center gap-2">
                  <ImageIcon className="w-3 h-3" /> Scanned Image
                </label>
                {scan.imageUrl ? (
                  <div className="aspect-video rounded-xl overflow-hidden border border-border bg-muted">
                    <img src={scan.imageUrl} alt="Scan" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="aspect-video rounded-xl flex flex-col items-center justify-center bg-muted border border-dashed border-border text-muted-foreground">
                    <ImageIcon className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm">No image available</p>
                  </div>
                )}
              </div>

              {/* AI Prediction Details */}
              <div className="bg-[#2a64ad]/5 border border-[#2a64ad]/20 rounded-xl p-5">
                <label className="text-xs font-bold uppercase text-[#2a64ad] mb-3 block">AI Prediction Result</label>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-2xl font-bold text-[#2a64ad]">{scan.predictedDisease}</p>
                    <p className="text-xs text-muted-foreground">Model Version: {scan.modelVersion}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-[#2a64ad]">
                      {scan.confidence.toFixed(1)}%
                    </p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Confidence Level</p>
                  </div>
                </div>

                <div className="w-full bg-[#2a64ad]/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#2a64ad] h-full transition-all duration-1000"
                    style={{ width: `${scan.confidence}%` }}
                  />
                </div>

                {scan.confidence < 60 && (
                  <div className="mt-4 flex items-start gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 italic text-sm">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    Low confidence detected. Manual review is highly recommended.
                  </div>
                )}
              </div>

              {/* Patient Diary Section */}
              {scan.patientDiary && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
                  <label className="text-[10px] font-black uppercase text-emerald-600 mb-3 block tracking-widest">Patient Self-Tracking (Diary)</label>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-lg font-bold text-emerald-800">Condition Score: {scan.patientDiary.score}/10</p>
                      <p className="text-[10px] text-emerald-600 font-medium">Logged on: {new Date(scan.patientDiary.date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {scan.patientDiary.symptoms && scan.patientDiary.symptoms.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] font-bold uppercase text-emerald-700 mb-2">Reported Symptoms:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {scan.patientDiary.symptoms.map((s: string) => (
                          <span key={s} className="px-2 py-0.5 bg-white border border-emerald-200 rounded-md text-[10px] font-bold text-emerald-700">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {scan.patientDiary.note && (
                    <div className="bg-white/60 p-3 rounded-lg border border-emerald-100">
                      <p className="text-[10px] font-bold uppercase text-emerald-700 mb-1">Patient's Note:</p>
                      <p className="text-xs text-emerald-900 leading-relaxed italic">"{scan.patientDiary.note}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Review Form */}
          <div className="w-full lg:w-96 p-6 bg-muted/10 overflow-y-auto">
            <h3 className="font-bold mb-6 text-foreground">Review Decision</h3>

            <div className="space-y-6">
              {/* AI Validation Section */}
              <div>
                <p className="text-sm font-medium mb-3 text-slate-700">Is the AI prediction accurate based on professional judgment?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsCorrect(true)}
                    className={`cursor-pointer flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${isCorrect === true
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                      : "bg-card border-border hover:border-emerald-200"
                      }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-bold">Accurate</span>
                  </button>
                  <button
                    onClick={() => setIsCorrect(false)}
                    className={`cursor-pointer flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${isCorrect === false
                      ? "bg-rose-50 border-rose-500 text-rose-700 shadow-sm"
                      : "bg-card border-border hover:border-rose-200"
                      }`}
                  >
                    <X className="w-4 h-4" />
                    <span className="font-bold">Inaccurate</span>
                  </button>
                </div>
              </div>

              {/* Image Quality Display (Read-only) */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Automated Image Quality</p>
                  <p className="text-sm font-bold text-slate-700">The system analyzed this scan as:</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-black text-xs uppercase tracking-wider ${scan.imageQuality === "CLEAR" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}>
                  {scan.imageQuality === "CLEAR" ? (
                    <><CheckCircle2 className="w-4 h-4" /> Clear / Sharp</>
                  ) : (
                    <><ImageIcon className="w-4 h-4" /> Blurry / Low Quality</>
                  )}
                </div>
              </div>

              {/* Correct Disease Select (Conditional) */}
              {isCorrect === false && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="text-sm font-medium mb-2 block text-slate-700">Correct Clinical Diagnosis</label>
                  <select
                    value={actualDiseaseId.toString()}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "HEALTHY" || val === "UNKNOWN") {
                        setActualDiseaseId(val);
                      } else {
                        setActualDiseaseId(val ? Number(val) : "");
                      }
                    }}
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2a64ad]/20 focus:border-[#2a64ad] transition-all"
                  >
                    <option value="">Select the correct clinical diagnosis...</option>
                    <option value="UNKNOWN" className="font-bold text-amber-700">Other (Unknown / Unlisted Disease)</option>
                    {(diseases || []).map(d => (
                      <option key={d.id} value={d.id.toString()}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Internal Notes */}
              <div>
                <label className="text-sm font-medium mb-2 block text-slate-700">Review Notes & Observations</label>
                <textarea
                  placeholder="Provide clinical observations or explain the model's inaccuracy to improve future training..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm h-32 focus:outline-none focus:ring-2 focus:ring-[#2a64ad]/20 focus:border-[#2a64ad] transition-all resize-none"
                />
              </div>

              <div className="pt-4 mt-auto">
                <button
                  disabled={submitting || isCorrect === null}
                  onClick={handleSubmit}
                  className="cursor-pointer w-full bg-[#2a64ad] hover:bg-[#1e4e8c] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  {submitting ? "Submitting Review..." : "Submit Review"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
