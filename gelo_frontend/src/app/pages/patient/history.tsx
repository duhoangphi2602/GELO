import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { History, Trash2, Activity, Calendar } from "lucide-react";
import { useNavigate } from "react-router";
import { scanService } from "@/services/scan.service";
import { Layout } from "@/components/shared/layout/Layout";
import { useToastContext } from "@/components/shared/ui/ToastContext";
import { ConfirmModal } from "@/components/shared/ui/ConfirmModal";
import { useAuth } from "@/hooks/useAuth";

export function ScanHistory() {
  const navigate = useNavigate();
  const toast = useToastContext();
  const queryClient = useQueryClient();
  const { patientId } = useAuth();

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    onConfirm: () => { },
    isDanger: true
  });

  const { data: scans = [], isLoading } = useQuery({
    queryKey: ["scans", patientId],
    queryFn: () => scanService.getPatientScans(patientId || 1),
    enabled: !!patientId || true,
  });

  const deleteMutation = useMutation({
    mutationFn: (scanId: number) => scanService.deleteScan(scanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scans"] });
      toast.success("Deleted", "Scan record removed successfully.");
    },
    onError: () => toast.error("Error", "Failed to delete the record."),
  });

  const clearAllMutation = useMutation({
    mutationFn: () => scanService.clearAllHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scans"] });
      toast.success("Success", "All history has been cleared.");
    },
    onError: () => toast.error("Error", "Failed to clear history."),
  });

  const handleDelete = (e: any, scanId: number) => {
    e.stopPropagation();
    setModalConfig({
      title: "Delete Scan Record",
      message: "Are you sure you want to permanently remove this diagnostic record? This action cannot be undone.",
      isDanger: true,
      onConfirm: () => deleteMutation.mutate(scanId)
    });
    setModalOpen(true);
  };

  const handleDeleteAllHistory = () => {
    setModalConfig({
      title: "Wipe All Scan History",
      message: "WARNING: This will permanently delete ALL your scan history and related diagnostic reports. There is no recovery after this action.",
      isDanger: true,
      onConfirm: () => clearAllMutation.mutate()
    });
    setModalOpen(true);
  };

  const navigateToResult = (scanId: number) => {
    localStorage.setItem("currentScanId", scanId.toString());
    navigate("/patient/results");
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-[#2a64ad] flex items-center justify-center shadow-sm">
                <History className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="space-y-0">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-slate-100 rounded-md text-[8px] font-black uppercase text-slate-500 tracking-widest">Records</span>
                  <span className="text-[9px] font-bold text-slate-400">{scans.length} Items</span>
                </div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">History Archives</h2>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDeleteAllHistory}
            disabled={isLoading || scans.length === 0}
            className="flex items-center gap-2 cursor-pointer bg-white border border-slate-200 text-slate-400 px-3 py-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors font-black text-[9px] uppercase tracking-widest disabled:opacity-50"
          >
            <Trash2 className="w-3 h-3" />
            Clear Data
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-slate-50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : scans.length > 0 ? (
          <div className="space-y-2">
            {scans.map((scan: any) => {
              const diagnosis = scan.diagnosis;
              const decision = diagnosis?.decision || "low_confidence";
              const confidence = diagnosis?.aiConfidence ?? 0;
              const imageUrl = scan.images?.[0]?.imageUrl;
              const isHigh = decision === 'high_confidence';
              const statusColor = isHigh ? "text-emerald-600" : "text-amber-600";

              return (
                <div
                  key={scan.id}
                  onClick={() => navigateToResult(scan.id)}
                  className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition-colors cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Scan" className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Activity className="w-4 h-4 text-slate-300" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 text-sm truncate">
                        {diagnosis?.predictedDisease?.name || "Processing Analysis..."}
                      </h3>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${isHigh ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-900'}`}>
                        {isHigh ? 'Accurate' : 'Low Conf.'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-400 font-medium">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(scan.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1 font-bold">
                        Match: <span className={statusColor}>{confidence}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-2">
                    <button
                      onClick={(e) => handleDelete(e, scan.id)}
                      className="cursor-pointer p-2 hover:bg-rose-500 hover:text-white text-slate-300 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-50/50 border border-slate-100 border-dashed rounded-[2rem] py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 border border-slate-50">
              <History className="w-8 h-8 text-slate-200" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Your Archives are Empty</h3>
            <p className="text-slate-500 font-medium mb-8 max-w-sm mx-auto text-sm leading-relaxed">
              Every professional skin assessment you perform will be stored here for tracking and clinical comparison.
            </p>
            <button
              onClick={() => navigate("/patient/scan")}
              className="cursor-pointer bg-slate-900 text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
            >
              Initialize First Scan
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        isDanger={modalConfig.isDanger}
      />
    </Layout>
  );
}

export default ScanHistory;
