import { ExternalLink, ShieldCheck, AlertCircle, Trash2, Table } from "lucide-react";

interface VerifiedDataTableProps {
  data: any[];
  isLoading: boolean;
  selectedIds: number[];
  isSelectedAll: boolean;
  onToggleAll: () => void;
  onToggleOne: (id: number) => void;
  onDelete: (scanId: number) => void;
}

export function VerifiedDataTable({
  data,
  isLoading,
  selectedIds,
  isSelectedAll,
  onToggleAll,
  onToggleOne,
}: VerifiedDataTableProps) {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left table-auto min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-4 py-5 w-12 text-center">
                <input
                  type="checkbox"
                  checked={isSelectedAll}
                  onChange={onToggleAll}
                  className="w-4 h-4 rounded border-slate-300 text-[#2a64ad] focus:ring-[#2a64ad] cursor-pointer"
                />
              </th>
              <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Scan</th>
              <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Predicted</th>
              <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Verified</th>
              <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
              <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
              <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={7} className="px-4 py-6">
                    <div className="h-6 bg-slate-100 rounded-xl w-full" />
                  </td>
                </tr>
              ))
            ) : data.length > 0 ? (
              data.map((item: any) => (
                <tr
                  key={item.feedbackId}
                  className={`hover:bg-slate-50/50 transition-colors ${
                    selectedIds.includes(item.scanId) ? "bg-blue-50/40" : ""
                  }`}
                >
                  <td className="px-4 py-5 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.scanId)}
                      onChange={() => onToggleOne(item.scanId)}
                      className="w-4 h-4 rounded border-slate-300 text-[#2a64ad] focus:ring-[#2a64ad] cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 overflow-hidden border border-white shadow-sm ring-1 ring-slate-100">
                        <img src={item.imageUrl} alt="Scan" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] font-black font-mono text-slate-400">#{item.scanId}</span>
                    </div>
                  </td>
                  <td className="px-4 py-5 text-[10px] font-black text-slate-500 uppercase tracking-tight">
                    {item.predictedDisease}
                  </td>
                  <td className="px-4 py-5">
                    <span className="text-[9px] font-black text-[#2a64ad] bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 uppercase tracking-tighter">
                      {item.actualDisease}
                    </span>
                  </td>
                  <td className="px-4 py-5">
                    {item.isCorrect ? (
                      <div className="flex items-center gap-1 text-emerald-600 font-black text-[9px] uppercase tracking-tighter">
                        <ShieldCheck size={14} /> Confirmed
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-rose-600 font-black text-[9px] uppercase tracking-tighter">
                        <AlertCircle size={14} /> Corrected
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-5 text-[10px] font-black text-slate-400">
                    {new Date(item.reviewedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-5 text-right">
                    <a
                      href={item.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex p-2 hover:bg-[#2a64ad]/10 rounded-xl text-slate-400 hover:text-[#2a64ad] transition-all"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-20 text-center text-slate-300 italic">
                  <Table size={40} className="mx-auto mb-4 opacity-10" />
                  <p className="text-xs font-bold uppercase tracking-[0.2em]">No clinical data yet</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
