// medical-assessment.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Upload, AlertCircle, X, FileSearch, CheckCircle2, ChevronRight, ActivitySquare, Loader2 } from "lucide-react";
import api from "../lib/api";
import { Layout } from "./layout/Layout";
import { useToastContext } from "./ui/ToastContext";

interface Question {
  id: number;
  questionText: string;
}

export function MedicalAssessment() {
  const navigate = useNavigate();
  const toast = useToastContext();

  const [selectedAngle, setSelectedAngle] = useState<string | null>(null);
  const [showBlurryAlert, setShowBlurryAlert] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  const [symptoms, setSymptoms] = useState<Record<string, string>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await api.get("/rules/active");
        setQuestions(response.data);
        
        // Initialize symptoms state while preserving existing answers
        setSymptoms(prev => {
          const newSymptoms = { ...prev };
          response.data.forEach((q: Question) => {
            const qId = q.id.toString();
            if (newSymptoms[qId] === undefined) {
              newSymptoms[qId] = "";
            }
          });
          return newSymptoms;
        });
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, []); // Remove toast dependency to prevent re-fetch on toast updates

  const handleSubmitAssessment = async () => {
    const patientId = localStorage.getItem("patientId");
    if (!patientId) {
      toast.error(
        "Not logged in",
        "No patient ID found. Please register or log in first."
      );
      navigate("/");
      return;
    }

    if (uploadedFiles.length === 0) {
      toast.warning(
        "No image uploaded",
        "At least 1 image is required to perform the scan."
      );
      return;
    }

    // Check if all questions are answered
    const answeredCount = Object.values(symptoms).filter(v => v !== "").length;
    if (questions.length > 0 && answeredCount < questions.length) {
      toast.warning(
        "Incomplete Survey",
        `Please answer all ${questions.length} diagnostic questions before submitting.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      
      if (uploadedFiles.length > 0) {
        uploadedFiles.forEach(file => {
          formData.append("images", file);
        });
      }

      // Convert symptoms object { "qId": "Yes" } to array [ { questionId: "qId", answer: "Yes" } ]
      const answersArray = Object.entries(symptoms).map(([questionId, answer]) => ({
        questionId: parseInt(questionId),
        answer,
      }));
      formData.append("answers", JSON.stringify(answersArray));

      const response = await api.post("/scans/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.scanId) {
        localStorage.setItem("currentScanId", response.data.scanId);
        navigate("/results");
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(
        "Analysis failed",
        error.response?.data?.message || "Could not connect to the backend. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files).slice(0, 3);
      setUploadedFiles(filesArr);
    }
  };

  const handleSymptomChange = (id: string, value: string) => {
    setSymptoms((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">

        <div className="flex flex-col mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center border border-blue-200">
              <FileSearch className="w-5 h-5 text-[#2a64ad]" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">AI Atopic Dermatitis Diagnosis</h2>
          </div>
          <p className="text-slate-500">
            Specialized AI system for analyzing and identifying **Atopic Dermatitis** based on images and symptoms.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Image Upload */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Box */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <h3 className="mb-4 text-sm font-semibold text-slate-700">Upload Medical Images</h3>

              {uploadedFiles.length > 0 ? (
                <div className="border-2 border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50/50 relative group">
                  <div
                    className="absolute top-3 right-3 bg-white rounded-full p-1 shadow-sm border border-slate-100 z-10 cursor-pointer hover:bg-red-50 hover:text-red-500 hover:shadow-md transition-all"
                    onClick={() => setUploadedFiles([])}
                  >
                    <X className="w-4 h-4 text-slate-400 group-hover:text-red-500" />
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center mb-4">
                    {uploadedFiles.map((file, idx) => (
                      <img
                        key={idx}
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${idx + 1}`}
                        className="w-24 h-24 object-cover rounded-lg border border-slate-200 shadow-sm"
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2a64ad]" />
                    <p className="text-sm font-semibold text-slate-700">
                      {uploadedFiles.length} file(s) ready
                    </p>
                  </div>
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer text-sm font-medium text-[#2a64ad] hover:text-[#1e4e8c] hover:bg-blue-100 transition-colors bg-blue-50 px-4 py-2 rounded-lg"
                  >
                    Change photo
                  </label>
                  <input id="file-upload" type="file" className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
                </div>
              ) : (
                <label
                  htmlFor="file-upload"
                  className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-[#2a64ad] hover:bg-blue-50/50 hover:shadow-md transition-all bg-slate-50/50 group"
                >
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-8 h-8 text-blue-400 group-hover:text-[#2a64ad]" />
                  </div>
                  <p className="text-center font-semibold text-slate-700 mb-1">Drop your image here</p>
                  <p className="text-xs font-medium text-slate-400 mb-6">Supports JPG, PNG (Max 3 files)</p>
                  <div className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg shadow-sm group-hover:border-blue-200 group-hover:text-[#2a64ad] transition-colors">
                    Browse Files
                  </div>
                  <input id="file-upload" type="file" className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
                </label>
              )}
            </div>

            {/* Angle Selection Buttons */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <h3 className="mb-4 text-sm font-semibold text-slate-700">Select Image Angle</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "front", label: "Front" },
                  { id: "side", label: "Side" },
                  { id: "closeup", label: "Close-up" },
                ].map((angle) => (
                  <button
                    key={angle.id}
                    onClick={() => setSelectedAngle(angle.id)}
                    className={`cursor-pointer py-3 px-2 rounded-xl border-2 transition-all text-sm font-semibold hover:shadow-md ${
                      selectedAngle === angle.id
                        ? "border-[#2a64ad] bg-blue-50 text-[#2a64ad] shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-slate-50"
                    }`}
                  >
                    {angle.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Blurry Image Alert */}
            {showBlurryAlert && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in zoom-in-95 duration-300">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-800 font-bold text-sm">Blurry Image Detected</p>
                  <p className="text-red-600 text-xs font-medium mt-1">
                    Please upload a clearer image for accurate AI analysis.
                  </p>
                </div>
                <button
                  onClick={() => setShowBlurryAlert(false)}
                  className="cursor-pointer text-red-400 hover:text-red-600 bg-red-100/50 hover:bg-red-200 rounded-md p-1 transition-colors hover:shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Symptom Survey */}
          <div className="col-span-1 lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8">
              <div className="flex items-center gap-3 mb-8">
                <ActivitySquare className="w-5 h-5 text-[#2a64ad]" />
                <h3 className="text-lg font-bold text-slate-800">Symptom Diagnostic Survey</h3>
              </div>

              <div className="space-y-8 min-h-[300px]">
                {loadingQuestions ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#2a64ad]" />
                    <p className="text-sm font-medium">Loading specialist survey questions...</p>
                  </div>
                ) : questions.length > 0 ? (
                  questions.map((q) => (
                    <div key={q.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                      <label className="block mb-4 text-slate-700 font-semibold">{q.questionText}</label>
                      <div className="flex flex-wrap gap-4">
                        {["Yes", "No", "Unsure"].map((option) => (
                          <label
                            key={option}
                            className={`flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-2.5 transition-all hover:shadow-md ${
                              symptoms[q.id.toString()] === option
                                ? "border-[#2a64ad] bg-blue-50/50 shadow-sm"
                                : "border-slate-200 hover:border-blue-200 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="radio"
                              name={q.id.toString()}
                              value={option}
                              checked={symptoms[q.id.toString()] === option}
                              onChange={(e) => handleSymptomChange(q.id.toString(), e.target.value)}
                              className="cursor-pointer w-4 h-4 text-[#2a64ad] border-slate-300 focus:ring-[#2a64ad] accent-[#2a64ad]"
                            />
                            <span
                              className={`text-sm font-medium ${
                                symptoms[q.id.toString()] === option
                                  ? "text-[#2a64ad]"
                                  : "text-slate-600"
                              }`}
                            >
                              {option}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed border-slate-200 rounded-2xl">
                    <CheckCircle2 className="w-12 h-12 mb-4 text-emerald-500 opacity-20" />
                    <p className="text-sm font-medium">No specialized symptoms required for this analysis.</p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleSubmitAssessment}
                  disabled={isSubmitting}
                  className="cursor-pointer px-8 py-4 bg-[#2a64ad] text-white font-bold rounded-xl hover:bg-[#1e4e8c] hover:shadow-lg transition-all flex items-center justify-center gap-2 shadow-sm focus:ring-4 focus:ring-[#2a64ad]/20 disabled:bg-slate-300 disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processing AI Analysis...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Assessment</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}