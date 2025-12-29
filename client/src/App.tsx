// src/App.tsx
import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";

import SignIn from "./pages/Public/AuthPages/SignIn";
import SignUp from "./pages/Public/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";

import UserProfiles from "./pages/UserProfiles";
import Images from "./pages/UiElements/Images";
import Accomplishments from "./pages/Accomplishments";
import Calendar from "./pages/Calendar";
import AccomplishmentsTable from "./pages/AccomplishmentsTable";

import ProtectedRoute from "./routes/ProtectedRoute";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";

import Home from "./pages/Dashboard/Home";
import PublicHome from "./pages/Dashboard/PublicHome";
import AuthCallback from "./pages/Private/Auth/AuthCallback";

import Users from "./pages/Users";
import Databases from "./pages/Databases";
import { Projects } from "./pages/ProjectsInternal/Projects";

import HighManagerDashboard from "./pages/HighManagerDashboard";
import { envConfig } from "./config/envConfig";

type DbUser = {
  badge: number;
  role?: string | null;
};

const API_BASE = envConfig.backendApiBaseUrl || "http://localhost:3005/api";
const LOGIN_KEY = envConfig.loginEmpKey || "loginEmployee";

function normalizeRole(role: unknown): string {
  return String(role ?? "").trim().toLowerCase();
}

function readBadgeFromStorage(): number | null {
  try {
    const raw = localStorage.getItem(LOGIN_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw);
    const badge = Number(u?.badge);
    return Number.isFinite(badge) ? badge : null;
  } catch {
    return null;
  }
}

async function fetchDbRoleForBadge(badge: number): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/users`, { credentials: "include" });
    if (!res.ok) return "";
    const users = (await res.json()) as DbUser[];
    const me = users.find((u) => Number(u?.badge) === badge);
    return normalizeRole(me?.role);
  } catch {
    return "";
  }
}

/**
 * Index ("/") gate:
 * - logged out -> PublicHome
 * - logged in + high_manager -> HighManagerDashboard
 * - logged in + not high_manager -> Home
 */
function IndexGate() {
  const { accounts, inProgress } = useMsal();
  const isLoggedIn = accounts.length > 0;

  const [status, setStatus] = useState<"loading" | "public" | "home" | "high_manager">("loading");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // While MSAL is still processing, don’t decide yet
      if (inProgress !== InteractionStatus.None) {
        if (!cancelled) setStatus("loading");
        return;
      }

      // Logged out -> always public home
      if (!isLoggedIn) {
        if (!cancelled) setStatus("public");
        return;
      }

      // Logged in -> determine DB role
      const badge = readBadgeFromStorage();
      if (!badge) {
        // fallback: treat as normal home (user is logged in but local storage not ready)
        if (!cancelled) setStatus("home");
        return;
      }

      const role = await fetchDbRoleForBadge(badge);
      if (cancelled) return;

      if (role === "high_manager") setStatus("high_manager");
      else setStatus("home");
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [accounts.length, inProgress, isLoggedIn]);

  if (status === "loading") {
    return (
      <div className="p-6">
        <div className="text-sm text-gray-600 dark:text-gray-300">Loading…</div>
      </div>
    );
  }

  if (status === "public") return <PublicHome />;
  if (status === "high_manager") return <HighManagerDashboard />;
  return <Home />;
}

/** Route guard: allows access only if DB role is high_manager (and user is logged in) */
function HighManagerOnlyRoute() {
  const { accounts, inProgress } = useMsal();
  const isLoggedIn = accounts.length > 0;

  const [status, setStatus] = useState<"loading" | "allowed" | "denied">("loading");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (inProgress !== InteractionStatus.None) {
        if (!cancelled) setStatus("loading");
        return;
      }

      if (!isLoggedIn) {
        if (!cancelled) setStatus("denied");
        return;
      }

      const badge = readBadgeFromStorage();
      if (!badge) {
        if (!cancelled) setStatus("denied");
        return;
      }

      const role = await fetchDbRoleForBadge(badge);
      if (!cancelled) setStatus(role === "high_manager" ? "allowed" : "denied");
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [accounts.length, inProgress, isLoggedIn]);

  if (status === "loading") {
    return (
      <div className="p-6">
        <div className="text-sm text-gray-600 dark:text-gray-300">Checking access…</div>
      </div>
    );
  }

  if (status === "denied") return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function App() {
  const { accounts, inProgress } = useMsal();

  // ✅ Critical: when MSAL is logged out, clear your app's localStorage login key
  useEffect(() => {
    if (inProgress !== InteractionStatus.None) return;

    const isLoggedIn = accounts.length > 0;
    if (!isLoggedIn) {
      try {
        localStorage.removeItem(LOGIN_KEY);
      } catch {}
    }
  }, [accounts.length, inProgress]);

  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/auth-response" element={<AuthCallback />} />

          <Route element={<AppLayout />}>
            {/* ✅ Dynamic home based on MSAL + DB role */}
            <Route index element={<IndexGate />} />

            <Route path="/images" element={<Images />} />

            {/* Public */}
            <Route path="/projects-external" element={<Projects isInternal={false} />} />

            {/* ---------- Auth‑only pages ---------- */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<UserProfiles />} />
              <Route path="/projects-internal" element={<Projects isInternal={true} />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/submit-accomplishment" element={<Accomplishments />} />
              <Route path="/view-accomplishments" element={<AccomplishmentsTable />} />
              <Route path="/users" element={<Users />} />
              <Route path="/databases" element={<Databases />} />

              {/* optional: keep a dedicated route if you still want it accessible via URL */}
              <Route element={<HighManagerOnlyRoute />}>
                <Route path="/high-manager-dashboard" element={<HighManagerDashboard />} />
              </Route>
            </Route>
          </Route>

          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
