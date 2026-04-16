import { createBrowserRouter } from "react-router";
import { Registration } from "./components/registration";
import { Login } from "./components/login";
import { Dashboard } from "./components/dashboard";
import { MedicalAssessment } from "./components/medical-assessment";
import { DiagnosticResult } from "./components/diagnostic-result";
import { PatientDiary } from "./components/patient-diary";
import { ScanHistory } from "./components/scan-history";
import { AdminDashboard } from "./components/admin-dashboard";
import { DiseaseManagement } from "./components/disease-management";
import { PrivateRoute } from "./components/layout/PrivateRoute";
import { AdminRoute } from "./components/layout/AdminRoute";
import { AdminPatientList } from "./components/admin-patient-list";
import { Feedback } from "./components/feedback";
import { AdviceConfiguration } from "./components/advice-configuration";

export const router = createBrowserRouter([
  // ─── Public routes (không cần đăng nhập) ───────────────────────────────────
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/register",
    Component: Registration,
  },

  // ─── Patient routes (yêu cầu đăng nhập, bất kỳ role nào) ──────────────────
  {
    Component: PrivateRoute,
    children: [
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
        Component: ScanHistory,
      },
      {
        path: "/diary",
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
    ],
  },

  // ─── Admin routes (yêu cầu role = "admin") ─────────────────────────────────
  {
    Component: AdminRoute,
    children: [
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
        path: "/admin/patients",
        Component: AdminPatientList,
      },
    ],
  },
]);