import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { formatPrice, getProductImageUrl } from '../utils/product'

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const total = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const shipping = total >= 50 ? 0 : 9.99
  const grandTotal = total + shipping

  return (
    <div className="page-container py-8 sm:py-12 font-body">
      {/* Header */}
      <div className="mb-8">
        <nav className="mb-4 text-sm text-slate-500">
          <Link to="/" className="transition hover:text-gold-500">Home</Link>
          <span className="mx-2 text-slate-300">/</span>
          <span className="text-slate-900">Cart</span>
        </nav>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 font-display">
              Shopping Cart
            </h1>
            <div className="mt-2 h-1 w-12 rounded-full bg-gold-500" />
          </div>
          {cartItems.length > 0 && (
            <p className="text-sm text-slate-500">
              {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
            </p>
          )}
        </div>
      </div>

      {cartItems.length === 0 ? (
        /* ── Empty state ── */
        <div className="card mx-auto max-w-lg p-12 text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-gold-500/10">
            <svg className="size-10 text-gold-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.936-4.708 2.436-7.18.075-.37-.221-.7-.598-.7H5.106M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
          </div>
          <h2 className="mt-5 text-xl font-bold text-slate-900 font-display">
            Your cart is empty
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Looks like you haven't added anything yet. Explore our collection and find something you love.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-plum-950 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-plum-950/20 transition hover:bg-plum-900"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            Start Shopping
          </Link>
        </div>
      ) : (
        /* ── Cart with items ── */
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Item list */}
          <div className="space-y-4 lg:col-span-2">
            {cartItems.map((item) => {
              const imageUrl = getProductImageUrl(item.image)
              const lineTotal = Number(item.price) * item.quantity

              return (
                <article
                  key={item.id}
                  className="group card flex flex-col gap-4 p-4 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:p-5"
                >
                  {/* Image */}
                  <Link to={`/product/${item.id}`} className="shrink-0">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.name}
                        className="size-24 rounded-xl object-cover transition group-hover:shadow-md sm:size-28"
                      />
                    ) : (
                      <div className="flex size-24 items-center justify-center rounded-xl bg-slate-50 text-xs text-slate-400 sm:size-28">
                        <div className="text-center">
                          <svg className="mx-auto size-8 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 0 0 1.5-1.5V5.25a1.5 1.5 0 0 0-1.5-1.5H3.75a1.5 1.5 0 0 0-1.5 1.5v14.25a1.5 1.5 0 0 0 1.5 1.5Z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </Link>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/product/${item.id}`}
                      className="text-lg font-semibold text-slate-900 transition hover:text-gold-700"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-1 text-sm text-slate-500">{formatPrice(item.price)} each</p>
                    <p className="mt-2 text-lg font-bold tracking-tight text-plum-950 font-display">
                      {formatPrice(lineTotal)}
                    </p>
                  </div>

                  {/* Quantity & remove */}
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="flex size-9 items-center justify-center text-slate-600 transition hover:bg-white hover:text-slate-900"
                        aria-label="Decrease quantity"
                      >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                        </svg>
                      </button>
                      <span className="w-9 text-center text-sm font-semibold text-slate-900">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="flex size-9 items-center justify-center bg-plum-950 text-white transition hover:bg-plum-900"
                        aria-label="Increase quantity"
                      >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="flex items-center gap-1 text-sm font-medium text-red-400 transition hover:text-red-600"
                    >
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                      Remove
                    </button>
                  </div>
                </article>
              )
            })}

            {/* Continue shopping link */}
            <Link
              to="/"
              className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-gold-700 transition hover:text-gold-600"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Continue Shopping
            </Link>
          </div>

          {/* ── Order Summary ── */}
          <aside className="card h-fit overflow-hidden p-0 lg:sticky lg:top-24">
            {/* Gold accent bar */}
            <div className="h-1.5 bg-linear-to-r from-gold-500 via-gold-400 to-gold-500" />

            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 font-display">
                Order Summary
              </h2>

              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <dt>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})</dt>
                  <dd className="font-medium text-slate-900">{formatPrice(total)}</dd>
                </div>
                <div className="flex justify-between text-slate-600">
                  <dt>Shipping</dt>
                  <dd className={shipping === 0 ? 'font-medium text-green-600' : 'font-medium text-slate-900'}>
                    {shipping === 0 ? (
                      <span className="flex items-center gap-1">
                        <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        Free
                      </span>
                    ) : (
                      formatPrice(shipping)
                    )}
                  </dd>
                </div>
              </dl>

              {shipping > 0 && (
                <p className="mt-2 rounded-lg bg-gold-500/10 px-3 py-2 text-xs text-gold-700">
                  Add {formatPrice(50 - total)} more to qualify for free shipping
                </p>
              )}

              <div className="mt-5 border-t border-slate-100 pt-5">
                <div className="flex justify-between text-xl font-bold text-slate-900 font-display">
                  <span>Total</span>
                  <span>{formatPrice(grandTotal)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    navigate('/login')
                  } else {
                    navigate('/checkout')
                  }
                }}
                className="mt-6 w-full rounded-xl bg-gold-500 py-3.5 text-sm font-bold uppercase tracking-wide text-plum-950 shadow-lg shadow-gold-500/30 transition hover:bg-gold-400 hover:shadow-xl active:opacity-90"
              >
                Proceed to Checkout
              </button>

              {!user && (
                <p className="mt-3 text-center text-xs text-slate-500">
                  You'll be asked to log in before checkout
                </p>
              )}

              {/* Trust badges */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <svg className="size-4 shrink-0 text-gold-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                  Secure checkout
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <svg className="size-4 shrink-0 text-gold-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 1-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 1-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a8.25 8.25 0 0 0-2.034-4.926l-.726-.726a1.125 1.125 0 0 1-.298-.774V6.375c0-.621-.504-1.125-1.125-1.125H14.25M3.75 14.25h7.875c.621 0 1.125.504 1.125 1.125v3.75M3.75 14.25V6.375c0-.621.504-1.125 1.125-1.125h6.75" />
                  </svg>
                  Free delivery over ₹50
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <svg className="size-4 shrink-0 text-gold-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                  </svg>
                  30-day returns
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <svg className="size-4 shrink-0 text-gold-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.625h12M4.5 6.375h15M6.75 3.75h10.5" />
                  </svg>
                  Easy payments
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}