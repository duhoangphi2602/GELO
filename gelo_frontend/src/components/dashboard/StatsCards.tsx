import { Scan, ShieldAlert, Stethoscope, CheckCircle2 } from "lucide-react";

export function StatsCards({ scans = [] }: { scans: any[] }) {
  const totalScans = (scans || []).length;
  const diseasesDetected = (scans || []).filter(s => s.diagnosis?.diagnosticStatus === 'DISEASE').length;
  const awaitingReview = (scans || []).filter(s =>
    s.diagnosis?.diagnosticStatus === 'DISEASE' &&
    !s.feedback?.some((f: any) => f.role === 'ADMIN')
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        title="Total Diagnostic Scans"
        value={totalScans.toString()}
        description={totalScans === 0 ? "No clinical scans recorded" : totalScans === 1 ? "1 primary scan analyzed" : `${totalScans} total scans analyzed`}
        icon={Scan}
        bgLight="bg-blue-50/50"
        textColor="text-[#2a64ad]"
        accentColor="bg-[#2a64ad]"
      />
      <StatCard
        title="Conditions Identified"
        value={diseasesDetected.toString()}
        description={diseasesDetected === 0 ? "AI results within normal range" : `${diseasesDetected} positive case${diseasesDetected > 1 ? 's' : ''} detected`}
        icon={ShieldAlert}
        bgLight="bg-rose-50/50"
        textColor="text-rose-600"
        accentColor="bg-rose-500"
      />
      <StatCard
        title="Consultation Pipeline"
        value={awaitingReview.toString()}
        description={awaitingReview === 0 ? "All analyses verified" : `${awaitingReview} case${awaitingReview > 1 ? 's' : ''} pending review`}
        icon={awaitingReview > 0 ? Stethoscope : CheckCircle2}
        bgLight={awaitingReview > 0 ? "bg-amber-50/50" : "bg-emerald-50/50"}
        textColor={awaitingReview > 0 ? "text-amber-600" : "text-emerald-600"}
        accentColor={awaitingReview > 0 ? "bg-amber-500" : "bg-emerald-500"}
      />
    </div>
  );
}


function StatCard({ title, value, description, icon: Icon, bgLight, textColor, accentColor }: any) {
  return (
    <div className={`bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative`}>
      <div className={`absolute top-0 right-0 w-32 h-32 ${bgLight} rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-125 duration-700`} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className={`w-12 h-12 rounded-2xl ${bgLight} flex items-center justify-center ${textColor} border border-white/50 shadow-sm group-hover:bg-white group-hover:shadow-md transition-all`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex flex-col items-end">
             <span className={`text-3xl font-black text-slate-800 tabular-nums tracking-tighter`}>{value}</span>
             <div className={`h-1 w-8 ${accentColor} rounded-full mt-1 opacity-20 group-hover:opacity-100 group-hover:w-12 transition-all duration-500`} />
          </div>
        </div>
        
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{title}</p>
        <p className="text-xs font-bold text-slate-600 group-hover:text-slate-800 transition-colors">{description}</p>
      </div>
    </div>
  );
}