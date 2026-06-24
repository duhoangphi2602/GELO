import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router";
import { BookOpen, Save, Trash2, ArrowUpDown, ChevronDown, ChevronUp, Activity } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { diaryService } from "@/services/diary.service";
import { Layout } from "@/components/shared/layout/Layout";
import { useToastContext } from "@/components/shared/ui/ToastContext";
import { ConfirmModal } from "@/components/shared/ui/ConfirmModal";
import { useAuth } from "@/hooks/useAuth";

export function PatientDiary() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToastContext();
  const queryClient = useQueryClient();
  const { patientId, isPatient } = useAuth();

  const [recoveryLevel, setRecoveryLevel] = useState(5);
  const [notes, setNotes] = useState("");
  const [lastSavedId, setLastSavedId] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
    isDanger: true
  });

  const today = new Date().toISOString().split('T')[0];
  const [entryDate, setEntryDate] = useState(today);

  const { data: diaries = [], isLoading } = useQuery({
    queryKey: ["diaries", patientId],
    queryFn: () => diaryService.getPatientDiaries(patientId || 1),
    enabled: !!patientId || true,
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => diaryService.saveEntry(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["diaries"] });
      toast.success("Entry saved!", "Your diary entry has been recorded successfully.");
      setNotes("");
      setSelectedSymptoms([]);
      setSortOrder('newest');
      setLastSavedId(res.diaryId);
      setTimeout(() => setLastSavedId(null), 3000);
    },
    onError: (err: any) => {
      toast.error("Save failed", err.response?.data?.message || "Internal server error");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => diaryService.deleteEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diaries"] });
      toast.success("Success", "Diary entry deleted");
    },
    onError: () => toast.error("Error", "Could not delete entry"),
  });

  const clearAllMutation = useMutation({
    mutationFn: () => diaryService.clearAllEntries(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diaries"] });
      toast.success("Wiped", "All diary entries have been cleared.");
    },
    onError: () => toast.error("Error", "Could not perform batch deletion"),
  });

  const sortedDiaries = [...diaries].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    if (timeA === timeB) {
      return sortOrder === 'newest' ? b.id - a.id : a.id - b.id;
    }
    return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
  });

  useEffect(() => {
    if (lastSavedId) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`diary-entry-${lastSavedId}`);
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [lastSavedId]);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom) 
        : [...prev, symptom]
    );
  };

  const handleSave = () => {
    if (!isPatient) {
      toast.warning("Access Restricted", "Only patients can maintain a personal skin diary.");
      return;
    }
    if (!patientId) {
      toast.error("Not logged in", "No patient ID found. Please log in again.");
      navigate("/auth/login");
      return;
    }

    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const fullDateTime = new Date(`${entryDate}T${hours}:${minutes}:${seconds}`).toISOString();

    const scanIdRaw = searchParams.get("scanId");
    saveMutation.mutate({
      patientId: Number(patientId),
      scanId: scanIdRaw ? parseInt(scanIdRaw) : null,
      conditionScore: Number(recoveryLevel),
      symptoms: selectedSymptoms,
      note: notes,
      entryDate: fullDateTime,
    });
  };

  const handleDelete = (id: number) => {
    setModalConfig({
      title: "Delete Diary Entry",
      message: "Are you sure you want to remove this entry from your skin diary?",
      isDanger: true,
      onConfirm: () => deleteMutation.mutate(id)
    });
    setModalOpen(true);
  };

  const handleDeleteAll = () => {
    setModalConfig({
      title: "Wipe All Diary Entries",
      message: "CRITICAL: This will permanently delete your entire skin tracking history. This data cannot be recovered.",
      isDanger: true,
      onConfirm: () => {
        setTimeout(() => {
          setModalConfig({
            title: "FINAL CONFIRMATION",
            message: "I understand that all my tracking data will be lost forever. Clear all data now?",
            isDanger: true,
            onConfirm: () => clearAllMutation.mutate()
          });
          setModalOpen(true);
        }, 300);
      }
    });
    setModalOpen(true);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-[#2a64ad] flex items-center justify-center shadow-md">
                <BookOpen className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="space-y-0 text-left">
                <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded-md text-[8px] font-black uppercase text-slate-500 tracking-widest">Wellness</span>
                    <span className="text-[9px] font-bold text-slate-400">Recovery Log</span>
                </div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Patient Diary Tracking</h2>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 flex flex-col md:col-span-1">
              <label className="block mb-2 text-[10px] font-black uppercase text-slate-400 tracking-wider">Entry Date</label>
              <input type="date" value={entryDate} max={today} onChange={(e) => setEntryDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl outline-none transition-all text-sm font-bold text-slate-700" />
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 flex flex-col md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Recovery Condition</label>
                <div className="flex items-center gap-1.5"><span className="text-xl font-black text-[#2a64ad]">{recoveryLevel}</span><span className="text-slate-300 font-bold text-[10px]">/ 10</span></div>
              </div>
              <div className="space-y-3 px-1">
                <input type="range" min="1" max="10" value={recoveryLevel} onChange={(e) => setRecoveryLevel(Number(e.target.value))} className="w-full h-2 rounded-lg appearance-none cursor-pointer slider-thumb" style={{ background: `linear-gradient(to right, #2a64ad 0%, #2a64ad ${(recoveryLevel - 1) * 11.11}%, #f1f5f9 ${(recoveryLevel - 1) * 11.11}%, #f1f5f9 100%)` }} />
                <div className="flex justify-between text-[9px] font-bold text-slate-300 uppercase tracking-tighter"><span>Worse</span><span>Neutral</span><span>Better</span></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 lg:col-span-2 flex flex-col">
              <label className="block mb-2 text-[10px] font-black uppercase text-slate-400 tracking-wider">Daily Observations</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe symptoms, changes, or activities..." rows={4} className="w-full flex-1 px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl outline-none transition-all resize-none text-sm font-medium text-slate-700" />
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 lg:col-span-1">
              <h3 className="mb-3 text-[10px] font-black uppercase text-slate-400 tracking-wider">Symptoms</h3>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5">
                {["Itching", "Redness", "Swelling", "Pain", "Discharge", "Fever"].map((symptom) => (
                  <label key={symptom} className="flex items-center gap-2 cursor-pointer group p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                    <input 
                      type="checkbox" 
                      checked={selectedSymptoms.includes(symptom)}
                      onChange={() => toggleSymptom(symptom)}
                      className="w-3.5 h-3.5 rounded border-slate-300 accent-[#2a64ad]" 
                    />
                    <span className="text-[11px] text-slate-600 font-bold group-hover:text-[#2a64ad] transition-colors">{symptom}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saveMutation.isPending} className="px-8 py-3 bg-[#2a64ad] text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-xl hover:bg-[#1e4e8c] transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 shadow-lg cursor-pointer">
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? "Processing..." : "Secure Save Entry"}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200/60">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Recent Progress</h3>
                <button onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')} className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black text-slate-500 hover:text-[#2a64ad] transition-all uppercase cursor-pointer">
                  <ArrowUpDown className="w-3 h-3" />
                  {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                </button>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{diaries.length} Logs</span>
                {diaries.length > 0 && (
                  <button onClick={handleDeleteAll} className="text-[10px] font-black text-rose-500/60 hover:text-rose-600 transition-colors uppercase tracking-widest cursor-pointer border-l border-slate-200 pl-4">Clear All</button>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-50 animate-pulse rounded-xl" />)}
              </div>
            ) : sortedDiaries.length > 0 ? (
              <div className="space-y-6">
                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-4 h-4 text-[#2a64ad]" />
                    <h4 className="text-xs font-black text-slate-600 uppercase tracking-widest">Recovery Trend</h4>
                  </div>
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[...sortedDiaries].reverse().slice(-14)} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2a64ad" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#2a64ad" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="createdAt" 
                          tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                          style={{ fontSize: '10px', fontWeight: 'bold', fill: '#94a3b8' }}
                          axisLine={false}
                          tickLine={false}
                          minTickGap={20}
                        />
                        <YAxis 
                          domain={[0, 10]} 
                          ticks={[0, 2, 4, 6, 8, 10]}
                          style={{ fontSize: '10px', fontWeight: 'bold', fill: '#94a3b8' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                          labelFormatter={(date) => new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          formatter={(value: any) => [`Score: ${value}`, 'Condition']}
                        />
                        <Area type="monotone" dataKey="conditionScore" stroke="#2a64ad" strokeWidth={3} fillOpacity={1} fill="url(#scoreGradient)" activeDot={{ r: 6, fill: '#2a64ad', stroke: 'white', strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-3">
                  {sortedDiaries.map((diary: any) => {
                    const isExpanded = expandedId === diary.id;
                    
                    let scoreColor = "bg-green-100 text-green-700 border-green-200";
                    let scoreDot = "bg-green-500";
                    if (diary.conditionScore <= 3) {
                      scoreColor = "bg-rose-100 text-rose-700 border-rose-200";
                      scoreDot = "bg-rose-500";
                    } else if (diary.conditionScore <= 6) {
                      scoreColor = "bg-amber-100 text-amber-700 border-amber-200";
                      scoreDot = "bg-amber-500";
                    }

                    return (
                    <div key={diary.id} id={`diary-entry-${diary.id}`} className={`group bg-white border shadow-sm rounded-xl p-4 transition-all duration-300 flex flex-col relative overflow-hidden cursor-pointer hover:shadow-md ${diary.id === lastSavedId ? 'border-[#2a64ad] bg-[#2a64ad]/5 ring-4 ring-[#2a64ad]/10 scale-[1.02]' : 'border-slate-200'}`} onClick={() => setExpandedId(isExpanded ? null : diary.id)}>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="sm:w-32 flex-shrink-0 flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-2 sm:gap-1 mt-1">
                            <span className="text-[11px] font-black text-[#2a64ad] uppercase block leading-tight">
                              {new Date(diary.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </span>
                            <div className={`px-2 py-1 rounded-md border flex items-center gap-1.5 ${scoreColor}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${scoreDot}`} />
                              <span className="text-[10px] font-bold uppercase tracking-wider">Score: {diary.conditionScore}</span>
                            </div>
                        </div>
                        
                        <div className="flex-1 pr-8 space-y-3">
                            <div className="flex justify-between items-start">
                              <p className={`text-slate-700 leading-relaxed font-medium transition-all ${isExpanded ? 'text-sm' : 'line-clamp-2 text-slate-600 text-[11px]'}`}>
                                {diary.note || "No specific observations recorded for this day."}
                              </p>
                              <div className="text-slate-400 shrink-0 ml-2">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </div>
                            
                            {diary.symptoms && diary.symptoms.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {diary.symptoms.map((s: string) => {
                                  let badgeColor = "bg-slate-100 text-slate-600 border-slate-200";
                                  if (s.toLowerCase() === "redness" || s.toLowerCase() === "fever" || s.toLowerCase() === "đỏ da" || s.toLowerCase() === "sốt") badgeColor = "bg-rose-50 text-rose-600 border-rose-100";
                                  else if (s.toLowerCase() === "pain" || s.toLowerCase() === "itching" || s.toLowerCase() === "đau" || s.toLowerCase() === "ngứa") badgeColor = "bg-amber-50 text-amber-600 border-amber-100";
                                  else if (s.toLowerCase() === "swelling" || s.toLowerCase() === "sưng") badgeColor = "bg-purple-50 text-purple-600 border-purple-100";
                                  
                                  return (
                                  <span key={s} className={`px-2 py-1 rounded-md text-[9px] border font-bold uppercase tracking-tighter ${badgeColor}`}>
                                    {s}
                                  </span>
                                )})}
                              </div>
                            )}
                            
                            {isExpanded && diary.scanId && (
                              <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between hover:bg-slate-100 transition-colors" onClick={(e) => { e.stopPropagation(); navigate(`/patient/results/${diary.scanId}`); }}>
                                <div className="flex items-center gap-2">
                                  <Activity className="w-4 h-4 text-[#2a64ad]" />
                                  <span className="text-xs font-bold text-slate-600">Skin Scan Attached</span>
                                </div>
                                <span className="text-[10px] font-black text-[#2a64ad] uppercase tracking-wider">
                                  View Scan
                                </span>
                              </div>
                            )}
                        </div>
                      </div>
                      
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(diary.id); }} className="absolute top-3 right-3 p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-10"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )})}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50/50 border border-slate-100 border-dashed rounded-2xl py-8 flex flex-col items-center justify-center">
                <BookOpen className="w-8 h-8 text-slate-200 mb-2" />
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">No entries yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <ConfirmModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onConfirm={modalConfig.onConfirm} title={modalConfig.title} message={modalConfig.message} isDanger={modalConfig.isDanger} />
      <style>{`
        .slider-thumb::-webkit-slider-thumb { appearance: none; width: 24px; height: 24px; border-radius: 50%; background: #2a64ad; cursor: pointer; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s; }
        .slider-thumb::-webkit-slider-thumb:hover { background: #1e4e8c; transform: scale(1.1); }
        .slider-thumb::-moz-range-thumb { width: 24px; height: 24px; border-radius: 50%; background: #2a64ad; cursor: pointer; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: all 0.2s; }
      `}</style>
    </Layout>
  );
}

export default PatientDiary;
