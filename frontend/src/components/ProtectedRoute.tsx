import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useToken, useStatus } from "src/contest/ContestContext";
import { Loading } from "./Loading";

export function ProtectedRoute() {
  const status = useStatus();
  const token = useToken();

  if (status.isLoading()) {
    return <Loading />;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
