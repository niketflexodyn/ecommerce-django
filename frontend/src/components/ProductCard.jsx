import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatPrice, getProductImageUrl } from '../utils/product'

const fontDisplay = { fontFamily: "'Playfair Display', serif" }

export default function ProductCard({ product }) {
  const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart()
  const cartItem = cartItems.find((item) => item.id === product.id)
  const imageUrl = getProductImageUrl(product.image)

  return (
    <article className="group card flex flex-col overflow-hidden border-t-2 border-transparent transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[#E8C766]">
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
          <span className="absolute left-3 top-3 rounded-full bg-[#E8C766]/20 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-[#8a6d1f] backdrop-blur-sm">
            {product.category.name}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link to={`/product/${product.id}`}>
          <h2 className="truncate text-base font-semibold text-slate-900 group-hover:text-[#2A1A2C]">
            {product.name}
          </h2>
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">{product.description}</p>
        </Link>

        <div className="mt-auto flex items-center justify-between pt-4">
          <p className="text-lg font-bold tracking-tight text-[#2A1A2C]" style={fontDisplay}>
            {formatPrice(product.price)}
          </p>
        </div>

        <div className="mt-3">
          {!cartItem ? (
            <button
              type="button"
              onClick={() => addToCart(product)}
              className="btn-primary w-full flex items-center justify-center gap-2 shadow-sm shadow-[#2A1A2C]/10"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.936-4.708 2.436-7.18.075-.37-.221-.7-.598-.7H5.106M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
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
                  className="flex size-9 items-center justify-center rounded-lg text-lg font-medium text-white transition hover:opacity-90"
                  style={{ backgroundColor: '#2A1A2C' }}
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