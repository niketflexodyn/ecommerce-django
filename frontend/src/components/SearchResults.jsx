import { Link, useSearchParams } from 'react-router-dom'
import { getProductImageUrl, useProductSearch } from '../hooks/useProductSearch'

export default function SearchResults() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const { results, loading, error } = useProductSearch(query, 0)

  if (!query) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-500">Enter a search term to find products.</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-6 text-gray-900">
        {loading ? 'Searching...' : `Results for "${query}" (${results.length})`}
      </h1>

      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && results.length === 0 && (
        <p className="text-gray-500">No products matched your search.</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {results.map((product) => (
          <Link key={product.id} to={`/product/${product.id}`} className="group">
            {getProductImageUrl(product.image) ? (
              <img
                src={getProductImageUrl(product.image)}
                alt={product.name}
                className="w-full h-48 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-48 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                No image
              </div>
            )}
            <p className="mt-2 text-sm font-medium text-gray-900 group-hover:text-indigo-600">{product.name}</p>
            <p className="text-sm text-gray-600">${product.price}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
