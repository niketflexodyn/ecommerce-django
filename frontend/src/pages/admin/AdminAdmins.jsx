import { useState, useEffect, useCallback } from 'react'
import { superadminApi } from '../../utils/api'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import ConfirmDialog from '../../components/admin/ConfirmDialog'

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'active', label: 'Active' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'rejected', label: 'Rejected' },
]

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700 ring-amber-200',
  active: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  suspended: 'bg-orange-100 text-orange-700 ring-orange-200',
  rejected: 'bg-red-100 text-red-700 ring-red-200',
}

function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || 'bg-slate-100 text-slate-600 ring-slate-200'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${cls}`}>
      {status}
    </span>
  )
}

function initials(user) {
  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim()
  return (name || user.username || '?').charAt(0).toUpperCase()
}

function fullName(user) {
  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim()
  return name || user.username
}

export default function AdminAdmins() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [toast, setToast] = useState(null)
  const [confirm, setConfirm] = useState(null) // { action, user }

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    superadminApi
      .listAdmins()
      .then(setAdmins)
      .catch(() => setError('Failed to load admin accounts.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const counts = admins.reduce(
    (acc, a) => {
      acc.all += 1
      acc[a.account_status] = (acc[a.account_status] || 0) + 1
      return acc
    },
    { all: 0, pending: 0, active: 0, suspended: 0, rejected: 0 }
  )

  const filtered = admins
    .filter((a) => (tab === 'all' ? true : a.account_status === tab))
    .filter((a) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        a.username?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        fullName(a).toLowerCase().includes(q) ||
        a.phone?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => new Date(b.date_joined) - new Date(a.date_joined))

  const runAction = async (action, user) => {
    setBusyId(user.id)
    setError('')
    try {
      let updated
      if (action === 'activate') updated = await superadminApi.activateAdmin(user.id)
      else if (action === 'reject') updated = await superadminApi.rejectAdmin(user.id)
      else if (action === 'suspend') updated = await superadminApi.suspendAdmin(user.id)
      setAdmins((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
      setToast({
        type: action === 'reject' ? 'error' : action === 'suspend' ? 'warn' : 'success',
        msg: `${fullName(user)} ${action}d successfully.`,
      })
    } catch (e) {
      setError(e?.data?.error || `Failed to ${action} ${fullName(user)}.`)
    } finally {
      setBusyId(null)
      setConfirm(null)
    }
  }

  const prompt = (action, user) => setConfirm({ action, user })

  const statCards = [
    { key: 'pending', label: 'Pending Approval', value: counts.pending, dot: 'bg-amber-500' },
    { key: 'active', label: 'Active', value: counts.active, dot: 'bg-emerald-500' },
    { key: 'suspended', label: 'Suspended', value: counts.suspended, dot: 'bg-orange-500' },
    { key: 'rejected', label: 'Rejected', value: counts.rejected, dot: 'bg-red-500' },
  ]

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
              onClick={() => setTab(t.key)}
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
          onChange={(e) => setSearch(e.target.value)}
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

        {!loading && filtered.length === 0 && (
          <div className="rounded-xl bg-white p-8 sm:p-12 text-center text-slate-400 shadow-sm ring-1 ring-slate-200/80">
            {tab === 'pending'
              ? 'No admin registrations awaiting approval. New admin sign-ups will appear here for your review.'
              : 'No admin accounts match this filter.'}
          </div>
        )}

        {!loading &&
          filtered.map((a) => (
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
  )
}