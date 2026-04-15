// src/app/components/layout/AdminRoute.tsx
// Guard cho các route chỉ dành cho admin
// - Chưa đăng nhập → redirect về login "/"
// - Đã đăng nhập nhưng không phải admin → redirect về dashboard "/dashboard"

import { Navigate, Outlet } from "react-router";

export function AdminRoute() {
  const role = localStorage.getItem("role");

  if (!role) {
    // Chưa đăng nhập
    return <Navigate to="/" replace />;
  }

  if (role !== "ADMIN") {
    // Đã đăng nhập nhưng là patient, không được vào trang admin
    return <Navigate to="/dashboard" replace />;
  }

  // Là admin → render trang con
  return <Outlet />;
}
