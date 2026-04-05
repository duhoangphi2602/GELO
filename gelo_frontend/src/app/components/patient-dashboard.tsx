import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Activity, FileText, Calendar } from "lucide-react";
import axios from "axios";

export function PatientDashboard() {
  const navigate = useNavigate();
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const patientId = localStorage.getItem("patientId");
    if (!patientId) {
      navigate("/login");
      return;
    }

    axios.get(`http://localhost:3000/scans/patient/${patientId}`)
      .then(res => {
        setScanHistory(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load scans", err);
        setLoading(false);
      });
  }, [navigate]);
  const formatStatus = (scan: any) => "Completed"; // Simplified
  const formatResult = (scan: any) => scan.diagnosis?.predictedDisease?.name || "Unknown";

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl">HealthAI Platform</h1>
              <p className="text-sm text-muted-foreground">Patient Portal</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 text-muted-foreground hover:text-foreground"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h2 className="text-3xl mb-2">Welcome Back, Patient</h2>
          <p className="text-muted-foreground">
            Start a new AI-powered health assessment or review your scan history
          </p>
        </div>

        {/* Start New Scan Button */}
        <div className="mb-12">
          <button
            onClick={() => navigate("/assessment")}
            className="w-full max-w-2xl bg-primary text-primary-foreground py-8 rounded-lg hover:bg-primary/90 transition-colors shadow-lg flex items-center justify-center gap-4"
          >
            <FileText className="w-8 h-8" />
            <span className="text-2xl">Start New AI Scan</span>
          </button>
        </div>

        {/* Scan History Section */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-primary" />
            <h3 className="text-2xl">Scan History</h3>
          </div>

          <div className="bg-card rounded-lg shadow-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-left">Type</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-left">Result</th>
                    <th className="px-6 py-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                  ) : scanHistory.length === 0 ? (
                    <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Chưa có lịch sử Scan nào. Hãy bắn Scan mới!</td></tr>
                  ) : (
                    scanHistory.map((scan) => (
                      <tr
                        key={scan.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4">{new Date(scan.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">Skin Assessment</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800">
                            {formatStatus(scan)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full ${
                              formatResult(scan) === "Normal"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {formatResult(scan)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => {
                              localStorage.setItem("currentScanId", scan.id.toString());
                              navigate("/results");
                            }}
                            className="text-primary hover:underline">
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
