import { useState } from "react";
import { AdminLayout } from "./admin-layout";
import { Save, AlertTriangle, Heart, CheckCircle } from "lucide-react";

export function AdviceConfiguration() {
  const [selectedDisease, setSelectedDisease] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [careAdvice, setCareAdvice] = useState("");
  const [lifestyleAdvice, setLifestyleAdvice] = useState("");
  const [emergencyWarnings, setEmergencyWarnings] = useState("");
  const [savedMessage, setSavedMessage] = useState(false);

  const diseases = [
    "Contact Dermatitis",
    "Eczema",
    "Psoriasis",
    "Acne Vulgaris",
    "Rosacea",
    "Seborrheic Dermatitis",
    "Fungal Infection",
    "Bacterial Infection",
  ];

  const categories = [
    { value: "care", label: "Care Advice", icon: Heart },
    { value: "lifestyle", label: "Lifestyle Recommendations", icon: CheckCircle },
    { value: "warning", label: "Emergency Warnings", icon: AlertTriangle },
  ];

  const handleSave = () => {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const loadExistingAdvice = () => {
    if (selectedDisease === "Contact Dermatitis") {
      setCareAdvice("• Apply a gentle, fragrance-free moisturizer twice daily to affected areas\n• Use mild, hypoallergenic soaps and avoid harsh chemicals\n• Consider over-the-counter hydrocortisone cream for inflammation\n• Keep the affected area clean and dry\n• Avoid scratching to prevent secondary infection");
      setLifestyleAdvice("• Identify and avoid triggers (certain fabrics, detergents, or plants)\n• Wear breathable, loose-fitting cotton clothing\n• Maintain a healthy diet rich in anti-inflammatory foods\n• Stay hydrated by drinking plenty of water throughout the day\n• Manage stress through relaxation techniques or exercise");
      setEmergencyWarnings("• Severe swelling or spreading rash\n• Signs of infection (fever, pus, increased warmth)\n• Difficulty breathing or swallowing\n• No improvement after 2 weeks of home treatment\n• Symptoms affecting large areas of your body");
    }
  };

  return (
    <AdminLayout
      title="Advice Configuration"
      subtitle="Configure medical advice and warnings for each disease"
    >
      <div className="space-y-6">
        {/* Success Message */}
        {savedMessage && (
          <div className="bg-green-50 border border-green-300 text-green-800 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <p>Advice configuration saved successfully!</p>
          </div>
        )}

        {/* Selection Controls */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="mb-6">Select Disease & Category</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Disease Dropdown */}
            <div>
              <label htmlFor="disease" className="block mb-2">
                Disease
              </label>
              <select
                id="disease"
                value={selectedDisease}
                onChange={(e) => {
                  setSelectedDisease(e.target.value);
                  if (e.target.value) loadExistingAdvice();
                }}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a disease...</option>
                {diseases.map((disease) => (
                  <option key={disease} value={disease}>
                    {disease}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Dropdown */}
            <div>
              <label htmlFor="category" className="block mb-2">
                Advice Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!selectedDisease}
              >
                <option value="">Select a category...</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedDisease && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Currently editing:</strong> {selectedDisease}
              </p>
            </div>
          )}
        </div>

        {/* Advice Editor Tabs */}
        {selectedDisease && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Care Advice */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="bg-primary/10 px-6 py-4 border-b border-border flex items-center gap-3">
                <Heart className="w-5 h-5 text-primary" />
                <h3 className="text-primary">Care Advice</h3>
              </div>
              <div className="p-6">
                <label htmlFor="care" className="block mb-3 text-sm text-muted-foreground">
                  Recommended care instructions
                </label>
                <textarea
                  id="care"
                  value={careAdvice}
                  onChange={(e) => setCareAdvice(e.target.value)}
                  rows={12}
                  placeholder="• First care instruction&#10;• Second care instruction&#10;• Third care instruction..."
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Use bullet points (•) for each instruction
                </p>
              </div>
            </div>

            {/* Lifestyle Advice */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="bg-green-50 px-6 py-4 border-b border-border flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="text-green-600">Lifestyle Recommendations</h3>
              </div>
              <div className="p-6">
                <label htmlFor="lifestyle" className="block mb-3 text-sm text-muted-foreground">
                  Lifestyle and prevention tips
                </label>
                <textarea
                  id="lifestyle"
                  value={lifestyleAdvice}
                  onChange={(e) => setLifestyleAdvice(e.target.value)}
                  rows={12}
                  placeholder="• First lifestyle tip&#10;• Second lifestyle tip&#10;• Third lifestyle tip..."
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Use bullet points (•) for each recommendation
                </p>
              </div>
            </div>

            {/* Emergency Warnings */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="bg-destructive/10 px-6 py-4 border-b border-border flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <h3 className="text-destructive">Emergency Warnings</h3>
              </div>
              <div className="p-6">
                <label htmlFor="warnings" className="block mb-3 text-sm text-muted-foreground">
                  Critical warning signs requiring immediate medical attention
                </label>
                <textarea
                  id="warnings"
                  value={emergencyWarnings}
                  onChange={(e) => setEmergencyWarnings(e.target.value)}
                  rows={12}
                  placeholder="• First warning sign&#10;• Second warning sign&#10;• Third warning sign..."
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Use bullet points (•) for each warning
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Preview Section */}
        {selectedDisease && selectedCategory && (
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="mb-4">Preview</h3>
            <div className="bg-muted/30 rounded-lg p-6">
              <h4 className="mb-3">
                {categories.find(c => c.value === selectedCategory)?.label}
              </h4>
              <div className="space-y-2">
                {selectedCategory === "care" && careAdvice.split('\n').filter(line => line.trim()).map((line, idx) => (
                  <p key={idx} className="text-sm">{line}</p>
                ))}
                {selectedCategory === "lifestyle" && lifestyleAdvice.split('\n').filter(line => line.trim()).map((line, idx) => (
                  <p key={idx} className="text-sm">{line}</p>
                ))}
                {selectedCategory === "warning" && emergencyWarnings.split('\n').filter(line => line.trim()).map((line, idx) => (
                  <p key={idx} className="text-sm text-destructive">{line}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {selectedDisease && (
          <div className="flex justify-end gap-4">
            <button
              onClick={() => {
                setSelectedDisease("");
                setSelectedCategory("");
                setCareAdvice("");
                setLifestyleAdvice("");
                setEmergencyWarnings("");
              }}
              className="px-6 py-3 bg-card border-2 border-border rounded-lg hover:bg-muted/30 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Save className="w-5 h-5" />
              Save Configuration
            </button>
          </div>
        )}

        {/* Help Text */}
        {!selectedDisease && (
          <div className="bg-muted/30 rounded-lg p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              Select a disease to begin configuring advice
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
