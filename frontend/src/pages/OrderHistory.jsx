import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderApi, ratingApi } from '../utils/api';
import StarRating from '../components/StarRating';

const fontDisplay = { fontFamily: "'Playfair Display', serif" };
const fontBody = { fontFamily: "'Jost', sans-serif" };

const STATUS_STYLES = {
  successful: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Successful' },
  unsuccessful: { bg: 'bg-red-50', text: 'text-red-700', label: 'Unsuccessful' },
};

export default function OrderHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [detailCache, setDetailCache] = useState({});
  const [myRatings, setMyRatings] = useState({});
  const [ratingScores, setRatingScores] = useState({});
  const [ratingMessages, setRatingMessages] = useState({});

  useEffect(() => {
    if (!user) return;
    orderApi
      .mine()
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  // Fetch user's ratings on mount
  useEffect(() => {
    if (!user) return;
    ratingApi
      .mine()
      .then((ratings) => {
        const map = {};
        ratings.forEach((r) => {
          map[r.product] = r.score;
        });
        setMyRatings(map);
      })
      .catch(() => {});
  }, [user]);

  const toggleExpand = async (orderId) => {
    if (expanded === orderId) {
      setExpanded(null);
      return;
    }
    setExpanded(orderId);
    if (!detailCache[orderId]) {
      try {
        const detail = await orderApi.mineDetail(orderId);
        setDetailCache((prev) => ({ ...prev, [orderId]: detail }));
      } catch {
        /* ignore */
      }
    }
  };

  const handleRate = useCallback(async (productId, score) => {
    setRatingScores((prev) => ({ ...prev, [productId]: score }));
    setRatingMessages((prev) => ({ ...prev, [productId]: '' }));
    try {
      await ratingApi.create({ product: productId, score });
      setMyRatings((prev) => ({ ...prev, [productId]: score }));
      setRatingMessages((prev) => ({ ...prev, [productId]: 'success' }));
    } catch (err) {
      const msg =
        err.data?.product?.[0] ||
        err.data?.score?.[0] ||
        err.data?.detail ||
        'You can only rate products you have purchased.';
      setRatingMessages((prev) => ({ ...prev, [productId]: msg }));
      setRatingScores((prev) => ({ ...prev, [productId]: myRatings[productId] || 0 }));
    }
  }, [myRatings]);

  if (!user) {
    return (
      <div className="page-container py-12" style={fontBody}>
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-3xl font-bold text-slate-900" style={fontDisplay}>Please Sign In</h1>
          <p className="mt-3 text-slate-500">You need to be logged in to view your orders.</p>
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

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" style={fontBody}>
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#2A1A2C]" />
      </div>
    );
  }

  return (
    <div className="page-container py-8 sm:py-12" style={fontBody}>
      <div className="mb-8">
        <nav className="mb-4 text-sm text-slate-500">
          <Link to="/" className="transition hover:text-[#E8C766]">Home</Link>
          <span className="mx-2 text-slate-300">/</span>
          <span className="text-slate-900">My Orders</span>
        </nav>
        <h1 className="text-3xl font-bold text-slate-900" style={fontDisplay}>My Orders</h1>
        <div className="mt-2 h-1 w-12 rounded-full bg-[#E8C766]" />
      </div>

      {orders.length === 0 ? (
        <div className="card mx-auto max-w-lg p-12 text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-[#E8C766]/10">
            <svg className="size-10 text-[#C9A227]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.25 18.75a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75Z" />
            </svg>
          </div>
          <h2 className="mt-5 text-xl font-bold text-slate-900" style={fontDisplay}>No orders yet</h2>
          <p className="mt-2 text-sm text-slate-500">
            Start shopping and your orders will appear here.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#2A1A2C] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#2A1A2C]/20 transition hover:bg-[#3D2136]"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const detail = detailCache[order.id];
            const isExpanded = expanded === order.id;
            const statusStyle = STATUS_STYLES[order.status] || STATUS_STYLES.successful;

            return (
              <div key={order.id} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80">
                <button
                  onClick={() => toggleExpand(order.id)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-[#2A1A2C]">#{order.order_number}</span>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                      {statusStyle.label}
                    </span>
                    <span className="text-xs text-slate-400">
                      {order.items_count} item{order.items_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-[#2A1A2C]">₹{Number(order.total_amount).toLocaleString()}</span>
                    <span className="text-xs text-slate-400">{new Date(order.created_at).toLocaleDateString()}</span>
                    <svg
                      className={`size-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 px-6 py-4">
                    {!detail ? (
                      <div className="flex justify-center py-4">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#2A1A2C]" />
                      </div>
                    ) : (
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-100">
                          <tr>
                            <th className="pb-2 font-medium text-slate-500">Product</th>
                            <th className="pb-2 font-medium text-slate-500 text-right">Price</th>
                            <th className="pb-2 font-medium text-slate-500 text-right">Qty</th>
                            <th className="pb-2 font-medium text-slate-500 text-right">Subtotal</th>
                            <th className="pb-2 font-medium text-slate-500 text-right">Rating</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {detail.items?.map((item) => {
                            const productId = item.product;
                            const existingRating = myRatings[productId];
                            const currentScore = ratingScores[productId] ?? existingRating ?? 0;
                            const msg = ratingMessages[productId];

                            return (
                              <tr key={item.id}>
                                <td className="py-3 text-slate-800">{item.product_name}</td>
                                <td className="py-3 text-right text-slate-600">₹{Number(item.product_price).toLocaleString()}</td>
                                <td className="py-3 text-right text-slate-600">{item.quantity}</td>
                                <td className="py-3 text-right font-medium text-[#2A1A2C]">
                                  ₹{(Number(item.product_price) * item.quantity).toLocaleString()}
                                </td>
                                <td className="py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {order.status === 'successful' ? (
                                      <>
                                        <StarRating
                                          value={currentScore}
                                          onChange={(score) => handleRate(productId, score)}
                                          size="sm"
                                        />
                                        {existingRating && !msg && (
                                          <span className="text-xs text-[#8a6d1f] font-medium">✓</span>
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-xs text-slate-400">—</span>
                                    )}
                                  </div>
                                  {msg && (
                                    <p className={`mt-1 text-xs ${msg === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                                      {msg === 'success' ? 'Rated!' : msg}
                                    </p>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}