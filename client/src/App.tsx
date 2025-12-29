import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";

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

/* -------------------- helpers -------------------- */

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

/**
 * Tiny in-memory cache to avoid calling /users multiple times per page load.
 * (Keeps your UI snappy when both index + guards check role.)
 */
const roleCache = new Map<number, { role: string; at: number }>();
const ROLE_TTL_MS = 60_000; // 1 minute

async function fetchDbRoleForBadge(badge: number): Promise<string> {
  const cached = roleCache.get(badge);
  if (cached && Date.now() - cached.at < ROLE_TTL_MS) return cached.role;

  try {
    const res = await fetch(`${API_BASE}/users`, { credentials: "include" });
    if (!res.ok) return "";

    const users = (await res.json()) as DbUser[];
    const me = users.find((u) => Number(u?.badge) === badge);
    const role = normalizeRole(me?.role);

    roleCache.set(badge, { role, at: Date.now() });
    return role;
  } catch {
    return "";
  }
}

function InlineLoading({ label }: { label: string }) {
  return (
    <div className="p-6">
      <div className="text-sm text-gray-600 dark:text-gray-300">{label}</div>
    </div>
  );
}

/**
 * ✅ Index route:
 * - Logged out => PublicHome
 * - Logged in + role=high_manager => HighManagerDashboard
 * - Logged in + other role => Home
 */
function IndexGate() {
  const [state, setState] = useState<
    { kind: "loading" } | { kind: "public" } | { kind: "home" } | { kind: "high" }
  >({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function decide() {
      const badge = readBadgeFromStorage();

      // not logged in
      if (!badge) {
        if (!cancelled) setState({ kind: "public" });
        return;
      }

      // logged in => check DB role
      const role = await fetchDbRoleForBadge(badge);

      if (cancelled) return;

      if (role === "high_manager") setState({ kind: "high" });
      else setState({ kind: "home" });
    }

    decide();

    // If loginEmployee changes in another tab, re-evaluate
    const onStorage = (e: StorageEvent) => {
      if (e.key === LOGIN_KEY) decide();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  if (state.kind === "loading") return <InlineLoading label="Loading dashboard…" />;
  if (state.kind === "public") return <PublicHome />;
  if (state.kind === "high") return <HighManagerDashboard />;
  return <Home />;
}

/**
 * ✅ Route guard for high_manager-only routes.
 * (No AuthCallback changes needed; uses badge from localStorage + /users role)
 */
function HighManagerOnlyRoute() {
  const [status, setStatus] = useState<"loading" | "allowed" | "denied">("loading");

  useEffect(() => {
    let cancelled = false;

    async function check() {
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
  }, []);

  if (status === "loading") return <InlineLoading label="Checking access…" />;
  if (status === "denied") return <Navigate to="/" replace />;

  return <Outlet />;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />

      <Routes>
        <Route path="/auth-response" element={<AuthCallback />} />

        {/* App shell */}
        <Route element={<AppLayout />}>
          {/* ✅ Dashboard/Home route */}
          <Route index element={<IndexGate />} />

          {/* Public routes */}
          <Route path="/images" element={<Images />} />
          <Route path="/projects-external" element={<Projects isInternal={false} />} />

          {/* Auth-only routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/projects-internal" element={<Projects isInternal={true} />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/submit-accomplishment" element={<Accomplishments />} />
            <Route path="/view-accomplishments" element={<AccomplishmentsTable />} />
            <Route path="/users" element={<Users />} />
            <Route path="/databases" element={<Databases />} />

            {/* ✅ Keep this route (optional) but lock it down to high_manager */}
            <Route element={<HighManagerOnlyRoute />}>
              <Route path="/high-manager-dashboard" element={<HighManagerDashboard />} />
            </Route>
          </Route>
        </Route>

        {/* Auth screens */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
