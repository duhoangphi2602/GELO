import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Activity, CheckCircle, AlertTriangle, Heart } from "lucide-react";
import axios from "axios";

export function DiagnosticResult() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"care" | "lifestyle" | "warning">("care");
  const [resultData, setResultData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const scanId = localStorage.getItem("currentScanId");
    if (!scanId) {
      alert("No assessment data found. Please run a scan first.");
      navigate("/dashboard");
      return;
    }

    axios.get(`http://localhost:3000/results/${scanId}`)
      .then(res => {
        setResultData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load results", err);
        setLoading(false);
      });
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h2 className="text-2xl animate-pulse text-primary">Loading AI Diagnosis...</h2>
      </div>
    );
  }

  const confidence = resultData?.confidence !== undefined ? resultData.confidence : 0;
  const diseaseName = resultData?.disease || "Unknown Condition";
  const diseaseDescription = resultData?.description || "Please consult a medical professional.";
  const uploadedImage = resultData?.images?.[0]; // Get the first uploaded image

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
              <p className="text-sm text-muted-foreground">Diagnostic Results</p>
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
        <h2 className="text-3xl mb-2">AI Diagnostic Results</h2>
        <p className="text-muted-foreground mb-8">
          Review your assessment results and recommended actions
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column - Image */}
          <div className="bg-card rounded-lg shadow-lg border border-border p-6 h-fit">
            <h3 className="mb-4">Analyzed Image</h3>
            <div className="aspect-square bg-muted/30 rounded-lg flex items-center justify-center border-2 border-dashed border-border overflow-hidden">
              {uploadedImage ? (
                <img src={uploadedImage} alt="Assessment" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-muted-foreground">
                  <svg
                    className="w-24 h-24 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p>Skin Assessment Image</p>
                  <p className="text-sm mt-1">Front View - Close-up</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Diagnosis & Confidence */}
          <div className="space-y-6">
            {/* Diagnosis */}
            <div className="bg-card rounded-lg shadow-lg border border-border p-6">
              <h3 className="mb-2">Preliminary Diagnosis</h3>
              <p className="text-xl text-primary mb-2">{diseaseName}</p>
              <p className="text-muted-foreground">
                {diseaseDescription}
              </p>
            </div>

            {/* Confidence Score */}
            <div className="bg-card rounded-lg shadow-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3>Confidence Level</h3>
                <span className="text-2xl text-primary">{confidence}%</span>
              </div>
              
              {/* Progress Bar */}
              <div className="relative w-full h-8 bg-muted rounded-lg overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-blue-400 flex items-center justify-end pr-3 transition-all duration-500"
                  style={{ width: `${Math.max(0, confidence)}%` }}
                >
                  {confidence > 0 && <span className="text-sm text-white">Confidence</span>}
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-4">
                Our AI model analyzed your image with {confidence}% confidence.{' '}
                {confidence === 0 ? "This is a default value since no real confidence score was provided." : "This indicates a reliable assessment."}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section - Tabs with Advice and Action Buttons */}
        <div className="space-y-6">
            <div className="bg-card rounded-lg shadow-lg border border-border overflow-hidden">
              {/* Tab Headers */}
              <div className="flex border-b border-border">
                <button
                  onClick={() => setActiveTab("care")}
                  className={`flex-1 py-4 px-6 flex items-center justify-center gap-2 transition-colors ${
                    activeTab === "care"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted/30"
                  }`}
                >
                  <Heart className="w-5 h-5" />
                  <span>Care</span>
                </button>
                <button
                  onClick={() => setActiveTab("lifestyle")}
                  className={`flex-1 py-4 px-6 flex items-center justify-center gap-2 transition-colors ${
                    activeTab === "lifestyle"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted/30"
                  }`}
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Lifestyle</span>
                </button>
                <button
                  onClick={() => setActiveTab("warning")}
                  className={`flex-1 py-4 px-6 flex items-center justify-center gap-2 transition-colors ${
                    activeTab === "warning"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted/30"
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span>Warning</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === "care" && (
                  <div className="space-y-4">
                    <h3 className="text-xl mb-4">Recommended Care</h3>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <p>Apply a gentle, fragrance-free moisturizer twice daily to affected areas</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <p>Use mild, hypoallergenic soaps and avoid harsh chemicals</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <p>Consider over-the-counter hydrocortisone cream for inflammation</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <p>Keep the affected area clean and dry</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <p>Avoid scratching to prevent secondary infection</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "lifestyle" && (
                  <div className="space-y-4">
                    <h3 className="text-xl mb-4">Lifestyle Recommendations</h3>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <p>Identify and avoid triggers (certain fabrics, detergents, or plants)</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <p>Wear breathable, loose-fitting cotton clothing</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <p>Maintain a healthy diet rich in anti-inflammatory foods</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <p>Stay hydrated by drinking plenty of water throughout the day</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <p>Manage stress through relaxation techniques or exercise</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "warning" && (
                  <div className="space-y-4">
                    <h3 className="text-xl mb-4 text-destructive">Warning Signs</h3>
                    <div className="bg-destructive/10 border border-destructive rounded-lg p-4 mb-4">
                      <p className="text-destructive">
                        Seek immediate medical attention if you experience any of the following:
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-destructive mt-2 flex-shrink-0" />
                        <p>Severe swelling or spreading rash</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-destructive mt-2 flex-shrink-0" />
                        <p>Signs of infection (fever, pus, increased warmth)</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-destructive mt-2 flex-shrink-0" />
                        <p>Difficulty breathing or swallowing</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-destructive mt-2 flex-shrink-0" />
                        <p>No improvement after 2 weeks of home treatment</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-destructive mt-2 flex-shrink-0" />
                        <p>Symptoms affecting large areas of your body</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => navigate("/diary")}
                className="flex-1 bg-primary text-primary-foreground py-4 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Start Recovery Diary
              </button>
              <button
                onClick={() => navigate("/feedback")}
                className="flex-1 bg-card border-2 border-primary text-primary py-4 rounded-lg hover:bg-primary/5 transition-colors"
              >
                Provide Feedback
              </button>
            </div>
          </div>
      </main>
    </div>
  );
}
