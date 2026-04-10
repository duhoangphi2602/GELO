import { useState, useEffect } from "react";
import { X, CheckCircle2, AlertTriangle, Info, Image as ImageIcon, Activity } from "lucide-react";
import { useToast } from "../hooks/useToast";
import api from "../lib/api";

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
  const { toast } = useToast();
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [actualDiseaseId, setActualDiseaseId] = useState<string | number>("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.get("/scans/admin/diseases")
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
      await api.post(`/scans/admin/review/${scan.scanId}`, {
        isCorrect,
        actualDiseaseId: (isCorrect || actualDiseaseId === "HEALTHY" || !actualDiseaseId) ? undefined : Number(actualDiseaseId),
        actualStatus: actualDiseaseId === "HEALTHY" ? "HEALTHY" : undefined,
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
                      {(scan.confidence * 100).toFixed(1)}%
                    </p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Confidence Level</p>
                  </div>
                </div>
                
                <div className="w-full bg-[#2a64ad]/10 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#2a64ad] h-full transition-all duration-1000" 
                    style={{ width: `${scan.confidence * 100}%` }}
                  />
                </div>
                
                {scan.confidence < 0.6 && (
                  <div className="mt-4 flex items-start gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 italic text-sm">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    Low confidence detected. Manual review is highly recommended.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Review Form */}
          <div className="w-full lg:w-96 p-6 bg-muted/10 overflow-y-auto">
            <h3 className="font-bold mb-6 text-foreground">Review Decision</h3>
            
            <div className="space-y-6">
              {/* Question 1 */}
              <div>
                <p className="text-sm font-medium mb-3">Is the AI prediction correct?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsCorrect(true)}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                      isCorrect === true 
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm" 
                        : "bg-card border-border hover:border-emerald-200"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-bold">Correct</span>
                  </button>
                  <button
                    onClick={() => setIsCorrect(false)}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                      isCorrect === false 
                        ? "bg-rose-50 border-rose-500 text-rose-700 shadow-sm" 
                        : "bg-card border-border hover:border-rose-200"
                    }`}
                  >
                    <X className="w-4 h-4" />
                    <span className="font-bold">Incorrect</span>
                  </button>
                </div>
              </div>

              {/* Correct Disease Select (Conditional) */}
              {isCorrect === false && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="text-sm font-medium mb-2 block">Correct Diagnosis</label>
                  <select
                    value={actualDiseaseId.toString()}
                    onChange={(e) => setActualDiseaseId(e.target.value === "HEALTHY" ? "HEALTHY" : (e.target.value ? Number(e.target.value) : ""))}
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2a64ad]/20 focus:border-[#2a64ad] transition-all"
                  >
                    <option value="">Select the correct diagnosis...</option>
                    <option value="HEALTHY" className="font-bold text-green-700">Healthy Skin (No Disease)</option>
                    {(diseases || []).map(d => (
                      <option key={d.id} value={d.id.toString()}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Internal Notes */}
              <div>
                <label className="text-sm font-medium mb-2 block">Admin Notes (Optional)</label>
                <textarea
                  placeholder="Describe why the model might be wrong or add clinical notes..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm h-32 focus:outline-none focus:ring-2 focus:ring-[#2a64ad]/20 focus:border-[#2a64ad] transition-all resize-none"
                />
              </div>

              <div className="pt-4 mt-auto">
                <button
                  disabled={submitting || isCorrect === null}
                  onClick={handleSubmit}
                  className="w-full bg-[#2a64ad] hover:bg-[#1e4e8c] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
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
