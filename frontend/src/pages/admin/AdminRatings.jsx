import { useState, useEffect, useMemo } from 'react';
import { ratingApi, adminProductApi } from '../../utils/api';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import StarRating from '../../components/StarRating';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function resolveImgUrl(image) {
  if (!image) return null;
  return image.startsWith('http') ? image : `${API_BASE.replace('/api', '')}${image}`;
}

export default function AdminRatings() {
  const [ratings, setRatings] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState('all');
  const [search, setSearch] = useState('');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      ratingApi.adminList().catch(() => []),
      adminProductApi.list({ all: 'true' }).catch(() => ({ results: [] })),
    ])
      .then(([ratingsData, productsData]) => {
        if (!isMounted) return;
        const ratingsList = Array.isArray(ratingsData)
          ? ratingsData
          : ratingsData?.results || [];
        const productsList = Array.isArray(productsData)
          ? productsData
          : productsData?.results || [];

        setRatings(ratingsList);
        setProducts(productsList);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Map product ID to count and average score from loaded ratings
  const productRatingStats = useMemo(() => {
    const map = {};
    ratings.forEach((r) => {
      const pId = String(r.product);
      if (!map[pId]) {
        map[pId] = { count: 0, sum: 0, name: r.product_name, image: r.product_image };
      }
      map[pId].count += 1;
      map[pId].sum += Number(r.score) || 0;
    });
    Object.keys(map).forEach((pId) => {
      map[pId].avg = (map[pId].sum / map[pId].count).toFixed(1);
    });
    return map;
  }, [ratings]);

  // Merge products list with any rated products that might not be in the product list
  const allProductOptions = useMemo(() => {
    const items = [...products];
    // If a rating exists for a product not in products, add a stub
    ratings.forEach((r) => {
      const pId = r.product;
      if (pId && !items.some((p) => String(p.id) === String(pId))) {
        items.push({
          id: pId,
          name: r.product_name || `Product #${pId}`,
          image: r.product_image || null,
        });
      }
    });
    return items;
  }, [products, ratings]);

  // Selected product object
  const selectedProduct = useMemo(() => {
    if (selectedProductId === 'all') return null;
    return allProductOptions.find((p) => String(p.id) === String(selectedProductId)) || null;
  }, [selectedProductId, allProductOptions]);

  // Ratings filtered by product
  const productFiltered = useMemo(() => {
    if (selectedProductId === 'all') return ratings;
    return ratings.filter((r) => String(r.product) === String(selectedProductId));
  }, [ratings, selectedProductId]);

  // Final filtered list with search and score filter
  const filtered = useMemo(() => {
    return productFiltered
      .filter((r) => {
        if (scoreFilter !== 'all' && String(r.score) !== String(scoreFilter)) {
          return false;
        }
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          r.product_name?.toLowerCase().includes(q) ||
          r.username?.toLowerCase().includes(q) ||
          String(r.score).includes(q)
        );
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'score') cmp = a.score - b.score;
        else if (sortField === 'product_name')
          cmp = (a.product_name || '').localeCompare(b.product_name || '');
        else if (sortField === 'username')
          cmp = (a.username || '').localeCompare(b.username || '');
        else cmp = new Date(a.created_at) - new Date(b.created_at);
        return sortDir === 'desc' ? -cmp : cmp;
      });
  }, [productFiltered, scoreFilter, search, sortField, sortDir]);

  // Pagination calculation
  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

  // Ensure current page does not exceed totalPages
  const activePage = Math.min(currentPage, totalPages);

  const paginatedRatings = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, activePage, pageSize]);

  // Page numbers with ellipsis
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (activePage <= 4) {
      return [1, 2, 3, 4, 5, '…', totalPages];
    }
    if (activePage >= totalPages - 3) {
      return [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '…', activePage - 1, activePage, activePage + 1, '…', totalPages];
  }, [totalPages, activePage]);

  // Summary stats for the currently selected product scope
  const totalCount = productFiltered.length;
  const avgRating = totalCount
    ? (productFiltered.reduce((sum, r) => sum + r.score, 0) / totalCount).toFixed(1)
    : '0.0';
  const fiveStars = productFiltered.filter((r) => r.score === 5).length;
  const fourStars = productFiltered.filter((r) => r.score === 4).length;
  const threeStars = productFiltered.filter((r) => r.score === 3).length;
  const twoStars = productFiltered.filter((r) => r.score === 2).length;
  const oneStars = productFiltered.filter((r) => r.score === 1).length;
  const denominator = totalCount || 1;
  const positiveRate = totalCount
    ? Math.round(((fiveStars + fourStars) / totalCount) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-plum-950" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full min-w-0">
      <AdminPageHeader
        title="Product Ratings & Reviews"
        subtitle="Analyze customer ratings, filter by product, and track customer satisfaction"
      />

      {/* Product Selection & Quick Filter Banner */}
      <div className="mt-6 rounded-xl bg-white p-4 sm:p-5 shadow-sm ring-1 ring-slate-200/80 w-full min-w-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <label htmlFor="product-select" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Choose Product to Inspect Ratings
            </label>
            <div className="relative">
              <select
                id="product-select"
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setScoreFilter('all');
                  setCurrentPage(1);
                }}
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3.5 pr-10 text-sm font-medium text-slate-900 shadow-xs focus:border-gold-600 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
              >
                <option value="all">
                  🌟 All Products ({ratings.length} total review{ratings.length === 1 ? '' : 's'})
                </option>
                {allProductOptions.map((p) => {
                  const stats = productRatingStats[String(p.id)];
                  const count = stats?.count || p.rating_count || 0;
                  const avg = stats?.avg || (p.average_rating ? Number(p.average_rating).toFixed(1) : null);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} {count > 0 ? `(${count} review${count === 1 ? '' : 's'} • ★ ${avg})` : '(No reviews yet)'}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </div>
          </div>

          {selectedProductId !== 'all' && (
            <div className="flex items-center gap-2 self-start md:self-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedProductId('all');
                  setScoreFilter('all');
                  setCurrentPage(1);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
                View All Products
              </button>
            </div>
          )}
        </div>

        {/* Selected Product Spotlight */}
        {selectedProduct && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              {selectedProduct.image ? (
                <img
                  src={resolveImgUrl(selectedProduct.image)}
                  alt={selectedProduct.name}
                  className="size-14 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-medium text-slate-400">
                  No img
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-base font-bold text-plum-950 truncate">{selectedProduct.name}</h2>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {selectedProduct.category?.name && (
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                      {selectedProduct.category.name}
                    </span>
                  )}
                  {selectedProduct.price && (
                    <span className="font-semibold text-slate-900">
                      ₹{Number(selectedProduct.price).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-3.5 py-2 ring-1 ring-slate-200/70 shrink-0">
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">Product Rating</p>
                <p className="text-lg font-bold text-plum-950">{avgRating} <span className="text-xs font-normal text-slate-400">/ 5</span></p>
              </div>
              <StarRating value={parseFloat(avgRating) || 0} size="md" />
            </div>
          </div>
        )}
      </div>

      {/* Stats cards for the chosen scope */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 w-full">
        <div className="rounded-xl bg-white p-4 sm:p-5 shadow-sm ring-1 ring-slate-200/80 w-full min-w-0">
          <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">
            {selectedProduct ? 'Product Ratings' : 'Total Ratings'}
          </p>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-plum-950 truncate">{totalCount}</p>
        </div>

        <div className="rounded-xl bg-white p-4 sm:p-5 shadow-sm ring-1 ring-slate-200/80 w-full min-w-0">
          <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">Average Rating</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-bold text-plum-950">{avgRating}</span>
            <StarRating value={parseFloat(avgRating) || 0} size="sm" />
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 sm:p-5 shadow-sm ring-1 ring-slate-200/80 w-full min-w-0">
          <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">5-Star Reviews</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-plum-950 truncate">
            {fiveStars}{' '}
            <span className="text-xs sm:text-sm font-normal text-slate-400">
              ({totalCount > 0 ? Math.round((fiveStars / denominator) * 100) : 0}%)
            </span>
          </p>
        </div>

        <div className="rounded-xl bg-white p-4 sm:p-5 shadow-sm ring-1 ring-slate-200/80 w-full min-w-0">
          <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">
            {selectedProduct ? 'Satisfaction Rate (4-5★)' : 'Products Rated'}
          </p>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-plum-950 truncate">
            {selectedProduct ? `${positiveRate}%` : new Set(ratings.map((r) => r.product)).size}
          </p>
        </div>
      </div>

      {/* Rating distribution breakdown */}
      <div className="mt-6 rounded-xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-slate-200/80 w-full min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">
            Rating Distribution {selectedProduct ? `(${selectedProduct.name})` : '(All Products)'}
          </h3>
          <span className="text-xs text-slate-400">{totalCount} total reviews</span>
        </div>
        <div className="mt-4 space-y-2.5">
          {[
            { score: 5, label: '5 ★', count: fiveStars },
            { score: 4, label: '4 ★', count: fourStars },
            { score: 3, label: '3 ★', count: threeStars },
            { score: 2, label: '2 ★', count: twoStars },
            { score: 1, label: '1 ★', count: oneStars },
          ].map((row) => {
            const pct = totalCount > 0 ? Math.round((row.count / denominator) * 100) : 0;
            const isFilterActive = scoreFilter === String(row.score);
            return (
              <button
                key={row.label}
                type="button"
                onClick={() => {
                  setScoreFilter(scoreFilter === String(row.score) ? 'all' : String(row.score));
                  setCurrentPage(1);
                }}
                className={`w-full flex items-center gap-3 rounded-lg p-1.5 transition text-left ${
                  isFilterActive ? 'bg-gold-50/70 ring-1 ring-gold-400' : 'hover:bg-slate-50'
                }`}
                title={`Filter by ${row.label}`}
              >
                <span className="w-10 text-xs sm:text-sm font-medium text-slate-700 shrink-0">
                  {row.label}
                </span>
                <div className="flex-1 overflow-hidden rounded-full bg-slate-100 h-2.5">
                  <div
                    className="h-full rounded-full bg-gold-500 transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-16 text-right text-xs text-slate-500 shrink-0 font-medium">
                  {row.count} ({pct}%)
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Sort Bar */}
      <div className="mt-6 flex flex-wrap items-center gap-3 w-full">
        <div className="relative flex-1 min-w-[220px]">
          <input
            type="text"
            maxLength={100}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by customer, product, or score..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-gold-600 focus:outline-none focus:ring-2 focus:ring-gold-500/50 shadow-xs"
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
        </div>

        {/* Score filter tabs */}
        <select
          value={scoreFilter}
          onChange={(e) => {
            setScoreFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-gold-600 focus:outline-none focus:ring-2 focus:ring-gold-500/50 shadow-xs"
        >
          <option value="all">All Star Scores</option>
          <option value="5">5 Stars only</option>
          <option value="4">4 Stars only</option>
          <option value="3">3 Stars only</option>
          <option value="2">2 Stars only</option>
          <option value="1">1 Star only</option>
        </select>

        <select
          value={sortField}
          onChange={(e) => {
            setSortField(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-gold-600 focus:outline-none focus:ring-2 focus:ring-gold-500/50 shadow-xs"
        >
          <option value="created_at">Sort by Date</option>
          <option value="score">Sort by Score</option>
          <option value="product_name">Sort by Product</option>
          <option value="username">Sort by Customer</option>
        </select>

        <button
          type="button"
          onClick={() => {
            setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
            setCurrentPage(1);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 shadow-xs"
        >
          {sortDir === 'desc' ? '↓ Descending' : '↑ Ascending'}
        </button>

        {(search || scoreFilter !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setScoreFilter('all');
              setCurrentPage(1);
            }}
            className="text-xs font-medium text-gold-700 hover:text-gold-800 underline ml-auto"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Ratings list cards */}
      <div className="mt-6 space-y-3 w-full">
        {totalFiltered === 0 && (
          <div className="rounded-xl bg-white p-8 sm:p-12 text-center text-slate-400 shadow-sm ring-1 ring-slate-200/80">
            {totalCount === 0 ? (
              <div>
                <p className="text-base font-semibold text-slate-700">
                  {selectedProduct
                    ? `No ratings yet for "${selectedProduct.name}"`
                    : 'No ratings found'}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {selectedProduct
                    ? 'Customer reviews for this product will appear here as orders are completed.'
                    : 'Customer ratings for your store products will be recorded here.'}
                </p>
                {selectedProductId !== 'all' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProductId('all');
                      setCurrentPage(1);
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-plum-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-plum-900"
                  >
                    View All Product Ratings
                  </button>
                )}
              </div>
            ) : (
              <div>
                <p className="text-base font-semibold text-slate-700">No ratings match your filter</p>
                <p className="mt-1 text-xs text-slate-400">Try adjusting your search or star score filter.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setScoreFilter('all');
                    setCurrentPage(1);
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3.5 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}

        {paginatedRatings.map((r) => (
          <div
            key={r.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-xl bg-white p-4 sm:p-5 shadow-sm ring-1 ring-slate-200/80 transition hover:shadow-md w-full"
          >
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-plum-950 text-sm font-bold text-white shadow-xs">
                {r.username?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-900">{r.username}</span>
                  <span className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-600/20">
                    Verified Buyer
                  </span>
                  <span className="text-xs text-slate-400">• rated</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (r.product) {
                        setSelectedProductId(String(r.product));
                        setScoreFilter('all');
                        setCurrentPage(1);
                      }
                    }}
                    className="font-medium text-plum-950 hover:text-gold-600 transition truncate max-w-[200px] sm:max-w-xs text-left"
                    title={`Filter by ${r.product_name}`}
                  >
                    {r.product_name}
                  </button>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <StarRating value={r.score} size="sm" />
                  <span className="rounded-full bg-gold-500/10 px-2 py-0.5 text-xs font-bold text-gold-700">
                    {r.score} / 5
                  </span>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-400 pl-13 sm:pl-0 shrink-0">
              <div className="font-medium text-slate-600">
                {new Date(r.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
              <div className="text-[11px] text-slate-400">
                {new Date(r.created_at).toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalFiltered > 0 && (
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80 w-full">
          {/* Showing Range & Page Size Selector */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <div>
              Showing{' '}
              <span className="font-semibold text-slate-900">
                {(activePage - 1) * pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-900">
                {Math.min(activePage * pageSize, totalFiltered)}
              </span>{' '}
              of <span className="font-semibold text-slate-900">{totalFiltered}</span> ratings
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 font-medium">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-gold-500 shadow-xs"
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
            <div className="flex items-center gap-1 self-center sm:self-auto">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={activePage === 1}
                className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors shadow-xs"
                title="Previous Page"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>

              {pageNumbers.map((p, idx) =>
                p === '…' ? (
                  <span key={`dots-${idx}`} className="px-1 text-xs text-slate-400">
                    …
                  </span>
                ) : (
                  <button
                    key={`page-${p}`}
                    type="button"
                    onClick={() => setCurrentPage(Number(p))}
                    className={`inline-flex size-8 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                      p === activePage
                        ? 'bg-plum-950 text-white shadow-xs font-semibold'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={activePage === totalPages}
                className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors shadow-xs"
                title="Next Page"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}