import { Navigate, Outlet } from "react-router";
import { useIsAuthenticated } from "@azure/msal-react";

export default function ProtectedRoute() {
  const authenticated = useIsAuthenticated();
  return authenticated ? <Outlet /> : <Navigate to="/signin" replace />;
}
