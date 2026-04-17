// medical-assessment.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Upload, AlertCircle, X, FileSearch, Activity, Loader2 } from "lucide-react";
import api from "../lib/api";
import { Layout } from "./layout/Layout";
import { useToastContext } from "./ui/ToastContext";

export function MedicalAssessment() {
  const navigate = useNavigate();
  const toast = useToastContext();

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isInitiating, setIsInitiating] = useState(false);
  const [isBlurry, setIsBlurry] = useState(false);
  const [processStatus, setProcessStatus] = useState<"idle" | "uploading" | "analyzing">("idle");

  // --- Memory Management: Clean up object URLs to prevent leaks ---
  useEffect(() => {
    if (uploadedFiles.length === 0) {
      setPreviewUrls([]);
      return;
    }

    const urls = uploadedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);

    // Cleanup: revoke URLs when files change or component unmounts
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [uploadedFiles]);

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
          const avg1 = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const avg2 = (data[i + 4] + data[i + 5] + data[i + 6]) / 3;
          diff += Math.abs(avg1 - avg2);
        }

        const score = diff / (size * size);
        const threshold = Number(import.meta.env.VITE_BLUR_THRESHOLD || 8);
        resolve(score < threshold);
      };

      // Use the first file for blur check
      const tempUrl = URL.createObjectURL(file);
      img.src = tempUrl;
      // Revoke temporary URL for blur check after loading
      img.onload = (originalOnload => (e) => {
        if (originalOnload) originalOnload.call(img, e);
        URL.revokeObjectURL(tempUrl);
      })(img.onload);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files).slice(0, 3);
      setUploadedFiles(filesArr);

      if (filesArr.length > 0) {
        const blurry = await detectBlur(filesArr[0]);
        setIsBlurry(blurry);
        if (blurry) {
          toast.warning("Poor Image Quality", "Image seems blurry. Please retake for better AI accuracy.");
        }
      }
    }
  };

  // --- AI-Only Scan Initiation ---
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
    setProcessStatus("uploading");

    try {
      const formData = new FormData();
      uploadedFiles.forEach(file => formData.append("images", file));

      // 1. Step: Uploading to server & starting analysis
      setProcessStatus("analyzing");
      const response = await api.post("/scans/initiate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 45000, // 45s for entire flow (upload + AI)
      });

      // Save scanId for results retrieval
      localStorage.setItem("currentScanId", response.data.scanId.toString());

      toast.success("Analysis Complete", "Redirecting to your results...");

      // Artificial delay for smooth transition
      setTimeout(() => {
        navigate("/results");
      }, 1000);

    } catch (error: any) {
      const msg = error.code === 'ECONNABORTED'
        ? "AI Analysis timed out. The server is taking too long."
        : (error.response?.data?.message || "AI Service unavailable.");
      toast.error("Analysis Failed", msg);
    } finally {
      setIsInitiating(false);
      setProcessStatus("idle");
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Sync Header - Ultra Compact */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-[#2a64ad] flex items-center justify-center shadow-md">
                <Activity className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="space-y-0 text-left">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-slate-100 rounded-md text-[8px] font-black uppercase text-slate-500 tracking-widest">Diagnostics</span>
                  <span className="text-[9px] font-bold text-slate-400">AI-Powered</span>
                </div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">AI Skin Assessment</h2>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Container - Compact */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 md:p-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Step 1: Upload Images</h3>
              <div className="h-px flex-1 bg-slate-100 mx-4" />
            </div>

            {uploadedFiles.length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-md">
                      <img
                        src={url}
                        alt="Preview"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <button
                        onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg p-1.5 shadow-xl border border-white hover:bg-red-500 hover:text-white transition-all scale-0 group-hover:scale-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {isBlurry && (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 italic text-sm font-medium">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>Image quality seems low. Clearer photos ensure higher AI accuracy.</p>
                  </div>
                )}

                <button
                  onClick={handleInitiateScan}
                  disabled={isInitiating}
                  className="cursor-pointer w-full py-4 bg-[#2a64ad] text-white font-black text-lg rounded-2xl hover:bg-[#1e4e8c] hover:shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 group"
                >
                  {isInitiating ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>{processStatus === "uploading" ? "Uploading..." : "Analyzing..."}</span>
                    </>
                  ) : (
                    <>
                      <FileSearch className="w-5 h-5" />
                      Execute Analysis
                    </>
                  )}
                </button>
              </div>
            ) : (
              <label className="group relative border-2 border-dashed border-slate-200 rounded-[2rem] p-10 flex flex-col items-center justify-center cursor-pointer hover:border-[#2a64ad] hover:bg-blue-50/10 transition-all duration-300 text-center">
                <div className="relative z-10 w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300 border border-slate-50">
                  <Upload className="w-6 h-6 text-[#2a64ad]" />
                </div>
                <div className="relative z-10 space-y-1">
                  <p className="text-xl font-bold text-slate-800 tracking-tight">Drop photos here</p>
                  <p className="text-slate-400 text-xs font-medium">Close-up shots recommended (Max 3)</p>
                </div>
                <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
              </label>
            )}
          </div>
        </div>

        {/* Small Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-8">
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2">Quality Notice</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              High clarity allows the AI to detect micro-textures and border irregularities for professional-grade insights.
            </p>
          </div>
          <div className="bg-slate-900 rounded-2xl p-5 text-white/90">
            <h4 className="text-xs font-black uppercase tracking-widest mb-2">Secure & Private</h4>
            <p className="text-[11px] opacity-70 leading-relaxed font-medium">
              All data is encrypted and processed securely. We prioritize your diagnostic privacy above all else.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
