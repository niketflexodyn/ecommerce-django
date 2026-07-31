import { Link } from 'react-router-dom'
import { useWishlist } from '../context/WishlistContext'
import ProductCard from '../components/ProductCard'

export default function Wishlist() {
  const { wishlistItems } = useWishlist()

  return (
    <div className="bg-slate-50 py-16 sm:py-24">
      <div className="page-container">
        <div className="mb-10 text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            My Wishlist
          </h1>
          <p className="mt-4 text-lg text-slate-500">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>

        {wishlistItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {wishlistItems.map((item) => (
              <ProductCard key={item.productId} product={item.product} />
            ))}
          </div>
        ) : (
          <div className="card mx-auto max-w-lg p-12 text-center shadow-sm">
            <svg
              className="mx-auto size-16 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
            <h2 className="mt-6 font-display text-2xl font-semibold text-slate-900">
              Your wishlist is empty
            </h2>
            <p className="mt-2 text-slate-500">
              Save your favorite items here to review and purchase them later.
            </p>
            <Link to="/" className="btn-primary mt-8 inline-flex px-8 py-3">
              Explore Products
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
