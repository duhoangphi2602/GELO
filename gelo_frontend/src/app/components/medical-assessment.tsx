// medical-assessment.tsx
import { useState } from "react";
import { useNavigate } from "react-router";
import { Upload, AlertCircle, X, FileSearch, CheckCircle2, ActivitySquare, Loader2, Image as ImageIcon } from "lucide-react";
import api from "../lib/api";
import { Layout } from "./layout/Layout";
import { useToastContext } from "./ui/ToastContext";

interface Question {
  id: number;
  text: string;
  isEmergency: boolean;
}

export function MedicalAssessment() {
  const navigate = useNavigate();
  const toast = useToastContext();

  const [step, setStep] = useState<1 | 2>(1);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [scanId, setScanId] = useState<number | null>(null);
  const [prediction, setPrediction] = useState<any>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [symptoms, setSymptoms] = useState<Record<string, string>>({});

  const [isInitiating, setIsInitiating] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isBlurry, setIsBlurry] = useState(false);

  // --- Blurry Detection Logic ---
  const detectBlur = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(false);

        // Resize for faster processing
        const size = 100;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        let diff = 0;

        for (let i = 0; i < data.length - 4; i += 4) {
          // Compare luminance of adjacent pixels
          const avg1 = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const avg2 = (data[i + 4] + data[i + 5] + data[i + 6]) / 3;
          diff += Math.abs(avg1 - avg2);
        }

        const score = diff / (size * size);
        // Lower score means less contrast/sharper edges = likely blurry
        const threshold = Number(import.meta.env.VITE_BLUR_THRESHOLD || 8);
        resolve(score < threshold);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files).slice(0, 3);
      setUploadedFiles(filesArr);

      // Check first image for blur
      if (filesArr.length > 0) {
        const blurry = await detectBlur(filesArr[0]);
        setIsBlurry(blurry);
        if (blurry) {
          toast.warning("Poor Image Quality", "Image seems blurry. Please retake for better AI accuracy.");
        }
      }
    }
  };

  // --- Phase 1: Initiate Scan ---
  const handleInitiateScan = async () => {
    const patientId = localStorage.getItem("patientId");
    if (!patientId) {
      toast.error("Access Denied", "Please log in first.");
      navigate("/");
      return;
    }

    if (uploadedFiles.length === 0) {
      toast.warning("Upload Required", "Please provide at least 1 image.");
      return;
    }

    setIsInitiating(true);
    try {
      const formData = new FormData();
      uploadedFiles.forEach(file => formData.append("images", file));

      const response = await api.post("/scans/initiate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setScanId(response.data.scanId);
      setPrediction(response.data);
      setQuestions(response.data.questions);

      // Initialize survey state
      const initialSymptoms: Record<string, string> = {};
      response.data.questions.forEach((q: Question) => {
        initialSymptoms[q.id.toString()] = "";
      });
      setSymptoms(initialSymptoms);

      setStep(2);
      toast.success("AI Analysis Complete", `Likely: ${response.data.predictedDisease}. Please answer a few questions.`);
    } catch (error: any) {
      toast.error("Connection Error", error.response?.data?.message || "AI Service unavailable.");
    } finally {
      setIsInitiating(false);
    }
  };

  // --- Phase 2: Complete Scan ---
  const handleCompleteScan = async () => {
    if (!scanId) return;

    const unanswered = questions.some(q => !symptoms[q.id.toString()]);
    if (unanswered) {
      toast.warning("Incomplete", "Please answer all questions to get final results.");
      return;
    }

    setIsCompleting(true);
    try {
      const answersArray = Object.entries(symptoms).map(([questionId, answer]) => ({
        questionId: parseInt(questionId),
        answer,
      }));

      await api.post(`/scans/complete/${scanId}`, { answers: answersArray });

      localStorage.setItem("currentScanId", scanId.toString());
      navigate("/results");
    } catch (error: any) {
      toast.error("Submission Failed", "Could not save your diagnosis results.");
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">

        {/* Header Section */}
        <div className="flex flex-col mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center border border-blue-200">
              <ActivitySquare className="w-5 h-5 text-[#2a64ad]" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">AI Diagnosis</h2>
          </div>
          <p className="text-slate-500 max-w-2xl">
            {step === 1
              ? "Start by uploading photos of the affected area. Our AI will analyze the patterns to identify potential conditions."
              : "AI analysis is complete. Now, provide some details about your symptoms to refine the diagnosis."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* STEP 1: UPLOAD AREA (Left on large, Full on small) */}
          <div className={`${step === 1 ? 'lg:col-span-12' : 'lg:col-span-4'} transition-all duration-500`}>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-[#2a64ad] text-white' : 'bg-emerald-500 text-white'}`}>
                    {step === 1 ? '1' : <CheckCircle2 className="w-4 h-4" />}
                  </span>
                  Image Submission
                </h3>
                {step === 2 && (
                  <button onClick={() => setStep(1)} className="cursor-pointer text-xs font-semibold text-[#2a64ad] hover:text-[#1e4e8c] hover:underline underline-offset-4 transition-colors">
                    Change images
                  </button>
                )}
              </div>

              {uploadedFiles.length > 0 ? (
                <div className={`border-2 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50/50 relative group transition-colors ${isBlurry ? 'border-amber-200 bg-amber-50/10' : 'border-slate-200'}`}>
                  {step === 1 && (
                    <div
                      className="absolute top-3 right-3 bg-white rounded-full p-1 shadow-sm border border-slate-100 z-10 cursor-pointer hover:bg-red-50 hover:text-red-500 transition-all"
                      onClick={() => setUploadedFiles([])}
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3 justify-center mb-4">
                    {uploadedFiles.map((file, idx) => (
                      <img
                        key={idx}
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className="w-28 h-28 object-cover rounded-lg border border-slate-200 shadow-sm"
                      />
                    ))}
                  </div>

                  {isBlurry && (
                    <div className="flex items-center gap-2 mb-4 p-2 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold">
                      <AlertCircle className="w-4 h-4" />
                      Blurred detected! Consider retaking.
                    </div>
                  )}

                  {step === 1 && (
                      <button
                        onClick={handleInitiateScan}
                        disabled={isInitiating}
                        className="cursor-pointer w-full py-4 bg-[#2a64ad] text-white font-bold rounded-xl hover:bg-[#1e4e8c] hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isInitiating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><FileSearch className="w-5 h-5" /> Start AI Analysis</>}
                      </button>
                  )}
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-300 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-[#2a64ad] hover:bg-blue-50/50 transition-all bg-slate-50/50 group text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="font-semibold text-slate-700 mb-1">Click to upload photos</p>
                  <p className="text-xs text-slate-400 mb-6 font-medium">Clear photos improve accuracy significantly.</p>
                  <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
                </label>
              )}
            </div>
          </div>

          {/* STEP 2: DYNAMIC SURVEY (Right Side) */}
          {step === 2 && (
            <div className="lg:col-span-8 animate-in slide-in-from-right-10 duration-500">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8 h-full flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] bg-[#2a64ad] text-white">2</span>
                    Clinical Survey: {prediction?.predictedDisease}
                  </h3>
                  <div className="px-3 py-1 bg-blue-50 rounded-full text-[#2a64ad] text-[10px] font-bold uppercase tracking-tight">
                    AI Analysis Result
                  </div>
                </div>

                <div className="space-y-8 flex-1">
                  {questions.map((q) => (
                    <div key={q.id} className={`pb-6 border-b transition-opacity ${q.isEmergency ? 'border-red-100' : 'border-slate-100'} last:border-0`}>
                      <div className="flex items-start gap-3 mb-4">
                        <label className="text-slate-700 font-bold text-base leading-tight">
                          {q.text}
                          {q.isEmergency && <span className="ml-2 text-[10px] font-bold text-red-500 uppercase border border-red-200 bg-red-50 px-1.5 py-0.5 rounded">Emergency Indicator</span>}
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {["Yes", "No", "Unsure"].map((option) => (
                          <button
                            key={option}
                            onClick={() => setSymptoms(prev => ({ ...prev, [q.id]: option }))}
                            className={`cursor-pointer flex-1 py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all ${symptoms[q.id] === option
                                ? "border-[#2a64ad] bg-blue-50 text-[#2a64ad] shadow-sm"
                                : "border-slate-100 bg-white text-slate-500 hover:border-blue-200 hover:bg-slate-50"
                              }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {questions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 opacity-60">
                      <ImageIcon className="w-12 h-12 mb-4 text-slate-300" />
                      <p className="text-slate-500 font-medium">AI analysis confirms no additional survey needed.</p>
                    </div>
                  )}
                </div>

                <div className="mt-10 pt-6 border-t border-slate-100 flex gap-4">
                  <button
                    onClick={handleCompleteScan}
                    disabled={isCompleting}
                    className="cursor-pointer flex-1 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-black hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    {isCompleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> View Final Diagnosis Result</>}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
