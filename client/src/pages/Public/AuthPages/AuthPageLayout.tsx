import React from "react";
import GridShape from "../../../components/common/GridShape";
import { Link } from "react-router";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The new structural bounding wrapper from your console test
    <div className="flex-1 md:mx-auto w-full max-w-[--breakpoint-2xl]">
      
      <div className="relative h-screen w-full bg-neutral-900 text-neutral-100 overflow-hidden">
        <div className="flex h-full w-full flex-col lg:flex-row">
          
          {/* LEFT: Sign-in content — matches your tested flex alignment */}
          <div className="flex h-full w-full items-center justify-center bg-white text-neutral-900 px-6 lg:w-1/2">
            {children}
          </div>

          {/* RIGHT: Brand panel — strictly h-full */}
          <div className="hidden h-full w-full items-center justify-center bg-neutral-900 lg:flex lg:w-1/2 border-t border-neutral-800 lg:border-t-0 lg:border-l">
            <div className="relative z-10 flex items-center justify-center">
              <GridShape />
              <div className="flex max-w-xs flex-col items-center">
                <Link to="/" className="mb-4 block">
                  <img
                    width={231}
                    height={48}
                    src="/images/LAMetroLogo.svg.png"
                    alt="Logo"
                    className="opacity-95"
                  />
                </Link>
                <p className="text-center text-neutral-300">DSI Teams Website</p>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}