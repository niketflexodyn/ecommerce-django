import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatPrice, getProductImageUrl } from '../utils/product'

export default function ProductDetails() {
  const { id } = useParams()
  const { addToCart, cartItems } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [added, setAdded] = useState(false)

  const BASE_URL = import.meta.env.VITE_DJANGO_URL
  const inCart = cartItems.some((item) => item.id === Number(id))

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/products/${id}/`)
        if (!response.ok) throw new Error('Failed to fetch product.')
        const data = await response.json()
        setProduct(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id, BASE_URL])

  const handleAddToCart = () => {
    addToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) {
    return (
      <div className="page-container py-16">
        <div className="card mx-auto max-w-4xl animate-pulse p-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="h-96 rounded-xl bg-slate-100" />
            <div className="space-y-4">
              <div className="h-8 w-2/3 rounded bg-slate-100" />
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-4/5 rounded bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="page-container py-16">
        <div className="card mx-auto max-w-md p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-900">{error || 'Product not found'}</h2>
          <Link to="/" className="btn-primary mt-4">Back to Shop</Link>
        </div>
      </div>
    )
  }

  const imageUrl = getProductImageUrl(product.image)

  return (
    <div className="page-container py-8 sm:py-12">
      <nav className="mb-6 text-sm text-slate-500">
        <Link to="/" className="hover:text-indigo-600">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">{product.name}</span>
      </nav>

      <div className="card overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="bg-slate-50 p-4 sm:p-6">
            {imageUrl ? (
              <img src={imageUrl} alt={product.name} className="h-72 w-full rounded-xl object-cover sm:h-[28rem]" />
            ) : (
              <div className="flex h-72 items-center justify-center rounded-xl bg-slate-100 text-slate-400 sm:h-[28rem]">
                No image available
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center p-6 sm:p-10">
            {product.category?.name && (
              <span className="mb-3 w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
                {product.category.name}
              </span>
            )}
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{product.name}</h1>
            <p className="mt-4 leading-relaxed text-slate-600">{product.description}</p>
            <p className="mt-6 text-3xl font-bold text-indigo-600">{formatPrice(product.price)}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={handleAddToCart} className="btn-primary min-w-[160px]">
                {added ? 'Added!' : inCart ? 'Add Another' : 'Add to Cart'}
              </button>
              <Link to="/cart" className="btn-secondary">View Cart</Link>
            </div>

            <ul className="mt-8 space-y-2 border-t border-slate-100 pt-6 text-sm text-slate-500">
              <li>✓ Free delivery on orders over ₹999</li>
              <li>✓ Secure checkout</li>
              <li>✓ 7-day easy returns</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
