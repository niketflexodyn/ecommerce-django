import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { profileApi } from '../utils/api';

const NAME_RE = /^[a-zA-Z\s'-]+$/;
const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    location: user?.location || '',
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

    if (form.location && form.location.trim().length > 200) {
      setError('Location must not exceed 200 characters.');
      return;
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
      // Prefer SimpleJWT's `detail` (e.g. "Given token not valid…") over the
      // raw `messages` array, which would otherwise stringify to [object Object].
      const msg =
        data.detail ||
        Object.entries(data)
          .filter(([k]) => k !== 'messages' && k !== 'code')
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ');
      setError(msg || 'Failed to update details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="page-container font-body py-12">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="font-display text-3xl font-bold text-slate-900">Please Sign In</h1>
          <p className="mt-3 text-slate-500">You need to be logged in to view your profile.</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 inline-block rounded-xl bg-gold-500 px-6 py-3 font-semibold text-plum-950 transition hover:opacity-90"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-600';

  return (
    <div className="page-container font-body mx-auto justify-center py-8 sm:py-12">
      <nav className="mb-6 text-sm text-slate-500">
        <Link to="/" className="transition hover:text-gold-500">Home</Link>
        <span className="mx-2 text-slate-300">/</span>
        <span className="text-slate-900">My Profile</span>
      </nav>

      <h1 className="font-display text-3xl font-bold text-plum-950">My Profile</h1>
      <p className="mt-1 text-sm text-slate-500">Update your personal details and delivery address.</p>

      <div className="mt-6 max-w-2xl overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80">
        {/* Read-only account info */}
        <div className="border-b border-slate-100 px-6 py-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-slate-500">
              Username: <span className="font-medium text-slate-900">{user.username}</span>
            </span>
            <span className="rounded-full bg-gold-500/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-700">
              {user.role}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Username and role can't be changed here.</p>
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

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Location</label>
            <input
              type="text"
              name="location"
              maxLength={200}
              value={form.location}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. London, UK"
            />
            <p className="mt-1 text-xs text-slate-400">Shown to sellers with your orders.</p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-xl bg-plum-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}