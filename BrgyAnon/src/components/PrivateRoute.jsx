// src/components/PrivateRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children, isAdmin = false }) {
  const role = localStorage.getItem("brgy_role");
  const admin = localStorage.getItem("brgy_is_admin");

  // convert string to boolean
  const isAdminUser = admin === "true";

  // if admin route, check admin
  if (isAdmin && !isAdminUser) {
    return <Navigate to="/login" replace />;
  }

  // if normal user route, check role exists
  if (!isAdmin && !role) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
