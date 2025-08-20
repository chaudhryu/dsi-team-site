// src/pages/Users.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { envConfig } from '../config/envConfig';

const API_BASE = envConfig.backendApiBaseUrl || 'http://localhost:3000/api';

type UserRow = {
  badge: number;
  firstName: string;
  lastName: string;
  email: string;
  position?: string | null;
  readOnly?: boolean | null;
};

export default function Users() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  // modal state
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // form fields
  const [badge, setBadge] = useState<string>('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('');
  const [readOnly, setReadOnly] = useState(false);

  const firstInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setBadge('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPosition('');
    setReadOnly(false);
    setErrMsg(null);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users`, { credentials: 'include' });
      if (!res.ok) {
        const text = await res.text();
        console.error('GET /users failed', res.status, text);
        setRows([]);
        return;
      }
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Network error /users:', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (open) {
      // focus the first input when modal opens
      setTimeout(() => firstInputRef.current?.focus(), 0);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((u) => {
      const hay = `${u.badge} ${u.firstName ?? ''} ${u.lastName ?? ''} ${u.email ?? ''} ${u.position ?? ''}`.toLowerCase();
      return hay.includes(term);
    });
  }, [rows, q]);

  const handleOpen = () => {
    resetForm();
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const validate = () => {
    if (!badge || isNaN(Number(badge))) return 'Badge must be a number.';
    if (!firstName.trim()) return 'First name is required.';
    if (!lastName.trim()) return 'Last name is required.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Valid email is required.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setErrMsg(v);
      return;
    }
    setSaving(true);
    setErrMsg(null);
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          badge: Number(badge),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          position: position.trim() || null,
          readOnly,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('POST /users failed', res.status, text);
        setErrMsg('Failed to save user. The badge might already exist or the server rejected the data.');
        return;
      }

      const created: UserRow = await res.json();
      // Optimistic: append & sort by badge; or just reload()
      setRows((prev) => {
        const next = [...prev, created];
        next.sort((a, b) => a.badge - b.badge);
        return next;
      });
      setOpen(false);
      resetForm();
    } catch (err) {
      console.error('Network error creating user:', err);
      setErrMsg('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="-m-4 md:-m-6">
      {/* Header */}
      <header className="p-6 md:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Users
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Directory of users from the backend (SQLite via Nest + TypeORM).
        </p>
      </header>

      {/* Filters / Actions */}
      <section className="px-6 md:px-8">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Search</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by badge, name, email, position"
                className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="flex items-end gap-3">
              <button
                onClick={load}
                className="inline-flex items-center rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
              <button
                onClick={handleOpen}
                className="inline-flex items-center rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600"
              >
                + Add user
              </button>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {filtered.length} result{filtered.length === 1 ? '' : 's'}
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="p-6 md:p-8">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-auto">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Users</h2>
          </div>

          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-6 py-3 font-medium">Badge</th>
                <th className="px-6 py-3 font-medium">First Name</th>
                <th className="px-6 py-3 font-medium">Last Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Position</th>
                <th className="px-6 py-3 font-medium">Read Only</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filtered.map((u) => (
                <tr key={u.badge} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40">
                  <td className="px-6 py-3">{u.badge}</td>
                  <td className="px-6 py-3">{u.firstName ?? ''}</td>
                  <td className="px-6 py-3">{u.lastName ?? ''}</td>
                  <td className="px-6 py-3">{u.email ?? ''}</td>
                  <td className="px-6 py-3">{u.position ?? ''}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        u.readOnly
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                      }`}
                    >
                      {u.readOnly ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500 dark:text-gray-400" colSpan={6}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add User Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onKeyDown={(e) => e.key === 'Escape' && !saving && handleClose()}
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => !saving && handleClose()} />

          <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add user</h3>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {errMsg ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                  {errMsg}
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Badge *</label>
                  <input
                    ref={firstInputRef}
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="e.g. 96880"
                    className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email *</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@metro.net"
                    className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">First name *</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last name *</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Position</label>
                  <input
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="(optional)"
                    className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="flex items-center gap-2 md:col-span-2">
                  <input
                    id="readonly"
                    type="checkbox"
                    checked={readOnly}
                    onChange={(e) => setReadOnly(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="readonly" className="text-sm text-gray-700 dark:text-gray-300">
                    Read-only user
                  </label>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-800 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={saving}
                  className="inline-flex items-center rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-700 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save user'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
