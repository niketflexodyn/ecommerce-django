import { useEffect, useState } from 'react'
import ProductCard from '../components/ProductCard'

export default function ProductList() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const BASE_URL = import.meta.env.VITE_DJANGO_URL

  useEffect(() => {
    fetch(`${BASE_URL}/api/products/`)
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
  }, [BASE_URL])

  if (loading) {
    return (
      <div className="page-container py-16">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card h-80 animate-pulse bg-slate-100" />
          ))}
        </div>
      </div>
    )
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
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="page-container relative py-16 sm:py-20">
          <p className="text-sm font-medium uppercase tracking-wider text-indigo-200">Welcome to MyStore</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            Discover products you&apos;ll love
          </h1>
          <p className="mt-4 max-w-xl text-lg text-indigo-100">
            Browse our curated collection — quality items, fair prices, and fast checkout.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#products" className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">
              Shop Now
            </a>
            <span className="inline-flex items-center rounded-xl border border-white/30 px-6 py-3 text-sm font-medium text-white">
              {products.length} products available
            </span>
          </div>
        </div>
      </section>

      <section id="products" className="page-container py-10 sm:py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">All Products</h2>
          <p className="mt-1 text-sm text-slate-500">{products.length} items in our catalog</p>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <h3 className="text-lg font-semibold text-slate-900">No products available</h3>
            <p className="mt-2 text-sm text-slate-500">Check back soon for new arrivals.</p>
          </div>
        )}
      </section>
    </div>
  )
}
