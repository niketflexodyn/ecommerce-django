import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatPrice, getProductImageUrl } from '../utils/product'

export default function ProductCard({ product }) {
  const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart()
  const cartItem = cartItems.find((item) => item.id === product.id)
  const imageUrl = getProductImageUrl(product.image)

  return (
    <article className="group card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
      <Link to={`/product/${product.id}`} className="relative block overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="h-56 w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-56 w-full items-center justify-center bg-slate-100 text-sm text-slate-400">
            No image
          </div>
        )}
        {product.category?.name && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-600 backdrop-blur-sm">
            {product.category.name}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link to={`/product/${product.id}`}>
          <h2 className="truncate text-base font-semibold text-slate-900 group-hover:text-indigo-600">
            {product.name}
          </h2>
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">{product.description}</p>
        </Link>

        <div className="mt-auto flex items-center justify-between pt-4">
          <p className="text-lg font-bold text-indigo-600">{formatPrice(product.price)}</p>
        </div>

        <div className="mt-3">
          {!cartItem ? (
            <button type="button" onClick={() => addToCart(product)} className="btn-primary w-full">
              Add to Cart
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                  className="flex size-9 items-center justify-center rounded-lg text-lg font-medium text-slate-600 hover:bg-white"
                >
                  −
                </button>
                <span className="text-sm font-semibold text-slate-900">{cartItem.quantity} in cart</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                  className="flex size-9 items-center justify-center rounded-lg bg-indigo-600 text-lg font-medium text-white hover:bg-indigo-500"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() => removeFromCart(product.id)}
                className="w-full text-center text-sm font-medium text-red-500 hover:text-red-600"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
