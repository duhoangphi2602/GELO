import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { Layout } from "./layout/Layout";
import { StatsCards } from "./dashboard/StatsCards";
import { RecentScans } from "./dashboard/RecentScans";
import { QuickActions } from "./dashboard/QuickActions";

export function Dashboard() {
  const navigate = useNavigate();
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fullName = localStorage.getItem("fullName") || "Patient";

  useEffect(() => {
    const patientId = localStorage.getItem("patientId");
    if (!patientId) {
      // In a real app we might redirect, for demo we can mock or proceed
    }

    // Defaulting to 1 for demo purposes if not registered
    const fetchId = patientId || "1";

    axios.get(`http://localhost:3000/scans/patient/${fetchId}`)
      .then(res => {
        setScanHistory(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load scans", err);
        setLoading(false);
      });
  }, [navigate]);

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* Welcome Text */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-slate-800">Welcome back, {fullName}! 👋</h1>
          <p className="text-slate-500 mt-1">Here is the latest overview of your diagnostic scans and history.</p>
        </div>

        {/* Stats Grid */}
        <StatsCards scanHistory={scanHistory} />

        {/* Action Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Quick Actions (1 col) */}
          <div className="xl:col-span-1 h-full">
            <QuickActions />
          </div>

          {/* Scan History Table (2 cols) */}
          <div className="xl:col-span-2 h-full">
            <RecentScans loading={loading} scanHistory={scanHistory} />
          </div>
        </div>
        
      </div>
    </Layout>
  );
}
