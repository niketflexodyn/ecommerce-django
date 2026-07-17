import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { checkoutApi } from '../utils/api';

const fontDisplay = { fontFamily: "'Playfair Display', serif" };
const fontBody = { fontFamily: "'Jost', sans-serif" };

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
      const order = await checkoutApi.place({
        address: form.address,
        phone: form.phone,
      });
      clearCart();
      navigate('/order-success', { state: { orderId: order.id, orderNumber: order.order_number, total: order.total_amount } });
    } catch (err) {
      setError(err.data?.error || err.data?.detail || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!auth.user) {
    return (
      <div className="page-container py-12" style={fontBody}>
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-3xl font-bold text-slate-900" style={fontDisplay}>Please Sign In</h1>
          <p className="mt-3 text-slate-500">You need to be logged in to checkout.</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 inline-block rounded-xl px-6 py-3 font-semibold text-[#2A1A2C] transition hover:opacity-90"
            style={{ backgroundColor: '#E8C766' }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="page-container py-12" style={fontBody}>
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-3xl font-bold text-slate-900" style={fontDisplay}>Your Cart is Empty</h1>
          <p className="mt-3 text-slate-500">Add some products before checking out.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 inline-block rounded-xl px-6 py-3 font-semibold text-[#2A1A2C] transition hover:opacity-90"
            style={{ backgroundColor: '#E8C766' }}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container py-8 sm:py-12" style={fontBody}>
      <h1 className="text-3xl font-bold text-slate-900" style={fontDisplay}>Checkout</h1>
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
              <h2 className="text-lg font-semibold text-[#2A1A2C]" style={fontDisplay}>Shipping Information</h2>

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
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C766]/50 focus:border-[#C9A227]"
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
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C766]/50 focus:border-[#C9A227]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Order summary */}
          <aside className="card h-fit p-6 lg:sticky lg:top-24">
            <h2 className="text-lg font-bold text-slate-900" style={fontDisplay}>Order Summary</h2>

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
                  <p className="text-sm font-semibold text-[#2A1A2C]">
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
                <span className="font-medium text-[#8a6d1f]">{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
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
              className="mt-6 w-full rounded-xl py-3 font-semibold text-[#2A1A2C] transition hover:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: '#E8C766' }}
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </aside>
        </div>
      </form>
    </div>
  );
}