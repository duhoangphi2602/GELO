import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/admin-layout";
import { adminService } from "@/services/admin.service";
import {
  Search,
  User,
  Calendar,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Users
} from "lucide-react";

type SortKey = "fullName" | "age" | "gender" | "totalScans" | "totalDiaries" | "lastScanDate" | "createdAt";
type SortDirection = "asc" | "desc" | null;

export function AdminPatientList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: "createdAt",
    direction: "desc",
  });

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["admin", "patients"],
    queryFn: () => adminService.getPatients(),
  });

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  const processedPatients = useMemo(() => {
    let result = [...patients];

    if (searchTerm) {
      result = result.filter(
        (p) =>
          p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (genderFilter !== "all") {
      result = result.filter((p) => p.gender?.toLowerCase() === genderFilter.toLowerCase());
    }

    if (sortConfig.direction && sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue === null) return 1;
        if (bValue === null) return -1;
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [patients, searchTerm, genderFilter, sortConfig]);

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig.key !== columnKey || !sortConfig.direction) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
    }
    return sortConfig.direction === "asc" ? <ArrowUp className="w-3 h-3 ml-1 text-[#2a64ad]" /> : <ArrowDown className="w-3 h-3 ml-1 text-[#2a64ad]" />;
  };

  return (
    <AdminLayout title="Patient Management" subtitle="Manage registered patients and their diagnostic records">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-muted/30 border border-border rounded-xl text-sm outline-none focus:border-[#2a64ad]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-muted/30 border border-border px-3 py-1.5 rounded-xl">
              <Filter size={14} className="text-muted-foreground" />
              <select className="bg-transparent text-xs font-bold focus:outline-none" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
                <option value="all">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#2a64ad]/5 border border-[#2a64ad]/20 rounded-xl">
              <Users size={16} className="text-[#2a64ad]" />
              <span className="text-sm font-black text-[#2a64ad]">{processedPatients.length} Patients</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-widest text-[10px] cursor-pointer" onClick={() => handleSort("fullName")}>
                    <div className="flex items-center">Patient <SortIcon columnKey="fullName" /></div>
                  </th>
                  <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-widest text-[10px] text-center cursor-pointer" onClick={() => handleSort("age")}>
                    <div className="flex items-center justify-center">Age <SortIcon columnKey="age" /></div>
                  </th>
                  <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-widest text-[10px] text-center cursor-pointer" onClick={() => handleSort("gender")}>
                    <div className="flex items-center justify-center">Gender <SortIcon columnKey="gender" /></div>
                  </th>
                  <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-widest text-[10px] text-center">Activity</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-widest text-[10px] cursor-pointer" onClick={() => handleSort("lastScanDate")}>
                    <div className="flex items-center">Last Diagnosis <SortIcon columnKey="lastScanDate" /></div>
                  </th>
                  <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-widest text-[10px] text-right cursor-pointer" onClick={() => handleSort("createdAt")}>
                    <div className="flex items-center justify-end">Joined <SortIcon columnKey="createdAt" /></div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-5"><div className="h-10 w-10 bg-muted rounded-xl" /></td>
                      <td colSpan={5} className="px-6 py-5"><div className="h-4 bg-muted rounded w-full" /></td>
                    </tr>
                  ))
                ) : processedPatients.map((p: any) => (
                  <tr key={p.id} className="group hover:bg-muted/20 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#2a64ad]/10 flex items-center justify-center text-[#2a64ad] group-hover:bg-[#2a64ad] group-hover:text-white transition-all"><User size={20} /></div>
                        <div><p className="font-bold text-foreground text-sm">{p.fullName}</p><p className="text-[10px] text-muted-foreground">{p.email}</p></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-sm">{p.age}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${p.gender === 'MALE' ? 'bg-blue-50 text-blue-600' : p.gender === 'FEMALE' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'}`}>
                        {p.gender || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-center"><p className="font-black text-[#2a64ad] text-sm">{p.totalScans}</p><p className="text-[8px] font-black uppercase text-muted-foreground">Scans</p></div>
                        <div className="text-center"><p className="font-black text-emerald-600 text-sm">{p.totalDiaries}</p><p className="text-[8px] font-black uppercase text-muted-foreground">Diaries</p></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {p.lastScanDate ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground text-xs">{p.lastScanDisease || "Unknown"}</span>
                          <span className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1"><Calendar size={10} /> {new Date(p.lastScanDate).toLocaleDateString()}</span>
                        </div>
                      ) : <span className="text-[10px] italic text-muted-foreground">No records</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[10px] font-bold text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminPatientList;
