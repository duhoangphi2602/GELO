import { createBrowserRouter } from "react-router";
import { Registration } from "./components/registration";
import { Login } from "./components/login";
import { PatientDashboard } from "./components/patient-dashboard";
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
    Component: PatientDashboard,
  },
  {
    path: "/assessment",
    Component: MedicalAssessment,
  },
  {
    path: "/results",
    Component: DiagnosticResult,
  },
  {
    path: "/diary",
    Component: PatientDiary,
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