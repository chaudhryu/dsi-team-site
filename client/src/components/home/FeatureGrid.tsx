import { useEffect, useMemo, useRef, useState } from "react";
import { useLogin } from "@/context/LoginContext";
import { getUserByCostCenter } from "@/Data/actions/UserAction";
import { UserType } from "@/Data/dataTypes/Types";

// Optional: normalize role checks (handles "Manager", "MANAGER", "manager", etc.)
const isManagerRole = (role: string) => role?.trim().toLowerCase() === "manager";

export default function FeatureGrid() {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const { loginEmployee } = useLogin();
  const [people, setPeople] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep your intersection animation
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { root: null, threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Fetch people from API
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await getUserByCostCenter((loginEmployee as any).costCenter);
        if (res.status !== 200) {
          // Optionally parse server error message

          throw new Error(`Failed to load team (HTTP ${res.status})`);
        }

        const data = (await res.data) as UserType[];

        // Basic safety: ensure array
        setPeople(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e?.message || "Failed to load team.");
        setPeople([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Managers first (optional), then alphabetical
  const sortedPeople = useMemo(() => {
    return [...people].sort((a, b) => {
      const aMgr = isManagerRole(a.role);
      const bMgr = isManagerRole(b.role);
      if (aMgr !== bMgr) return aMgr ? -1 : 1; // managers first
      return a.firstName.localeCompare(b.firstName);
    });
  }, [people]);

  return (
    <section
      ref={sectionRef}
      className={`bg-white dark:bg-gray-900 py-24 sm:py-32 transition-all duration-700
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
    >
      <div className="mx-auto grid max-w-7xl gap-20 px-6 lg:px-8 xl:grid-cols-3">
        {/* intro */}
        <div className="max-w-xl">
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Team Members
          </h2>
          {/* <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            We’re a dynamic group of individuals who are passionate about what we do and dedicated to delivering the
            best results for Metro riders.
          </p> */}

          {/* status */}
          <div className="mt-6">
            {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading team...</p>}
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>
        </div>

        {/* team grid */}
        <ul role="list" className="grid gap-x-8 gap-y-12 sm:grid-cols-2 sm:gap-y-16 xl:col-span-2">
          {!loading && !error && sortedPeople.length === 0 && (
            <li className="sm:col-span-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">No team members found.</p>
            </li>
          )}

          {sortedPeople.map((person) => {
            const manager = isManagerRole(person.role);

            return (
              <li key={person.badge}>
                <div className="flex items-center gap-x-6">
                  <div className="relative">
                    {/* <img
                      src={person.imageUrl}
                      alt={person.name}
                      className={[
                        "h-20 w-20 md:h-24 md:w-24 rounded-full ring-1 ring-black/5 object-cover",
                        manager ? "ring-2 ring-brand-500" : "",
                      ].join(" ")}
                    /> */}
                  </div>

                  <div>
                    <h3 className="text-base font-semibold leading-7 tracking-tight text-gray-900 dark:text-white">
                      {person.firstName} {person.lastName}
                    </h3>

                    {/* If manager, show stronger styling */}
                    <p
                      className={[
                        "text-sm font-semibold leading-6",
                        manager ? "text-brand-700 dark:text-brand-300" : "text-brand-600",
                      ].join(" ")}
                    >
                      {person.role}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
