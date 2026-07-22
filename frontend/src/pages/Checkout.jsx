import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { checkoutApi } from '../utils/api';

// Lazily inject the Razorpay checkout.js script (once). The backend returns
// the public key_id with the order, so no frontend env config is needed.
let razorpayPromise = null;
function loadRazorpay() {
  if (!razorpayPromise) {
    razorpayPromise = new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve();
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        razorpayPromise = null; // allow a retry on the next attempt
        reject(new Error('Could not load Razorpay. Check your connection.'));
      };
      document.body.appendChild(script);
    });
  }
  return razorpayPromise;
}

// Turn a backend/gateway error into a customer-friendly message. The backend
// returns {"error": "..."} on failure (e.g. "Razorpay rejected the order:
// Authentication failed" when the keys are misconfigured); surface that as
// something the customer can act on instead of raw gateway jargon.
function friendlyPaymentError(err) {
  const raw = err?.data?.error || err?.data?.detail || err?.message || '';
  const lower = String(raw).toLowerCase();
  if (
    lower.includes('authentication failed') ||
    lower.includes('keys are not configured') ||
    lower.includes('keys are invalid') ||
    lower.includes('invalid or expired')
  ) {
    return 'Payment gateway is not configured correctly. Please contact support and try again later.';
  }
  if (lower.includes('cart is empty')) {
    return 'Your cart is empty. Add some items before checking out.';
  }
  if (lower.includes('signature') || lower.includes('verification')) {
    return 'Payment verification failed. If money was debited, it will be refunded automatically. Please contact support.';
  }
  if (lower.includes('order mismatch') || lower.includes('order not found')) {
    return 'This order could not be found. Please refresh the page and try again.';
  }
  return raw || 'Could not start payment. Please try again.';
}

export default function Checkout() {
  const { cartItems, user } = useAuth() ? useAuth() : { user: null };
  const { cartItems: items, clearCart } = useCart();
  const auth = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    address: auth.user?.address || '',
    phone: auth.user?.phone || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const shipping = total >= 50 ? 0 : 9.99;
  const grandTotal = total + shipping;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Create a Razorpay order on the backend (also saves shipping info).
      const rzp = await checkoutApi.razorpay({
        address: form.address,
        phone: form.phone,
      });

      // 2. Load the Razorpay checkout script, then open the modal.
      await loadRazorpay();

      const options = {
        key: rzp.key_id,
        amount: rzp.amount,
        currency: rzp.currency,
        name: rzp.name,
        order_id: rzp.razorpay_order_id,
        prefill: rzp.prefill,
        handler: async (response) => {
          // 3. Verify the signature server-side and finalize the order.
          try {
            const order = await checkoutApi.verifyRazorpay({
              order_id: rzp.order_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            clearCart();
            navigate('/order-success', {
              state: { orderId: order.id, orderNumber: order.order_number, total: order.total_amount },
            });
          } catch (verifyErr) {
            setError(friendlyPaymentError(verifyErr));
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setError('Payment was cancelled. You can try again.');
          },
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', (resp) => {
        setError(
          `Payment failed: ${resp?.error?.description || 'unknown error'}. No money was debited.`
        );
        setLoading(false);
      });
      rzpInstance.open();
    } catch (err) {
      setError(friendlyPaymentError(err));
      setLoading(false);
    }
  };

  if (!auth.user) {
    return (
      <div className="page-container py-12 font-body">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-3xl font-bold text-slate-900 font-display">Please Sign In</h1>
          <p className="mt-3 text-slate-500">You need to be logged in to checkout.</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 inline-block rounded-xl bg-gold-500 px-6 py-3 font-semibold text-plum-950 transition hover:opacity-90"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="page-container py-12 font-body">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-3xl font-bold text-slate-900 font-display">Your Cart is Empty</h1>
          <p className="mt-3 text-slate-500">Add some products before checking out.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 inline-block rounded-xl bg-gold-500 px-6 py-3 font-semibold text-plum-950 transition hover:opacity-90"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-8 sm:py-12 font-body">
      <h1 className="text-3xl font-bold text-slate-900 font-display">Checkout</h1>
      <p className="mt-1 text-sm text-slate-500">Complete your order</p>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Left: Shipping info */}
          <div className="space-y-6 lg:col-span-2">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-plum-950 font-display">Shipping Information</h2>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
                  <input
                    type="text"
                    readOnly
                    value={`${auth.user.first_name} ${auth.user.last_name}`}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    readOnly
                    value={auth.user.email}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Your phone number"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-600"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Delivery Address *</label>
                  <textarea
                    name="address"
                    required
                    value={form.address}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Full delivery address"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Order summary */}
          <aside className="card h-fit p-6 lg:sticky lg:top-24">
            <h2 className="text-lg font-bold text-slate-900 font-display">Order Summary</h2>

            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  {item.image ? (
                    <img
                      src={item.image.startsWith('http') ? item.image : `${(import.meta.env.VITE_DJANGO_URL || 'http://localhost:8000')}${item.image}`}
                      alt={item.name}
                      className="size-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex size-12 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                      No img
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-plum-950">
                    ₹{(Number(item.price) * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="font-medium text-slate-900">₹{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span className="font-medium text-gold-700">{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
              </div>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="flex justify-between text-lg font-bold text-slate-900">
                <span>Total</span>
                <span>₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-gold-500 py-3 font-semibold text-plum-950 transition hover:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Pay Now'}
            </button>
          </aside>
        </div>
      </form>
    </div>
  );
}