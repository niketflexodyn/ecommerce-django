import { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { FiEdit2, FiTrash2, FiSearch, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { adminCategoryApi } from '../../utils/api';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteInfo, setDeleteInfo] = useState(null);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [form, setForm] = useState({ name: '', slug: '' });

  // A sensible starter set so admins can add products without first creating
  // categories one by one. Created via the normal API, so they're owned by the
  // logged-in admin and show up in the product dropdown.
  const DEFAULT_CATEGORIES = [
    'Fashion',
    'Electronics',
    'Home & Kitchen',
    'Beauty & Health',
    'Sports & Outdoors',
    'Books',
  ];

  const fetchCategories = () => {
    setLoading(true);
    const params = {
      page,
      page_size: pageSize,
    };
    if (searchTerm.trim()) {
      params.search = searchTerm.trim();
    }

    adminCategoryApi
      .list(params)
      .then((data) => {
        if (data && Array.isArray(data.results)) {
          setCategories(data.results);
          setTotalCount(data.count ?? data.results.length);
        } else if (Array.isArray(data)) {
          setCategories(data);
          setTotalCount(data.length);
        } else {
          setCategories([]);
          setTotalCount(0);
        }
      })
      .catch((err) => setError(err.data?.detail || 'Failed to load categories'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategories();
    }, 250);
    return () => clearTimeout(timer);
  }, [page, pageSize, searchTerm]);

  const openCreate = () => {
    setEditCategory(null);
    setForm({ name: '', slug: '' });
    setFormError('');
    setFieldErrors({});
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditCategory(cat);
    setForm({ name: cat.name, slug: cat.slug });
    setFormError('');
    setFieldErrors({});
    setModalOpen(true);
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.name || !form.name.trim()) {
      nextErrors.name = 'Category name is required.';
    } else if (form.name.trim().length < 2) {
      nextErrors.name = 'Category name must be at least 2 characters.';
    } else if (form.name.trim().length > 100) {
      nextErrors.name = 'Category name must not exceed 100 characters.';
    }

    if (form.slug && form.slug.trim()) {
      if (form.slug.trim().length > 100) {
        nextErrors.slug = 'Slug must not exceed 100 characters.';
      } else if (!/^[a-z0-9-_]+$/i.test(form.slug.trim())) {
        nextErrors.slug = 'Slug may only contain letters, numbers, underscores, or hyphens.';
      }
    }

    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug ? form.slug.trim() : undefined,
      };

      if (editCategory) {
        await adminCategoryApi.update(editCategory.id, payload);
      } else {
        await adminCategoryApi.create(payload);
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      const data = err.data || {};
      if (typeof data === 'object' && !Array.isArray(data)) {
        const backendFieldErrors = {};
        Object.entries(data).forEach(([key, val]) => {
          if (Array.isArray(val)) {
            backendFieldErrors[key] = val.join(' ');
          } else if (typeof val === 'string') {
            backendFieldErrors[key] = val;
          }
        });
        if (Object.keys(backendFieldErrors).length > 0) {
          setFieldErrors((prev) => ({ ...prev, ...backendFieldErrors }));
          if (backendFieldErrors.detail || backendFieldErrors.non_field_errors) {
            setFormError(backendFieldErrors.detail || backendFieldErrors.non_field_errors);
          }
          return;
        }
      }
      setFormError(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await adminCategoryApi.delete(deleteId);
      fetchCategories();
    } catch {
      /* already removed */
    }
    setDeleteId(null);
    setDeleteInfo(null);
  };

  const confirmDelete = (cat) => {
    setDeleteId(cat.id);
    setDeleteInfo(cat);
  };

  const handleAddDefaults = async () => {
    setSeeding(true);
    setError('');
    const existing = new Set(categories.map((c) => c.name.toLowerCase()));
    const toCreate = DEFAULT_CATEGORIES.filter((n) => !existing.has(n.toLowerCase()));

    if (toCreate.length === 0) {
      setError('All default categories already exist.');
      setSeeding(false);
      return;
    }

    try {
      await Promise.all(toCreate.map((name) => adminCategoryApi.create({ name })));
      fetchCategories();
    } catch (err) {
      setError(err.data?.detail || 'Some default categories could not be created.');
      fetchCategories();
    } finally {
      setSeeding(false);
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

  if (loading && categories.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-plum-950" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full min-w-0">
      <AdminPageHeader
        title="Categories"
        subtitle="Manage product categories"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAddDefaults}
              disabled={seeding}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              title="Add a starter set of common categories"
            >
              <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 12h16.5m-16.5 5.25h16.5M3.75 6.75h16.5"
                />
              </svg>
              <span>{seeding ? 'Adding...' : 'Add Default Categories'}</span>
            </button>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-plum-950 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium text-white hover:bg-plum-900 transition-colors"
            >
              <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Add Category</span>
            </button>
          </div>
        }
      />

      {error && <p className="mt-4 text-red-600">{error}</p>}

      {/* Search Bar */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
        <div className="relative flex-1 max-w-md w-full">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search categories by name or slug..."
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
          Showing <span className="font-semibold text-slate-800">{categories.length}</span> of{' '}
          <span className="font-semibold text-slate-800">{totalCount}</span> categories
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80 w-full relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-plum-950" />
          </div>
        )}
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/50">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-500 whitespace-nowrap">Name</th>
                <th className="px-4 py-3 font-medium text-slate-500 whitespace-nowrap">Slug</th>
                <th className="px-4 py-3 font-medium text-slate-500 whitespace-nowrap">Products</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-plum-950 whitespace-nowrap">{cat.name}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs whitespace-nowrap">{cat.slug}</td>
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{cat.product_count ?? 0}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEdit(cat)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                        title="Edit Category"
                      >
                        <FiEdit2 className="size-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => confirmDelete(cat)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                        title="Delete Category"
                      >
                        <FiTrash2 className="size-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && !loading && searchTerm && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                    <FiSearch className="mx-auto size-8 text-slate-300 mb-2" />
                    <p className="font-medium text-slate-800">No categories found matching "{searchTerm}"</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Try checking for typos or clear your search query.
                    </p>
                    <button
                      onClick={() => setSearchTerm('')}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      Clear search
                    </button>
                  </td>
                </tr>
              )}
              {categories.length === 0 && !loading && !searchTerm && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                    No categories yet. Click "Add Category" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
              of <span className="font-semibold text-slate-900">{totalCount}</span> categories
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

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <DialogTitle className="text-lg font-semibold text-plum-950">
              {editCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>

            {formError && (
              <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{formError}</div>
            )}

            <form noValidate onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    fieldErrors.name
                      ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500'
                      : 'border-slate-300 focus:ring-gold-500/50 focus:border-gold-600'
                  }`}
                  placeholder="Category name (max 100 characters)"
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
                <input
                  type="text"
                  maxLength={100}
                  value={form.slug}
                  onChange={(e) => {
                    setForm({ ...form, slug: e.target.value });
                    if (fieldErrors.slug) setFieldErrors((prev) => ({ ...prev, slug: '' }));
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    fieldErrors.slug
                      ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500'
                      : 'border-slate-300 focus:ring-gold-500/50 focus:border-gold-600'
                  }`}
                  placeholder="Auto-generated from name if left empty"
                />
                {fieldErrors.slug && (
                  <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.slug}</p>
                )}
                <p className="mt-1 text-xs text-slate-400">Leave empty to auto-generate from the name.</p>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-plum-950 px-4 py-2 text-sm font-medium text-white hover:bg-plum-900 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => {
          setDeleteId(null);
          setDeleteInfo(null);
        }}
        onConfirm={handleDelete}
        title="Delete Category"
        message={
          deleteInfo?.product_count > 0
            ? `This category has ${deleteInfo.product_count} product(s). Deleting it will also remove those products. Are you sure?`
            : 'Are you sure you want to delete this category? This action cannot be undone.'
        }
      />
    </div>
  );
}