import { AdminLayout } from "./admin-layout";
import { TrendingUp, Users, FileCheck, AlertCircle } from "lucide-react";

export function AdminDashboard() {
  // Mock data
  const stats = [
    {
      label: "Total Diagnoses",
      value: "12,847",
      change: "+12.5%",
      trend: "up",
      icon: FileCheck,
    },
    {
      label: "Active Users",
      value: "3,421",
      change: "+8.3%",
      trend: "up",
      icon: Users,
    },
    {
      label: "Model Accuracy",
      value: "87.3%",
      change: "+2.1%",
      trend: "up",
      icon: TrendingUp,
    },
    {
      label: "Pending Reviews",
      value: "142",
      change: "-5.2%",
      trend: "down",
      icon: AlertCircle,
    },
  ];

  const confusionMatrix = [
    { actual: "Eczema", eczema: 456, psoriasis: 23, dermatitis: 12, acne: 8, other: 5 },
    { actual: "Psoriasis", eczema: 18, psoriasis: 389, dermatitis: 15, acne: 3, other: 7 },
    { actual: "Dermatitis", eczema: 31, psoriasis: 19, dermatitis: 512, acne: 6, other: 9 },
    { actual: "Acne", eczema: 5, psoriasis: 2, dermatitis: 8, acne: 298, other: 4 },
    { actual: "Other", eczema: 12, psoriasis: 15, dermatitis: 11, acne: 7, other: 234 },
  ];

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="Overview of AI model performance and system metrics"
    >
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="cursor-pointer bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <span
                    className={`text-sm ${stat.trend === "up" ? "text-green-600" : "text-red-600"
                      }`}
                  >
                    {stat.change}
                  </span>
                </div>
                <p className="text-3xl mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Accuracy Over Time Chart Placeholder */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="mb-6">Model Accuracy Over Time</h3>
            <div className="h-64 bg-muted/30 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Accuracy Chart Placeholder</p>
                <p className="text-sm mt-1">Line chart showing model accuracy trends</p>
              </div>
            </div>
          </div>

          {/* Diagnoses Distribution Chart Placeholder */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="mb-6">Diagnosis Distribution</h3>
            <div className="h-64 bg-muted/30 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <svg
                  className="w-12 h-12 mx-auto mb-3 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                  />
                </svg>
                <p>Distribution Chart Placeholder</p>
                <p className="text-sm mt-1">Pie chart showing diagnosis breakdown</p>
              </div>
            </div>
          </div>
        </div>

        {/* Confusion Matrix */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="mb-1">Confusion Matrix</h3>
              <p className="text-sm text-muted-foreground">
                Model prediction accuracy by disease category
              </p>
            </div>
            <button className="cursor-pointer px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              Export Data
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="px-4 py-3 text-left bg-muted/50">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Actual</span>
                      <span className="text-xs text-muted-foreground">Predicted →</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center bg-muted/50">
                    <div>Eczema</div>
                    <div className="text-xs text-muted-foreground mt-1">Predicted</div>
                  </th>
                  <th className="px-4 py-3 text-center bg-muted/50">
                    <div>Psoriasis</div>
                    <div className="text-xs text-muted-foreground mt-1">Predicted</div>
                  </th>
                  <th className="px-4 py-3 text-center bg-muted/50">
                    <div>Dermatitis</div>
                    <div className="text-xs text-muted-foreground mt-1">Predicted</div>
                  </th>
                  <th className="px-4 py-3 text-center bg-muted/50">
                    <div>Acne</div>
                    <div className="text-xs text-muted-foreground mt-1">Predicted</div>
                  </th>
                  <th className="px-4 py-3 text-center bg-muted/50">
                    <div>Other</div>
                    <div className="text-xs text-muted-foreground mt-1">Predicted</div>
                  </th>
                  <th className="px-4 py-3 text-center bg-muted/50">Total</th>
                </tr>
              </thead>
              <tbody>
                {confusionMatrix.map((row, idx) => {
                  const total = row.eczema + row.psoriasis + row.dermatitis + row.acne + row.other;
                  return (
                    <tr key={idx} className="cursor-pointer border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 bg-muted/30">{row.actual}</td>
                      <td className={`px-4 py-3 text-center ${row.actual === "Eczema" ? "bg-green-100 text-green-800" : ""}`}>
                        {row.eczema}
                      </td>
                      <td className={`px-4 py-3 text-center ${row.actual === "Psoriasis" ? "bg-green-100 text-green-800" : ""}`}>
                        {row.psoriasis}
                      </td>
                      <td className={`px-4 py-3 text-center ${row.actual === "Dermatitis" ? "bg-green-100 text-green-800" : ""}`}>
                        {row.dermatitis}
                      </td>
                      <td className={`px-4 py-3 text-center ${row.actual === "Acne" ? "bg-green-100 text-green-800" : ""}`}>
                        {row.acne}
                      </td>
                      <td className={`px-4 py-3 text-center ${row.actual === "Other" ? "bg-green-100 text-green-800" : ""}`}>
                        {row.other}
                      </td>
                      <td className="px-4 py-3 text-center bg-muted/30">{total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Green highlighted cells represent correct predictions (true positives). Higher values indicate better model performance for that category.
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="mb-6">Recent System Activity</h3>
          <div className="space-y-3">
            {[
              { time: "2 minutes ago", event: "New diagnosis submitted", user: "Patient #3421" },
              { time: "15 minutes ago", event: "Model retrained with new data", user: "System" },
              { time: "1 hour ago", event: "Feedback received on diagnosis", user: "Patient #3418" },
              { time: "2 hours ago", event: "Admin updated disease rules", user: "Admin User" },
              { time: "3 hours ago", event: "Batch processing completed", user: "System" },
            ].map((activity, idx) => (
              <div
                key={idx}
                className="cursor-pointer flex items-center justify-between py-3 px-4 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-sm">{activity.event}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.user}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}