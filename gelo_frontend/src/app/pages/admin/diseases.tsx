import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z as zod } from "zod";

import { AdminLayout } from "@/components/admin/admin-layout";
import { Plus, Edit, Trash2, Search, Loader2 } from "lucide-react";
import { adminService } from "@/services/admin.service";
import { useToastContext } from "@/components/shared/ui/ToastContext";

const diseaseSchema = zod.object({
  code: zod.string().min(1, "Code is required"),
  name: zod.string().min(1, "Name is required"),
  description: zod.string().min(1, "Description is required"),
});

type DiseaseFormData = zod.infer<typeof diseaseSchema>;

export function DiseaseManagement() {
  const queryClient = useQueryClient();
  const toast = useToastContext();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: diseases = [], isLoading } = useQuery({
    queryKey: ["admin", "diseases"],
    queryFn: () => adminService.getDiseases(),
  });

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<DiseaseFormData>({
    resolver: zodResolver(diseaseSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: DiseaseFormData) => 
      editingId ? adminService.updateDisease(editingId, data) : adminService.createDisease(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "diseases"] });
      toast.success("Success", `Disease ${editingId ? "updated" : "created"} successfully.`);
      resetForm();
    },
    onError: (err: any) => {
      toast.error("Error", err.response?.data?.message || "Failed to save disease.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminService.deleteDisease(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "diseases"] });
      toast.success("Deleted", "Disease has been removed.");
    },
    onError: () => toast.error("Error", "Could not delete disease. It may be linked to scans.")
  });

  const resetForm = () => {
    reset();
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (disease: any) => {
    setValue("code", disease.code);
    setValue("name", disease.name);
    setValue("description", disease.description);
    setEditingId(disease.id);
    setShowForm(true);
  };

  const filteredDiseases = (diseases || []).filter((d: any) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.code.toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <AdminLayout title="Disease Management" subtitle="Configure AI-supported dermatological conditions">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter diseases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#2a64ad]/20 transition-all"
            />
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="cursor-pointer flex items-center gap-2 px-6 py-2 bg-[#2a64ad] text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all"
          >
            <Plus size={18} /> Add Condition
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className={showForm ? "lg:col-span-2" : "lg:col-span-3"}>
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Code</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Condition Name</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    [1, 2, 3].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-6"><div className="h-4 bg-muted rounded w-16" /></td>
                        <td className="px-6 py-6"><div className="h-4 bg-muted rounded w-48" /></td>
                        <td className="px-6 py-6"><div className="h-8 bg-muted rounded w-20 mx-auto" /></td>
                      </tr>
                    ))
                  ) : filteredDiseases.map((d: any) => (
                    <tr key={d.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4"><span className="font-mono text-xs font-bold bg-muted px-2 py-1 rounded">{d.code}</span></td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-foreground text-sm">{d.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{d.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleEdit(d)} className="p-2 hover:bg-[#2a64ad]/10 text-[#2a64ad] rounded-lg transition-all cursor-pointer"><Edit size={16} /></button>
                          <button onClick={() => { if(confirm("Delete this disease?")) deleteMutation.mutate(d.id) }} className="p-2 hover:bg-rose-50 text-rose-500 rounded-lg transition-all cursor-pointer"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {showForm && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <div className="bg-card rounded-2xl border border-border p-6 shadow-xl sticky top-6">
                <h3 className="text-lg font-black mb-6">{editingId ? "Update" : "Add"} Condition</h3>
                <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
                  <div>
                    <label className="block mb-1 text-[10px] font-black uppercase text-muted-foreground">ICD Code *</label>
                    <input {...register("code")} className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm outline-none focus:border-[#2a64ad]" placeholder="e.g., L20.9" />
                    {errors.code && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.code.message}</p>}
                  </div>
                  <div>
                    <label className="block mb-1 text-[10px] font-black uppercase text-muted-foreground">Name *</label>
                    <input {...register("name")} className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm outline-none focus:border-[#2a64ad]" placeholder="e.g., Atopic Dermatitis" />
                    {errors.name && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block mb-1 text-[10px] font-black uppercase text-muted-foreground">Description *</label>
                    <textarea {...register("description")} rows={4} className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl text-sm outline-none focus:border-[#2a64ad] resize-none" placeholder="Clinical description..." />
                    {errors.description && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.description.message}</p>}
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button type="submit" disabled={isSubmitting} className="flex-1 bg-[#2a64ad] text-white py-3 rounded-xl font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                      {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                      {editingId ? "Save Changes" : "Create Condition"}
                    </button>
                    <button type="button" onClick={resetForm} className="px-4 py-3 bg-muted border border-border rounded-xl text-xs font-bold uppercase transition-all">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default DiseaseManagement;
