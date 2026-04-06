import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { BookOpen, Save, CheckCircle2, AlertTriangle, BatteryCharging } from "lucide-react";
import axios from "axios";
import { Layout } from "./layout/Layout";

export function PatientDiary() {
  const navigate = useNavigate();
  const [recoveryLevel, setRecoveryLevel] = useState(5);
  const [notes, setNotes] = useState("");
  const [savedMessage, setSavedMessage] = useState(false);
  const [diaries, setDiaries] = useState<any[]>([]);
  
  // Format today as YYYY-MM-DD for date input constraints
  const today = new Date().toISOString().split('T')[0];
  const [entryDate, setEntryDate] = useState(today);

  const fetchDiaries = async () => {
    const patientId = localStorage.getItem("patientId");
    if (!patientId) return;
    try {
      const res = await axios.get(`http://localhost:3000/diary/${patientId}`);
      setDiaries(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDiaries();
  }, []);

  const handleSave = async () => {
    const patientId = localStorage.getItem("patientId");
    const scanId = localStorage.getItem("currentScanId") || "1"; // Fallback if direct access

    if (!patientId) {
      alert("No patient ID found, please log in.");
      return;
    }

    try {
      await axios.post("http://localhost:3000/diary", {
        patientId: parseInt(patientId),
        scanId: parseInt(scanId),
        conditionScore: recoveryLevel,
        note: notes,
        entryDate: entryDate // Send selected date
      });
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
      setNotes("");
      fetchDiaries();
    } catch (error) {
      alert("Failed to save diary entry");
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
        
        <div className="flex flex-col mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center border border-emerald-200">
              <BookOpen className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Scan History & Diary</h2>
          </div>
          <p className="text-slate-500">
            Track your recovery progress and document your daily observations.
          </p>
        </div>

        {/* Success Message */}
        {savedMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <p className="font-medium">Your diary entry has been saved successfully!</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Top Row: Date & Level */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Date Display */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 flex flex-col md:col-span-1">
              <label className="block mb-2 text-sm font-semibold text-slate-700">Entry Date</label>
              <input
                type="date"
                value={entryDate}
                max={today}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 font-medium"
              />
            </div>

            {/* Recovery Slider */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 flex flex-col md:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <label className="text-sm font-semibold text-slate-700">How do you feel today?</label>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black text-emerald-500">{recoveryLevel}</span>
                  <span className="text-slate-400 font-medium tracking-widest text-sm">/ 10</span>
                </div>
              </div>

              {/* Slider */}
              <div className="space-y-4 px-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={recoveryLevel}
                  onChange={(e) => setRecoveryLevel(Number(e.target.value))}
                  className="w-full h-3 rounded-lg appearance-none cursor-pointer slider-thumb shadow-inner"
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${(recoveryLevel - 1) * 11.11}%, #f1f5f9 ${(recoveryLevel - 1) * 11.11}%, #f1f5f9 100%)`
                  }}
                />

                {/* Scale Labels */}
                <div className="flex justify-between text-xs font-medium text-slate-400">
                  <span className="text-center w-8">1<br/>Worse</span>
                  <span className="text-center w-4 mt-1">2</span>
                  <span className="text-center w-4 mt-1">3</span>
                  <span className="text-center w-4 mt-1">4</span>
                  <span className="text-center w-8">5<br/>Same</span>
                  <span className="text-center w-4 mt-1">6</span>
                  <span className="text-center w-4 mt-1">7</span>
                  <span className="text-center w-4 mt-1">8</span>
                  <span className="text-center w-4 mt-1">9</span>
                  <span className="text-center w-8">10<br/>Better</span>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="mt-6">
                {recoveryLevel <= 3 && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 py-2.5 px-4 rounded-lg font-medium text-sm">
                    <AlertTriangle className="w-4 h-4" /> Feeling worse - Consider consulting your doctor
                  </div>
                )}
                {recoveryLevel > 3 && recoveryLevel <= 7 && (
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 py-2.5 px-4 rounded-lg font-medium text-sm">
                    <BatteryCharging className="w-4 h-4" /> Stable condition - Continue monitoring
                  </div>
                )}
                {recoveryLevel > 7 && (
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 py-2.5 px-4 rounded-lg font-medium text-sm">
                    <CheckCircle2 className="w-4 h-4" /> Great progress - Keep up the good work!
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Notes Text Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 lg:col-span-2 flex flex-col">
              <label htmlFor="notes" className="block mb-3 text-sm font-semibold text-slate-700">
                Daily Notes & Observations
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe your symptoms, any changes you've noticed, medications taken, activities performed..."
                rows={7}
                className="w-full flex-1 px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none text-slate-800"
              />
              <p className="text-xs font-medium text-slate-400 mt-3 text-right">
                {notes.length} characters
              </p>
            </div>

            {/* Additional Symptoms Checklist */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 lg:col-span-1">
              <h3 className="mb-4 text-sm font-semibold text-slate-700">Current Symptoms</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                {[
                  "Itching",
                  "Redness",
                  "Swelling",
                  "Pain",
                  "Discharge",
                  "Fever",
                  "Dryness",
                  "Burning sensation",
                ].map((symptom) => (
                  <label key={symptom} className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500 transition-all cursor-pointer accent-emerald-500"
                    />
                    <span className="text-sm text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{symptom}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              onClick={handleSave}
              className="px-8 py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-emerald-500/20 sm:w-auto w-full"
            >
              <Save className="w-5 h-5 flex-shrink-0" />
              Save Diary Entry
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-8 py-3.5 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all sm:w-auto w-full"
            >
              Cancel
            </button>
          </div>

          {/* Previous Entries List */}
          <div className="mt-12 pt-8 border-t border-slate-200/60">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Previous Entries</h3>
              <p className="text-sm font-medium text-slate-500">{diaries.length} records</p>
            </div>

            {diaries.length > 0 ? (
              <div className="grid gap-4">
                {diaries.map((diary: any, idx) => (
                  <div key={idx} className="bg-white border border-slate-200/60 shadow-sm rounded-xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 text-sm">
                      <span className="font-bold text-slate-700">
                        {new Date(diary.createdAt).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                      <div className="flex items-center gap-2 mt-2 sm:mt-0">
                        <span className="font-medium text-slate-500">Condition Score:</span>
                        <span className="px-2.5 py-1 bg-emerald-50/80 rounded-md font-bold text-emerald-600 border border-emerald-100/50">
                          {diary.conditionScore} / 10
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{diary.note || "No specific notes provided."}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50/50 border border-slate-100 border-dashed rounded-2xl py-12 flex flex-col items-center justify-center">
                <BookOpen className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">No previous entries found.</p>
                <p className="text-sm text-slate-400 mt-1">Your saved daily records will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: background-color 0.2s, transform 0.1s;
        }
        
        .slider-thumb::-webkit-slider-thumb:hover {
          background: #059669;
          transform: scale(1.1);
        }
        
        .slider-thumb::-webkit-slider-thumb:active {
          cursor: grabbing;
        }
        
        .slider-thumb::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: background-color 0.2s, transform 0.1s;
        }
        
        .slider-thumb::-moz-range-thumb:hover {
          background: #059669;
          transform: scale(1.1);
        }
      `}</style>
    </Layout>
  );
}
