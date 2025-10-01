import { Link } from "react-router-dom";

const currentYear = new Date().getFullYear();

const AppFooter: React.FC = () => (
  <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* top row ---------------------------------------------------- */}
      <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
        {/* logo (small) */}
        <Link to="/" className="flex items-center space-x-2">
          <img
            src="/images/LAMetroLogo.svg.png"
            alt="Metro logo"
            className="h-8 w-auto dark:hidden"
          />
          <img
            src="/images/logo/theMetroLogo.webp"
            alt="Metro logo"
            className="hidden h-8 w-auto dark:block"
          />
          <span className="sr-only">DSI WebApps</span>
        </Link>

       
      </div>

      {/* bottom row ------------------------------------------------- */}
      <p className="mt-10 text-center text-xs leading-5 text-gray-500 dark:text-gray-400">
        © {currentYear} Los Angeles County Metropolitan Transportation Authority. All rights reserved.
      </p>
    </div>
  </footer>
);

export default AppFooter;
