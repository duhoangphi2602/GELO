import { Clock, Image as ImageIcon, Trash2, CheckCircle2, X } from "lucide-react";

interface PendingReviewsTableProps {
  scans: any[];
  isLoading: boolean;
  selectedIds: number[];
  isSelectedAll: boolean;
  isSomeSelected: boolean;
  onToggleAll: () => void;
  onToggleOne: (id: number) => void;
  onBulkDelete: () => void;
  onBulkApprove: () => void;
  onBulkReject: () => void;
  onOpenReview: (scan: any) => void;
}

export function PendingReviewsTable({
  scans,
  isLoading,
  selectedIds,
  isSelectedAll,
  isSomeSelected,
  onToggleAll,
  onToggleOne,
  onBulkDelete,
  onBulkApprove,
  onBulkReject,
  onOpenReview
}: PendingReviewsTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-black flex items-center gap-2 text-slate-800">
            <Clock className="w-5 h-5 text-amber-500" /> Pending AI Reviews
          </h3>
          {scans.length > 0 && (
            <label className="flex items-center gap-1.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={isSelectedAll}
                onChange={onToggleAll}
                className="w-4 h-4 rounded border-slate-300 text-[#2a64ad] focus:ring-[#2a64ad] cursor-pointer"
              />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors mt-0.5">
                Select All
              </span>
            </label>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isSomeSelected && (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
              <span className="text-[10px] font-black text-[#2a64ad] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                {selectedIds.length} SELECTED
              </span>
              <button
                onClick={onBulkApprove}
                className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition-all shadow-sm"
              >
                <CheckCircle2 size={12} /> Approve
              </button>
              <button
                onClick={onBulkReject}
                className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-amber-700 transition-all shadow-sm"
              >
                <X size={12} /> Reject
              </button>
              <button
                onClick={onBulkDelete}
                className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-rose-700 transition-all shadow-sm"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}
          <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 uppercase tracking-tight">
            {scans.length} Cases
          </span>
        </div>
      </div>

      <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="space-y-4 p-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-[1.5rem] border border-slate-100 bg-slate-100 h-28 shadow-sm" />
            ))
          ) : scans.length > 0 ? (
            <ul className="space-y-4">
              {scans.map((scan: any) => (
                <li
                  key={scan.scanId}
                  className={`grid gap-4 rounded-[1.5rem] border p-4 shadow-sm transition-colors ${selectedIds.includes(scan.scanId) ? 'border-[#2a64ad]/30 bg-[#eff6ff]' : 'border-slate-100 bg-white'} xl:grid-cols-[auto_1.4fr_1fr_96px_96px_96px] xl:items-center`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(scan.scanId)}
                      onChange={() => onToggleOne(scan.scanId)}
                      className="mt-1 w-4 h-4 rounded border-slate-300 text-[#2a64ad] focus:ring-[#2a64ad] cursor-pointer"
                    />
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-white shadow-sm ring-1 ring-slate-100">
                        {scan.imageUrl ? (
                          <img src={scan.imageUrl} alt="Scan" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-800 truncate">#{scan.scanId}</p>
                        <p className="text-[10px] text-slate-400 font-bold truncate leading-tight">{scan.patientName}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Disease Code</p>
                    <p className="text-xs font-black uppercase tracking-tight text-slate-800 truncate">{scan.predictedDiseaseCode || 'UNKNOWN'}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Prediction</p>
                    <p className="text-xs font-black uppercase tracking-tight text-[#2a64ad] truncate">{scan.prediction}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">{scan.confidence <= 1 ? (scan.confidence * 100).toFixed(0) : scan.confidence}% Match</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quality</p>
                    <p className="text-xs font-black uppercase tracking-tight">
                      {scan.imageQuality === 'CLEAR' ? 'SHARP' : 'BLUR'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-black uppercase tracking-tighter text-amber-600 border border-amber-100">
                      <Clock size={12} /> Pending
                    </span>
                  </div>

                  <div className="flex justify-end xl:justify-end">
                    <button
                      onClick={() => onOpenReview(scan)}
                      className="cursor-pointer whitespace-nowrap px-3 py-1.5 bg-[#2a64ad] text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-[#1e4e8c] transition-all active:scale-95 shadow-sm"
                    >
                      Review
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-[1.5rem] border border-slate-100 p-10 text-center text-slate-400 italic">
              <p className="text-xs font-bold uppercase tracking-[0.2em]">All Caught Up!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
