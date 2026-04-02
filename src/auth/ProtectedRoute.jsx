import { Navigate } from "react-router-dom";
import { parseJwt } from "../utils/auth";
import React from "react";

export default function ProtectedRoute({ children, minLevel = 9 }) {
  const token = localStorage.getItem("access_token");

  // ❌ No token → login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const decoded = parseJwt(token);

  // ❌ Invalid token → login
  if (!decoded) {
    return <Navigate to="/login" replace />;
  }

  // ❌ Level check (higher number = lower authority)
  if (decoded.level > minLevel) {
    return <Navigate to="/dashboard" replace />;
  }

  // ✅ Allowed
  return children;
}