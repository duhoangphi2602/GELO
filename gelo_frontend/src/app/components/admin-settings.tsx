import { useState, useEffect } from "react";
import api from "../lib/api";
import { Save, RefreshCw, Cpu, Activity, AlertTriangle, Box } from "lucide-react";
import { useToastContext } from "./ui/ToastContext";

export function AdminSettings() {
  const [config, setConfig] = useState<any>(null);
  const [diseases, setDiseases] = useState<any[]>([]);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToastContext();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch models first to trigger backend Auto-Sync of new diseases
      const modelsRes = await api.get("/scans/admin/models");

      const [configRes, diseasesRes] = await Promise.all([
        api.get("/scans/admin/ai-settings"),
        api.get("/scans/admin/diseases"),
      ]);

      setConfig(configRes.data);
      setDiseases(diseasesRes.data);
      setAvailableModels(modelsRes.data);
      setSelectedVersion(configRes.data.version);
    } catch (err) {
      console.error("Failed to fetch settings", err);
      toast.error("Failed to load AI configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/scans/admin/ai-settings", {
        version: selectedVersion,
        inference_threshold: config.inference_threshold,
        enabled_disease_codes: config.enabled_disease_codes
      });
      toast.success("AI Configuration updated & reloaded successfully!");
      fetchData(); // Refresh to get active state
    } catch (err) {
      console.error(err);
      toast.error("Failed to save AI configuration");
    } finally {
      setSaving(false);
    }
  };

  const toggleDisease = (code: string) => {
    const currentList = config.enabled_disease_codes || [];
    const isEnabled = currentList.includes(code);

    let newList;
    if (isEnabled) {
      newList = currentList.filter((dCode: string) => dCode !== code);
    } else {
      newList = [...currentList, code];
    }

    setConfig({ ...config, enabled_disease_codes: newList });
  };

  useEffect(() => {
    if (config && availableModels.length > 0 && selectedVersion) {
      const activeModel = availableModels.find(m => m.version === selectedVersion);
      if (activeModel && activeModel.supported_labels) {
        const supportedCodes = activeModel.supported_labels.map((l: any) => l.code);
        const currentEnabled = config.enabled_disease_codes || [];
        const validEnabled = currentEnabled.filter((code: string) => supportedCodes.includes(code));

        if (validEnabled.length !== currentEnabled.length) {
          setConfig({ ...config, enabled_disease_codes: validEnabled });
          const removed = currentEnabled.filter((code: string) => !supportedCodes.includes(code));
          toast.success(`Disabled unsupported diseases: ${removed.join(', ')}`);
        }
      }
    }
  }, [selectedVersion, availableModels]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="bg-rose-50 text-rose-600 p-6 rounded-2xl border border-rose-100 flex items-start gap-4">
        <AlertTriangle className="w-6 h-6 flex-shrink-0" />
        <div>
          <h3 className="font-bold">Failed to load Configuration</h3>
          <p className="text-sm mt-1">Could not connect to the AI Service or Backend API. Please ensure the services are running.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header Info */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#2a64ad]/10 flex items-center justify-center text-[#2a64ad]">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">AI Engine Configuration</h3>
            <p className="text-sm text-muted-foreground">Modify parameters and hot-reload the model without downtime.</p>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100">
            <Activity className="w-3.5 h-3.5" /> Active Version: {config.version || "v1"}
          </span>
          <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider font-bold">Architecture: {config.architecture || "Unknown"}</p>
        </div>
      </div>

      {/* Model Package Selection */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-lg text-foreground">Active Model Package</h4>
            <p className="text-sm text-muted-foreground">Select a trained model package from the <code>model_package</code> directory.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableModels.map((model) => (
            <div
              key={model.version}
              onClick={() => setSelectedVersion(model.version)}
              className={`cursor-pointer p-4 rounded-xl border-2 transition-all group ${selectedVersion === model.version
                ? "border-[#2a64ad] bg-blue-50/50 ring-4 ring-blue-100"
                : "border-border hover:border-[#2a64ad]/30 bg-muted/10"
                }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded ${selectedVersion === model.version ? "bg-[#2a64ad] text-white" : "bg-muted text-muted-foreground"
                  }`}>
                  {model.version}
                </span>
                {model.is_active && (
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> LIVE
                  </span>
                )}
              </div>
              <p className={`font-bold text-base ${selectedVersion === model.version ? "text-[#2a64ad]" : "text-foreground"}`}>
                {model.name}
              </p>
              <div className="mt-3 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-2">
                  Arch: <span className="text-foreground">{model.architecture}</span>
                </p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-2">
                  Date: <span className="text-foreground">{model.created_at}</span>
                </p>
              </div>
            </div>
          ))}

          {availableModels.length === 0 && (
            <div className="col-span-full py-8 text-center border-2 border-dashed border-border rounded-2xl">
              <p className="text-sm text-muted-foreground">No model packages found in <code>model_package/</code> directory.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inference Threshold */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
          <div>
            <h4 className="font-bold text-lg text-foreground flex items-center gap-2 mb-2">
              Inference Threshold
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Determines the minimum confidence required for a positive diagnosis.
              Values below this threshold will result in an "Analysis Inconclusive" (Unknown) status,
              flagging the scan for manual review.
            </p>
          </div>

          <div className="bg-muted/30 p-6 rounded-xl border border-border">
            <div className="flex justify-between items-end mb-4">
              <span className="text-3xl font-black text-[#2a64ad]">
                {config.inference_threshold?.toFixed(2) || "0.70"}
              </span>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Current Value
              </span>
            </div>

            <input
              type="range"
              min="0.1" max="0.99" step="0.01"
              value={config.inference_threshold || 0.70}
              onChange={(e) => setConfig({ ...config, inference_threshold: parseFloat(e.target.value) })}
              className="w-full accent-[#2a64ad]"
            />

            <div className="flex justify-between text-xs text-muted-foreground mt-2 font-medium">
              <span>More Sensitive (0.1)</span>
              <span>More Strict (0.99)</span>
            </div>
          </div>
        </div>

        {/* Dynamic Labels */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
          <div>
            <h4 className="font-bold text-lg text-foreground mb-2">
              Supported Diseases
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Select which diseases the AI is allowed to diagnose. If the model predicts an unselected disease, it will automatically fallback to "Analysis Inconclusive".
            </p>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {(() => {
              const activeModel = availableModels.find(m => m.version === selectedVersion);
              console.log("AdminSettings Debug:", { selectedVersion, activeModel, diseasesCount: diseases.length });

              if (!activeModel) {
                return <p className="text-sm text-muted-foreground italic p-4 bg-muted/20 rounded-xl border border-dashed text-center">Please select a model version to see supported diseases. (Selected: {selectedVersion})</p>;
              }

              const supportedCodes = (activeModel.supported_labels || []).map((l: any) => l.code);
              console.log("Supported Codes:", supportedCodes);
              
              const filteredDiseases = diseases.filter(disease => {
                const match = supportedCodes.includes(disease.code);
                if (!match) console.log(`Disease ${disease.name} (Code: ${disease.code}) not in supportedCodes`);
                return match;
              });

              if (filteredDiseases.length === 0) {
                return (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground italic p-4 bg-muted/20 rounded-xl border border-dashed text-center">
                      No diseases in your database match the codes supported by this model.
                    </p>
                    <div className="text-[10px] text-muted-foreground font-mono bg-slate-50 p-2 rounded">
                      Model Codes: {JSON.stringify(supportedCodes)} <br/>
                      DB Codes: {JSON.stringify(diseases.map(d => d.code))}
                    </div>
                  </div>
                );
              }

              return filteredDiseases.map(disease => {
                const isEnabled = (config.enabled_disease_codes || []).includes(disease.code);

                return (
                  <div
                    key={disease.id}
                    onClick={() => toggleDisease(disease.code)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${isEnabled
                      ? "border-[#2a64ad] bg-blue-50/50 shadow-sm"
                      : "border-border bg-muted/20 hover:bg-muted/50"
                      }`}
                  >
                    <div className="flex-1">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <p className={`font-bold ${isEnabled ? "text-[#2a64ad]" : "text-muted-foreground"}`}>
                            {disease.name}
                          </p>
                          <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100 uppercase tracking-tighter">In Model</span>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          Code: {disease.code}
                        </p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <div className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors ${isEnabled ? 'bg-[#2a64ad]' : 'bg-muted-foreground/30'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="cursor-pointer flex items-center gap-2 px-6 py-3 bg-[#2a64ad] text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:bg-[#1e4e8c] hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? "Deploying Configuration..." : "Save & Hot-Reload AI"}
        </button>
      </div>

    </div>
  );
}
