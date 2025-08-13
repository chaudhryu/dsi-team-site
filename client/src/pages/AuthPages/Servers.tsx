// src/pages/Servers.tsx
import { useEffect, useMemo, useState } from 'react';
import { envConfig } from '../../config/envConfig';
const API_BASE = envConfig.backendApiBaseUrl || 'http://localhost:3005/api';

type ServerRow = {
  id: number;
  hostname: string;
  ipAddress: string;
  os: string;
  status: string;
  environment: string;
  role: string;
  location: string;
  folder?: string | null;
};

export default function Servers() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<ServerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<ServerRow, 'id'>>({
    hostname: '',
    ipAddress: '',
    os: '',
    status: 'Active',
    environment: 'Dev',
    role: '',
    location: '',
    folder: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const url = new URL(`${API_BASE}/servers`);
      if (q) url.searchParams.set('q', q);
      const res = await fetch(url.toString(), { credentials: 'include' });
      const data = await res.json();
      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCount = useMemo(() => rows.length, [rows]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/servers`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      alert('Failed to create server');
      return;
    }
    setOpen(false);
    setForm({ ...form, hostname: '', ipAddress: '', os: '', role: '', location: '', folder: '' });
    await load();
  };

  return (
    <div className="-m-4 md:-m-6">
      <header className="p-6 md:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Servers
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          List, filter, and add servers (SQLite via Nest + TypeORM).
        </p>
      </header>

      {/* Filters & Actions */}
      <section className="px-6 md:px-8">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Search
              </label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Hostname, IP, OS, status, env, role, location, folder"
                className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="flex items-end gap-3">
              <button
                onClick={load}
                className="inline-flex items-center rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {loading ? 'Searching…' : 'Search'}
              </button>
              <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
              >
                Add Server
              </button>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">{filteredCount} result(s)</div>
        </div>
      </section>

      {/* Table */}
      <section className="p-6 md:p-8">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-auto">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Servers</h2>
          </div>

          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-6 py-3 font-medium">Hostname</th>
                <th className="px-6 py-3 font-medium">IP</th>
                <th className="px-6 py-3 font-medium">OS</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Env</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Location</th>
                <th className="px-6 py-3 font-medium">Folder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {rows.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40">
                  <td className="px-6 py-3">{s.hostname}</td>
                  <td className="px-6 py-3">{s.ipAddress}</td>
                  <td className="px-6 py-3">{s.os}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      s.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : s.status === 'Down'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">{s.environment}</td>
                  <td className="px-6 py-3">{s.role}</td>
                  <td className="px-6 py-3">{s.location}</td>
                  <td className="px-6 py-3">{s.folder ?? ''}</td>
                </tr>
              ))}
              {rows.length === 0 && !loading && (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500 dark:text-gray-400" colSpan={8}>
                    No servers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-2xl rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg"
          >
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add Server</h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Close
              </button>
            </div>

            <form onSubmit={submit} className="p-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {([
                ['hostname', 'Hostname'],
                ['ipAddress', 'IP Address'],
                ['os', 'Operating System'],
                ['status', 'Status'],
                ['environment', 'Environment'],
                ['role', 'Role'],
                ['location', 'Location'],
                ['folder', 'Folder (optional)'],
              ] as const).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                  </label>
                  <input
                    required={key !== 'folder'}
                    value={(form as any)[key] ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              ))}

              <div className="sm:col-span-2 mt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
