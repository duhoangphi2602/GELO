import { useState } from "react";
import { AdminLayout } from "./admin-layout";
import { Plus, Edit, Trash2, Search } from "lucide-react";

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
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    patterns: "",
    hasBlister: false,
    hasScaling: false,
  });

  // Mock diseases data
  const [diseases, setDiseases] = useState<Disease[]>([
    {
      id: 1,
      name: "Contact Dermatitis",
      description: "Inflammatory skin reaction caused by contact with allergens or irritants",
      patterns: "Redness, swelling, itching at contact site",
      hasBlister: true,
      hasScaling: false,
      status: "active",
    },
    {
      id: 2,
      name: "Eczema",
      description: "Chronic inflammatory skin condition causing dry, itchy patches",
      patterns: "Dry patches, redness, intense itching, thickened skin",
      hasBlister: false,
      hasScaling: true,
      status: "active",
    },
    {
      id: 3,
      name: "Psoriasis",
      description: "Autoimmune condition causing rapid skin cell buildup",
      patterns: "Silvery scales, red patches, dry cracked skin",
      hasBlister: false,
      hasScaling: true,
      status: "active",
    },
    {
      id: 4,
      name: "Acne Vulgaris",
      description: "Common skin condition affecting hair follicles and oil glands",
      patterns: "Pimples, blackheads, whiteheads, cysts",
      hasBlister: false,
      hasScaling: false,
      status: "active",
    },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      // Update existing disease
      setDiseases(diseases.map(d => 
        d.id === editingId 
          ? { ...d, ...formData }
          : d
      ));
    } else {
      // Add new disease
      const newDisease: Disease = {
        id: diseases.length + 1,
        ...formData,
        status: "active",
      };
      setDiseases([...diseases, newDisease]);
    }
    resetForm();
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

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this disease?")) {
      setDiseases(diseases.filter(d => d.id !== id));
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
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
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
                      <tr key={disease.id} className="hover:bg-muted/20">
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
                              className="p-2 hover:bg-muted rounded-lg text-primary"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(disease.id)}
                              className="p-2 hover:bg-destructive/10 rounded-lg text-destructive"
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
                      className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
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
                      className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
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
                      className="w-full px-3 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
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
                        className="w-5 h-5 text-primary accent-primary rounded"
                      />
                      <span className="text-sm">Has Blisters</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasScaling}
                        onChange={(e) => setFormData({ ...formData, hasScaling: e.target.checked })}
                        className="w-5 h-5 text-primary accent-primary rounded"
                      />
                      <span className="text-sm">Has Scaling</span>
                    </label>
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 text-sm"
                    >
                      {editingId ? "Update" : "Add"} Disease
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted/30 text-sm"
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
