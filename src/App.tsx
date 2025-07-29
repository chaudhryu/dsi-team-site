import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import ProtectedRoute from "./routes/ProtectedRoute";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";

export default function App() {
  return (
    <>
 <Router>
  <ScrollToTop />

  {/* ---------- Layout that everyone can see ---------- */}
  <Route element={<AppLayout />}>
    <Route index element={<Home />} />          {/* Public */}
    <Route path="/images" element={<Images />} />{/* Public */}
    {/* Whatever else should be public… */}

    {/* ---------- Auth‑only pages ---------- */}
    <Route element={<ProtectedRoute />}>
      <Route path="/profile" element={<UserProfiles />} />
      <Route path="/calendar" element={<Calendar />} />
      {/* add other private routes here */}
    </Route>
  </Route>

  {/* Auth screens */}
  <Route path="/signin" element={<SignIn />} />
  <Route path="/signup" element={<SignUp />} />

  <Route path="*" element={<NotFound />} />
</Router>
    </>
  );
}
