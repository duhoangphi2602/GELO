import { useState, useEffect } from "react";
import { AdminLayout } from "./admin-layout";
import { Plus, Edit, Trash2, Search, Download, Upload } from "lucide-react";
import axios from "axios";

interface Rule {
  id: number;
  question: string;
  expectedAnswer: string;
  weight: number;
  diseaseCategory: string;
  active: boolean;
}

export function RuleEngine() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [loading, setLoading] = useState(true);

  // State quản lý danh sách các rule được tick chọn
  const [selectedRules, setSelectedRules] = useState<number[]>([]);

  const [formData, setFormData] = useState({
    question: "",
    expectedAnswer: "",
    weight: 50,
    diseaseCategory: "",
  });

  const [rules, setRules] = useState<Rule[]>([]);
  const [diseases, setDiseases] = useState<any[]>([]);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:3000/rules");
      setRules(response.data);
    } catch (error) {
      console.error("Error fetching rules:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiseases = async () => {
    try {
      const response = await axios.get("http://localhost:3000/diseases");
      setDiseases(response.data);
    } catch (error) {
      console.error("Error fetching diseases:", error);
    }
  };

  useEffect(() => {
    fetchRules();
    fetchDiseases();
  }, []);

  const diseaseCategories = diseases.map(d => d.name).filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.patch(`http://localhost:3000/rules/${editingId}`, formData);
      } else {
        await axios.post("http://localhost:3000/rules", formData);
      }
      fetchRules();
      resetForm();
    } catch (error) {
      console.error("Error saving rule:", error);
      alert("Failed to save rule. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      question: "",
      expectedAnswer: "",
      weight: 50,
      diseaseCategory: "",
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (rule: Rule) => {
    setFormData({
      question: rule.question,
      expectedAnswer: rule.expectedAnswer,
      weight: rule.weight,
      diseaseCategory: rule.diseaseCategory,
    });
    setEditingId(rule.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this rule?")) {
      try {
        await axios.delete(`http://localhost:3000/rules/${id}`);
        fetchRules();
        setSelectedRules(prev => prev.filter(selectedId => selectedId !== id));
      } catch (error) {
        console.error("Error deleting rule:", error);
      }
    }
  };

  const toggleActive = async (id: number) => {
    const rule = rules.find(r => r.id === id);
    if (!rule) return;
    
    try {
      await axios.patch(`http://localhost:3000/rules/${id}`, { active: !rule.active });
      fetchRules();
    } catch (error) {
      console.error("Error toggling rule status:", error);
    }
  };

  const filteredRules = rules.filter((r) => {
    const matchesSearch =
      r.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.diseaseCategory.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !filterCategory || r.diseaseCategory === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Xử lý khi tick vào ô "Select All" ở tiêu đề bảng
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRules(filteredRules.map(r => r.id));
    } else {
      setSelectedRules([]);
    }
  };

  // Xử lý khi tick vào từng ô riêng lẻ
  const handleSelectRule = (id: number) => {
    setSelectedRules(prev =>
      prev.includes(id) ? prev.filter(rId => rId !== id) : [...prev, id]
    );
  };

  return (
    <AdminLayout
      title="Rule Engine"
      subtitle="Configure diagnostic rules and survey questions"
    >
      <div className="space-y-6">
        {/* Action Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search rules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="cursor-text w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              aria-label="Filter rules by disease category"
              className="cursor-pointer px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              <option value="">All Categories</option>
              {diseaseCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted/30 transition-colors">
              <Upload className="w-4 h-4" />
              Import
            </button>
            <button className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted/30 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Rule
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Rules</p>
            <p className="text-2xl">{rules.length}</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground mb-1">Active Rules</p>
            <p className="text-2xl text-green-600">
              {rules.filter((r) => r.active).length}
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground mb-1">Avg Weight</p>
            <p className="text-2xl">
              {Math.round(
                rules.reduce((sum, r) => sum + r.weight, 0) / rules.length
              )}
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground mb-1">Categories</p>
            <p className="text-2xl">{diseaseCategories.length}</p>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="bg-card rounded-lg border-2 border-primary p-6">
            <h3 className="mb-6">
              {editingId ? "Edit Rule" : "Add New Rule"}
            </h3>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Question */}
              <div className="md:col-span-2">
                <label htmlFor="question" className="block mb-2">
                  Survey Question *
                </label>
                <input
                  type="text"
                  id="question"
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                  className="cursor-text w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="e.g., Are you experiencing itching?"
                  required
                />
              </div>

              {/* Expected Answer */}
              <div>
                <label htmlFor="answer" className="block mb-2">
                  Expected Answer *
                </label>
                <select
                  id="answer"
                  value={formData.expectedAnswer}
                  onChange={(e) =>
                    setFormData({ ...formData, expectedAnswer: e.target.value })
                  }
                  className="cursor-pointer w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  required
                >
                  <option value="">Select answer...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Unsure">Unsure</option>
                </select>
              </div>

              {/* Disease Category */}
              <div>
                <label htmlFor="category" className="block mb-2">
                  Disease Category *
                </label>
                <select
                  id="category"
                  value={formData.diseaseCategory}
                  onChange={(e) =>
                    setFormData({ ...formData, diseaseCategory: e.target.value })
                  }
                  className="cursor-pointer w-full px-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  required
                >
                  <option value="">Select category...</option>
                  {diseaseCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Weight Score */}
              <div className="md:col-span-2">
                <label htmlFor="weight" className="block mb-2">
                  Weight Score: {formData.weight}
                </label>
                <input
                  type="range"
                  id="weight"
                  min="0"
                  max="100"
                  value={formData.weight}
                  onChange={(e) =>
                    setFormData({ ...formData, weight: Number(e.target.value) })
                  }
                  className="cursor-pointer w-full"
                  style={{
                    background: `linear-gradient(to right, #0066CC 0%, #0066CC ${formData.weight}%, #e9ebef ${formData.weight}%, #e9ebef 100%)`,
                  }}
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>0 (Low Impact)</span>
                  <span>50 (Medium)</span>
                  <span>100 (High Impact)</span>
                </div>
              </div>

              {/* Form Actions */}
              <div className="md:col-span-2 flex gap-4">
                <button
                  type="submit"
                  className="cursor-pointer flex-1 bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {editingId ? "Update" : "Add"} Rule
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="cursor-pointer px-8 py-3 bg-card border-2 border-border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Rules Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b-2 border-border">
                <tr>
                  <th className="px-6 py-4 text-left w-12">
                    <input
                      type="checkbox"
                      title="Select all rules"
                      aria-label="Select all rules"
                      className="cursor-pointer w-4 h-4"
                      checked={filteredRules.length > 0 && selectedRules.length === filteredRules.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4 text-left">Survey Question</th>
                  <th className="px-6 py-4 text-center">Expected Answer</th>
                  <th className="px-6 py-4 text-left">Disease Category</th>
                  <th className="px-6 py-4 text-center">Weight Score</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        title={`Select rule ${rule.id}`}
                        aria-label={`Select rule ${rule.id}`}
                        className="cursor-pointer w-4 h-4"
                        checked={selectedRules.includes(rule.id)}
                        onChange={() => handleSelectRule(rule.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm">{rule.question}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${rule.expectedAnswer === "Yes"
                          ? "bg-green-100 text-green-800"
                          : rule.expectedAnswer === "No"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                          }`}
                      >
                        {rule.expectedAnswer}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs">
                        {rule.diseaseCategory}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${rule.weight}%` }}
                          />
                        </div>
                        <span className="text-sm w-10 text-right">{rule.weight}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleActive(rule.id)}
                        className={`cursor-pointer inline-flex items-center px-3 py-1 rounded-full text-xs transition-colors ${rule.active
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                      >
                        {rule.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(rule)}
                          className="cursor-pointer p-2 hover:bg-muted rounded-lg text-primary transition-colors"
                          aria-label="Edit rule"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rule.id)}
                          className="cursor-pointer p-2 hover:bg-destructive/10 rounded-lg text-destructive transition-colors"
                          title="Delete rule"
                          aria-label="Delete rule"
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

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredRules.length} of {rules.length} rules
          </p>
          <div className="flex gap-2">
            <button className="cursor-pointer px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted/30 text-sm transition-colors">
              Previous
            </button>
            <button className="cursor-pointer px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm transition-colors">
              1
            </button>
            <button className="cursor-pointer px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted/30 text-sm transition-colors">
              2
            </button>
            <button className="cursor-pointer px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted/30 text-sm transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}