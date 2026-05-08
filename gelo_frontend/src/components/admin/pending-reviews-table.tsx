import { Clock, Image as ImageIcon, Trash2 } from "lucide-react";

interface PendingReviewsTableProps {
  scans: any[];
  isLoading: boolean;
  selectedIds: number[];
  isSelectedAll: boolean;
  isSomeSelected: boolean;
  onToggleAll: () => void;
  onToggleOne: (id: number) => void;
  onBulkDelete: () => void;
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
  onOpenReview
}: PendingReviewsTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-lg font-black flex items-center gap-2 text-slate-800">
          <Clock className="w-5 h-5 text-amber-500" /> Pending AI Reviews
        </h3>
        <div className="flex items-center gap-3">
          {isSomeSelected && (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
              <span className="text-[10px] font-black text-[#2a64ad] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                {selectedIds.length} SELECTED
              </span>
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
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left table-fixed">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-3 py-3 w-[40px] text-center">
                  <input
                    type="checkbox"
                    checked={isSelectedAll}
                    onChange={onToggleAll}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-[#2a64ad] focus:ring-[#2a64ad] cursor-pointer"
                  />
                </th>
                <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[210px]">Scan Details</th>
                <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[170px]">AI Prediction</th>
                <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center w-[80px]">Quality</th>
                <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center w-[80px]">Status</th>
                <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right w-[80px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-5"><div className="w-4 h-4 bg-slate-100 rounded mx-auto" /></td>
                    <td className="px-4 py-5"><div className="h-10 bg-slate-100 rounded-xl w-40" /></td>
                    <td className="px-4 py-5"><div className="h-10 bg-slate-100 rounded-xl w-32" /></td>
                    <td className="px-4 py-5"><div className="h-6 bg-slate-100 rounded-lg w-16 mx-auto" /></td>
                    <td className="px-4 py-5"><div className="h-6 bg-slate-100 rounded-full w-20 mx-auto" /></td>
                    <td className="px-4 py-5"><div className="h-8 bg-slate-100 rounded-xl w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : scans.length > 0 ? (
                scans.map((scan: any) => (
                  <tr key={scan.scanId} className={`group hover:bg-slate-50/80 transition-colors ${selectedIds.includes(scan.scanId) ? 'bg-blue-50/40' : ''}`}>
                    <td className="px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(scan.scanId)}
                        onChange={() => onToggleOne(scan.scanId)}
                        className="w-3 h-3 rounded border-slate-300 text-[#2a64ad] focus:ring-[#2a64ad] cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-white shadow-sm ring-1 ring-slate-100 group/img">
                          {scan.imageUrl ? (
                            <img
                              src={scan.imageUrl}
                              alt="Scan"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-125"
                            />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-slate-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-800 truncate">#{scan.scanId}</p>
                          <p className="text-[10px] text-slate-400 font-bold truncate max-w-[140px] leading-tight">{scan.patientName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-black text-[#2a64ad] truncate uppercase tracking-tight leading-none">{scan.prediction}</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                          {scan.confidence <= 1 ? (scan.confidence * 100).toFixed(0) : scan.confidence}% Match
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {scan.imageQuality === "CLEAR" ? (
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded border border-emerald-100 tracking-tighter">SHARP</span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[8px] font-black rounded border border-rose-100 tracking-tighter">BLUR</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="inline-flex items-center gap-0.5 text-[8px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 uppercase tracking-tighter">
                        <Clock size={8} /> PEND
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={() => onOpenReview(scan)}
                        className="cursor-pointer px-3 py-1.5 bg-[#2a64ad] text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-[#1e4e8c] transition-all active:scale-95 shadow-sm"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-20 text-center text-slate-300 italic">
                    <p className="text-xs font-bold uppercase tracking-[0.2em]">All Caught Up!</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
