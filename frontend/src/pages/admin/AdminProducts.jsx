import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { adminProductApi, adminCategoryApi } from '../../utils/api';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Resolve a product image URL (absolute or media-relative) to a full URL.
function resolveImgUrl(image) {
  if (!image) return null;
  return image.startsWith('http') ? image : `${API_BASE.replace('/api', '')}${image}`;
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  // Gallery images: { url, file?, existing } — existing ones come from the
  // server (not re-sent), newly picked ones carry a File to upload.
  const [gallery, setGallery] = useState([]);
  const galleryRef = useRef(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    location: '',
    shipping_days: '5',
    dispatch_days: '5',
    out_for_delivery_days: '5',
    image: null,
  });
  const fileRef = useRef(null);

  const fetchProducts = () => {
    adminProductApi
      .list()
      .then((data) => setProducts(data))
      .catch((err) => setError(err.data?.detail || 'Failed to load products'))
      .finally(() => setLoading(false));
  };

  const fetchCategories = () => {
    adminCategoryApi.list().then(setCategories).catch(() => {});
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const resetGallery = () => {
    gallery.forEach((g) => {
      if (!g.existing) URL.revokeObjectURL(g.url);
    });
    setGallery([]);
    if (galleryRef.current) galleryRef.current.value = '';
  };

  const openCreate = () => {
    setEditProduct(null);
    setForm({
      name: '',
      description: '',
      price: '',
      category: categories[0]?.id?.toString() || '',
      location: '',
      shipping_days: '5',
      dispatch_days: '5',
      out_for_delivery_days: '5',
      image: null,
    });
    setImagePreview(null);
    resetGallery();
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category: product.category?.id?.toString() || product.category?.toString() || '',
      location: product.location || '',
      shipping_days: String(product.shipping_days ?? 5),
      dispatch_days: String(product.dispatch_days ?? 5),
      out_for_delivery_days: String(product.out_for_delivery_days ?? 5),
      image: null,
    });
    setImagePreview(product.image || null);
    resetGallery();
    setGallery((product.images || []).map((url) => ({ url: resolveImgUrl(url), existing: true })));
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    try {
      const newImages = gallery.filter((g) => !g.existing).map((g) => g.file);
      const data = {
        name: form.name,
        description: form.description,
        price: form.price,
        category: form.category,
        location: form.location,
        shipping_days: form.shipping_days,
        dispatch_days: form.dispatch_days,
        out_for_delivery_days: form.out_for_delivery_days,
        ...(form.image ? { image: form.image } : {}),
        ...(newImages.length ? { images: newImages } : {}),
      };

      if (editProduct) {
        await adminProductApi.update(editProduct.id, data);
      } else {
        await adminProductApi.create(data);
      }
      setModalOpen(false);
      resetGallery();
      fetchProducts();
    } catch (err) {
      const data = err.data || {};
      const msg = Object.entries(data)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
        .join(' | ');
      setFormError(msg || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await adminProductApi.delete(deleteId);
      fetchProducts();
    } catch {
      /* already removed or error */
    }
    setDeleteId(null);
  };

  const getCategoryName = (product) => {
    if (typeof product.category === 'object' && product.category?.name) return product.category.name;
    const cat = categories.find((c) => c.id === Number(product.category));
    return cat?.name || '—';
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-plum-950" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <AdminPageHeader
        title="Products"
        subtitle="Manage your product catalog"
        action={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-plum-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-plum-900 transition-colors"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Product
          </button>
        }
      />

      {error && <p className="mt-4 text-red-600">{error}</p>}

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/50">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-500">Image</th>
              <th className="px-4 py-3 font-medium text-slate-500">Name</th>
              <th className="px-4 py-3 font-medium text-slate-500">Category</th>
              <th className="px-4 py-3 font-medium text-slate-500">Price</th>
              <th className="px-4 py-3 font-medium text-slate-500">Delivery days</th>
              <th className="px-4 py-3 font-medium text-slate-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3">
                  {product.image ? (
                    <img
                      src={product.image.startsWith('http') ? product.image : `${API_BASE.replace('/api', '')}${product.image}`}
                      alt={product.name}
                      className="size-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                      <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 0 0 1.5-1.5V5.25a1.5 1.5 0 0 0-1.5-1.5H3.75a1.5 1.5 0 0 0-1.5 1.5v14.25a1.5 1.5 0 0 0 1.5 1.5Z" />
                      </svg>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-plum-950">{product.name}</td>
                <td className="px-4 py-3 text-slate-600">{getCategoryName(product)}</td>
                <td className="px-4 py-3 text-slate-700">₹{Number(product.price).toLocaleString()}</td>
                <td className="px-4 py-3 text-slate-600">
                  {(Number(product.shipping_days) || 0) +
                    (Number(product.dispatch_days) || 0) +
                    (Number(product.out_for_delivery_days) || 0)}
                  <span className="block text-xs text-slate-400">
                    {Number(product.shipping_days) || 0}S · {Number(product.dispatch_days) || 0}D · {Number(product.out_for_delivery_days) || 0}O
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openEdit(product)}
                    className="mr-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteId(product.id)}
                    className="rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  No products yet. Click "Add Product" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <DialogTitle className="text-lg font-semibold text-plum-950">
              {editProduct ? 'Edit Product' : 'Add Product'}
            </DialogTitle>

            {formError && (
              <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{formError}</div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-600"
                  placeholder="Product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <select
                  required
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-600"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-600"
                  placeholder="Product description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-600"
                  placeholder="e.g. Ahmedabad, India"
                />
                <p className="mt-1 text-xs text-slate-400">Shown to customers on the product detail page.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Price *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-600"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Shipping timeline (days)</label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Shipping</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.shipping_days}
                      onChange={(e) => setForm({ ...form, shipping_days: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-600"
                      placeholder="5"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Dispatch</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.dispatch_days}
                      onChange={(e) => setForm({ ...form, dispatch_days: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-600"
                      placeholder="5"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Out for delivery</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.out_for_delivery_days}
                      onChange={(e) => setForm({ ...form, out_for_delivery_days: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-600"
                      placeholder="5"
                    />
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Per-stage durations used to compute the customer-facing delivery timeline when an order is placed (e.g. 5 + 5 + 5 = 15-day delivery).
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Cover image {!editProduct && '*'}
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  required={!editProduct && !editProduct?.image}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    setForm({ ...form, image: file || null });
                    if (file) {
                      setImagePreview(URL.createObjectURL(file));
                    } else {
                      setImagePreview(editProduct?.image ? resolveImgUrl(editProduct.image) : null);
                    }
                  }}
                  className="w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-plum-950 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-plum-900 file:transition-colors"
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mt-2 h-24 w-24 rounded-lg object-cover ring-1 ring-slate-200"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Additional images</label>
                <input
                  ref={galleryRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setGallery((prev) => [
                      ...prev,
                      ...files.map((f) => ({ url: URL.createObjectURL(f), file: f, existing: false })),
                    ]);
                  }}
                  className="w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-plum-950 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-plum-900 file:transition-colors"
                />
                <p className="mt-1 text-xs text-slate-400">Optional. Shown in the product image gallery.</p>
                {gallery.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {gallery.map((g, idx) => (
                      <div key={idx} className="group relative">
                        <img
                          src={g.url}
                          alt="Gallery"
                          className="h-20 w-20 rounded-lg object-cover ring-1 ring-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!g.existing) URL.revokeObjectURL(g.url);
                            setGallery((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-plum-950 text-xs text-white shadow ring-2 ring-white hover:bg-plum-900"
                          aria-label="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  {saving ? 'Saving...' : editProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
      />
    </div>
  );
}