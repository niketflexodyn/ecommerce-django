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
      fetch(`${BASE_URL}/api/products/?search=${encodeURIComponent(trimmed)}`)
        .then((response) => {
          if (!response.ok) throw new Error('Failed to fetch search results')
          return response.json()
        })
        .then((data) => setResults(data))
        .catch(() => setError('Something went wrong. Please try again.'))
        .finally(() => setLoading(false))
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs])

  return { results, loading, error }
}
