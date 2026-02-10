import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserActivityLogs } from "@/Data/actions/UserActivityAction";

type ActivityLog = {
  id: number;
  activityType: string;
  timestamp: string;
  accomplishmentId: number | null;
  metadata: string | null;
  user: {
    badge: number;
    firstName: string;
    lastName: string;
    email: string;
  };
};

export default function UserActivityLogs() {
  const { badge } = useParams<{ badge: string }>();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!badge) return;

    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getUserActivityLogs(Number(badge));
        if (response.status === 200) {
          setLogs(response.data);
        } else {
          setError("Failed to load activity logs");
        }
      } catch (err) {
        console.error("Error fetching activity logs:", err);
        setError("Failed to load activity logs. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [badge]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatActivityType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const userName = logs.length > 0 
    ? `${logs[0].user.firstName} ${logs[0].user.lastName} (${logs[0].user.badge})`
    : `User ${badge}`;

  return (
    <div className="-m-4 md:-m-6">
      <header className="p-6 md:p-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/users")}
            className="text-brand-600 hover:text-brand-700 text-sm font-medium"
          >
            ← Back to Users
          </button>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mt-4">
          Activity Logs for {userName}
        </h1>
      </header>

      <section className="p-6 md:p-8">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-auto">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Activity History</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {logs.length} activity log{logs.length === 1 ? "" : "s"}
            </p>
          </div>

          {loading && (
            <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
              Loading activity logs...
            </div>
          )}

          {error && (
            <div className="px-6 py-4 text-center text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {!loading && !error && logs.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
              No activity logs found for this user.
            </div>
          )}

          {!loading && !error && logs.length > 0 && (
            <table className="min-w-full w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="px-6 py-3 font-medium">Date & Time</th>
                  <th className="px-6 py-3 font-medium">Activity Type</th>
                  <th className="px-6 py-3 font-medium">Accomplishment ID</th>
                  <th className="px-6 py-3 font-medium">Details</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40">
                    <td className="px-6 py-3">{formatTimestamp(log.timestamp)}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          log.activityType === "login"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                        }`}
                      >
                        {formatActivityType(log.activityType)}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {log.accomplishmentId ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                      {log.metadata ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
