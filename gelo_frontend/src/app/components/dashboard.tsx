import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import api from "../lib/api";
import { Layout } from "./layout/Layout";
import { StatsCards } from "./dashboard/StatsCards";
import { RecentScans } from "./dashboard/RecentScans";
import { QuickActions } from "./dashboard/QuickActions";
import { SupportedDiseases } from "./dashboard/SupportedDiseases";

export function Dashboard() {
  const navigate = useNavigate();
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [supportedDiseases, setSupportedDiseases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDiseases, setLoadingDiseases] = useState(true);

  const fullName = localStorage.getItem("fullName") || "Patient";

  useEffect(() => {
    const patientId = localStorage.getItem("patientId");
    if (!patientId) {
      // In a real app we might redirect, for demo we can mock or proceed
    }

    // Defaulting to 1 for demo purposes if not registered
    const fetchId = patientId || "1";

    api.get(`/scans/patient/${fetchId}`)
      .then(res => {
        setScanHistory(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load scans", err);
        setScanHistory([]);
        setLoading(false);
      });

    // Fetch AI capabilities
    api.get("/scans/supported-diseases")
      .then(res => {
        setSupportedDiseases(res.data || []);
        setLoadingDiseases(false);
      })
      .catch(err => {
        console.error("Failed to load supported diseases", err);
        setLoadingDiseases(false);
      });
  }, [navigate]);

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">

        {/* Welcome Text */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-slate-800">Welcome, {fullName}!</h1>
        </div>

        {/* Stats Grid */}
        <StatsCards scanHistory={scanHistory} />

        {/* AI Capabilities Section */}
        <SupportedDiseases diseases={supportedDiseases} loading={loadingDiseases} />

        {/* Action Section */}
        <div className="flex flex-col gap-8">
          {/* Quick Actions */}
          <div className="w-full">
            <QuickActions />
          </div>

          {/* Scan History Table */}
          <div className="w-full">
            <RecentScans loading={loading} scanHistory={scanHistory} />
          </div>
        </div>

      </div>
    </Layout>
  );
}
