import { useState, useEffect } from "react";
import { AdminLayout } from "./admin-layout";
import { Plus, Edit, Trash2, Search, Loader2 } from "lucide-react";
import axios from "axios";

interface Disease {
  id: number;
  name: string;
  description: string;
  patterns: string;
  hasBlister: boolean;
  hasScaling: boolean;
  status: "active" | "inactive";
}

export function DiseaseManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    patterns: "",
    hasBlister: false,
    hasScaling: false,
  });

  const [diseases, setDiseases] = useState<Disease[]>([]);

  const fetchDiseases = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:3000/diseases");
      // Map visualPattern to patterns for the UI
      const mappedDiseases = response.data.map((d: any) => ({
        ...d,
        patterns: d.visualPattern || "",
      }));
      setDiseases(mappedDiseases);
    } catch (error) {
      console.error("Error fetching diseases:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiseases();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.patch(`http://localhost:3000/diseases/${editingId}`, formData);
      } else {
        await axios.post("http://localhost:3000/diseases", formData);
      }
      fetchDiseases();
      resetForm();
    } catch (error) {
      console.error("Error saving disease:", error);
      alert("Failed to save disease. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      patterns: "",
      hasBlister: false,
      hasScaling: false,
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (disease: Disease) => {
    setFormData({
      name: disease.name,
      description: disease.description,
      patterns: disease.patterns,
      hasBlister: disease.hasBlister,
      hasScaling: disease.hasScaling,
    });
    setEditingId(disease.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this disease? This might affect associated rules.")) {
      try {
        await axios.delete(`http://localhost:3000/diseases/${id}`);
        fetchDiseases();
      } catch (error) {
        console.error("Error deleting disease:", error);
        alert("Failed to delete disease. It might be linked to existing rules.");
      }
    }
  };

  const filteredDiseases = diseases.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout
      title="Disease Management"
      subtitle="Manage disease definitions and characteristics"
    >
      <div className="space-y-6">
        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search diseases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="cursor-text w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            />
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Disease
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Disease Table */}
          <div className={`${showForm ? "lg:col-span-2" : "lg:col-span-3"}`}>
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-left">Disease Name</th>
                      <th className="px-6 py-4 text-left">Description</th>
                      <th className="px-6 py-4 text-left">Key Patterns</th>
                      <th className="px-6 py-4 text-center">Blister</th>
                      <th className="px-6 py-4 text-center">Scaling</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredDiseases.map((disease) => (
                      <tr key={disease.id} className="cursor-pointer hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4">
                          <span>{disease.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {disease.description}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {disease.patterns}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {disease.hasBlister ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs">
                              No
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {disease.hasScaling ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs">
                              No
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                            {disease.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(disease)}
                              className="cursor-pointer p-2 hover:bg-muted rounded-lg text-primary transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(disease.id)}
                              className="cursor-pointer p-2 hover:bg-destructive/10 rounded-lg text-destructive transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Disease Form */}
          {showForm && (
            <div className="lg:col-span-1">
              <div className="bg-card rounded-lg border border-border p-6 sticky top-6">
                <h3 className="mb-6">
                  {editingId ? "Edit Disease" : "Add New Disease"}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block mb-2 text-sm">
                      Disease Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="cursor-text w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-colors"
                      placeholder="e.g., Contact Dermatitis"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block mb-2 text-sm">
                      Description *
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="cursor-text w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm transition-colors"
                      placeholder="Brief medical description..."
                      required
                    />
                  </div>

                  {/* Patterns */}
                  <div>
                    <label htmlFor="patterns" className="block mb-2 text-sm">
                      Key Patterns *
                    </label>
                    <textarea
                      id="patterns"
                      value={formData.patterns}
                      onChange={(e) => setFormData({ ...formData, patterns: e.target.value })}
                      rows={3}
                      className="cursor-text w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm transition-colors"
                      placeholder="Common visual patterns..."
                      required
                    />
                  </div>

                  {/* Characteristics Checkboxes */}
                  <div className="space-y-3 pt-2">
                    <label className="block text-sm mb-3">
                      Physical Characteristics
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasBlister}
                        onChange={(e) => setFormData({ ...formData, hasBlister: e.target.checked })}
                        className="cursor-pointer w-5 h-5 text-primary accent-primary rounded"
                      />
                      <span className="text-sm">Has Blisters</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasScaling}
                        onChange={(e) => setFormData({ ...formData, hasScaling: e.target.checked })}
                        className="cursor-pointer w-5 h-5 text-primary accent-primary rounded"
                      />
                      <span className="text-sm">Has Scaling</span>
                    </label>
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      className="cursor-pointer flex-1 bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 text-sm transition-colors"
                    >
                      {editingId ? "Update" : "Add"} Disease
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="cursor-pointer px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted/30 text-sm transition-colors"
                    >
                      Cancel
                    </button>
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