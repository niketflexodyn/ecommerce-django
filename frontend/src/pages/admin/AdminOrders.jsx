import { useState, useEffect } from 'react';
import { orderApi } from '../../utils/api';
import AdminPageHeader from '../../components/admin/AdminPageHeader';

const STATUS_STYLES = {
  successful: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Successful' },
  unsuccessful: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Unsuccessful' },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [detailCache, setDetailCache] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    orderApi
      .list()
      .then(setOrders)
      .catch((err) => setError(err.data?.detail || 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setLoading(true);
    const params = {};
    if (search.trim()) params.search = search.trim();
    orderApi
      .list(params)
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const toggleExpand = async (orderId) => {
    if (expanded === orderId) {
      setExpanded(null);
      return;
    }
    setExpanded(orderId);
    if (!detailCache[orderId]) {
      try {
        const detail = await orderApi.get(orderId);
        setDetailCache((prev) => ({ ...prev, [orderId]: detail }));
      } catch {
        /* ignore */
      }
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#2A1A2C]" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <AdminPageHeader title="Orders" subtitle="View orders for your products" />

      {error && <p className="mt-4 text-red-600">{error}</p>}

      {/* Search */}
      <form onSubmit={handleSearch} className="mt-6 flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name or email..."
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C766]/50 focus:border-[#C9A227]"
        />
        <button
          type="submit"
          className="rounded-lg bg-[#2A1A2C] px-4 py-2 text-sm font-medium text-white hover:bg-[#3D2136] transition-colors"
        >
          Search
        </button>
      </form>

      {/* Orders list */}
      <div className="mt-6 space-y-3">
        {orders.length === 0 && !loading && (
          <div className="rounded-xl bg-white p-12 text-center text-slate-400 shadow-sm ring-1 ring-slate-200/80">
            No orders yet. Orders will appear here when customers purchase your products.
          </div>
        )}

        {orders.map((order) => {
          const detail = detailCache[order.id];
          const isExpanded = expanded === order.id;
          const statusStyle = STATUS_STYLES[order.status] || STATUS_STYLES.successful;

          return (
            <div key={order.id} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80">
              {/* Order header row */}
              <button
                onClick={() => toggleExpand(order.id)}
                className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-[#2A1A2C]">#{order.id}</span>
                  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                    {statusStyle.label}
                  </span>
                  <span className="text-sm text-slate-600">
                    {order.username || order.email || '—'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {order.items_count} item{order.items_count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-sm font-semibold text-[#2A1A2C]">
                    ₹{Number(order.total_amount).toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                  <svg
                    className={`size-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-slate-100 px-6 py-4">
                  {!detail ? (
                    <div className="flex justify-center py-4">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#2A1A2C]" />
                    </div>
                  ) : (
                    <>
                      {/* Customer info */}
                      <div className="mb-4 grid gap-4 sm:grid-cols-3">
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Customer</p>
                          <p className="mt-1 text-sm font-medium text-[#2A1A2C]">
                            {detail.first_name} {detail.last_name}
                          </p>
                          <p className="text-sm text-slate-600">@{detail.username}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Email</p>
                          <p className="mt-1 text-sm text-slate-700">{detail.email}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Phone / Address</p>
                          <p className="mt-1 text-sm text-slate-700">{detail.phone || '—'}</p>
                          <p className="text-sm text-slate-600">{detail.address || '—'}</p>
                          {detail.location && (
                            <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                              <svg className="size-4 shrink-0 text-[#C9A227]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                              </svg>
                              {detail.location}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="mb-4">
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Payment Status</p>
                        <span className={`mt-1 inline-block rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                          {statusStyle.label}
                        </span>
                      </div>

                      {/* Items */}
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
                      <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
                        <p className="text-sm font-semibold text-[#2A1A2C]">
                          Total: ₹{Number(detail.total_amount).toLocaleString()}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}