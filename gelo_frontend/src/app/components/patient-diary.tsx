import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Activity, BookOpen, Save } from "lucide-react";
import axios from "axios";

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
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl">HealthAI Platform</h1>
              <p className="text-sm text-muted-foreground">Patient Diary</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2 text-primary hover:text-primary/80"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-8 py-12">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-8 h-8 text-primary" />
          <h2 className="text-3xl">Recovery Diary</h2>
        </div>
        <p className="text-muted-foreground mb-8">
          Track your recovery progress and document your daily observations
        </p>

        {/* Success Message */}
        {savedMessage && (
          <div className="bg-green-50 border border-green-300 text-green-800 rounded-lg p-4 mb-6 flex items-center gap-3">
            <Save className="w-5 h-5" />
            <p>Your diary entry has been saved successfully!</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Date Display */}
          <div className="bg-card rounded-lg shadow-lg border border-border p-6">
            <label className="block mb-2">Entry Date</label>
            <input
              type="date"
              value={entryDate}
              max={today}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Recovery Slider */}
          <div className="bg-card rounded-lg shadow-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <label>How do you feel today?</label>
              <div className="flex items-center gap-3">
                <span className="text-3xl text-primary">{recoveryLevel}</span>
                <span className="text-muted-foreground">/ 10</span>
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-4">
              <input
                type="range"
                min="1"
                max="10"
                value={recoveryLevel}
                onChange={(e) => setRecoveryLevel(Number(e.target.value))}
                className="w-full h-3 bg-muted rounded-lg appearance-none cursor-pointer slider-thumb"
                style={{
                  background: `linear-gradient(to right, #0066CC 0%, #0066CC ${(recoveryLevel - 1) * 11.11}%, #e9ebef ${(recoveryLevel - 1) * 11.11}%, #e9ebef 100%)`
                }}
              />

              {/* Scale Labels */}
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>1<br/>Worse</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5<br/>Same</span>
                <span>6</span>
                <span>7</span>
                <span>8</span>
                <span>9</span>
                <span>10<br/>Better</span>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="mt-6 p-4 rounded-lg bg-muted/30">
              <p className="text-center">
                {recoveryLevel <= 3 && (
                  <span className="text-destructive">Feeling worse - Consider consulting your doctor</span>
                )}
                {recoveryLevel > 3 && recoveryLevel <= 7 && (
                  <span className="text-yellow-600">Stable condition - Continue monitoring</span>
                )}
                {recoveryLevel > 7 && (
                  <span className="text-green-600">Great progress - Keep up the good work!</span>
                )}
              </p>
            </div>
          </div>

          {/* Notes Text Area */}
          <div className="bg-card rounded-lg shadow-lg border border-border p-6">
            <label htmlFor="notes" className="block mb-4">
              Daily Notes & Observations
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe your symptoms, any changes you've noticed, medications taken, activities performed, or anything else worth noting..."
              rows={12}
              className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <p className="text-sm text-muted-foreground mt-2">
              {notes.length} characters
            </p>
          </div>

          {/* Additional Symptoms Checklist */}
          <div className="bg-card rounded-lg shadow-lg border border-border p-6">
            <h3 className="mb-4">Current Symptoms</h3>
            <div className="grid grid-cols-2 gap-4">
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
                <label key={symptom} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-primary accent-primary rounded"
                  />
                  <span>{symptom}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              className="flex-1 bg-primary text-primary-foreground py-4 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save Entry
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-8 py-4 bg-card border-2 border-border rounded-lg hover:bg-muted/30 transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Previous Entries List */}
          <div className="mt-12">
            <h3 className="text-2xl mb-6">Previous Entries</h3>
            {diaries.length > 0 ? (
              <div className="space-y-4">
                {diaries.map((diary: any, idx) => (
                  <div key={idx} className="bg-card border border-border shadow-sm rounded-lg p-6">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-primary">{new Date(diary.createdAt).toLocaleDateString()}</span>
                      <span className="text-sm px-2 py-1 bg-primary/10 rounded text-primary">Score: {diary.conditionScore}/10</span>
                    </div>
                    <p className="text-muted-foreground whitespace-pre-wrap">{diary.note}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center">No previous entries found.</p>
            )}
          </div>
        </div>
      </main>

      <style>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #0066CC;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider-thumb::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #0066CC;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
