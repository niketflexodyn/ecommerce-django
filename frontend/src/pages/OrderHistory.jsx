import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderApi } from '../utils/api';

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

  useEffect(() => {
    if (!user) return;
    orderApi
      .mine()
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
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
      <h1 className="text-3xl font-bold text-slate-900" style={fontDisplay}>My Orders</h1>
      <p className="mt-1 text-sm text-slate-500">Your order history</p>

      {orders.length === 0 ? (
        <div className="mt-8 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-slate-100 text-2xl">📦</div>
          <p className="mt-4 text-slate-600">You haven't placed any orders yet.</p>
          <Link
            to="/"
            className="mt-4 inline-block rounded-xl px-6 py-3 font-semibold text-[#2A1A2C] transition hover:opacity-90"
            style={{ backgroundColor: '#E8C766' }}
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
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
                    <span className="text-sm font-semibold text-[#2A1A2C]">#{order.id}</span>
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
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {detail.items?.map((item) => (
                            <tr key={item.id}>
                              <td className="py-2 text-slate-800">{item.product_name}</td>
                              <td className="py-2 text-right text-slate-600">₹{Number(item.product_price).toLocaleString()}</td>
                              <td className="py-2 text-right text-slate-600">{item.quantity}</td>
                              <td className="py-2 text-right font-medium text-[#2A1A2C]">
                                ₹{(Number(item.product_price) * item.quantity).toLocaleString()}
                              </td>
                            </tr>
                          ))}
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