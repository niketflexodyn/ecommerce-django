import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatPrice, getProductImageUrl } from '../utils/product'

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity } = useCart()

  const total = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="page-container py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Shopping Cart</h1>
        <p className="mt-1 text-sm text-slate-500">
          {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
        </p>
      </div>

      {cartItems.length === 0 ? (
        <div className="card mx-auto max-w-lg p-12 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-400">
            🛍
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">Your cart is empty</h2>
          <p className="mt-2 text-sm text-slate-500">Add products to get started.</p>
          <Link to="/" className="btn-primary mt-6">Continue Shopping</Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {cartItems.map((item) => {
              const imageUrl = getProductImageUrl(item.image)
              return (
                <article key={item.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                  {imageUrl ? (
                    <img src={imageUrl} alt={item.name} className="size-24 shrink-0 rounded-xl object-cover sm:size-28" />
                  ) : (
                    <div className="flex size-24 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400 sm:size-28">
                      No image
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <Link to={`/product/${item.id}`} className="text-lg font-semibold text-slate-900 hover:text-indigo-600">
                      {item.name}
                    </Link>
                    <p className="mt-1 text-sm text-slate-500">{formatPrice(item.price)} each</p>
                    <p className="mt-2 font-semibold text-indigo-600">
                      {formatPrice(Number(item.price) * item.quantity)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="flex size-8 items-center justify-center rounded-lg hover:bg-white"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="text-sm font-medium text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              )
            })}
          </div>

          <aside className="card h-fit p-6 lg:sticky lg:top-24">
            <h2 className="text-lg font-bold text-slate-900">Order Summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <dt>Subtotal ({totalItems} items)</dt>
                <dd className="font-medium text-slate-900">{formatPrice(total)}</dd>
              </div>
              <div className="flex justify-between text-slate-600">
                <dt>Shipping</dt>
                <dd className="font-medium text-emerald-600">{total >= 999 ? 'Free' : formatPrice(99)}</dd>
              </div>
            </dl>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="flex justify-between text-lg font-bold text-slate-900">
                <span>Total</span>
                <span>{formatPrice(total >= 999 ? total : total + 99)}</span>
              </div>
            </div>
            <button type="button" className="btn-primary mt-6 w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700">
              Proceed to Checkout
            </button>
            <Link to="/" className="btn-secondary mt-3 w-full">Continue Shopping</Link>
          </aside>
        </div>
      )}
    </div>
  )
}
