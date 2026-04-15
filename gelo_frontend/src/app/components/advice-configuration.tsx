import { useState, useEffect } from "react";
import { AdminLayout } from "./admin-layout";
import { Save, AlertTriangle, Heart, CheckCircle, Loader2, ActivitySquare } from "lucide-react";
import api from "../lib/api";
import { useToastContext } from "./ui/ToastContext";

interface Disease {
  id: number;
  name: string;
}

interface Advice {
  id?: number;
  adviceType: "care" | "lifestyle" | "emergency";
  title: string;
  content: string;
}

export function AdviceConfiguration() {
  const toast = useToastContext();

  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<string>("");

  const [careAdvice, setCareAdvice] = useState("");
  const [lifestyleAdvice, setLifestyleAdvice] = useState("");
  const [emergencyWarnings, setEmergencyWarnings] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Fetch all diseases on mount
  useEffect(() => {
    const fetchDiseases = async () => {
      try {
        const response = await api.get("/diseases");
        setDiseases(response.data);
      } catch (error) {
        toast.error("Error", "Could not load diseases.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDiseases();
  }, []);

  // 2. Fetch advices when disease changes
  useEffect(() => {
    if (!selectedDiseaseId) {
      setCareAdvice("");
      setLifestyleAdvice("");
      setEmergencyWarnings("");
      return;
    }

    const fetchAdvices = async () => {
      try {
        const response = await api.get(`/diseases/${selectedDiseaseId}/advices`);
        const advices = response.data;

        // Map types to state
        setCareAdvice(advices.filter((a: any) => a.adviceType === 'care').map((a: any) => a.content).join('\n'));
        setLifestyleAdvice(advices.filter((a: any) => a.adviceType === 'lifestyle').map((a: any) => a.content).join('\n'));
        setEmergencyWarnings(advices.filter((a: any) => a.adviceType === 'emergency').map((a: any) => a.content).join('\n'));
      } catch (error) {
        toast.error("Error", "Could not load existing advice.");
      }
    };
    fetchAdvices();
  }, [selectedDiseaseId]);

  const handleSave = async () => {
    if (!selectedDiseaseId) return;

    setIsSaving(true);
    try {
      const advicesToSave = [
        ...careAdvice.split('\n').filter(c => c.trim()).map(c => ({ type: 'care', content: c.trim() })),
        ...lifestyleAdvice.split('\n').filter(c => c.trim()).map(c => ({ type: 'lifestyle', content: c.trim() })),
        ...emergencyWarnings.split('\n').filter(c => c.trim()).map(c => ({ type: 'emergency', content: c.trim() })),
      ];

      await api.post(`/diseases/${selectedDiseaseId}/advices`, advicesToSave);
      toast.success("Success", "Advice configuration updated.");
    } catch (error) {
      toast.error("Save Failed", "Could not save advice configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Advice Configuration" subtitle="Loading system data...">
        <div className="flex flex-col items-center justify-center p-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground font-medium">Syncing with clinical database...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Advice Configuration"
      subtitle="Configure medical advice and warnings for each disease dynamically"
    >
      <div className="space-y-6">
        {/* Selection Controls */}
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-lg font-bold">Selection Engine</h3>
            <div className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] uppercase font-bold rounded border border-blue-100">Dynamic Mode</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="disease" className="block mb-2 text-sm font-semibold text-slate-600">
                Target Disease
              </label>
              <select
                id="disease"
                value={selectedDiseaseId}
                onChange={(e) => setSelectedDiseaseId(e.target.value)}
                className="cursor-pointer w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium"
              >
                <option value="">-- Choose a disease from system --</option>
                {diseases.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Advice Editor Tabs */}
        {selectedDiseaseId && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Care Advice */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col">
              <div className="bg-primary/5 px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-primary" />
                  <h3 className="text-primary font-bold">Care Advice</h3>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <textarea
                  value={careAdvice}
                  onChange={(e) => setCareAdvice(e.target.value)}
                  rows={15}
                  placeholder="Enter medical care instructions (one per line)..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary resize-none text-sm font-medium flex-1"
                />
              </div>
            </div>

            {/* Lifestyle Advice */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col">
              <div className="bg-emerald-50 px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-emerald-600 font-bold">Lifestyle Tips</h3>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <textarea
                  value={lifestyleAdvice}
                  onChange={(e) => setLifestyleAdvice(e.target.value)}
                  rows={15}
                  placeholder="Enter lifestyle and prevention tips (one per line)..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 resize-none text-sm font-medium flex-1"
                />
              </div>
            </div>

            {/* Emergency Warnings */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col">
              <div className="bg-red-50 px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h3 className="text-red-600 font-bold">Emergency Warnings</h3>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <textarea
                  value={emergencyWarnings}
                  onChange={(e) => setEmergencyWarnings(e.target.value)}
                  rows={15}
                  placeholder="Enter critical warning signs (one per line)..."
                  className="w-full px-4 py-3 bg-red-50/20 border border-red-100 rounded-xl focus:ring-2 focus:ring-red-500 resize-none text-sm font-bold text-red-900 flex-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {selectedDiseaseId && (
          <div className="flex justify-end gap-4 pb-10">
            <button
              onClick={() => {
                setSelectedDiseaseId("");
                setCareAdvice("");
                setLifestyleAdvice("");
                setEmergencyWarnings("");
              }}
              className="cursor-pointer px-8 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
            >
              Discard Changes
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="cursor-pointer flex items-center gap-2 px-10 py-3 bg-[#2a64ad] text-white font-bold rounded-xl hover:bg-[#1e4e8c] hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Configuration</>}
            </button>
          </div>
        )}

        {/* Help Text */}
        {!selectedDiseaseId && (
          <div className="bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 p-20 text-center animate-in fade-in duration-700">
            <ActivitySquare className="w-16 h-16 text-slate-300 mx-auto mb-4 opacity-40" />
            <h4 className="text-slate-800 font-bold text-lg mb-1">Clinic Knowledge Base</h4>
            <p className="text-slate-500 max-w-sm mx-auto font-medium">
              Select a clinical condition from the dropdown above to manage its dynamic advice engine.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}