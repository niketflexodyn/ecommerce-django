import { Link, useSearchParams } from 'react-router-dom'
import ProductCard from './ProductCard'
import { useProductSearch } from '../hooks/useProductSearch'

export default function SearchResults() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const { results, loading, error } = useProductSearch(query, 0)

  return (
    <div className="page-container py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {query ? (loading ? 'Searching...' : `Results for "${query}"`) : 'Search Products'}
        </h1>
        {query && !loading && (
          <p className="mt-1 text-sm text-slate-500">{results.length} {results.length === 1 ? 'result' : 'results'} found</p>
        )}
      </div>

      {!query && (
        <div className="card p-10 text-center">
          <p className="text-slate-500">Use the search bar above to find products.</p>
          <Link to="/" className="btn-primary mt-4">Browse All Products</Link>
        </div>
      )}

      {error && (
        <div className="card p-6 text-center text-red-600">{error}</div>
      )}

      {query && !loading && !error && results.length === 0 && (
        <div className="card p-10 text-center">
          <h2 className="text-lg font-semibold text-slate-900">No products matched</h2>
          <p className="mt-2 text-sm text-slate-500">Try a different keyword.</p>
        </div>
      )}

      {query && loading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-80 animate-pulse bg-slate-100" />
          ))}
        </div>
      )}

      {query && !loading && results.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
