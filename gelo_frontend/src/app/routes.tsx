import { createBrowserRouter } from "react-router";
import { Registration } from "./components/registration";
import { Login } from "./components/login";
import { Dashboard } from "./components/dashboard";
import { MedicalAssessment } from "./components/medical-assessment";
import { DiagnosticResult } from "./components/diagnostic-result";
import { PatientDiary } from "./components/patient-diary";
import { Feedback } from "./components/feedback";
import { AdminDashboard } from "./components/admin-dashboard";
import { DiseaseManagement } from "./components/disease-management";
import { AdviceConfiguration } from "./components/advice-configuration";
import { RuleEngine } from "./components/rule-engine";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Registration,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/dashboard",
    Component: Dashboard,
  },
  {
    path: "/scan",
    Component: MedicalAssessment,
  },
  {
    path: "/results",
    Component: DiagnosticResult,
  },
  {
    path: "/history",
    Component: PatientDiary,
  },
  {
    path: "/reports",
    async lazy() {
      const { Reports } = await import("./components/reports");
      return { Component: Reports };
    },
  },
  {
    path: "/profile",
    async lazy() {
      const { Profile } = await import("./components/profile");
      return { Component: Profile };
    },
  },
  {
    path: "/feedback",
    Component: Feedback,
  },
  {
    path: "/admin/dashboard",
    Component: AdminDashboard,
  },
  {
    path: "/admin/diseases",
    Component: DiseaseManagement,
  },
  {
    path: "/admin/advice",
    Component: AdviceConfiguration,
  },
  {
    path: "/admin/rules",
    Component: RuleEngine,
  },
]);