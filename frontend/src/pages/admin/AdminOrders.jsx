import { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiSearch, FiX } from 'react-icons/fi';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const fetchOrders = () => {
    setLoading(true);
    const params = {
      page,
      page_size: pageSize,
    };
    if (searchTerm.trim()) {
      params.search = searchTerm.trim();
    }

    orderApi
      .list(params)
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
      .catch((err) => setError(err.data?.detail || 'Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 250);
    return () => clearTimeout(timer);
  }, [page, pageSize, searchTerm]);

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

  if (loading && orders.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-plum-950" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full min-w-0">
      <AdminPageHeader title="Orders" subtitle="View orders for your products" />

      {error && <p className="mt-4 text-red-600">{error}</p>}

      {/* Search Bar & Counter */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
        <div className="relative flex-1 max-w-md w-full">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            maxLength={100}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search by customer name, email, or order #..."
            className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-600 shadow-sm"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors"
              title="Clear search"
            >
              <FiX className="size-4" />
            </button>
          )}
        </div>

        {/* Counter Badge */}
        <div className="text-xs font-medium text-slate-500">
          Showing <span className="font-semibold text-slate-800">{orders.length}</span> of{' '}
          <span className="font-semibold text-slate-800">{totalCount}</span> orders
        </div>
      </div>

      {/* Orders list */}
      <div className="mt-4 space-y-3 w-full relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-xl min-h-[120px]">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-plum-950" />
          </div>
        )}

        {orders.length === 0 && !loading && searchTerm && (
          <div className="rounded-xl bg-white p-8 sm:p-12 text-center text-slate-500 shadow-sm ring-1 ring-slate-200/80">
            <FiSearch className="mx-auto size-8 text-slate-300 mb-2" />
            <p className="font-medium text-slate-800">No orders found matching "{searchTerm}"</p>
            <p className="mt-1 text-xs text-slate-400">
              Try searching with another customer name, email, or order ID.
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Clear search
            </button>
          </div>
        )}

        {orders.length === 0 && !loading && !searchTerm && (
          <div className="rounded-xl bg-white p-8 sm:p-12 text-center text-slate-400 shadow-sm ring-1 ring-slate-200/80">
            No orders yet. Orders will appear here when customers purchase your products.
          </div>
        )}

        {orders.map((order, index) => {
          const detail = detailCache[order.id];
          const isExpanded = expanded === order.id;
          const statusStyle = STATUS_STYLES[order.status] || STATUS_STYLES.successful;

          return (
            <div key={order.id} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80 w-full">
              {/* Order header row */}
              <button
                onClick={() => toggleExpand(order.id)}
                className="flex w-full flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 sm:px-6 sm:py-4 text-left hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <span className="text-sm font-semibold text-plum-950">#{index+1}</span>
                  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                    {statusStyle.label}
                  </span>
                  <span className="text-sm text-slate-600 truncate max-w-[150px] sm:max-w-none">
                    {order.username || order.email || '—'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {order.items_count} item{order.items_count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 border-t border-slate-100 pt-2 sm:border-t-0 sm:pt-0">
                  <span className="text-sm font-semibold text-plum-950">
                    ₹{Number(order.total_amount).toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                  <svg
                    className={`size-5 text-slate-400 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
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
                <div className="border-t border-slate-100 px-4 py-3.5 sm:px-6 sm:py-4">
                  {!detail ? (
                    <div className="flex justify-center py-4">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-plum-950" />
                    </div>
                  ) : (
                    <>
                      {/* Customer info */}
                      <div className="mb-4 grid gap-4 grid-cols-1 sm:grid-cols-3">
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Customer</p>
                          <p className="mt-1 text-sm font-medium text-plum-950">
                            {detail.first_name} {detail.last_name}
                          </p>
                          <p className="text-sm text-slate-600">@{detail.username}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Email</p>
                          <p className="mt-1 text-sm text-slate-700 break-all">{detail.email}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Phone / Address</p>
                          <p className="mt-1 text-sm text-slate-700">{detail.phone || '—'}</p>
                          <p className="text-sm text-slate-600">{detail.address || '—'}</p>
                          {detail.location && (
                            <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                              <svg className="size-4 shrink-0 text-gold-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
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
                      <div className="overflow-x-auto w-full">
                        <table className="w-full min-w-[400px] text-left text-sm">
                          <thead className="border-b border-slate-100">
                            <tr>
                              <th className="pb-2 font-medium text-slate-500 whitespace-nowrap">Product</th>
                              <th className="pb-2 font-medium text-slate-500 text-right whitespace-nowrap">Price</th>
                              <th className="pb-2 font-medium text-slate-500 text-right whitespace-nowrap">Qty</th>
                              <th className="pb-2 font-medium text-slate-500 text-right whitespace-nowrap">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {detail.items?.map((item) => (
                              <tr key={item.id}>
                                <td className="py-2 text-slate-800 whitespace-nowrap">{item.product_name}</td>
                                <td className="py-2 text-right text-slate-600 whitespace-nowrap">₹{Number(item.product_price).toLocaleString()}</td>
                                <td className="py-2 text-right text-slate-600 whitespace-nowrap">{item.quantity}</td>
                                <td className="py-2 text-right font-medium text-plum-950 whitespace-nowrap">
                                  ₹{(Number(item.product_price) * item.quantity).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
                        <p className="text-sm font-semibold text-plum-950">
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

      {/* Pagination Footer */}
      {totalCount > 0 && (
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
          {/* Showing Range & Page Size Selector */}
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
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Page Navigation Buttons */}
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
  );
}