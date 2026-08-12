import { useState, useEffect, useCallback } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { superadminApi } from '../../utils/api';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import SuperAdminSubscription from '../../components/admin/SuperAdminSubscription';
const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'active', label: 'Active' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'rejected', label: 'Rejected' },
];

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700 ring-amber-200',
  active: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  suspended: 'bg-orange-100 text-orange-700 ring-orange-200',
  rejected: 'bg-red-100 text-red-700 ring-red-200',
};

function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || 'bg-slate-100 text-slate-600 ring-slate-200';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${cls}`}>
      {status}
    </span>
  );
}

function initials(user) {
  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return (name || user.username || '?').charAt(0).toUpperCase();
}

function fullName(user) {
  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return name || user.username;
}

export default function AdminAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [counts, setCounts] = useState({ all: 0, pending: 0, active: 0, suspended: 0, rejected: 0 });
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null); // { action, user }

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    const params = {
      page,
      page_size: pageSize,
    };
    if (tab !== 'all') {
      params.status = tab;
    }
    if (search.trim()) {
      params.search = search.trim();
    }

    superadminApi
      .listAdmins(params)
      .then((data) => {
        if (data && Array.isArray(data.results)) {
          setAdmins(data.results);
          setTotalCount(data.count ?? data.results.length);
          if (data.counts) {
            setCounts(data.counts);
          }
        } else if (Array.isArray(data)) {
          setAdmins(data);
          setTotalCount(data.length);
        } else {
          setAdmins([]);
          setTotalCount(0);
        }
      })
      .catch(() => setError('Failed to load admin accounts.'))
      .finally(() => setLoading(false));
  }, [page, pageSize, tab, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 250);
    return () => clearTimeout(timer);
  }, [load]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const pageNumbers = (() => {
    const pages = [];
    const span = 1;
    const start = Math.max(1, currentPage - span);
    const end = Math.min(totalPages, currentPage + span);
    if (start > 1) pages.push(1);
    if (start > 2) pages.push('…');
    for (let p = start; p <= end; p++) pages.push(p);
    if (end < totalPages - 1) pages.push('…');
    if (end < totalPages) pages.push(totalPages);
    return pages;
  })();

  const runAction = async (action, user) => {
    setBusyId(user.id);
    setError('');
    try {
      let updated;
      if (action === 'activate') updated = await superadminApi.activateAdmin(user.id);
      else if (action === 'reject') updated = await superadminApi.rejectAdmin(user.id);
      else if (action === 'suspend') updated = await superadminApi.suspendAdmin(user.id);

      setAdmins((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setToast({
        type: action === 'reject' ? 'error' : action === 'suspend' ? 'warn' : 'success',
        msg: `${fullName(user)} ${action}d successfully.`,
      });
      load();
    } catch (e) {
      setError(e?.data?.error || `Failed to ${action} ${fullName(user)}.`);
    } finally {
      setBusyId(null);
      setConfirm(null);
    }
  };

  const prompt = (action, user) => setConfirm({ action, user });

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full min-w-0">
      <AdminPageHeader
        title="Admin Accounts"
        subtitle="Review registration requests — activate, reject, or suspend admins"
      />

      {/* Filter tabs + search */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
        <div className="flex flex-wrap gap-1 rounded-lg bg-white p-1 shadow-sm ring-1 ring-slate-200/80 max-w-full">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setPage(1);
              }}
              className={`rounded-md px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition ${
                tab === t.key
                  ? 'bg-plum-950 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t.label}
              <span className={`ml-1.5 text-xs ${tab === t.key ? 'text-white/70' : 'text-slate-400'}`}>
                {counts[t.key] ?? 0}
              </span>
            </button>
          ))}
        </div>
        <input
          type="text"
          maxLength={100}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name, username, email, phone..."
          className="w-full sm:max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-600 shadow-sm"
        />
      </div>

      {/* Error banner */}
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      {/* List */}
      <div className="mt-6 space-y-3 w-full">
        {loading && (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-plum-950" />
          </div>
        )}

        {!loading && admins.length === 0 && (
          <div className="rounded-xl bg-white p-8 sm:p-12 text-center text-slate-400 shadow-sm ring-1 ring-slate-200/80">
            {tab === 'pending'
              ? 'No admin registrations awaiting approval. New admin sign-ups will appear here for your review.'
              : 'No admin accounts match this filter.'}
          </div>
        )}

        {!loading &&
          admins.map((a) => (
            <div
              key={a.id}
              className="flex flex-col gap-4 rounded-xl bg-white p-4 sm:p-5 shadow-sm ring-1 ring-slate-200/80 sm:flex-row sm:items-center justify-between w-full"
            >
              {/* Identity */}
              <div className="flex min-w-0 flex-1 items-center gap-3.5 sm:gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-plum-950 text-sm font-bold text-white">
                  {initials(a)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">{fullName(a)}</span>
                    <StatusBadge status={a.account_status} />
                  </div>
                  <p className="truncate text-sm text-slate-500">
                    @{a.username} · {a.email || 'no email'}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {a.phone || 'no phone'}
                    {a.location ? ` · ${a.location}` : ''}
                    {a.address ? ` · ${a.address}` : ''}
                  </p>
                </div>
              </div>

              {/* Joined */}
              <div className="shrink-0 text-left sm:text-right text-xs text-slate-400 sm:w-32">
                <p className="font-medium text-slate-500">Joined</p>
                <p>{new Date(a.date_joined).toLocaleDateString()}</p>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 flex-wrap gap-2 border-t border-slate-100 pt-2 sm:border-t-0 sm:pt-0">
                {a.account_status !== 'active' && (
                  <button
                    disabled={busyId === a.id}
                    onClick={() => runAction('activate', a)}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {busyId === a.id ? '…' : 'Activate'}
                  </button>
                )}
                {a.account_status === 'pending' && (
                  <button
                    disabled={busyId === a.id}
                    onClick={() => prompt('reject', a)}
                    className="rounded-lg bg-red-600 px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                  >
                    {busyId === a.id ? '…' : 'Reject'}
                  </button>
                )}
                {a.account_status === 'active' && (
                  <button
                    disabled={busyId === a.id}
                    onClick={() => prompt('suspend', a)}
                    className="rounded-lg bg-orange-500 px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white transition hover:bg-orange-600 disabled:opacity-50"
                  >
                    {busyId === a.id ? '…' : 'Suspend'}
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* Pagination Controls */}
      {totalCount > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-4 w-full">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-900">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-slate-900">
                {Math.min(currentPage * pageSize, totalCount)}
              </span>{' '}
              of <span className="font-semibold text-slate-900">{totalCount}</span> admin{totalCount !== 1 ? 's' : ''}
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">|</span>
              <span className="text-slate-500">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-gold-500 shadow-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Page Navigation Buttons */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors shadow-sm"
                title="Previous Page"
              >
                <FiChevronLeft className="size-4" />
              </button>

              {pageNumbers.map((p, idx) =>
                p === '…' ? (
                  <span key={`dots-${idx}`} className="px-1 text-xs text-slate-400">
                    …
                  </span>
                ) : (
                  <button
                    key={`page-${p}`}
                    onClick={() => setPage(p)}
                    className={`inline-flex size-8 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                      p === currentPage
                        ? 'bg-plum-950 text-white shadow-sm'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors shadow-sm"
                title="Next Page"
              >
                <FiChevronRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Confirm dialog for reject / suspend */}
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && runAction(confirm.action, confirm.user)}
        title={
          confirm?.action === 'reject'
            ? 'Reject admin registration?'
            : 'Suspend this admin?'
        }
        message={
          confirm?.user
            ? confirm.action === 'reject'
              ? `${fullName(confirm.user)} will be marked as rejected and will not be able to log in. You can still activate them later.`
              : `${fullName(confirm.user)} will be suspended immediately and will not be able to log in until re-activated.`
            : ''
        }
        confirmLabel={confirm?.action === 'reject' ? 'Reject' : 'Suspend'}
        danger={confirm?.action === 'reject'}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={`rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
              toast.type === 'success'
                ? 'bg-emerald-600'
                : toast.type === 'warn'
                  ? 'bg-orange-500'
                  : 'bg-red-600'
            }`}
          >
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}