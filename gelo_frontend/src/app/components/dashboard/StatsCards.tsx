import { Scan, ShieldAlert, Stethoscope, CheckCircle2 } from "lucide-react";

export function StatsCards({ scanHistory }: { scanHistory: any[] }) {
  const totalScans = scanHistory.length;
  const diseasesDetected = scanHistory.filter(s => s.diagnosis?.diagnosticStatus === 'DISEASE').length;
  const awaitingReview = scanHistory.filter(s => !s.diagnosis?.isReviewed && s.diagnosis?.diagnosticStatus === 'DISEASE').length;
  const healthy = scanHistory.filter(s => s.diagnosis?.diagnosticStatus === 'HEALTHY').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        title="Total Scans"
        value={totalScans.toString()}
        description={totalScans === 0 ? "No scans yet" : totalScans === 1 ? "1 scan completed" : `${totalScans} scans completed`}
        icon={Scan}
        color="bg-blue-500"
        bgLight="bg-blue-50"
        textColor="text-blue-600"
      />
      <StatCard
        title="Diseases Detected"
        value={diseasesDetected.toString()}
        description={diseasesDetected === 0 ? "All scans look healthy" : `${diseasesDetected} case${diseasesDetected > 1 ? 's' : ''} flagged`}
        icon={ShieldAlert}
        color="bg-rose-500"
        bgLight="bg-rose-50"
        textColor="text-rose-600"
      />
      <StatCard
        title="Awaiting Review"
        value={awaitingReview.toString()}
        description={awaitingReview === 0 ? "All clear — no pending reviews" : `${awaitingReview} case${awaitingReview > 1 ? 's' : ''} need attention`}
        icon={awaitingReview > 0 ? Stethoscope : CheckCircle2}
        color={awaitingReview > 0 ? "bg-amber-500" : "bg-emerald-500"}
        bgLight={awaitingReview > 0 ? "bg-amber-50" : "bg-emerald-50"}
        textColor={awaitingReview > 0 ? "text-amber-600" : "text-emerald-600"}
      />
    </div>
  );
}


function StatCard({ title, value, description, icon: Icon, color, bgLight, textColor }: any) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all group`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${bgLight} flex items-center justify-center ${textColor} group-hover:scale-110 transition-transform`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={`text-3xl font-black text-slate-800 tabular-nums`}>{value}</span>
      </div>
      <p className="text-sm font-semibold text-slate-700 mb-1">{title}</p>
      <p className="text-xs text-slate-400 leading-snug">{description}</p>
    </div>
  );
}