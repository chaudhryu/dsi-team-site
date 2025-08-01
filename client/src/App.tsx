import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Images from "./pages/UiElements/Images";
import Accomplishments from "./pages/Accomplishments";
import Calendar from "./pages/Calendar";

import ProtectedRoute from "./routes/ProtectedRoute";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import AuthCallback from "./pages/AuthCallback";

export default function App() {
  return (
    <>
 <Router>
  <ScrollToTop />
  <Routes>                    

  <Route path="/auth-response" element={<AuthCallback />} />

  {/* ---------- Layout that everyone can see ---------- */}
  <Route element={<AppLayout />}>
    <Route index element={<Home />} />          {/* Public */}
    <Route path="/images" element={<Images />} />{/* Public */}

    {/* ---------- Auth‑only pages ---------- */}
    <Route element={<ProtectedRoute />}>
      <Route path="/profile" element={<UserProfiles />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/submit-accomplishment" element={<Accomplishments />} />

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
