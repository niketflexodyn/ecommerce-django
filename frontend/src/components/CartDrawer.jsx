import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { getProductImageUrl } from '../utils/product'

function CloseIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

function TrashIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166M4.772 5.79a48.108 48.108 0 0 1 3.478-.397m0 0V4.5A2.25 2.25 0 0 1 10.5 2.25h3A2.25 2.25 0 0 1 15.75 4.5v.893m-6.75 0a48.667 48.667 0 0 1 6.75 0" />
    </svg>
  )
}

export default function CartDrawer() {
  const { cartItems, isCartOpen, closeCart, removeFromCart, updateQuantity } = useCart()

  const subtotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  )

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 ${
          isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-sm flex-col bg-white font-body shadow-2xl transition-transform duration-300 ease-in-out ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-display text-lg font-bold text-plum-950">
            Your Cart {cartItems.length > 0 && `(${cartItems.length})`}
          </h2>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="flex size-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="text-sm text-slate-500">Your cart is empty.</p>
            <button
              onClick={closeCart}
              className="mt-4 rounded-full bg-plum-950 px-5 py-2 text-sm font-semibold text-white hover:bg-plum-900"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {cartItems.map((item) => {
                const imageUrl = getProductImageUrl(item.image)
                const unitPrice = parseFloat(item.price || 0)
                const origPrice = parseFloat(item.original_price || unitPrice)
                const hasDiscount = origPrice > unitPrice
                const itemKey = item.cartItemId || `${item.id}-${item.variant_id || item.variant?.id || 'default'}`
                const itemIdentifier = item.cartItemId || itemKey

                return (
                  <div key={itemKey} className="flex gap-3">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
                        className="size-16 shrink-0 rounded-lg object-cover bg-slate-100"
                      />
                    ) : (
                      <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] text-slate-400">
                        No image
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-medium text-slate-800">{item.name}</p>
                        <button
                          onClick={() => removeFromCart(itemIdentifier)}
                          aria-label={`Remove ${item.name}`}
                          className="shrink-0 text-slate-300 hover:text-red-500"
                        >
                          <TrashIcon className="size-4" />
                        </button>
                      </div>

                      {/* Variant tags */}
                      {(item.variant_attributes?.length > 0 || item.variant?.attributes?.length > 0) && (
                        <div className="mt-0.5 flex flex-wrap items-center gap-1">
                          {item.variant_attributes?.map((attr, idx) => (
                            <span key={idx} className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600 font-medium">
                              {attr.value_name}
                            </span>
                          ))}
                          {!item.variant_attributes?.length && item.variant?.attributes?.map((attr, idx) => (
                            <span key={idx} className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600 font-medium">
                              {attr.value_name || attr.value}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Pricing */}
                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-sm font-bold text-plum-950">
                          ₹{unitPrice.toFixed(2)}
                        </span>
                        {hasDiscount && (
                          <>
                            <span className="text-[11px] text-slate-400 line-through">
                              ₹{origPrice.toFixed(2)}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700">
                              {item.discount?.percentage_off
                                ? `${Math.round(item.discount.percentage_off)}% OFF`
                                : 'SALE'}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="mt-2 inline-flex items-center rounded-full border border-slate-200">
                        <button
                          onClick={() => updateQuantity(itemIdentifier, item.quantity - 1)}
                          className="flex size-7 items-center justify-center text-slate-500 hover:text-plum-950"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(itemIdentifier, item.quantity + 1)}
                          className="flex size-7 items-center justify-center text-slate-500 hover:text-plum-950"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-slate-100 px-5 py-4">
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="text-base font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
              </div>
              <Link
                to="/checkout"
                onClick={closeCart}
                className="block w-full rounded-full bg-plum-950 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-plum-900"
              >
                Proceed to Checkout
              </Link>
              <Link
                to="/cart"
                onClick={closeCart}
                className="mt-2 block w-full rounded-full border border-slate-200 py-3 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                View full cart
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  )
}