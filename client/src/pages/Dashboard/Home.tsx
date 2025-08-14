import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import FeatureGrid from "../../components/home/FeatureGrid";
/**
 * Hero‑style landing page with image‑above‑text and a mount‑time fade‑in.
 */
export default function Home() {
  /* run‑once animation flag */
  const [visible, setVisible] = useState(false);
  useEffect(() => setVisible(true), []);

  return (
    <>
      <PageMeta
        title="DSI WebApps – Home"
        description="Landing page for the DSI WebApps team site"
      />

      {/* ─────────── Hero ─────────── */}
            <div className="relative isolate overflow-hidden bg-white dark:bg-gray-900
                     pt-14 sm:pt-20 -m-4 md:-m-6">    
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        >
          <div
            className="relative left-[calc(50%-11rem)] w-[72rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[90rem]"
            style={{
              clipPath:
                "polygon(74.1% 44.1%,100% 61.6%,97.5% 26.9%,85.5% 0.1%,80.7% 2%,72.5% 32.5%,60.2% 62.4%,52.4% 68.1%,47.5% 58.3%,45.2% 34.5%,27.5% 76.7%,0.1% 64.9%,17.9% 100%,27.6% 76.8%,76.1% 97.7%,74.1% 44.1%)",
            }}
          />
        </div>

        {/* ─────────── Animated content ─────────── */}
        <div
          className={`mx-auto flex max-w-2xl flex-col items-center px-6
                      transition-all duration-700
                      ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          {/* Image (smaller, above text) */}
          <img
            src="/images/stockTeam.jpg"
            alt="Team collaborating at their desks"
            className="mb-12 w-full max-w-md rounded-xl shadow-lg ring-1 ring-gray-900/10
                       dark:ring-gray-100/10 md:max-w-lg"
          />

          {/* Headline & Copy */}
          <h1 className="text-center text-5xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-7xl">
            Building better transit apps for LA
          </h1>
          <p className="mt-8 text-center text-lg leading-8 text-gray-600 dark:text-gray-300">
            Welcome to the DSI WebApps team hub. Explore our projects, read
            about the tech we use, and get involved in shaping the digital
            experience for Metro riders.
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              to="/projects-external"
              className="rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              View projects
            </Link>
            <Link
              to="/about"
              className="text-sm font-semibold text-gray-900 dark:text-gray-100"
            >
              Learn more <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Bottom blob */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
        >
          <div
            className="relative left-[calc(50%+3rem)] w-[72rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[90rem]"
            style={{
              clipPath:
                "polygon(74.1% 44.1%,100% 61.6%,97.5% 26.9%,85.5% 0.1%,80.7% 2%,72.5% 32.5%,60.2% 62.4%,52.4% 68.1%,47.5% 58.3%,45.2% 34.5%,27.5% 76.7%,0.1% 64.9%,17.9% 100%,27.6% 76.8%,76.1% 97.7%,74.1% 44.1%)",
            }}
          />
        </div>
           <FeatureGrid />

      </div>
    </>
  );
}
