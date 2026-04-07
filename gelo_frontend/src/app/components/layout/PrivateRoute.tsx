// src/app/components/layout/PrivateRoute.tsx
// Guard cho tất cả các route yêu cầu đăng nhập
// Nếu chưa đăng nhập → redirect về trang login "/"

import { Navigate, Outlet } from "react-router";

export function PrivateRoute() {
  const role = localStorage.getItem("role");

  // Chưa đăng nhập (không có role trong localStorage)
  if (!role) {
    return <Navigate to="/" replace />;
  }

  // Đã đăng nhập → render trang con
  return <Outlet />;
}
