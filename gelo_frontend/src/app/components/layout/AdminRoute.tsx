import { Navigate, Outlet } from "react-router";

export function AdminRoute() {
  const role = localStorage.getItem("role");

  if (!role) {
    return <Navigate to="/" replace />;
  }

  if (role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
