import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/admin-layout";
import { adminService } from "@/services/admin.service";
import { Save, AlertTriangle, Heart, CheckCircle, Loader2, ActivitySquare, X } from "lucide-react";
import { useToastContext } from "@/components/ui/ToastContext";

type AdviceType = "care" | "lifestyle" | "emergency";

export function AdviceConfiguration() {
  const toast = useToastContext();
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<string>("");

  const [careAdvice, setCareAdvice] = useState("");
  const [lifestyleAdvice, setLifestyleAdvice] = useState("");
  const [emergencyWarnings, setEmergencyWarnings] = useState("");

  const { data: diseases = [], isLoading: loadingDiseases } = useQuery({
    queryKey: ["admin", "diseases"],
    queryFn: () => adminService.getDiseases(),
  });

  const { data: advices = [], isLoading: loadingAdvices } = useQuery({
    queryKey: ["admin", "advices", selectedDiseaseId],
    queryFn: () => adminService.getAdvices(selectedDiseaseId),
    enabled: !!selectedDiseaseId,
  });

  useEffect(() => {
    if (advices.length > 0) {
      setCareAdvice(advices.filter((a: any) => a.adviceType === 'care').map((a: any) => a.content).join('\n'));
      setLifestyleAdvice(advices.filter((a: any) => a.adviceType === 'lifestyle').map((a: any) => a.content).join('\n'));
      setEmergencyWarnings(advices.filter((a: any) => a.adviceType === 'emergency').map((a: any) => a.content).join('\n'));
    } else {
      setCareAdvice(""); setLifestyleAdvice(""); setEmergencyWarnings("");
    }
  }, [advices]);

  const saveMutation = useMutation({
    mutationFn: (data: any[]) => adminService.updateAdvices(selectedDiseaseId, data),
    onSuccess: () => toast.success("Saved", "Advice configuration updated."),
    onError: () => toast.error("Error", "Failed to save configuration.")
  });

  const handleSave = () => {
    const data = [
      ...careAdvice.split('\n').filter(c => c.trim()).map(c => ({ type: 'care' as AdviceType, content: c.trim() })),
      ...lifestyleAdvice.split('\n').filter(c => c.trim()).map(c => ({ type: 'lifestyle' as AdviceType, content: c.trim() })),
      ...emergencyWarnings.split('\n').filter(c => c.trim()).map(c => ({ type: 'emergency' as AdviceType, content: c.trim() })),
    ];
    saveMutation.mutate(data);
  };

  if (loadingDiseases) {
    return (
      <AdminLayout title="Advice Config" subtitle="Loading system data...">
        <div className="p-20 flex flex-col items-center justify-center"><Loader2 className="animate-spin text-[#2a64ad] w-12 h-12 mb-4" /><p className="font-bold text-slate-400">Syncing database...</p></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Advice Configuration" subtitle="Define medical insights and safety warnings for conditions">
      <div className="space-y-6">
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="text-lg font-black tracking-tight">Condition Context</h3>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest rounded border border-blue-100">AI Logic Mapping</span>
          </div>
          <div className="max-w-md">
            <label className="block mb-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Select Target Disease</label>
            <select
              value={selectedDiseaseId}
              onChange={(e) => setSelectedDiseaseId(e.target.value)}
              className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm font-bold outline-none focus:border-[#2a64ad] transition-all cursor-pointer"
            >
              <option value="">-- Choose Disease --</option>
              {diseases.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        {selectedDiseaseId ? (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col">
                <div className="bg-[#2a64ad]/5 px-6 py-4 border-b border-border flex items-center gap-3"><Heart className="text-[#2a64ad]" size={20} /><h3 className="font-black text-[#2a64ad] text-sm uppercase">Medical Care</h3></div>
                <div className="p-6 flex-1"><textarea value={careAdvice} onChange={(e) => setCareAdvice(e.target.value)} rows={12} className="w-full h-full bg-muted/20 border border-border rounded-xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#2a64ad]/10 transition-all resize-none" placeholder="Medical care steps (one per line)..." /></div>
              </div>
              <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col">
                <div className="bg-emerald-50 px-6 py-4 border-b border-border flex items-center gap-3"><CheckCircle className="text-emerald-600" size={20} /><h3 className="font-black text-emerald-600 text-sm uppercase">Lifestyle</h3></div>
                <div className="p-6 flex-1"><textarea value={lifestyleAdvice} onChange={(e) => setLifestyleAdvice(e.target.value)} rows={12} className="w-full h-full bg-muted/20 border border-border rounded-xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all resize-none" placeholder="Daily routine tips..." /></div>
              </div>
              <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col">
                <div className="bg-rose-50 px-6 py-4 border-b border-border flex items-center gap-3"><AlertTriangle className="text-rose-600" size={20} /><h3 className="font-black text-rose-600 text-sm uppercase">Warnings</h3></div>
                <div className="p-6 flex-1"><textarea value={emergencyWarnings} onChange={(e) => setEmergencyWarnings(e.target.value)} rows={12} className="w-full h-full bg-rose-50/10 border border-rose-200 rounded-xl p-4 text-sm font-black text-rose-900 outline-none focus:ring-2 focus:ring-rose-500/10 transition-all resize-none" placeholder="Critical warning signs..." /></div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pb-10">
              <button onClick={() => setSelectedDiseaseId("")} className="px-6 py-3 bg-white border border-border text-muted-foreground font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-muted/50 transition-all cursor-pointer flex items-center gap-2"><X size={14} /> Discard</button>
              <button onClick={handleSave} disabled={saveMutation.isPending} className="px-10 py-3 bg-[#2a64ad] text-white font-black rounded-xl text-xs uppercase tracking-widest hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer">
                {saveMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save Configuration
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-muted/10 border-2 border-dashed border-border rounded-[2.5rem] p-24 text-center">
            <ActivitySquare size={64} className="mx-auto mb-4 opacity-10" />
            <h4 className="font-black text-slate-800 text-lg">System Repository</h4>
            <p className="text-muted-foreground text-sm font-medium">Select a condition to customize its clinical advice and safety protocols.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdviceConfiguration;
