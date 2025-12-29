import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  UserCircleIcon,
  TableIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { envConfig } from "../config/envConfig";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

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

const BASE_NAV_ITEMS: NavItem[] = [
  { icon: <GridIcon />, name: "Home", path: "/" },
  {
    icon: <CalenderIcon />,
    name: "Accomplishments",
    subItems: [
      { name: "Your Accomplishments", path: "/submit-accomplishment", pro: false },
      { name: "Team Accomplishments", path: "/view-accomplishments", pro: false },
    ],
  },
  { icon: <UserCircleIcon />, name: "User Management", path: "/users" },
  { name: "Projects", icon: <ListIcon />, path: "/projects-internal" },
  { name: "Databases", icon: <TableIcon />, path: "/databases" },
];

const HIGH_MANAGER_ITEM: NavItem = {
  name: "High Manager Dashboard",
  icon: <TableIcon />,
  path: "/high-manager-dashboard",
};

const othersItems: NavItem[] = [];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{ type: "main" | "others"; index: number } | null>(
    null
  );
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [isHighManager, setIsHighManager] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRoleFromDb() {
      const badge = readBadgeFromStorage();
      if (!badge) {
        if (!cancelled) setIsHighManager(false);
        return;
      }

      const role = await fetchDbRoleForBadge(badge);
      if (!cancelled) setIsHighManager(role === "high_manager");
    }

    loadRoleFromDb();

    // If loginEmployee changes (logout/login) in another tab, re-check
    const onStorage = (e: StorageEvent) => {
      if (e.key === LOGIN_KEY) loadRoleFromDb();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const navItems: NavItem[] = useMemo(() => {
    const items = [...BASE_NAV_ITEMS];
    if (isHighManager) items.push(HIGH_MANAGER_ITEM);
    return items;
  }, [isHighManager]);

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);

  useEffect(() => {
    let submenuMatched = false;

    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;

      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({ type: menuType as "main" | "others", index });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) setOpenSubmenu(null);
  }, [location, isActive, navItems]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prev) =>
      prev && prev.type === menuType && prev.index === index ? null : { type: menuType, index }
    );
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              aria-expanded={openSubmenu?.type === menuType && openSubmenu?.index === index}
              className={`menu-item group
                ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}
                hover:bg-neutral-800 rounded-lg
                ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "!bg-neutral-800 !text-white font-semibold"
                    : "text-neutral-200 hover:text-white"
                }`}
            >
              <span
                className={`menu-item-icon-size
                  ${
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? "text-white"
                      : "text-neutral-300 group-hover:text-white"
                  }`}
              >
                {nav.icon}
              </span>

              {(isExpanded || isHovered || isMobileOpen) && (
                <span
                  className={`menu-item-text tracking-wide
                    ${
                      openSubmenu?.type === menuType && openSubmenu?.index === index
                        ? "text-white font-semibold"
                        : "text-neutral-200 font-medium group-hover:text-white"
                    }`}
                >
                  {nav.name}
                </span>
              )}

              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200
                    ${
                      openSubmenu?.type === menuType && openSubmenu?.index === index
                        ? "rotate-180 text-white"
                        : "text-neutral-300"
                    }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"}
                            rounded-lg hover:bg-neutral-800
                            ${isActive(nav.path) ? "!bg-neutral-800 !text-white font-semibold" : "text-neutral-200 hover:text-white"}`}
              >
                <span
                  className={`menu-item-icon-size ${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}
                              ${isActive(nav.path) ? "text-white" : "text-neutral-300 group-hover:text-white"}`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span
                    className={`menu-item-text tracking-wide ${
                      isActive(nav.path)
                        ? "text-white font-semibold"
                        : "text-neutral-200 font-medium group-hover:text-white"
                    }`}
                  >
                    {nav.name}
                  </span>
                )}
              </Link>
            )
          )}

          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item rounded-md px-2 py-1.5
                                  ${
                                    isActive(subItem.path)
                                      ? "menu-dropdown-item-active !bg-neutral-800 !text-white font-medium"
                                      : "menu-dropdown-item-inactive text-neutral-300 hover:text-white hover:bg-neutral-800"
                                  }`}
                    >
                      <span className="tracking-wide">{subItem.name}</span>
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`menu-dropdown-badge ml-auto ${
                              isActive(subItem.path) ? "menu-dropdown-badge-active" : "menu-dropdown-badge-inactive"
                            } text-neutral-200`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`menu-dropdown-badge ml-auto ${
                              isActive(subItem.path) ? "menu-dropdown-badge-active" : "menu-dropdown-badge-inactive"
                            } text-neutral-200`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0
        bg-neutral-900 text-neutral-100 border-r border-neutral-800
        h-screen transition-all duration-300 ease-in-out z-50
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="py-8 flex border-b border-neutral-800 justify-center">
        <Link to="/" className="block">
          {isExpanded || isHovered || isMobileOpen ? (
            <img src="/images/LAMetroLogo.svg.png" alt="Logo" className="mx-auto h-12 w-auto" />
          ) : (
            <img src="/images/logo/metroLogoSmall.webp" alt="Logo" className="mx-auto h-8 w-auto" />
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px]
                            font-semibold tracking-wider text-neutral-300/90
                            ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6 text-neutral-400" />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
