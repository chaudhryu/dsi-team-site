// src/layout/AppHeader.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);

  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const isAuthenticated = useIsAuthenticated();
  const { instance } = useMsal();

  const handleLogout = () => instance.logoutRedirect();

  const handleToggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen((v) => !v);
  };

  return (
    <header className="sticky top-0 z-40 flex w-full bg-neutral-900 border-b border-neutral-800">
      <div className="flex grow flex-col items-center justify-between lg:flex-row lg:px-6 text-neutral-100">
        {/* ─────────── Left section ─────────── */}
        <div className="flex w-full items-center justify-between gap-2 px-3 py-3 border-b border-neutral-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          {/* Sidebar toggle (only when authenticated) */}
          {isAuthenticated ? (
            <button
              onClick={handleToggleSidebar}
              aria-label="Toggle Sidebar"
              className="items-center justify-center w-10 h-10 text-neutral-300 border border-neutral-800 rounded-lg z-99999 lg:flex lg:h-11 lg:w-11 hover:bg-neutral-800"
            >
              {/* X icon when open; hamburger otherwise */}
              {isMobileOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M6.22 7.28a.75.75 0 0 1 1.06-1.06l4.72 4.72 4.72-4.72a.75.75 0 0 1 1.06 1.06L13.06 12l4.72 4.72a.75.75 0 1 1-1.06 1.06L12 13.06l-4.72 4.72a.75.75 0 1 1-1.06-1.06L10.94 12 6.22 7.28Z"
                    fill="currentColor"
                  />
                </svg>
              ) : (
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
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
            <span />
          )}

          {/* Brand: ALWAYS links home */}
          <Link
            to="/"
            className="text-lg font-semibold text-neutral-100 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="Go to home"
          >
            ITS Team Hub
          </Link>

          {/* Mobile logo (also links home) */}
          <Link to="/" className="lg:hidden ml-auto">
            <img className="h-12 w-auto" src="./images/LAMetroLogo.svg.png" alt="Metro logo" />
          </Link>

          {/* Mobile app menu toggle */}
          <button
            onClick={toggleApplicationMenu}
            className="flex items-center justify-center w-10 h-10 text-neutral-300 rounded-lg hover:bg-neutral-800 lg:hidden"
            aria-label="Open application menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none">
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
          className={`${
            isApplicationMenuOpen ? "flex" : "hidden"
          } w-full items-center justify-between gap-4 px-5 py-4 lg:flex lg:justify-end lg:px-0`}
        >
          {/* {!isAuthenticated && (
            <Link
              to="/projects-external"
              className="inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold
                         text-neutral-200 hover:text-white hover:bg-neutral-800
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
            >
              Projects
            </Link>
          )} */}


          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Sign&nbsp;out
            </button>
          ) : (
            <Link
              to="/signin"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium
                       text-white border border-white/60 rounded-lg hover:bg-white/10
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
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
