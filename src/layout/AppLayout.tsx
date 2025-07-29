import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import AppFooter from "./AppFooter";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen xl:flex">
      {/* ─────────── Side bar column ─────────── */}
      <div>
        <AppSidebar />
        <Backdrop />
      </div>

      {/* ─────────── Main column ─────────── */}
      <div
        className={`flex flex-col flex-1 min-h-screen transition-all duration-300 ease-in-out
          ${isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"}
          ${isMobileOpen ? "ml-0" : ""}`}
      >
        {/* Header (fixed height) */}
        <AppHeader />

        {/* Scrollable page content */}
        <div className="w-full h-full">
          <Outlet />
        </div>

        <AppFooter />
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => (
  <SidebarProvider>
    <LayoutContent />
  </SidebarProvider>
);

export default AppLayout;
