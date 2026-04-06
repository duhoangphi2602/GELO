import { useState } from "react";
import { useNavigate } from "react-router";
import { Activity, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";

export function Feedback() {
  const navigate = useNavigate();
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [actualDisease, setActualDisease] = useState("");
  const [additionalComments, setAdditionalComments] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      navigate("/dashboard");
    }, 2000);
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
              <p className="text-sm text-muted-foreground">AI Feedback</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/results")}
            className="cursor-pointer px-4 py-2 text-primary hover:text-primary/80"
          >
            ← Back to Results
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-8 py-12">
        <div className="flex items-center gap-3 mb-2">
          <MessageSquare className="w-8 h-8 text-primary" />
          <h2 className="text-3xl">Help Us Improve</h2>
        </div>
        <p className="text-muted-foreground mb-8">
          Your feedback helps our AI become more accurate and reliable
        </p>

        {submitted ? (
          <div className="bg-card rounded-lg shadow-lg border border-border p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ThumbsUp className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl mb-2">Thank You!</h3>
            <p className="text-muted-foreground mb-4">
              Your feedback has been submitted successfully
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting to dashboard...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* AI Diagnosis Reference */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
              <h3 className="mb-2">AI Diagnosis</h3>
              <p className="text-xl text-primary">Contact Dermatitis</p>
              <p className="text-sm text-muted-foreground mt-2">
                Confidence: 87% • Date: April 5, 2026
              </p>
            </div>

            {/* Is AI Correct Question */}
            <div className="bg-card rounded-lg shadow-lg border border-border p-6">
              <h3 className="mb-6">Is the AI diagnosis correct?</h3>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setIsCorrect(true)}
                  className={`cursor-pointer p-6 rounded-lg border-2 transition-all ${isCorrect === true
                      ? "border-green-500 bg-green-50"
                      : "border-border hover:border-green-300"
                    }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center ${isCorrect === true
                          ? "bg-green-500"
                          : "bg-muted"
                        }`}
                    >
                      <ThumbsUp
                        className={`w-8 h-8 ${isCorrect === true ? "text-white" : "text-muted-foreground"
                          }`}
                      />
                    </div>
                    <span
                      className={`text-xl ${isCorrect === true ? "text-green-600" : "text-foreground"
                        }`}
                    >
                      Yes, Correct
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCorrect(false)}
                  className={`cursor-pointer p-6 rounded-lg border-2 transition-all ${isCorrect === false
                      ? "border-destructive bg-red-50"
                      : "border-border hover:border-red-300"
                    }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center ${isCorrect === false
                          ? "bg-destructive"
                          : "bg-muted"
                        }`}
                    >
                      <ThumbsDown
                        className={`w-8 h-8 ${isCorrect === false ? "text-white" : "text-muted-foreground"
                          }`}
                      />
                    </div>
                    <span
                      className={`text-xl ${isCorrect === false ? "text-destructive" : "text-foreground"
                        }`}
                    >
                      No, Incorrect
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Actual Disease Dropdown - Shows when "No" is selected */}
            {isCorrect === false && (
              <div className="bg-card rounded-lg shadow-lg border border-border p-6">
                <label htmlFor="actual-disease" className="block mb-4">
                  What is the actual condition?
                </label>
                <select
                  id="actual-disease"
                  value={actualDisease}
                  onChange={(e) => setActualDisease(e.target.value)}
                  className="cursor-pointer w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required={isCorrect === false}
                >
                  <option value="">Select the actual condition</option>
                  <optgroup label="Common Skin Conditions">
                    <option value="eczema">Eczema (Atopic Dermatitis)</option>
                    <option value="psoriasis">Psoriasis</option>
                    <option value="acne">Acne</option>
                    <option value="rosacea">Rosacea</option>
                    <option value="dermatitis-seborrheic">Seborrheic Dermatitis</option>
                  </optgroup>
                  <optgroup label="Infections">
                    <option value="fungal">Fungal Infection</option>
                    <option value="bacterial">Bacterial Infection</option>
                    <option value="viral">Viral Infection</option>
                    <option value="ringworm">Ringworm</option>
                  </optgroup>
                  <optgroup label="Allergic Reactions">
                    <option value="hives">Hives (Urticaria)</option>
                    <option value="drug-reaction">Drug Reaction</option>
                    <option value="food-allergy">Food Allergy</option>
                  </optgroup>
                  <optgroup label="Other">
                    <option value="skin-cancer">Skin Cancer</option>
                    <option value="melasma">Melasma</option>
                    <option value="vitiligo">Vitiligo</option>
                    <option value="lupus">Lupus</option>
                    <option value="other">Other (Not Listed)</option>
                    <option value="unsure">Unsure/Not Diagnosed</option>
                  </optgroup>
                </select>
              </div>
            )}

            {/* Additional Comments */}
            <div className="bg-card rounded-lg shadow-lg border border-border p-6">
              <label htmlFor="comments" className="block mb-4">
                Additional Comments <span className="text-muted-foreground">(Optional)</span>
              </label>
              <textarea
                id="comments"
                value={additionalComments}
                onChange={(e) => setAdditionalComments(e.target.value)}
                placeholder="Share any additional thoughts or details that might help us improve our AI..."
                rows={6}
                className="cursor-text w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            {/* Privacy Notice */}
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Privacy Notice:</strong> Your feedback is anonymous and will be used solely to improve our AI model. No personal health information will be shared with third parties.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isCorrect === null}
                className={`flex-1 py-4 rounded-lg transition-colors ${isCorrect === null
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
              >
                Submit Feedback
              </button>
              <button
                type="button"
                onClick={() => navigate("/results")}
                className="cursor-pointer px-8 py-4 bg-card border-2 border-border rounded-lg hover:bg-muted/30 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}