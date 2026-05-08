import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/shared/layout/Layout";
import { ReportTable } from "@/components/shared/ui/ReportTable";
import { scanService } from "@/services/scan.service";
import { diaryService } from "@/services/diary.service";
import { useAuth } from "@/hooks/useAuth";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';

export function PatientReports() {
  const { patientId } = useAuth();
  
  const { data: scans = [], isLoading } = useQuery({
    queryKey: ["scans", patientId],
    queryFn: () => scanService.getPatientScans(patientId || 1),
    enabled: !!patientId,
  });

  const { data: diaries = [] } = useQuery({
    queryKey: ["diaries", patientId],
    queryFn: () => diaryService.getPatientDiaries(patientId || 1),
    enabled: !!patientId,
  });

  // Calculate summary metrics
  const totalScans = scans.length;
  const diseaseFoundCount = scans.filter(s => s.diagnosis?.diagnosticStatus === 'DISEASE').length;
  const hasDisease = diseaseFoundCount > 0;

  // New Health Score Logic:
  // 1. If diaries exist, use average condition score (1-10) scaled to 0-100%
  // 2. If no diaries but has disease -> 0%
  // 3. Otherwise -> 100%
  let healthRate = "100";
  if (diaries.length > 0) {
    const totalScore = diaries.reduce((acc: number, curr: any) => acc + curr.conditionScore, 0);
    healthRate = ((totalScore / diaries.length) * 10).toFixed(0);
  } else if (hasDisease) {
    healthRate = "0";
  }

  // Process data for AreaChart (Last 7 days scan trend)
  const last7Days = Array.from({ length: 7 }, (_, i) => startOfDay(subDays(new Date(), 6 - i)));
  const trendData = last7Days.map(date => {
    const count = scans.filter(s => isSameDay(new Date(s.createdAt), date)).length;
    return {
      date: format(date, 'MMM dd'),
      count: count
    };
  });

  // Process data for PieChart (Disease distribution)
  const diseaseCounts: Record<string, number> = {};
  scans.forEach(s => {
    if (s.diagnosis?.diagnosticStatus === 'DISEASE') {
      const name = s.diagnosis?.predictedDisease?.name || "Other Condition";
      diseaseCounts[name] = (diseaseCounts[name] || 0) + 1;
    } else {
      const name = "Other / No Finding";
      diseaseCounts[name] = (diseaseCounts[name] || 0) + 1;
    }
  });

  const pieData = Object.entries(diseaseCounts).map(([name, value]) => ({ name, value }));
  const COLORS = ['#2a64ad', '#fb7185', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500 pb-12 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Your Health Analytics</h1>
            <p className="text-slate-500 font-medium text-sm">Visualizing your diagnostic journey and health trends.</p>
          </div>
          
          <div className="flex gap-3">
             <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Scans</span>
                <span className="text-xl font-black text-[#2a64ad]">{totalScans}</span>
             </div>
             <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Health Score</span>
                <span className="text-xl font-black text-emerald-500">{healthRate}%</span>
             </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-8">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8">Scan Frequency (Last 7 Days)</h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2a64ad" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#2a64ad" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px'}}
                    itemStyle={{fontSize: '12px', fontWeight: 900, color: '#2a64ad'}}
                    labelStyle={{fontSize: '10px', fontWeight: 800, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase'}}
                  />
                  <Area type="monotone" dataKey="count" stroke="#2a64ad" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-8">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8">Condition Distribution</h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px'}}
                  />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 800, paddingTop: '30px', textTransform: 'uppercase', color: '#64748b'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Scan Table */}
        <div className="space-y-4">
          <h3 className="text-sm font-black px-2 text-slate-800 uppercase tracking-widest">Detailed Diagnostic History</h3>
          <ReportTable scans={scans} loading={isLoading} />
        </div>
      </div>
    </Layout>
  );
}

export default PatientReports;
