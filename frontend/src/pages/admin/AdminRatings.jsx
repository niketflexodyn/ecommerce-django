import { useState, useEffect } from 'react'
import { ratingApi } from '../../utils/api'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import StarRating from '../../components/StarRating'

export default function AdminRatings() {
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    ratingApi
      .adminList()
      .then(setRatings)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = ratings
    .filter((r) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        r.product_name?.toLowerCase().includes(q) ||
        r.username?.toLowerCase().includes(q) ||
        String(r.score).includes(q)
      )
    })
    .sort((a, b) => {
      let cmp = 0
      if (sortField === 'score') cmp = a.score - b.score
      else if (sortField === 'product_name') cmp = (a.product_name || '').localeCompare(b.product_name || '')
      else if (sortField === 'username') cmp = (a.username || '').localeCompare(b.username || '')
      else cmp = new Date(a.created_at) - new Date(b.created_at)
      return sortDir === 'desc' ? -cmp : cmp
    })

  // Summary stats
  const avgRating = ratings.length
    ? (ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length).toFixed(1)
    : '—'
  const fiveStars = ratings.filter((r) => r.score === 5).length
  const fourStars = ratings.filter((r) => r.score === 4).length
  const threeStars = ratings.filter((r) => r.score === 3).length
  const twoStars = ratings.filter((r) => r.score === 2).length
  const oneStars = ratings.filter((r) => r.score === 1).length
  const total = ratings.length || 1

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-plum-950" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <AdminPageHeader title="Ratings" subtitle="Customer ratings for your products" />

      {/* Stats cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
          <p className="text-sm font-medium text-slate-500">Total Ratings</p>
          <p className="mt-1 text-2xl font-bold text-plum-950">{ratings.length}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
          <p className="text-sm font-medium text-slate-500">Average Rating</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl font-bold text-plum-950">{avgRating}</span>
            <StarRating value={parseFloat(avgRating) || 0} size="sm" />
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
          <p className="text-sm font-medium text-slate-500">5-Star Ratings</p>
          <p className="mt-1 text-2xl font-bold text-plum-950">{fiveStars} <span className="text-sm font-normal text-slate-400">({Math.round((fiveStars / total) * 100)}%)</span></p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
          <p className="text-sm font-medium text-slate-500">Products Rated</p>
          <p className="mt-1 text-2xl font-bold text-plum-950">
            {new Set(ratings.map((r) => r.product)).size}
          </p>
        </div>
      </div>

      {/* Rating distribution */}
      <div className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
        <h3 className="text-sm font-semibold text-slate-700">Rating Distribution</h3>
        <div className="mt-4 space-y-2">
          {[
            { label: '5 ★', count: fiveStars },
            { label: '4 ★', count: fourStars },
            { label: '3 ★', count: threeStars },
            { label: '2 ★', count: twoStars },
            { label: '1 ★', count: oneStars },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="w-8 text-sm font-medium text-slate-600">{row.label}</span>
              <div className="flex-1 overflow-hidden rounded-full bg-slate-100 h-2.5">
                <div
                  className="h-full rounded-full bg-gold-500 transition-all"
                  style={{ width: `${(row.count / total) * 100}%` }}
                />
              </div>
              <span className="w-8 text-right text-sm text-slate-500">{row.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Search & sort */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product, customer, or score..."
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-600"
        />
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
        >
          <option value="created_at">Sort by Date</option>
          <option value="score">Sort by Rating</option>
          <option value="product_name">Sort by Product</option>
          <option value="username">Sort by Customer</option>
        </select>
        <button
          onClick={() => setSortDir(sortDir === 'desc' ? 'asc' : 'desc')}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium transition hover:bg-slate-50"
        >
          {sortDir === 'desc' ? '↓ Desc' : '↑ Asc'}
        </button>
      </div>

      {/* Ratings list */}
      <div className="mt-6 space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-xl bg-white p-12 text-center text-slate-400 shadow-sm ring-1 ring-slate-200/80">
            {ratings.length === 0
              ? 'No ratings yet. Ratings will appear here when customers rate your products.'
              : 'No ratings match your search.'}
          </div>
        )}

        {filtered.map((r) => (
          <div key={r.id} className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
            <div className="flex size-10 items-center justify-center rounded-full bg-plum-950 text-sm font-bold text-white">
              {r.username?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-900">{r.username}</span>
                <span className="text-sm text-slate-500">rated</span>
                <span className="font-medium text-plum-950">{r.product_name}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <StarRating value={r.score} size="sm" />
                <span className="text-sm font-semibold text-plum-950">{r.score}/5</span>
              </div>
            </div>
            <div className="text-right text-xs text-slate-400">
              {new Date(r.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}