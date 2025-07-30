import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import AppFooter from "./AppFooter";
import { useIsAuthenticated } from "@azure/msal-react";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered } = useSidebar();
  const authenticated = useIsAuthenticated();   // NEW

  const sidebarWidth =
    authenticated
      ? isExpanded || isHovered
        ? "lg:ml-[290px]"
        : "lg:ml-[90px]"
      : "";

  return (
    <div className="min-h-screen xl:flex">
        {authenticated && (                      /* NEW */
        <>
          <AppSidebar />
          <Backdrop />
        </>
      )}
      {/* ─────────── Main column ─────────── */}
      <div
  className={`flex flex-col flex-1 min-h-screen transition-all duration-300 ease-in-out ${sidebarWidth}`}
>
        {/* Header (fixed height) */}
        <AppHeader />

        {/* Scrollable page content */}
        <div className="flex-1 p-4 md:p-6 mx-auto w-full max-w-[--breakpoint-2xl]">
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
