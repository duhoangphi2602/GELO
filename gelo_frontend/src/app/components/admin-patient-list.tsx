import { useState, useEffect, useMemo } from "react";
import { AdminLayout } from "./admin-layout";
import { 
  Search, 
  User, 
  Calendar, 
  Activity, 
  ChevronRight, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Filter,
  Users
} from "lucide-react";

interface Patient {
  id: number;
  fullName: string;
  age: number;
  gender: string;
  createdAt: string;
  email: string;
  username: string;
  totalScans: number;
  totalDiaries: number;
  lastScanDisease: string | null;
  lastScanDate: string | null;
}

type SortKey = "fullName" | "age" | "gender" | "totalScans" | "totalDiaries" | "lastScanDate" | "createdAt";
type SortDirection = "asc" | "desc" | null;

export function AdminPatientList() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: "createdAt",
    direction: "desc",
  });

  useEffect(() => {
    fetch("http://localhost:3000/scans/admin/patients")
      .then((res) => res.json())
      .then((data) => {
        setPatients(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch patients:", err);
        setLoading(false);
      });
  }, []);

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

    // 1. Filter by Search Term
    if (searchTerm) {
      result = result.filter(
        (p) =>
          p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 2. Filter by Gender
    if (genderFilter !== "all") {
      result = result.filter((p) => p.gender?.toLowerCase() === genderFilter.toLowerCase());
    }

    // 3. Sort
    if (sortConfig.direction && sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        // Handle nulls for dates
        if (aValue === null) return 1;
        if (bValue === null) return -1;

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [patients, searchTerm, genderFilter, sortConfig]);

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig.key !== columnKey || !sortConfig.direction) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-3 h-3 ml-1 text-[#2a64ad]" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1 text-[#2a64ad]" />
    );
  };

  return (
    <AdminLayout
      title="Patient Management"
      subtitle="View and manage all registered patients and their diagnostic history"
    >
      <div className="space-y-6">
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search patients by name or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a64ad]/20 focus:border-[#2a64ad] transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
             <div className="flex items-center gap-2 bg-muted/50 border border-border px-3 py-1.5 rounded-xl">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gender:</span>
                <select 
                  className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer"
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                >
                  <option value="all">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
             </div>

             <div className="h-8 w-px bg-border hidden md:block"></div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#2a64ad]/5 border border-[#2a64ad]/20 rounded-xl">
              <Users className="w-4 h-4 text-[#2a64ad]" />
              <span className="text-sm font-bold text-[#2a64ad]">
                {processedPatients.length} <span className="font-medium text-slate-500">/{patients.length}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Patients Table */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th 
                    className="px-6 py-4 font-bold text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleSort("fullName")}
                  >
                    <div className="flex items-center uppercase tracking-wider text-[11px]">
                      Patient Name <SortIcon columnKey="fullName" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 font-bold text-muted-foreground text-center cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleSort("age")}
                  >
                    <div className="flex items-center justify-center uppercase tracking-wider text-[11px]">
                      Age <SortIcon columnKey="age" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 font-bold text-muted-foreground text-center cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleSort("gender")}
                  >
                    <div className="flex items-center justify-center uppercase tracking-wider text-[11px]">
                      Gender <SortIcon columnKey="gender" />
                    </div>
                  </th>
                  <th className="px-6 py-4 font-bold text-muted-foreground text-center">
                    <div className="flex items-center justify-center gap-4 uppercase tracking-wider text-[11px]">
                       <div className="cursor-pointer hover:text-[#2a64ad] flex items-center" onClick={() => handleSort("totalScans")}>
                         Scans <SortIcon columnKey="totalScans" />
                       </div>
                       <div className="cursor-pointer hover:text-[#2a64ad] flex items-center" onClick={() => handleSort("totalDiaries")}>
                         Diaries <SortIcon columnKey="totalDiaries" />
                       </div>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 font-bold text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleSort("lastScanDate")}
                  >
                    <div className="flex items-center uppercase tracking-wider text-[11px]">
                      Last Scan <SortIcon columnKey="lastScanDate" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 font-bold text-muted-foreground text-right cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center justify-end uppercase tracking-wider text-[11px]">
                      Joined <SortIcon columnKey="createdAt" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-5"><div className="h-4 bg-muted rounded w-32"></div></td>
                      <td className="px-6 py-5"><div className="h-4 bg-muted rounded w-10 mx-auto"></div></td>
                      <td className="px-6 py-5"><div className="h-4 bg-muted rounded w-16 mx-auto"></div></td>
                      <td className="px-6 py-5"><div className="h-4 bg-muted rounded w-24 mx-auto"></div></td>
                      <td className="px-6 py-5"><div className="h-4 bg-muted rounded w-28"></div></td>
                      <td className="px-6 py-5 text-right"><div className="h-4 bg-muted rounded w-16 ml-auto"></div></td>
                    </tr>
                  ))
                ) : processedPatients.length > 0 ? (
                  processedPatients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="group hover:bg-[#2a64ad]/[0.02] transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#2a64ad]/10 flex items-center justify-center text-[#2a64ad] group-hover:bg-[#2a64ad] group-hover:text-white transition-all">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground group-hover:text-[#2a64ad] transition-colors">
                              {patient.fullName}
                            </p>
                            <p className="text-xs text-muted-foreground">{patient.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="font-bold text-slate-700">{patient.age}</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          patient.gender?.toLowerCase() === 'male' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                          patient.gender?.toLowerCase() === 'female' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                          'bg-slate-50 text-slate-600 border border-slate-100'
                        }`}>
                          {patient.gender || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center gap-6">
                          <div className="flex flex-col items-center">
                            <span className="font-black text-[#2a64ad] text-base">{patient.totalScans}</span>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">Scans</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="font-black text-emerald-600 text-base">{patient.totalDiaries}</span>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">Diaries</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {patient.lastScanDate ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700">
                              {patient.lastScanDisease || "No results"}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                               <Calendar className="w-3 h-3" />
                               {new Date(patient.lastScanDate).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic bg-muted/50 px-2 py-1 rounded">No scans yet</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 text-slate-500">
                          <span className="text-xs font-semibold">
                            {new Date(patient.createdAt).toLocaleDateString()}
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-muted-foreground">
                      <div className="flex flex-col items-center">
                         <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 opacity-20" />
                         </div>
                         <p className="font-bold text-slate-500">No patients found</p>
                         <p className="text-sm mt-1">Try adjusting your filters or search term</p>
                         <button 
                            onClick={() => {setSearchTerm(""); setGenderFilter("all");}}
                            className="mt-4 text-[#2a64ad] font-bold text-sm hover:underline"
                         >
                            Clear all filters
                         </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
