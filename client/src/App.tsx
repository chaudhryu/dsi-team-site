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

/** Index page that shows PublicHome when logged out, Home when logged in */
function IndexGate() {
  const badge = readBadgeFromStorage();
  return badge ? <Home /> : <PublicHome />;
}

/** Route guard: allows access only if DB role is high_manager */
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

  if (status === "loading") {
    return (
      <div className="p-6">
        <div className="text-sm text-gray-600 dark:text-gray-300">Checking access…</div>
      </div>
    );
  }

  if (status === "denied") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/auth-response" element={<AuthCallback />} />
          {/* App chrome */}
          <Route element={<AppLayout />}>
            {/*  Public landing */}
            <Route index element={<PublicHome />} />
			  // <Route index element={<IndexGate />} />
            <Route path="/images" element={<Images />} />
            <Route path="/projects-external" element={<Projects isInternal={false} />} />

            {/*  Private area */}

            {/* ---------- Auth‑only pages ---------- */}

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Home />} /> {/*  Home moved here */}
              <Route path="/profile" element={<UserProfiles />} />
              <Route path="/projects-internal" element={<Projects isInternal={true} />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/submit-accomplishment" element={<Accomplishments />} />
              <Route path="/view-accomplishments" element={<AccomplishmentsTable />} />
              <Route path="/users" element={<Users />} />
              <Route path="/databases" element={<Databases />} />
              {/* ✅ high_manager-only route */}
              <Route element={<HighManagerOnlyRoute />}>
                <Route path="/high-manager-dashboard" element={<HighManagerDashboard />} />
              </Route>
              {/* add other private routes here */}
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
