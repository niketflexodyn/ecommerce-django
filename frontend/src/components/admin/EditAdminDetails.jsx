import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { profileApi } from '../../utils/api';
import AdminPageHeader from '../../components/admin/AdminPageHeader';

const NAME_RE = /^[a-zA-Z\s'-]+$/;
const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

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
    const { name, value } = e.target;
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 13);
      setForm({ ...form, phone: digitsOnly });
      setError('');
      setSuccess(false);
      return;
    }
    setForm({ ...form, [name]: value });
    setError('');
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.first_name && form.first_name.trim()) {
      if (form.first_name.trim().length < 2 || form.first_name.trim().length > 50) {
        setError('First name must be between 2 and 50 characters.');
        return;
      }
      if (!NAME_RE.test(form.first_name.trim())) {
        setError('First name can only contain letters, spaces, and hyphens.');
        return;
      }
    }

    if (form.last_name && form.last_name.trim()) {
      if (form.last_name.trim().length < 2 || form.last_name.trim().length > 50) {
        setError('Last name must be between 2 and 50 characters.');
        return;
      }
      if (!NAME_RE.test(form.last_name.trim())) {
        setError('Last name can only contain letters, spaces, and hyphens.');
        return;
      }
    }

    if (!form.email || !form.email.trim()) {
      setError('Email is required.');
      return;
    }
    const emailVal = form.email.trim();
    if (emailVal.length > 100) {
      setError('Email must not exceed 100 characters.');
      return;
    }
    if (!emailVal.includes('@')) {
      setError("Email must include '@' (e.g. name@example.com).");
      return;
    }
    const emailParts = emailVal.split('@');
    if (!emailParts[0] || emailParts.length > 2 || !emailParts[1] || !emailParts[1].includes('.')) {
      setError('Email must include a domain with a dot (e.g. .com).');
      return;
    }
    if (!EMAIL_RE.test(emailVal)) {
      setError('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    if (form.phone) {
      const digits = form.phone.replace(/\D/g, '');
      if (digits.length > 0 && (digits.length < 10 || digits.length > 13)) {
        setError('Phone number must be between 10 and 13 digits.');
        return;
      }
    }

    if (form.address && form.address.trim()) {
      if (form.address.trim().length < 5 || form.address.trim().length > 500) {
        setError('Address must be between 5 and 500 characters.');
        return;
      }
      if (!/[a-zA-Z0-9]/.test(form.address.trim())) {
        setError('Please enter a valid street address.');
        return;
      }
    }

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
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-600';

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full min-w-0">
      <div className="max-w-2xl mx-auto w-full">
        <AdminPageHeader
          title="Edit Details"
          subtitle="Update your admin profile information"
        />

        <div className="mt-6 rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80 w-full min-w-0">
          {/* Read-only account info */}
        <div className="border-b border-slate-100 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-slate-500">
              Username:{' '}
              <span className="font-medium text-slate-900">{user?.username}</span>
            </span>
            <span className="rounded-full bg-gold-500/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-700">
              {user?.role}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Username and role can't be changed here.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4 sm:px-6 sm:py-6">
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
                maxLength={50}
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
                maxLength={50}
                value={form.last_name}
                onChange={handleChange}
                className={inputClass}
                placeholder="Last name"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              maxLength={100}
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
              type="tel"
              name="phone"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={13}
              value={form.phone}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (
                  !/[0-9]/.test(e.key) &&
                  !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) &&
                  !e.ctrlKey &&
                  !e.metaKey
                ) {
                  e.preventDefault();
                }
              }}
              className={inputClass}
              placeholder="Phone number (max 13 digits)"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Address</label>
            <textarea
              name="address"
              maxLength={500}
              rows={3}
              value={form.address}
              onChange={handleChange}
              className={inputClass}
              placeholder="Delivery address (max 500 characters)"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-plum-950 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-plum-900 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
);
}