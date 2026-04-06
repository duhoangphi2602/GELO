import { Layout } from "../layout/Layout";
import { ReportTable } from "./ReportTable";

export function Reports() {
  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-slate-800">Reports & Analytics</h1>
          <p className="text-slate-500 mt-1">Overview of your activity and system statistics.</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
            <p className="text-sm font-semibold text-slate-500 mb-1">Total Scans</p>
            <h3 className="text-3xl font-black text-slate-800">12</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
            <p className="text-sm font-semibold text-slate-500 mb-1">Success Rate</p>
            <h3 className="text-3xl font-black text-slate-800">98%</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
            <p className="text-sm font-semibold text-slate-500 mb-1">Flagged Cases</p>
            <h3 className="text-3xl font-black text-slate-800">1</h3>
          </div>
        </div>

        {/* Chart Placeholder */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 h-64 flex items-center justify-center">
          <p className="text-slate-400 font-semibold border-2 border-dashed border-slate-200 p-8 rounded-xl w-full h-full flex items-center justify-center">
            Chart Placeholder
          </p>
        </div>

        {/* Report Table */}
        <ReportTable />
      </div>
    </Layout>
  );
}
