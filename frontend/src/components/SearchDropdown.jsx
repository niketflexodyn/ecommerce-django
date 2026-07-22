import { Link } from 'react-router-dom'
import { getProductImageUrl, useProductSearch } from '../hooks/useProductSearch'
import { formatPrice } from '../utils/product'

export default function SearchDropdown({ query, onSelect }) {
  const { results, loading, error } = useProductSearch(query)

  if (!query.trim()) return null

  return (
    <div className="absolute left-0 right-0 top-full mt-2 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
      {loading && (
        <p className="px-4 py-3 text-sm text-slate-500">Searching...</p>
      )}

      {error && (
        <p className="px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && results.length === 0 && (
        <p className="px-4 py-3 text-sm text-slate-500">No products found.</p>
      )}

      {!loading && results.length > 0 && (
        <ul className="max-h-80 overflow-y-auto py-1">
          {results.map((product) => (
            <li key={product.id}>
              <Link
                to={`/product/${product.id}`}
                onClick={onSelect}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
              >
                {getProductImageUrl(product.image) ? (
                  <img
                    src={getProductImageUrl(product.image)}
                    alt={product.name}
                    className="size-10 rounded-md object-cover shrink-0"
                  />
                ) : (
                  <div className="size-10 rounded-md bg-slate-100 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
                  <p className="text-xs text-slate-500">{formatPrice(product.price)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!loading && results.length > 0 && (
        <Link
          to={`/search?q=${encodeURIComponent(query.trim())}`}
          onClick={onSelect}
          className="block border-t border-slate-100 px-4 py-2.5 text-center text-sm font-medium text-gold-700 hover:bg-slate-50"
        >
          View all results
        </Link>
      )}
    </div>
  )
}
