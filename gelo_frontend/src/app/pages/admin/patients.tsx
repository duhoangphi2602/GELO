import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/admin-layout";
import { adminService } from "@/services/admin.service";
import { useToastContext } from "@/components/shared/ui/ToastContext";
import { ConfirmModal } from "@/components/shared/ui/ConfirmModal";
import {
  Search,
  User,
  Calendar,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Users,
  Download,
  Mail,
  Trash2,
  X,
  Activity,
  FileText,
  Send
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
  
  // Demo states
  const [deletedPatientIds, setDeletedPatientIds] = useState<string[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<any | null>(null);
  const [patientToEmail, setPatientToEmail] = useState<any | null>(null);
  const toast = useToastContext();

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
    let result = [...patients].filter(p => !deletedPatientIds.includes(p.id));

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
  }, [patients, searchTerm, genderFilter, sortConfig, deletedPatientIds]);

  const exportToCSV = () => {
    if (processedPatients.length === 0) {
      toast.warning("No data", "There are no patients to export.");
      return;
    }
    const headers = ["Full Name,Email,Age,Gender,Total Scans,Total Diaries,Last Scan Date,Joined Date"];
    const rows = processedPatients.map(p => 
      `"${p.fullName}","${p.email}",${p.age},"${p.gender || 'N/A'}",${p.totalScans},${p.totalDiaries},"${p.lastScanDate ? new Date(p.lastScanDate).toLocaleDateString() : 'No records'}","${new Date(p.createdAt).toLocaleDateString()}"`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `patients_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export Successful", "The patient list has been downloaded.");
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig.key !== columnKey || !sortConfig.direction) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
    }
    return sortConfig.direction === "asc" ? <ArrowUp className="w-3 h-3 ml-1 text-[#2a64ad]" /> : <ArrowDown className="w-3 h-3 ml-1 text-[#2a64ad]" />;
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setPatientToEmail(null);
    toast.success("Email Sent", `Successfully sent notification to ${patientToEmail?.fullName}.`);
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
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-emerald-600/20 transition-colors"
            >
              <Download size={16} />
              Export CSV
            </button>
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
                  <th className="px-6 py-4 font-bold text-muted-foreground uppercase tracking-widest text-[10px] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-5"><div className="h-10 w-10 bg-muted rounded-xl" /></td>
                      <td colSpan={6} className="px-6 py-5"><div className="h-4 bg-muted rounded w-full" /></td>
                    </tr>
                  ))
                ) : processedPatients.map((p: any) => (
                  <tr key={p.id} onClick={() => setSelectedPatient(p)} className="group hover:bg-muted/20 transition-colors cursor-pointer">
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
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setPatientToEmail(p); }}
                          className="p-1.5 text-slate-400 hover:text-[#2a64ad] hover:bg-[#2a64ad]/10 rounded-lg transition-colors"
                          title="Send Email"
                        >
                          <Mail size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setPatientToDelete(p); }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Patient"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {processedPatients.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      No patients found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedPatient(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Patient Details</h3>
                <button onClick={() => setSelectedPatient(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                  <X size={16} />
                </button>
              </div>
              
              <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-xl">
                <div className="w-16 h-16 rounded-full bg-[#2a64ad]/10 flex items-center justify-center text-[#2a64ad]">
                  <User size={32} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{selectedPatient.fullName}</h4>
                  <p className="text-sm text-slate-500">{selectedPatient.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Demographics</p>
                  <p className="text-sm font-bold text-slate-700">Age: {selectedPatient.age} &bull; {selectedPatient.gender || 'N/A'}</p>
                </div>
                <div className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Joined Date</p>
                  <p className="text-sm font-bold text-slate-700">{new Date(selectedPatient.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 px-1">Activity Overview</h5>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><Activity size={16} /></div>
                    <p className="text-sm font-bold text-slate-700">Total Scans</p>
                  </div>
                  <span className="font-black text-blue-600">{selectedPatient.totalScans}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600"><FileText size={16} /></div>
                    <p className="text-sm font-bold text-slate-700">Health Diaries</p>
                  </div>
                  <span className="font-black text-emerald-600">{selectedPatient.totalDiaries}</span>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => {
                  setPatientToEmail(selectedPatient);
                  setSelectedPatient(null);
                }} 
                className="px-4 py-2 flex items-center gap-2 text-sm font-bold text-white bg-[#2a64ad] hover:bg-[#1e4c85] rounded-xl transition-colors"
              >
                <Mail size={16} /> Contact Patient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mock Send Email Modal */}
      {patientToEmail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setPatientToEmail(null)} />
          <form onSubmit={handleSendEmail} className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="h-1.5 w-full bg-[#2a64ad]" />
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Send Notification</h3>
                    <p className="text-sm font-medium text-slate-500">To: {patientToEmail.email}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setPatientToEmail(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-widest">Subject</label>
                  <input required type="text" placeholder="Notification Subject" defaultValue="Notice regarding your recent scan" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#2a64ad] focus:ring-1 focus:ring-[#2a64ad]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-widest">Message</label>
                  <textarea required rows={4} placeholder="Type your message here..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#2a64ad] focus:ring-1 focus:ring-[#2a64ad] resize-none" />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button type="button" onClick={() => setPatientToEmail(null)} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-[#2a64ad] text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-[#1e4c85] shadow-lg shadow-blue-200 transition-colors flex items-center justify-center gap-2">
                  <Send size={14} /> Send Email
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!patientToDelete}
        onClose={() => setPatientToDelete(null)}
        onConfirm={() => {
          if (patientToDelete) {
            setDeletedPatientIds([...deletedPatientIds, patientToDelete.id]);
            toast.success("Patient Deleted", `Successfully removed ${patientToDelete.fullName} from the system.`);
          }
        }}
        title="Delete Patient Record"
        message={`Are you sure you want to delete the record for ${patientToDelete?.fullName}? This action cannot be undone.`}
        confirmText="Delete Record"
      />
    </AdminLayout>
  );
}

export default AdminPatientList;
