import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ ui, children }) {
  // If no UI (not authenticated), redirect to login
  if (!ui) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the protected content
  return children;
}
