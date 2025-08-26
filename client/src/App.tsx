import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
import AuthCallback from "./pages/Private/Auth/AuthCallback";
import Users from "./pages/Users";
import { MyProjects } from "./pages/ProjectsInternal/MyProjects";
import { TeamProjects } from "./pages/ProjectsInternal/TeamProjects";
import { ProjectsExternal } from "./pages/ProjectsExternal/ProjectsExternal";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/auth-response" element={<AuthCallback />} />

          {/* ---------- Layout that everyone can see ---------- */}
          <Route element={<AppLayout />}>
            <Route index element={<Home />} /> {/* Public */}
            <Route path="/images" element={<Images />} />
            {/* Public */}
            <Route path="/projects-external" element={<ProjectsExternal />} />
            {/* ---------- Auth‑only pages ---------- */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<UserProfiles />} />
              <Route path="/my-projects" element={<MyProjects />} />
              <Route path="/team-projects" element={<TeamProjects />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route
                path="/submit-accomplishment"
                element={<Accomplishments />}
              />
              <Route
                path="/view-accomplishments"
                element={<AccomplishmentsTable />}
              />
              <Route path="/users" element={<Users />} />

              {/* add other private routes here */}
            </Route>
          </Route>

          {/* Auth screens */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
