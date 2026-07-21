import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { getProductImageUrl } from '../utils/product'

const fontDisplay = { fontFamily: "'Playfair Display', serif" }
const fontBody = { fontFamily: "'Jost', sans-serif" }

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
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={fontBody}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-[#2A1A2C]" style={fontDisplay}>
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
              className="mt-4 rounded-full bg-[#2A1A2C] px-5 py-2 text-sm font-semibold text-white hover:bg-[#3D2136]"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {cartItems.map((item) => {
                const imageUrl = getProductImageUrl(item.image)
                return (
                <div key={item.id} className="flex gap-3">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.name}
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
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="shrink-0 text-slate-300 hover:text-red-500"
                      >
                        <TrashIcon className="size-4" />
                      </button>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">
                    ₹{parseFloat(item.price).toFixed(2)}
                    </p>

                    <div className="mt-2 inline-flex items-center rounded-full border border-slate-200">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="flex size-7 items-center justify-center text-slate-500 hover:text-[#2A1A2C]"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="flex size-7 items-center justify-center text-slate-500 hover:text-[#2A1A2C]"
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
                className="block w-full rounded-full bg-[#2A1A2C] py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#3D2136]"
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