import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";

import { useIsAuthenticated, useMsal } from "@azure/msal-react";

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);

  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const authenticated = useIsAuthenticated();
  const { instance } = useMsal();

  const handleLogout = () => instance.logoutRedirect();

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 flex w-full bg-white border-gray-200 z-99999 dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
        {/* ─────────── Left section ─────────── */}
        <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          {authenticated ? (
            <button
              className="items-center justify-center w-10 h-10 text-gray-500 border-gray-200 rounded-lg z-99999 dark:border-gray-800 lg:flex dark:text-gray-400 lg:h-11 lg:w-11 lg:border"
              onClick={handleToggle}
              aria-label="Toggle Sidebar"
            >
              {isMobileOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M6.22 7.28a.75.75 0 0 1 1.06-1.06l4.72 4.72 4.72-4.72a.75.75 0 0 1 1.06 1.06L13.06 12l4.72 4.72a.75.75 0 1 1-1.06 1.06L12 13.06l-4.72 4.72a.75.75 0 1 1-1.06-1.06L10.94 12 6.22 7.28Z"
                    fill="currentColor"
                  />
                </svg>
              ) : (
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M.583 1A.75.75 0 0 1 1.333.25h13.333a.75.75 0 0 1 0 1.5H1.333A.75.75 0 0 1 .583 1Zm0 10a.75.75 0 0 1 .75-.75h13.333a.75.75 0 0 1 0 1.5H1.333a.75.75 0 0 1-.75-.75ZM1.333 5.25a.75.75 0 0 0 0 1.5h6.667a.75.75 0 0 0 0-1.5H1.333Z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </button>
          ) : (
            <Link
            to="/"
            className="text-lg font-semibold text-gray-700 hover:text-brand-700 dark:text-gray-200 dark:hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            DSI&nbsp;WebApps&nbsp;Team
          </Link>
          )}

          {/* mobile logo */}
          <Link to="/" className="lg:hidden">
            <img className="h-12 w-auto dark:hidden" src="./images/logo/metroLogoSmall.webp" alt="Logo" />
            <img className="hidden h-12 w-auto dark:block" src="./images/logo/metroLogoSmall.webp" alt="Logo" />
          </Link>

          <button
            onClick={toggleApplicationMenu}
            className="flex items-center justify-center w-10 h-10 text-gray-700 rounded-lg z-99999 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6 10.495a1.5 1.5 0 1 1 0 3h-.002a1.5 1.5 0 0 1 0-3Zm12 0a1.5 1.5 0 1 1 0 3h-.002a1.5 1.5 0 0 1 0-3Zm-6 1.5a1.5 1.5 0 1 1 0-3h.002a1.5 1.5 0 0 1 0 3Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        {/* ─────────── Right section ─────────── */}
        <div
          className={`${isApplicationMenuOpen ? "flex" : "hidden"
            } items-center justify-between w-full gap-4 px-5 py-4 lg:flex shadow-theme-md lg:justify-end lg:px-0 lg:shadow-none`}
        >
 {!authenticated && (
  <Link
    to="/projects"
    className="
      inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold
      text-gray-700 hover:text-gray-900 hover:bg-gray-100
      dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800
      focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600
      transition-colors
    "
  >
    Projects
  </Link>
)}
          <div className="flex items-center gap-2 2xsm:gap-3">
            <ThemeToggleButton />
            {authenticated}
          </div>



          {authenticated ? (
            <>
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
              >
                Sign&nbsp;out
              </button>
            </>
          ) : (
            <Link
              to="/signin"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600"
            >
              Sign&nbsp;in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
