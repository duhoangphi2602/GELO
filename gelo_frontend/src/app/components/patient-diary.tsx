// patient-diary.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { BookOpen, Save, Trash2, ArrowUpDown } from "lucide-react";
import api from "../lib/api";
import { Layout } from "./layout/Layout";
import { useToastContext } from "./ui/ToastContext";
import { ConfirmModal } from "./ui/ConfirmModal";

export function PatientDiary() {
  const navigate = useNavigate();
  const toast = useToastContext();

  const [recoveryLevel, setRecoveryLevel] = useState(5);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [diaries, setDiaries] = useState<any[]>([]);
  const [lastSavedId, setLastSavedId] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
    isDanger: true
  });

  // Format today as YYYY-MM-DD for date input constraints
  const today = new Date().toISOString().split('T')[0];
  const [entryDate, setEntryDate] = useState(today);

  const fetchDiaries = async () => {
    const patientId = localStorage.getItem("patientId");
    if (!patientId) return;
    try {
      const res = await api.get(`/diary/${patientId}`);
      setDiaries(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setDiaries([]);
    }
  };

  useEffect(() => {
    fetchDiaries();
  }, []);

  // Compute sorted copies of diaries
  const sortedDiaries = [...diaries].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
  });

  // Handle auto-scroll when a new entry is saved
  useEffect(() => {
    if (lastSavedId) {
      // Small delay to ensure the DOM has rendered the new content
      const timer = setTimeout(() => {
        const element = document.getElementById(`diary-entry-${lastSavedId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [lastSavedId]);

  async function handleSave() {
    const patientId = localStorage.getItem("patientId");
    const scanIdRaw = localStorage.getItem("currentScanId");
    const role = localStorage.getItem("role");

    if (role !== "PATIENT") {
      toast.warning("Access Restricted", "Only patients can maintain a personal skin diary.");
      return;
    }

    if (!patientId) {
      toast.error("Not logged in", "No patient ID found. Please log in again.");
      navigate("/");
      return;
    }

    setSaving(true);
    try {
      const res = await api.post("/diary", {
        patientId: parseInt(patientId),
        scanId: scanIdRaw ? parseInt(scanIdRaw) : null,
        conditionScore: Number(recoveryLevel),
        note: notes,
        entryDate: entryDate,
      });
      
      const newId = res.data.diaryId;
      toast.success("Entry saved!", "Your diary entry has been recorded successfully.");
      setNotes("");
      setSortOrder('newest'); // Đưa bản ghi mới nhất lên đầu
      setLastSavedId(newId);
      fetchDiaries();
      
      // Clear highlight after 3 seconds
      setTimeout(() => setLastSavedId(null), 3000);
     } catch (err: any) {
      console.error("Diary save failed:", err);
      const errorDetail = err.response?.data?.message || "Internal server error";
      toast.error("Save failed", `Server responded: ${errorDetail}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    console.log(`[Diary] Opening custom confirm for entry ID: ${id}`);
    
    setModalConfig({
      title: "Delete Diary Entry",
      message: "Are you sure you want to remove this entry from your skin diary?",
      isDanger: true,
      onConfirm: async () => {
        try {
          await api.delete(`/diary/${id}`);
          toast.success("Success", "Diary entry deleted");
          fetchDiaries();
        } catch (err) {
          console.error("Failed to delete diary entry", err);
          toast.error("Error", "Could not delete entry");
        }
      }
    });
    setModalOpen(true);
  }

  async function handleDeleteAll() {
    console.log("[Diary] Opening custom confirm for BATCH DELETE");
    
    setModalConfig({
      title: "Wipe All Diary Entries",
      message: "CRITICAL: This will permanently delete your entire skin tracking history. This data cannot be recovered. Proceed with caution.",
      isDanger: true,
      onConfirm: () => {
        // Second level confirmation for batch wipe
        setTimeout(() => {
          setModalConfig({
            title: "FINAL CONFIRMATION",
            message: "I understand that all my tracking data will be lost forever. Clear all data now?",
            isDanger: true,
            onConfirm: async () => {
              try {
                await api.delete("/diary/batch/all");
                toast.success("Wiped", "All diary entries have been cleared.");
                fetchDiaries();
              } catch (err) {
                console.error("Failed to clear diary batch", err);
                toast.error("Error", "Could not perform batch deletion");
              }
            }
          });
          setModalOpen(true);
        }, 300);
      }
    });
    setModalOpen(true);
  }

  return (
    <Layout>
      <>
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Sync Header - Ultra Compact */}
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
            {/* Top Row: Date & Level */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Display */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 flex flex-col md:col-span-1">
                <label className="block mb-2 text-[10px] font-black uppercase text-slate-400 tracking-wider">Entry Date</label>
                <input
                  type="date"
                  value={entryDate}
                  max={today}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="cursor-pointer w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2a64ad]/20 transition-all text-sm font-bold text-slate-700"
                />
              </div>

              {/* Recovery Slider */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 flex flex-col md:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Recovery Condition</label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl font-black text-[#2a64ad]">{recoveryLevel}</span>
                    <span className="text-slate-300 font-bold text-[10px]">/ 10</span>
                  </div>
                </div>

                {/* Slider */}
                <div className="space-y-3 px-1">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={recoveryLevel}
                    onChange={(e) => setRecoveryLevel(Number(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer slider-thumb shadow-inner"
                    style={{
                      background: `linear-gradient(to right, #2a64ad 0%, #2a64ad ${(recoveryLevel - 1) * 11.11}%, #f1f5f9 ${(recoveryLevel - 1) * 11.11}%, #f1f5f9 100%)`
                    }}
                  />
                  <div className="flex justify-between text-[9px] font-bold text-slate-300 uppercase tracking-tighter">
                    <span>Worse</span>
                    <span>Neutral</span>
                    <span>Better</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Notes Text Area */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 lg:col-span-2 flex flex-col">
                <label htmlFor="notes" className="block mb-2 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Daily Observations
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe symptoms, changes, or activities..."
                  rows={4}
                  className="cursor-text w-full flex-1 px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2a64ad]/20 transition-all resize-none text-sm font-medium text-slate-700"
                />
              </div>

              {/* Additional Symptoms Checklist */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 lg:col-span-1">
                <h3 className="mb-3 text-[10px] font-black uppercase text-slate-400 tracking-wider">Symptoms</h3>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5">
                  {[
                    "Itching",
                    "Redness",
                    "Swelling",
                    "Pain",
                    "Discharge",
                    "Fever",
                  ].map((symptom) => (
                    <label key={symptom} className="flex items-center gap-2 cursor-pointer group p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 rounded border-slate-300 accent-[#2a64ad]"
                      />
                      <span className="text-[11px] text-slate-600 font-bold group-hover:text-[#2a64ad] transition-colors">{symptom}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3 bg-[#2a64ad] text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-xl hover:bg-[#1e4e8c] active:scale-95 transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:pointer-events-none cursor-pointer shadow-lg shadow-blue-900/10"
              >
                <Save className="w-4 h-4" />
                {saving ? "Processing..." : "Secure Save Entry"}
              </button>
            </div>

            {/* Previous Entries List - Ultra Compact */}
            <div className="mt-8 pt-6 border-t border-slate-200/60">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Recent Progress</h3>
                  <button 
                    onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                    className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black text-slate-500 hover:bg-white hover:text-[#2a64ad] hover:border-[#2a64ad]/30 transition-all uppercase tracking-widest cursor-pointer"
                  >
                    <ArrowUpDown className="w-3 h-3" />
                    {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{diaries.length} Logs</span>
                  {diaries.length > 0 && (
                    <button 
                      type="button"
                      onClick={() => {
                        console.log("[UI] User clicked Clear All link");
                        handleDeleteAll();
                      }}
                      className="text-[10px] font-black text-rose-500/60 hover:text-rose-600 transition-colors uppercase tracking-widest cursor-pointer border-l border-slate-200 pl-4"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {sortedDiaries.length > 0 ? (
                <div className="space-y-3">
                  {sortedDiaries.map((diary: any) => {
                    const isNewlySaved = diary.id === lastSavedId;
                    
                    return (
                      <div 
                        key={diary.id} 
                        id={`diary-entry-${diary.id}`}
                        className={`group bg-white border shadow-sm rounded-xl p-4 transition-all duration-700 flex flex-col sm:flex-row gap-4 relative overflow-hidden ${
                          isNewlySaved ? 'border-[#2a64ad] bg-[#2a64ad]/5 ring-4 ring-[#2a64ad]/10 scale-[1.02]' : 'border-slate-100 hover:border-blue-100'
                        }`}
                      >
                        <div className="sm:w-32 flex-shrink-0">
                            <span className="text-[10px] font-black text-[#2a64ad] uppercase block">
                                {new Date(diary.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <div className="mt-1 flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-bold text-slate-400">Score: {diary.conditionScore}</span>
                            </div>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed font-medium flex-1 pr-8">
                            {diary.note || "System stability log entry."}
                        </p>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(diary.id)}
                          className="absolute top-3 right-3 z-30 p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer pointer-events-auto"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
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

        <ConfirmModal 
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onConfirm={modalConfig.onConfirm}
            title={modalConfig.title}
            message={modalConfig.message}
            isDanger={modalConfig.isDanger}
        />

        <style>{`
          .slider-thumb::-webkit-slider-thumb {
            appearance: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #2a64ad;
            cursor: pointer;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: background-color 0.2s, transform 0.1s;
          }
          .slider-thumb::-webkit-slider-thumb:hover {
            background: #1e4e8c;
            transform: scale(1.1);
          }
          .slider-thumb::-webkit-slider-thumb:active { cursor: grabbing; }
          .slider-thumb::-moz-range-thumb {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #2a64ad;
            cursor: pointer;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: background-color 0.2s, transform 0.1s;
          }
          .slider-thumb::-moz-range-thumb:hover {
            background: #1e4e8c;
            transform: scale(1.1);
          }
        `}</style>
      </>
    </Layout>
  );
}