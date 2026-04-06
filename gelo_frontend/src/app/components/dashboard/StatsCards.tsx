import { Activity, CheckCircle2, AlertTriangle, Crosshair } from "lucide-react";

export function StatsCards({ scanHistory }: { scanHistory: any[] }) {
  // Compute some stats instead of totally hardcoding if possible,
  // but we can mix with static for demo based on user req:
  const totalScans = scanHistory.length.toString();
  const flagged = scanHistory.filter(s => s.diagnosis?.predictedDisease?.name && s.diagnosis.predictedDisease.name !== 'Normal').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard 
        title="Total Scans" 
        value={totalScans} 
        icon={Activity} 
        trend="+12% this month" 
        color="bg-blue-500" 
      />
      <StatCard 
        title="Pending Review" 
        value="3" 
        icon={CheckCircle2} 
        trend="Requires attention" 
        color="bg-amber-500" 
      />
      <StatCard 
        title="Flagged Cases" 
        value={flagged > 0 ? flagged.toString() : "1"} 
        icon={AlertTriangle} 
        trend="-2 since last week" 
        color="bg-red-500" 
      />
      <StatCard 
        title="AI Accuracy" 
        value="98.2%" 
        icon={Crosshair} 
        trend="+0.4% improvement" 
        color="bg-emerald-500" 
      />
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, color }: any) {
  const getColorClasses = (bgClass: string) => {
    switch (bgClass) {
      case 'bg-blue-500': return { text: 'text-blue-500', border: 'border-blue-100', dot: 'bg-blue-500' };
      case 'bg-amber-500': return { text: 'text-amber-500', border: 'border-amber-100', dot: 'bg-amber-500' };
      case 'bg-red-500': return { text: 'text-red-500', border: 'border-red-100', dot: 'bg-red-500' };
      case 'bg-emerald-500': return { text: 'text-emerald-500', border: 'border-emerald-100', dot: 'bg-emerald-500' };
      default: return { text: 'text-emerald-500', border: 'border-emerald-100', dot: 'bg-emerald-500' };
    }
  };
  
  const colors = getColorClasses(color);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col relative overflow-hidden group hover:shadow-md transition-all hover:-translate-y-0.5 duration-300">
      <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-[0.03] rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500`} />
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <p className="text-sm font-semibold text-slate-500 mb-1">{title}</p>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} bg-opacity-10 ${colors.border}`}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>
      </div>
      
      <div className="mt-auto pt-4 border-t border-slate-100 relative z-10">
        <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
          <span className={`inline-block w-2 h-2 rounded-full ${colors.dot}`} />
          {trend}
        </p>
      </div>
    </div>
  );
}
