import { useEffect, useRef, useState, useMemo } from 'react'
import ProductCard from '../components/ProductCard'

const fontDisplay = { fontFamily: "'Playfair Display', serif" }
const fontBody = { fontFamily: "'Jost', sans-serif" }

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
]

export default function ProductList({ hideBanner = false }) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('featured')
  const [loading, setLoading] = useState(true)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [error, setError] = useState(null)

  const BASE_URL = import.meta.env.VITE_DJANGO_URL
  const debounceRef = useRef(null)

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
        setCategories(Array.isArray(data) ? data : data.results || [])
        setCategoriesLoading(false)
      })
      .catch(() => {
        setCategoriesLoading(false)
      })
  }, [BASE_URL])

  // Re-fetch products whenever category or search changes
  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (selectedCategory !== 'all') params.set('category', selectedCategory)
    if (searchTerm) params.set('search', searchTerm)

    const query = params.toString()
    const url = `${BASE_URL}/api/products/${query ? `?${query}` : ''}`

    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch products')
        return response.json()
      })
      .then((data) => {
        setProducts(Array.isArray(data) ? data : data.results || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [BASE_URL, selectedCategory, searchTerm])

  const activeCategory = categories.find((c) => c.slug === selectedCategory)

  const sortedProducts = useMemo(() => {
    const list = [...products]
    switch (sortBy) {
      case 'price-asc':
        return list.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
      case 'price-desc':
        return list.sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
      case 'name-asc':
        return list.sort((a, b) => a.name.localeCompare(b.name))
      default:
        return list
    }
  }, [products, sortBy])

  const hasActiveFilters = selectedCategory !== 'all' || searchTerm

  const clearFilters = () => {
    setSelectedCategory('all')
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
        className="relative overflow-hidden text-white"
        style={{
          background: 'linear-gradient(135deg, #2A1A2C 0%, #3D2136 55%, #4A2536 100%)',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(232,199,102,0.12),transparent_50%)]" />

        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-6 hidden select-none text-[180px] font-bold italic leading-none text-white/[0.04] lg:block"
          style={fontDisplay}
        >
          Browse
        </span>

        <div className="page-container relative py-16 sm:py-20" style={fontBody}>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#E8C766]">
            {activeCategory ? 'Category' : 'Welcome to MyStore'}
          </p>

          <h1
            className="mt-3 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl"
            style={fontDisplay}
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
            <div className="flex items-center gap-3 rounded-full bg-white/10 px-5 py-3 backdrop-blur transition focus-within:bg-white/15 focus-within:ring-1 focus-within:ring-[#E8C766]">
              <svg className="h-4 w-4 shrink-0 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
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
              className="rounded-full bg-[#E8C766] px-6 py-3 text-sm font-semibold text-[#2A1A2C] transition hover:bg-[#F1D9A0]"
            >
              Shop Now
            </a>
            <span className="inline-flex items-center rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-white">
              {products.length} product{products.length !== 1 ? 's' : ''} available
            </span>
          </div>
        </div>
      </section>
      )}

      {/* Category filter strip — offset below the sticky Navbar (adjust top-16 if your navbar height differs) */}
      <section className="sticky top-16 z-10 border-b border-slate-200/80 border-b-[#E8C766]/20 bg-white/95 backdrop-blur">
        <div className="page-container">
          <div className="flex items-center justify-between gap-4 py-4">
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition ${
                  selectedCategory === 'all'
                    ? 'bg-[#2A1A2C] text-white'
                    : 'bg-[#E8C766]/10 text-[#8a6d1f] hover:bg-[#E8C766]/20'
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
                      onClick={() => setSelectedCategory(category.slug)}
                      className={`shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition ${
                        selectedCategory === category.slug
                          ? 'bg-[#2A1A2C] text-white'
                          : 'bg-[#E8C766]/10 text-[#8a6d1f] hover:bg-[#E8C766]/20'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
            </div>

            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <label htmlFor="sort" className="text-sm text-slate-500">
                Sort
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#2A1A2C]"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="page-container py-10 sm:py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900" style={fontDisplay}>
              {activeCategory ? activeCategory.name : 'All Products'}
            </h2>
            <div className="mt-2 h-1 w-12 rounded-full bg-[#E8C766]" />
            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? 'Loading...'
                : `${sortedProducts.length} item${sortedProducts.length !== 1 ? 's' : ''}${
                    activeCategory ? ` in ${activeCategory.name}` : ' in our catalog'
                  }`}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#2A1A2C]"
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
                  onClick={() => setSelectedCategory('all')}
                  aria-label="Remove category filter"
                  className="text-slate-400 hover:text-slate-700"
                >
                  ×
                </button>
              </span>
            )}
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
              className="text-xs font-semibold text-[#8a6d1f] underline-offset-2 hover:underline"
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
        ) : sortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
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
                className="mt-4 rounded-full bg-[#2A1A2C] px-5 py-2 text-sm font-semibold text-white hover:bg-[#3D2136]"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}