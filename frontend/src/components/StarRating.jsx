/**
 * StarRating — reusable star display / input component
 *
 * Props:
 *  - value: number (current rating, e.g. 3.5)
 *  - onChange?: (score: number) => void  (if present, stars are interactive)
 *  - size?: 'sm' | 'md' | 'lg'  (default 'md')
 *  - showCount?: boolean  (show " (23)" after stars)
 *  - count?: number  (number of ratings to display)
 *  - className?: string
 */
export default function StarRating({
  value = 0,
  onChange,
  size = 'md',
  showCount = false,
  count = 0,
  className = '',
}) {
  const sizes = { sm: 'size-4', md: 'size-5', lg: 'size-6' }
  const sizeClass = sizes[size] || sizes.md

  const stars = [1, 2, 3, 4, 5]
  const interactive = typeof onChange === 'function'

  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {stars.map((star) => {
        const filled = star <= Math.floor(value)
        const half = !filled && star === Math.ceil(value) && value % 1 >= 0.25

        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange(star)}
            className={`${interactive ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'}`}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            {filled ? (
              /* Full star */
              <svg className={`${sizeClass} text-gold-500`} viewBox="0 0 24 24" fill="currentColor">
                <path d="M10.788 3.21c.448-1.077 1.978-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.228 5.295c.266 1.148-.903 2.087-1.841 1.444L12 18.162l-4.716 3.069c-.938.643-2.107-.296-1.841-1.444l1.228-5.295-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.006Z" />
              </svg>
            ) : half ? (
              /* Half star */
              <svg className={`${sizeClass} text-gold-500`} viewBox="0 0 24 24">
                <defs>
                  <linearGradient id="half-fill">
                    <stop offset="50%" stopColor="var(--color-gold-500)" />
                    <stop offset="50%" stopColor="#D1D5DB" />
                  </linearGradient>
                </defs>
                <path
                  d="M10.788 3.21c.448-1.077 1.978-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.228 5.295c.266 1.148-.903 2.087-1.841 1.444L12 18.162l-4.716 3.069c-.938.643-2.107-.296-1.841-1.444l1.228-5.295-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.006Z"
                  fill="url(#half-fill)"
                />
              </svg>
            ) : (
              /* Empty star */
              <svg className={`${sizeClass} text-slate-300`} viewBox="0 0 24 24" fill="currentColor">
                <path d="M10.788 3.21c.448-1.077 1.978-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.228 5.295c.266 1.148-.903 2.087-1.841 1.444L12 18.162l-4.716 3.069c-.938.643-2.107-.296-1.841-1.444l1.228-5.295-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.006Z" />
              </svg>
            )}
          </button>
        )
      })}
      {showCount && count > 0 && (
        <span className="ml-1 text-sm text-slate-500">({count})</span>
      )}
    </span>
  )
}