import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { orderApi, ratingApi } from '../utils/api';
import StarRating from '../components/StarRating';
import DeliveryTimeline from '../components/DeliveryTimeline';
import { useSelector } from 'react-redux';

const STATUS_STYLES = {
  pending: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Pending' },
  confirmed: { bg: 'bg-gold-500/10', text: 'text-gold-700', label: 'Confirmed' },
  successful: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Successful' },
  dispatched: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Dispatched' },
  out_for_delivery: { bg: 'bg-gold-500/10', text: 'text-gold-700', label: 'Out for Delivery' },
  delivered: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Delivered' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700', label: 'Cancelled' },
  unsuccessful: { bg: 'bg-red-50', text: 'text-red-700', label: 'Unsuccessful' },
};

export default function OrderHistory() {
  const user = useSelector((state) => state.auth.user);
  const authLoading = useSelector((state) => state.auth.loading);
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [expanded, setExpanded] = useState(null);
  const [detailCache, setDetailCache] = useState({});
  const [myRatings, setMyRatings] = useState({});
  const [ratingScores, setRatingScores] = useState({});
  const [ratingMessages, setRatingMessages] = useState({});

  const fetchOrders = () => {
    setOrdersLoading(true);
    orderApi
      .mine({ page, page_size: pageSize })
      .then((data) => {
        if (data && Array.isArray(data.results)) {
          setOrders(data.results);
          setTotalCount(data.count ?? data.results.length);
        } else if (Array.isArray(data)) {
          setOrders(data);
          setTotalCount(data.length);
        } else {
          setOrders([]);
          setTotalCount(0);
        }
      })
      .catch(() => {
        setOrders([]);
        setTotalCount(0);
      })
      .finally(() => setOrdersLoading(false));
  };

  useEffect(() => {
    if (!user) return;
    fetchOrders();
  }, [user, page, pageSize]);

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

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const pageNumbers = (() => {
    const pages = [];
    const span = 1;
    const start = Math.max(1, currentPage - span);
    const end = Math.min(totalPages, currentPage + span);
    if (start > 1) pages.push(1);
    if (start > 2) pages.push('…');
    for (let p = start; p <= end; p++) pages.push(p);
    if (end < totalPages - 1) pages.push('…');
    if (end < totalPages) pages.push(totalPages);
    return pages;
  })();

  if (!user && !authLoading) {
    return (
      <div className="page-container font-body py-12">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="font-display text-3xl font-bold text-slate-900">Please Sign In</h1>
          <p className="mt-3 text-slate-500">You need to be logged in to view your orders.</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 inline-block rounded-xl bg-gold-500 px-6 py-3 font-semibold text-plum-950 transition hover:opacity-90 shadow-md shadow-gold-500/20"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (ordersLoading && orders.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center font-body">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-plum-950" />
      </div>
    );
  }

  return (
    <div className="page-container font-body py-8 sm:py-12">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <nav className="mb-4 text-sm text-slate-500">
            <Link to="/" className="transition hover:text-gold-500">Home</Link>
            <span className="mx-2 text-slate-300">/</span>
            <span className="text-slate-900">My Orders</span>
          </nav>
          <h1 className="font-display text-3xl font-bold text-slate-900">My Orders</h1>
          <div className="mt-2 h-1 w-12 rounded-full bg-gold-500" />
        </div>

        {totalCount > 0 && (
          <div className="text-xs sm:text-sm font-medium text-slate-500">
            Showing <span className="font-semibold text-slate-800">{orders.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalCount}</span> orders
          </div>
        )}
      </div>

      {orders.length === 0 && !ordersLoading ? (
        <div className="card mx-auto max-w-lg p-12 text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-gold-500/10">
            <svg className="size-10 text-gold-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.25 18.75a.75.75 0 0 1 .75-.75h6a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75Z" />
            </svg>
          </div>
          <h2 className="font-display mt-5 text-xl font-bold text-slate-900">No orders yet</h2>
          <p className="mt-2 text-sm text-slate-500">
            Start shopping and your orders will appear here.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-plum-950 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-plum-950/20 transition hover:bg-plum-900"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4 relative">
          {ordersLoading && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-xl min-h-[120px]">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-plum-950" />
            </div>
          )}

          <div className="space-y-3">
            {orders.map((order) => {
              const detail = detailCache[order.id];
              const isExpanded = expanded === order.id;
              const statusStyle = STATUS_STYLES[order.status] || STATUS_STYLES.successful;

              return (
                <div key={order.id} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80 transition-shadow hover:shadow-md">
                  <button
                    onClick={() => toggleExpand(order.id)}
                    className="flex w-full flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 text-left hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                      <span className="text-sm font-semibold text-plum-950">#{order.order_number}</span>
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                        {statusStyle.label}
                      </span>
                      <span className="text-xs text-slate-400">
                        {order.items_count} item{order.items_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-slate-100 pt-2 sm:border-t-0 sm:pt-0">
                      <span className="text-sm font-semibold text-plum-950">₹{Number(order.total_amount).toLocaleString()}</span>
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
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-plum-950" />
                        </div>
                      ) : (
                        <>
                          <div className="mb-4 rounded-xl bg-slate-50/60 p-4 ring-1 ring-slate-100">
                            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Delivery timeline
                            </h3>
                            <DeliveryTimeline order={detail} cancelled={order.status === 'cancelled'} />
                          </div>
                          <div className="overflow-x-auto w-full">
                            <table className="w-full min-w-[500px] text-left text-sm">
                              <thead className="border-b border-slate-100">
                                <tr>
                                  <th className="pb-2 font-medium text-slate-500 whitespace-nowrap">Product</th>
                                  <th className="pb-2 font-medium text-slate-500 text-right whitespace-nowrap">Price</th>
                                  <th className="pb-2 font-medium text-slate-500 text-right whitespace-nowrap">Qty</th>
                                  <th className="pb-2 font-medium text-slate-500 text-right whitespace-nowrap">Subtotal</th>
                                  <th className="pb-2 font-medium text-slate-500 text-right whitespace-nowrap">Address</th>
                                  <th className="pb-2 font-medium text-slate-500 text-right whitespace-nowrap">Rating</th>
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
                                      <td className="py-3 text-slate-800 whitespace-nowrap">{item.product_name}</td>
                                      <td className="py-3 text-right text-slate-600 whitespace-nowrap">₹{Number(item.product_price).toLocaleString()}</td>
                                      <td className="py-3 text-right text-slate-600 whitespace-nowrap">{item.quantity}</td>
                                      <td className="py-3 text-right font-medium text-plum-950 whitespace-nowrap">
                                        ₹{(Number(item.product_price) * item.quantity).toLocaleString()}
                                      </td>
                                      <td className="py-3 text-right align-top whitespace-nowrap">
                                        <p className="text-sm text-slate-600">{detail.address || '—'}</p>
                                        {detail.location && (
                                          <p className="mt-1 flex items-center justify-end gap-1 text-sm text-slate-600">
                                            {detail.location}
                                          </p>
                                        )}
                                      </td>
                                      <td className="py-3 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-2">
                                          {order.status === 'successful' ? (
                                            <>
                                              <StarRating
                                                value={currentScore}
                                                onChange={(score) => handleRate(productId, score)}
                                                size="sm"
                                              />
                                              {existingRating && !msg && (
                                                <span className="text-xs font-medium text-gold-700">✓</span>
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
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalCount > 0 && (
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <div>
                  Showing{' '}
                  <span className="font-semibold text-slate-900">
                    {(currentPage - 1) * pageSize + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-semibold text-slate-900">
                    {Math.min(currentPage * pageSize, totalCount)}
                  </span>{' '}
                  of <span className="font-semibold text-slate-900">{totalCount}</span> orders
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-500">Per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-gold-500 shadow-sm"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors shadow-sm"
                    title="Previous Page"
                  >
                    <FiChevronLeft className="size-4" />
                  </button>

                  {pageNumbers.map((p, idx) =>
                    p === '…' ? (
                      <span key={`dots-${idx}`} className="px-1 text-xs text-slate-400">
                        …
                      </span>
                    ) : (
                      <button
                        key={`page-${p}`}
                        onClick={() => setPage(p)}
                        className={`inline-flex size-8 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                          p === currentPage
                            ? 'bg-plum-950 text-white shadow-sm'
                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors shadow-sm"
                    title="Next Page"
                  >
                    <FiChevronRight className="size-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}