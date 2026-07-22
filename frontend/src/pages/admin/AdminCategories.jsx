import { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { adminCategoryApi } from '../../utils/api';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteInfo, setDeleteInfo] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

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
    adminCategoryApi
      .list()
      .then(setCategories)
      .catch((err) => setError(err.data?.detail || 'Failed to load categories'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreate = () => {
    setEditCategory(null);
    setForm({ name: '', slug: '' });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditCategory(cat);
    setForm({ name: cat.name, slug: cat.slug });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    try {
      if (editCategory) {
        await adminCategoryApi.update(editCategory.id, form);
      } else {
        await adminCategoryApi.create(form);
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      const data = err.data || {};
      const msg = Object.entries(data)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
        .join(' | ');
      setFormError(msg || 'Failed to save category');
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
        title="Categories"
        subtitle="Manage product categories"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddDefaults}
              disabled={seeding}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              title="Add a starter set of common categories"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 12h16.5m-16.5 5.25h16.5M3.75 6.75h16.5"
                />
              </svg>
              {seeding ? 'Adding...' : 'Add Default Categories'}
            </button>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-plum-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-plum-900 transition-colors"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Category
            </button>
          </div>
        }
      />

      {error && <p className="mt-4 text-red-600">{error}</p>}

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/50">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-500">Name</th>
              <th className="px-4 py-3 font-medium text-slate-500">Slug</th>
              <th className="px-4 py-3 font-medium text-slate-500">Products</th>
              <th className="px-4 py-3 font-medium text-slate-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-plum-950">{cat.name}</td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{cat.slug}</td>
                <td className="px-4 py-3 text-slate-700">{cat.product_count ?? 0}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openEdit(cat)}
                    className="mr-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => confirmDelete(cat)}
                    className="rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                  No categories yet. Click "Add Category" to create one.
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
          <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <DialogTitle className="text-lg font-semibold text-plum-950">
              {editCategory ? 'Edit Category' : 'Add Category'}
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
                  placeholder="Category name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-600"
                  placeholder="Auto-generated from name if left empty"
                />
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