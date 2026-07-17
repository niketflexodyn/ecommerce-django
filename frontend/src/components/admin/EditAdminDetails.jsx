import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { profileApi } from '../../utils/api';
import AdminPageHeader from '../../components/admin/AdminPageHeader';

export default function EditAdminDetails() {
  const { user, refreshUser } = useAuth();

  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await profileApi.update(form);
      await refreshUser();
      setSuccess(true);
    } catch (err) {
      const data = err.data || {};
      const msg = Object.entries(data)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
        .join(' | ');
      setError(msg || 'Failed to update details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8C766]/50 focus:border-[#C9A227]';

  return (
    <div className="p-8">
      <AdminPageHeader
        title="Edit Details"
        subtitle="Update your admin profile information"
      />

      <div className="mt-6 max-w-2xl rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80">
        {/* Read-only account info */}
        <div className="border-b border-slate-100 px-6 py-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-slate-500">
              Username:{' '}
              <span className="font-medium text-slate-900">{user?.username}</span>
            </span>
            <span className="rounded-full bg-[#E8C766]/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8a6d1f]">
              {user?.role}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Username and role can't be changed here.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}
          {success && (
            <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
              ✓ Details updated successfully.
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">First name</label>
              <input
                type="text"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                className={inputClass}
                placeholder="First name"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Last name</label>
              <input
                type="text"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                className={inputClass}
                placeholder="Last name"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className={inputClass}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className={inputClass}
              placeholder="Phone number"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Address</label>
            <textarea
              name="address"
              rows={3}
              value={form.address}
              onChange={handleChange}
              className={inputClass}
              placeholder="Delivery address"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#2A1A2C] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3D2136] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}