import { Download } from "lucide-react";

export function ReportTable() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800">Detailed Report</h3>
        <button className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold border-b border-slate-100">Date</th>
              <th className="px-6 py-4 font-semibold border-b border-slate-100">Result</th>
              <th className="px-6 py-4 font-semibold border-b border-slate-100">Confidence</th>
              <th className="px-6 py-4 font-semibold border-b border-slate-100">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            <tr className="cursor-pointer hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4 text-slate-600 font-medium">Apr 5, 2026</td>
              <td className="px-6 py-4 font-bold text-slate-800">Normal</td>
              <td className="px-6 py-4 text-emerald-600 font-semibold">98.2%</td>
              <td className="px-6 py-4">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                  Completed
                </span>
              </td>
            </tr>
            <tr className="cursor-pointer hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4 text-slate-600 font-medium">Mar 28, 2026</td>
              <td className="px-6 py-4 font-bold text-slate-800">Mild Eczema</td>
              <td className="px-6 py-4 text-emerald-600 font-semibold">91.4%</td>
              <td className="px-6 py-4">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                  Completed
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}