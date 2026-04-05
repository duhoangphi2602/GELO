import { useState } from "react";
import { useNavigate } from "react-router";
import { Activity, Upload, AlertCircle, X } from "lucide-react";
import axios from "axios";

export function MedicalAssessment() {
  const navigate = useNavigate();
  const [selectedAngle, setSelectedAngle] = useState<string | null>(null);
  const [showBlurryAlert, setShowBlurryAlert] = useState(false); // Changed to false by default
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
      alert("Bạn chưa đăng nhập! (Không tìm thấy patientId). Hãy đăng ký/đăng nhập trước.");
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
        // Lưu scanId vừa nhận để trang Result load đúng kết quả
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
      const filesArr = Array.from(e.target.files).slice(0, 5); // Tối đa 5 ảnh
      setUploadedFiles(filesArr);
    }
  };

  const handleSymptomChange = (symptom: string, value: string) => {
    setSymptoms((prev) => ({ ...prev, [symptom]: value }));
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
              <p className="text-sm text-muted-foreground">Medical Assessment</p>
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
      <main className="max-w-7xl mx-auto px-8 py-12">
        <h2 className="text-3xl mb-2">AI Medical Assessment</h2>
        <p className="text-muted-foreground mb-8">
          Upload images and answer questions for AI-powered analysis
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image Upload */}
          <div className="space-y-6">
            {/* Upload Box */}
            <div className="bg-card rounded-lg shadow-lg border border-border p-6">
              <h3 className="mb-4">Upload Medical Images</h3>
              
              {uploadedFiles.length > 0 ? (
                <div className="border-2 border-border rounded-lg p-4 flex flex-col items-center justify-center bg-muted/10">
                  <img 
                    src={URL.createObjectURL(uploadedFiles[0])} 
                    alt="Preview" 
                    className="w-full max-h-64 object-contain rounded mb-4"
                  />
                  <p className="text-center mb-2">
                    {uploadedFiles.length} file(s) selected
                  </p>
                  <label htmlFor="file-upload" className="cursor-pointer text-primary hover:underline">
                    Upload different photos
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
                  className="border-2 border-dashed border-border rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-muted/10"
                >
                  <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-center mb-2">
                    Drop your image here or click to browse
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports: JPG, PNG (Max 5 files)
                  </p>
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
            <div className="bg-card rounded-lg shadow-lg border border-border p-6">
              <h3 className="mb-4">Select Image Angle</h3>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setSelectedAngle("front")}
                  className={`py-4 rounded-lg border-2 transition-colors ${
                    selectedAngle === "front"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  Front
                </button>
                <button
                  onClick={() => setSelectedAngle("side")}
                  className={`py-4 rounded-lg border-2 transition-colors ${
                    selectedAngle === "side"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  Side
                </button>
                <button
                  onClick={() => setSelectedAngle("closeup")}
                  className={`py-4 rounded-lg border-2 transition-colors ${
                    selectedAngle === "closeup"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  Close-up
                </button>
              </div>
            </div>

            {/* Blurry Image Alert */}
            {showBlurryAlert && (
              <div className="bg-destructive/10 border border-destructive rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-destructive">
                    <strong>Blurry Image Detected</strong>
                  </p>
                  <p className="text-destructive text-sm mt-1">
                    Please upload a clearer image for accurate analysis
                  </p>
                </div>
                <button
                  onClick={() => setShowBlurryAlert(false)}
                  className="text-destructive hover:text-destructive/80"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Symptom Survey */}
          <div className="space-y-6">
            <div className="bg-card rounded-lg shadow-lg border border-border p-6">
              <h3 className="mb-6">Symptom Survey</h3>
              
              <div className="space-y-6">
                {/* Itching */}
                <div>
                  <label className="block mb-3">
                    Are you experiencing itching?
                  </label>
                  <div className="flex gap-4">
                    {["Yes", "No", "Unsure"].map((option) => (
                      <label
                        key={option}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="itching"
                          value={option}
                          checked={symptoms.itching === option}
                          onChange={(e) =>
                            handleSymptomChange("itching", e.target.value)
                          }
                          className="w-4 h-4 text-primary accent-primary"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Redness */}
                <div>
                  <label className="block mb-3">
                    Is there any redness or discoloration?
                  </label>
                  <div className="flex gap-4">
                    {["Yes", "No", "Unsure"].map((option) => (
                      <label
                        key={option}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="redness"
                          value={option}
                          checked={symptoms.redness === option}
                          onChange={(e) =>
                            handleSymptomChange("redness", e.target.value)
                          }
                          className="w-4 h-4 text-primary accent-primary"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Swelling */}
                <div>
                  <label className="block mb-3">
                    Do you notice any swelling?
                  </label>
                  <div className="flex gap-4">
                    {["Yes", "No", "Unsure"].map((option) => (
                      <label
                        key={option}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="swelling"
                          value={option}
                          checked={symptoms.swelling === option}
                          onChange={(e) =>
                            handleSymptomChange("swelling", e.target.value)
                          }
                          className="w-4 h-4 text-primary accent-primary"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Pain */}
                <div>
                  <label className="block mb-3">
                    Are you experiencing pain or discomfort?
                  </label>
                  <div className="flex gap-4">
                    {["Yes", "No", "Unsure"].map((option) => (
                      <label
                        key={option}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="pain"
                          value={option}
                          checked={symptoms.pain === option}
                          onChange={(e) =>
                            handleSymptomChange("pain", e.target.value)
                          }
                          className="w-4 h-4 text-primary accent-primary"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Discharge */}
                <div>
                  <label className="block mb-3">
                    Is there any unusual discharge?
                  </label>
                  <div className="flex gap-4">
                    {["Yes", "No", "Unsure"].map((option) => (
                      <label
                        key={option}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="discharge"
                          value={option}
                          checked={symptoms.discharge === option}
                          onChange={(e) =>
                            handleSymptomChange("discharge", e.target.value)
                          }
                          className="w-4 h-4 text-primary accent-primary"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitAssessment}
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground py-4 rounded-lg hover:bg-primary/90 transition-colors mt-8 disabled:opacity-50"
              >
                {isSubmitting ? "Processing AI Analysis..." : "Submit Assessment"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
