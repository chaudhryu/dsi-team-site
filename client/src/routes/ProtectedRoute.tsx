// src/routes/ProtectedRoute.tsx
import { Outlet, Navigate } from "react-router-dom";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";

function Splash() {
  return (
    <div className="flex h-[60vh] items-center justify-center text-gray-500">
      Loading…
    </div>
  );
}

export default function ProtectedRoute() {
  const { inProgress, accounts } = useMsal();
  const isAuthed = useIsAuthenticated();

  // Wait until MSAL has restored cache / handled redirects
  if (inProgress !== InteractionStatus.None) {
    return <Splash />;
  }

  // Treat presence of an account as authenticated too
  const hasAccount = accounts.length > 0;

  return (isAuthed || hasAccount) ? <Outlet /> : <Navigate to="/signin" replace />;
}
