// medical-assessment.tsx
import { useState } from "react";
import { useNavigate } from "react-router";
import { Upload, AlertCircle, X, FileSearch, CheckCircle2, ChevronRight, ActivitySquare } from "lucide-react";
import axios from "axios";
import { Layout } from "./layout/Layout";

export function MedicalAssessment() {
  const navigate = useNavigate();
  const [selectedAngle, setSelectedAngle] = useState<string | null>(null);
  const [showBlurryAlert, setShowBlurryAlert] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const [symptoms, setSymptoms] = useState({
    itching: "",
    redness: "",
    swelling: "",
    pain: "",
    discharge: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitAssessment = async () => {
    const patientId = localStorage.getItem("patientId");
    if (!patientId) {
      alert("You are not logged in! (No patientId found). Please register/login first.");
      return;
    }

    if (uploadedFiles.length === 0) {
      alert("Error: At least 1 image is required to perform the scan!");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalImageUrl = "https://example.com/uploaded-skin-image.jpg";
      if (uploadedFiles.length > 0) {
        const fileToBase64 = (file: File): Promise<string> =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
          });
        finalImageUrl = await fileToBase64(uploadedFiles[0]);
      }

      const payload = {
        patientId: parseInt(patientId),
        imageUrl: finalImageUrl,
        answers: symptoms
      };

      const response = await axios.post("http://localhost:3000/scans/analyze", payload);

      if (response.data.scanId) {
        localStorage.setItem("currentScanId", response.data.scanId);
        navigate("/results");
      }
    } catch (error) {
      alert("Analysis failed! Check connection to backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files).slice(0, 5);
      setUploadedFiles(filesArr);
    }
  };

  const handleSymptomChange = (symptom: string, value: string) => {
    setSymptoms((prev) => ({ ...prev, [symptom]: value }));
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">

        <div className="flex flex-col mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center border border-emerald-200">
              <FileSearch className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">AI Medical Assessment</h2>
          </div>
          <p className="text-slate-500">
            Upload images and answer questions for an accurate AI-powered analysis.
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
                  <div className="absolute top-3 right-3 bg-white rounded-full p-1 shadow-sm border border-slate-100 z-10 cursor-pointer hover:bg-red-50 hover:text-red-500 hover:shadow-md transition-all" onClick={() => setUploadedFiles([])}>
                    <X className="w-4 h-4 text-slate-400 group-hover:text-red-500" />
                  </div>
                  <img
                    src={URL.createObjectURL(uploadedFiles[0])}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg mb-4 border border-slate-200"
                  />
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <p className="text-sm font-semibold text-slate-700">
                      {uploadedFiles.length} file(s) ready
                    </p>
                  </div>
                  <label htmlFor="file-upload" className="cursor-pointer text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 transition-colors bg-emerald-50 px-4 py-2 rounded-lg">
                    Change photo
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                  />
                </div>
              ) : (
                <label
                  htmlFor="file-upload"
                  className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 hover:shadow-md transition-all bg-slate-50/50 group"
                >
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-8 h-8 text-emerald-400 group-hover:text-emerald-500" />
                  </div>
                  <p className="text-center font-semibold text-slate-700 mb-1">
                    Drop your image here
                  </p>
                  <p className="text-xs font-medium text-slate-400 mb-6">
                    Supports JPG, PNG (Max 5 files)
                  </p>
                  <div className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg shadow-sm group-hover:border-emerald-200 group-hover:text-emerald-600 transition-colors">
                    Browse Files
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                  />
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
                  { id: "closeup", label: "Close-up" }
                ].map((angle) => (
                  <button
                    key={angle.id}
                    onClick={() => setSelectedAngle(angle.id)}
                    className={`cursor-pointer py-3 px-2 rounded-xl border-2 transition-all text-sm font-semibold hover:shadow-md ${selectedAngle === angle.id
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-slate-50"
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
                  <p className="text-red-800 font-bold text-sm">
                    Blurry Image Detected
                  </p>
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
                <ActivitySquare className="w-5 h-5 text-emerald-500" />
                <h3 className="text-lg font-bold text-slate-800">Symptom Diagnostic Survey</h3>
              </div>

              <div className="space-y-8">
                {[
                  { id: "itching", label: "Are you experiencing itching?" },
                  { id: "redness", label: "Is there any redness or discoloration?" },
                  { id: "swelling", label: "Do you notice any swelling?" },
                  { id: "pain", label: "Are you experiencing pain or discomfort?" },
                  { id: "discharge", label: "Is there any unusual discharge?" }
                ].map((q) => (
                  <div key={q.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                    <label className="block mb-4 text-slate-700 font-semibold">
                      {q.label}
                    </label>
                    <div className="flex flex-wrap gap-4">
                      {["Yes", "No", "Unsure"].map((option) => (
                        <label
                          key={option}
                          className={`flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-2.5 transition-all hover:shadow-md
                            ${(symptoms as any)[q.id] === option
                              ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                              : 'border-slate-200 hover:border-emerald-200 hover:bg-slate-50'
                            }
                          `}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            value={option}
                            checked={(symptoms as any)[q.id] === option}
                            onChange={(e) =>
                              handleSymptomChange(q.id, e.target.value)
                            }
                            className="cursor-pointer w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 accent-emerald-600"
                          />
                          <span className={`text-sm font-medium ${(symptoms as any)[q.id] === option ? 'text-emerald-800' : 'text-slate-600'}`}>
                            {option}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleSubmitAssessment}
                  disabled={isSubmitting}
                  className="cursor-pointer px-8 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 hover:shadow-lg transition-all flex items-center justify-center gap-2 shadow-sm focus:ring-4 focus:ring-emerald-500/20 disabled:bg-slate-300 disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
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