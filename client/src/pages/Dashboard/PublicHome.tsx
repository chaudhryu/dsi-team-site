import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
/**
 * Hero‑style landing page with image‑above‑text and a mount‑time fade‑in.
 */
export default function Home() {
  /* run‑once animation flag */
  const [visible, setVisible] = useState(false);
  useEffect(() => setVisible(true), []);

  return (
    <>
      <PageMeta title="DSI WebApps – Home" description="Landing page for the DSI WebApps team site" />

      {/* ─────────── Hero ─────────── */}
      <div
        className="relative isolate overflow-hidden bg-white dark:bg-gray-900
                     pt-14 sm:pt-20 -m-4 md:-m-6"
      >
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
          <img
            src="/images/LAMetroLogo.svg.png"
            alt="LA Metro logo"
            className="mb-8 mx-auto block h-16 w-auto sm:h-[72px] md:h-[88px]"
            loading="eager"
          />

          {/* Headline & Copy */}
          <h1 className="text-center text-5xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-7xl">
            ITS Teams Site
          </h1>
          <p className="mt-8 text-center text-lg leading-8 text-gray-600 dark:text-gray-300">
            Welcome to the ITS Team Site. Explore the applications from our ITS Teams, read about the technologies we
            use, and get involved in shaping the digital experience for Metro riders.
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex items-center justify-center gap-x-6">
            {/* <Link
              to="/projects-external"
              className="rounded-lg px-4 py-2.5 text-sm font-semibold
             bg-neutral-900 text-white shadow transition
             duration-200 ease-out
             hover:bg-neutral-800 hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.02]
             active:translate-y-0 active:scale-100
             focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/60

             dark:bg-white dark:text-neutral-900
             dark:hover:bg-neutral-200 dark:focus-visible:ring-white/70"
            >
              View projects
            </Link> */}
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
      </div>
    </>
  );
}
