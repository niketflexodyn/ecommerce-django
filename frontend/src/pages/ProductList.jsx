import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
]

const PAGE_SIZE = 8

export default function ProductList({ hideBanner = false }) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Drill state is derived from the URL (single source of truth, shared with
  // the CategoryStrip) so external URL changes are reflected here immediately.
  const selectedCategory = searchParams.get('category') || 'all'
  const selectedSubcategory = searchParams.get('subcategory') || ''
  const selectedAttrs = useMemo(() => {
    const o = {}
    searchParams.forEach((v, k) => {
      if (k.startsWith('attr_')) o[k.slice(5)] = v
    })
    return o
  }, [searchParams])

  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('featured')
  const [loading, setLoading] = useState(true)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  // Total count comes from the server now that pagination is server-side.
  const [totalCount, setTotalCount] = useState(0)

  const BASE_URL = import.meta.env.VITE_DJANGO_URL
  const debounceRef = useRef(null)

  // URL mutators — use the functional form so we merge with existing params
  // instead of overwriting (the old object form erased subcategory/attr_*).
  const updateCategory = (slug) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (!slug || slug === 'all') next.delete('category')
        else next.set('category', slug)
        next.delete('subcategory')
        for (const k of [...next.keys()]) {
          if (k.startsWith('attr_')) next.delete(k)
        }
        return next
      },
      { replace: true }
    )
  }

  const updateSubcategory = (slug) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (!slug) next.delete('subcategory')
        else next.set('subcategory', slug)
        for (const k of [...next.keys()]) {
          if (k.startsWith('attr_')) next.delete(k)
        }
        return next
      },
      { replace: true }
    )
  }

  const updateAttr = (key, value) => {
    const param = `attr_${key}`
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (!value || next.get(param) === value) next.delete(param)
        else next.set(param, value)
        return next
      },
      { replace: true }
    )
  }

  // Scroll to #products whenever a drill-down param is active — fires on mount
  // (deep links) AND on same-page URL changes from the CategoryStrip.
  useEffect(() => {
    const hasDrill =
      selectedCategory !== 'all' ||
      Boolean(selectedSubcategory) ||
      Object.keys(selectedAttrs).length > 0
    if (!hasDrill) return
    const timer = setTimeout(() => {
      document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
    }, 300)
    return () => clearTimeout(timer)
  }, [selectedCategory, selectedSubcategory, selectedAttrs])

  // Debounce the search input -> searchTerm
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearchTerm(searchInput.trim())
    }, 350)
    return () => clearTimeout(debounceRef.current)
  }, [searchInput])

  // Fetch categories once on mount
  useEffect(() => {
    fetch(`${BASE_URL}/api/categories/`)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch categories')
        return response.json()
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : data.results || []
        // De-duplicate by name (case-insensitive) so the filter never lists
        // the same category twice, even if the backend serves duplicates.
        const seen = new Set()
        const unique = list.filter((c) => {
          const key = (c.name || '').toLowerCase()
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        setCategories(unique)
        setCategoriesLoading(false)
      })
      .catch(() => {
        setCategoriesLoading(false)
      })
  }, [BASE_URL])

  // Re-fetch products whenever category, subcategory, attributes, search, sort,
  // or page changes. Pagination and sorting are handled server-side now, so
  // each request asks for exactly one page of already-sorted results.
  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (selectedCategory !== 'all') params.set('category', selectedCategory)
    if (selectedSubcategory) params.set('subcategory', selectedSubcategory)
    Object.entries(selectedAttrs).forEach(([k, v]) =>
      params.set(`attr_${k}`, v)
    )
    if (searchTerm) params.set('search', searchTerm)
    if (sortBy !== 'featured') params.set('sort', sortBy)
    params.set('page', page)
    params.set('page_size', PAGE_SIZE)

    const url = `${BASE_URL}/api/products/?${params.toString()}`

    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch products')
        return response.json()
      })
      .then((data) => {
        // Server now returns a paginated payload: {count, next, previous, results}
        setProducts(data.results || [])
        setTotalCount(data.count || 0)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [
    BASE_URL,
    selectedCategory,
    selectedSubcategory,
    selectedAttrs,
    searchTerm,
    sortBy,
    page,
  ])

  const activeCategory = categories.find((c) => c.slug === selectedCategory)
  const activeSubcategory =
    activeCategory?.children?.find((s) => s.slug === selectedSubcategory) ||
    null

  // Reset to the first page whenever the filtered/sorted set changes so the
  // user never lands on a page that no longer exists.
  useEffect(() => {
    setPage(1)
  }, [selectedCategory, selectedSubcategory, selectedAttrs, searchTerm, sortBy])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  // Windowed page numbers: show a few around the current page plus first/last.
  const pageNumbers = (() => {
    const pages = []
    const span = 1 // pages either side of the current page
    const start = Math.max(1, currentPage - span)
    const end = Math.min(totalPages, currentPage + span)
    if (start > 1) pages.push(1)
    if (start > 2) pages.push('…')
    for (let p = start; p <= end; p++) pages.push(p)
    if (end < totalPages - 1) pages.push('…')
    if (end < totalPages) pages.push(totalPages)
    return pages
  })()

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    Boolean(selectedSubcategory) ||
    Object.keys(selectedAttrs).length > 0 ||
    Boolean(searchTerm)

  const clearFilters = () => {
    updateCategory('all')
    setSearchInput('')
    setSearchTerm('')
  }

  if (error) {
    return (
      <div className="page-container py-16">
        <div className="card mx-auto max-w-md p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-900">Something went wrong</h2>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Banner — hidden on homepage where Hero provides the banner */}
      {!hideBanner && (
      <section
        className="relative overflow-hidden bg-linear-to-br from-plum-950 via-plum-900 to-plum-800 text-white"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(232,199,102,0.12),transparent_50%)]" />

        <span
          aria-hidden="true"
          className="font-display pointer-events-none absolute -right-8 -top-6 hidden select-none text-[180px] font-bold italic leading-none text-white/[0.04] lg:block"
        >
          Browse
        </span>

        <div className="page-container font-body relative py-16 sm:py-20">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gold-500">
            {activeCategory ? 'Category' : 'Welcome to Luxora'}
          </p>

          <h1
            className="font-display mt-3 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl"
          >
            {activeCategory ? activeCategory.name : "Discover products you'll love"}
          </h1>

          <p className="mt-4 max-w-xl text-lg text-white/70">
            {activeCategory
              ? `Browse our full ${activeCategory.name.toLowerCase()} range — quality items, fair prices, fast checkout.`
              : 'Browse our curated collection across every category — quality items, fair prices, and fast checkout.'}
          </p>

          {/* Search */}
          <div className="mt-8 max-w-md">
            <div className="flex items-center gap-3 rounded-full bg-white/10 px-5 py-3 backdrop-blur transition focus-within:bg-white/15 focus-within:ring-1 focus-within:ring-gold-500">
              <svg className="h-4 w-4 shrink-0 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                maxLength={100}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search for anything..."
                className="w-full bg-transparent text-sm text-white placeholder-white/50 outline-none"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  aria-label="Clear search"
                  className="shrink-0 text-white/50 hover:text-white"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">

             <a href="#products"
              className="rounded-full bg-gold-500 px-6 py-3 text-sm font-semibold text-plum-950 transition hover:bg-gold-400"
            >
              Shop Now
            </a>
            <span className="inline-flex items-center rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-white">
              {totalCount} product{totalCount !== 1 ? 's' : ''} available
            </span>
          </div>
        </div>
      </section>
      )}

      {/* Products */}
      <section id="products" className="page-container py-10 sm:py-12">
        {/* Mobile category strip (sidebar is desktop-only) */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          <button
            onClick={() => updateCategory('all')}
            className={`shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition ${
              selectedCategory === 'all'
                ? 'bg-plum-950 text-white'
                : 'bg-gold-500/10 text-gold-700 hover:bg-gold-500/20'
            }`}
          >
            All
          </button>
          {categoriesLoading
            ? [...Array(5)].map((_, i) => (
                <div key={i} className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-slate-100" />
              ))
            : categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => updateCategory(category.slug)}
                  className={`shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition ${
                    selectedCategory === category.slug
                      ? 'bg-plum-950 text-white'
                      : 'bg-gold-500/10 text-gold-700 hover:bg-gold-500/20'
                  }`}
                >
                  {category.name}
                </button>
              ))}
        </div>

        <div className="lg:flex lg:gap-8">
          {/* Category sidebar (desktop) */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-32">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Categories
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => updateCategory('all')}
                  className={`flex w-full items-center rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                    selectedCategory === 'all'
                      ? 'bg-plum-950 text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-plum-950'
                  }`}
                >
                  All Products
                </button>
                {categoriesLoading
                  ? [...Array(5)].map((_, i) => (
                      <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-slate-100" />
                    ))
                  : categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => updateCategory(category.slug)}
                        className={`flex w-full items-center rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                          selectedCategory === category.slug
                            ? 'bg-plum-950 text-white'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-plum-950'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
              </div>
            </div>
          </aside>

          {/* Main column */}
          <div className="min-w-0 flex-1">
            {/* Drill-down breadcrumb (from the CategoryStrip / URL) */}
            {(selectedCategory !== 'all' ||
              Boolean(selectedSubcategory) ||
              Object.keys(selectedAttrs).length > 0) && (
              <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <button
                  onClick={() => updateCategory('all')}
                  className="hover:text-plum-950"
                >
                  All
                </button>
                {activeCategory && (
                  <>
                    <span className="text-slate-300">›</span>
                    <button
                      onClick={() => updateCategory(activeCategory.slug)}
                      className="font-semibold text-plum-950 hover:underline"
                    >
                      {activeCategory.name}
                    </button>
                  </>
                )}
                {activeSubcategory && (
                  <>
                    <span className="text-slate-300">›</span>
                    <button
                      onClick={() => updateSubcategory('')}
                      className="font-semibold text-plum-950 hover:underline"
                    >
                      {activeSubcategory.name}
                    </button>
                  </>
                )}
                {Object.entries(selectedAttrs).map(([k, v]) => (
                  <span key={k} className="inline-flex items-center gap-1.5">
                    <span className="text-slate-300">›</span>
                    <button
                      onClick={() => updateAttr(k, '')}
                      className="font-semibold text-plum-950 hover:underline"
                    >
                      {k}: {v}
                    </button>
                  </span>
                ))}
              </nav>
            )}

            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900">
                  {activeSubcategory
                    ? activeSubcategory.name
                    : activeCategory
                    ? activeCategory.name
                    : 'All Products'}
                </h2>
                <div className="mt-2 h-1 w-12 rounded-full bg-gold-500" />
                <p className="mt-1 text-sm text-slate-500">
                  {loading
                    ? 'Loading...'
                    : `${totalCount} item${totalCount !== 1 ? 's' : ''}${
                        activeSubcategory
                          ? ` in ${activeSubcategory.name}`
                          : activeCategory
                          ? ` in ${activeCategory.name}`
                          : ' in our catalog'
                      }`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-sm text-slate-500">
                  Sort
                </label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-plum-950"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {hasActiveFilters && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {activeCategory && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                {activeCategory.name}
                <button
                  onClick={() => updateCategory('all')}
                  aria-label="Remove category filter"
                  className="text-slate-400 hover:text-slate-700"
                >
                  ×
                </button>
              </span>
            )}
            {activeSubcategory && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                {activeSubcategory.name}
                <button
                  onClick={() => updateSubcategory('')}
                  aria-label="Remove subcategory filter"
                  className="text-slate-400 hover:text-slate-700"
                >
                  ×
                </button>
              </span>
            )}
            {Object.entries(selectedAttrs).map(([k, v]) => (
              <span
                key={k}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                {k}: {v}
                <button
                  onClick={() => updateAttr(k, '')}
                  aria-label={`Remove ${k} filter`}
                  className="text-slate-400 hover:text-slate-700"
                >
                  ×
                </button>
              </span>
            ))}
            {searchTerm && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                "{searchTerm}"
                <button
                  onClick={() => {
                    setSearchInput('')
                    setSearchTerm('')
                  }}
                  aria-label="Remove search filter"
                  className="text-slate-400 hover:text-slate-700"
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-gold-700 underline-offset-2 hover:underline"
            >
              Clear all
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card h-80 animate-pulse bg-slate-100" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination (server-side) */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Prev
                </button>

                {pageNumbers.map((p, i) =>
                  p === '…' ? (
                    <span key={`gap-${i}`} className="px-2 text-sm text-slate-400">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                        p === currentPage
                          ? 'bg-plum-950 text-white'
                          : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="card flex flex-col items-center p-12 text-center">
            <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No products found</h3>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              {hasActiveFilters
                ? "We couldn't find anything matching your filters. Try adjusting your search or category."
                : 'Check back soon for new arrivals.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 rounded-full bg-plum-950 px-5 py-2 text-sm font-semibold text-white hover:bg-plum-900"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
          </div>
        </div>
      </section>
    </div>
  )
}