import { useEffect, useState } from 'react'

const BASE_URL = import.meta.env.VITE_DJANGO_URL

export { getProductImageUrl } from '../utils/product'

export function useProductSearch(query, debounceMs = 200) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const trimmed = query.trim()

    if (!trimmed) {
      setResults([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    const timer = setTimeout(() => {
      // The products endpoint is paginated server-side; pull the page of
      // matches out of the {count, next, previous, results} payload.
      fetch(
        `${BASE_URL}/api/products/?search=${encodeURIComponent(trimmed)}&page_size=20`
      )
        .then((response) => {
          if (!response.ok) throw new Error('Failed to fetch search results')
          return response.json()
        })
        .then((data) => setResults(data.results || []))
        .catch(() => setError('Something went wrong. Please try again.'))
        .finally(() => setLoading(false))
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs])

  return { results, loading, error }
}
