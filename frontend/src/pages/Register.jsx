import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";


const ROLE_OPTIONS = [
  { value: "customer", label: "Customer", desc: "Shop & place orders" },
  { value: "admin", label: "Admin", desc: "Manage products & orders" },
];

const NAME_RE = /^[a-zA-Z\s'-]+$/;
// Basic shape check (compatible across all browsers, no lookbehind needed):
// local@domain.tld where the TLD is at least two letters.
const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// Stricter per-part rules enforced in validateField() below.
const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirm_password: "",
    role: "customer",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateField = (name, value) => {
    switch (name) {
      case "first_name": {
        const val = value.trim();
        if (!val) return "First name is required.";
        if (val.length < 2 || val.length > 50) return "First name must be between 2 and 50 characters.";
        if (!NAME_RE.test(val)) return "First name can only contain letters, spaces, and hyphens.";
        return "";
      }
      case "last_name": {
        const val = value.trim();
        if (!val) return "Last name is required.";
        if (val.length < 2 || val.length > 50) return "Last name must be between 2 and 50 characters.";
        if (!NAME_RE.test(val)) return "Last name can only contain letters, spaces, and hyphens.";
        return "";
      }
      case "username": {
        const val = value.trim();
        if (!val) return "Username is required.";
        if (val.length < 3 || val.length > 30) return "Username must be between 3 and 30 characters.";
        if (!USERNAME_RE.test(val)) return "Username can only contain letters, numbers, and underscores.";
        return "";
      }
      case "email": {
        const val = value.trim();
        if (!val) return "Email is required.";
        if (val.length > 50) return "Email must not exceed 50 characters.";
        if (val.length < 6) return "Enter a valid email address (e.g. name@example.com).";
        if (!val.includes("@")) return "Email must include '@' (e.g. name@example.com).";

        const parts = val.split("@");
        if (parts.length > 2) return "Email cannot contain multiple '@' symbols.";
        const local = parts[0];
        const domain = parts[1];

        if (!local) return "Email must have a prefix before '@' (e.g. name@example.com).";
        if (local.length > 64) return "Email prefix is too long (max 64 characters).";
        if (/[._%+-]{2,}/.test(local)) return "Email prefix cannot contain consecutive special characters.";
        if (local.startsWith(".") || local.endsWith(".")) return "Email prefix cannot start or end with a dot.";

        if (!domain) return "Email must have a domain after '@' (e.g. name@example.com).";
        if (!domain.includes(".")) return "Email must include a domain with a dot (e.g. .com).";
        if (domain.startsWith("-") || domain.endsWith("-")) return "Email domain cannot start or end with a hyphen.";
        if (domain.startsWith(".") || domain.endsWith(".")) return "Email domain cannot start or end with a dot.";
        if (/\.\./.test(domain)) return "Email domain cannot contain consecutive dots.";

        const domainParts = domain.split(".");
        for (const label of domainParts) {
          if (!label) return "Email domain contains an empty label.";
          if (label.startsWith("-") || label.endsWith("-")) return "Email domain labels cannot start or end with a hyphen.";
          if (!/^[a-zA-Z0-9-]+$/.test(label)) return "Email domain can only contain letters, digits, and hyphens.";
        }

        const tld = domainParts[domainParts.length - 1];
        if (!tld || tld.length < 2) return "Email domain must end with a valid extension (e.g. .com).";
        if (!/^[a-zA-Z]+$/.test(tld)) return "Email extension (e.g. .com) can only contain letters.";

        if (!EMAIL_RE.test(val)) return "Enter a valid email address (e.g. name@example.com).";
        return "";
      }
      case "phone": {
        const digits = value.replace(/\D/g, "");
        if (!value.trim()) return "Phone number is required.";
        if (digits.length < 10 || digits.length > 13) return "Enter a valid phone number (10–13 digits).";
        return "";
      }
      case "address": {
        const val = value.trim();
        if (!val) return "Address is required.";
        if (val.length < 5 || val.length > 500) return "Address must be between 5 and 500 characters.";
        if (!/[a-zA-Z0-9]/.test(val)) return "Please enter a valid street address.";
        return "";
      }
      case "password": {
        if (!value) return "Password is required.";
        if (value.length < 8 || value.length > 128) return "Password must be between 8 and 128 characters.";
        return "";
      }
      case "confirm_password": {
        if (!value) return "Please confirm your password.";
        if (formData.password && value !== formData.password) return "Passwords do not match.";
        return "";
      }
      default:
        return "";
    }
  };

  const validate = () => {
    const next = {};
    Object.keys(formData).forEach((key) => {
      if (key === "role") return;
      const fieldError = validateField(key, formData[key]);
      if (fieldError) {
        next[key] = fieldError;
      }
    });
    return next;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const fieldError = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: fieldError,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      // Keep digits only, max 13 digits
      const digitsOnly = value.replace(/\D/g, "").slice(0, 13);
      setFormData({
        ...formData,
        phone: digitsOnly,
      });
      if (errors.phone) setErrors({ ...errors, phone: "" });
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    setLoading(true);

    try {
      await register(formData);
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      if (err.data && typeof err.data === "object" && !Array.isArray(err.data)) {
        const backendFieldErrors = {};
        Object.entries(err.data).forEach(([key, val]) => {
          if (Array.isArray(val)) {
            backendFieldErrors[key] = val.join(" ");
          } else if (typeof val === "string") {
            backendFieldErrors[key] = val;
          }
        });
        if (Object.keys(backendFieldErrors).length > 0) {
          setErrors((prev) => ({ ...prev, ...backendFieldErrors }));
          if (backendFieldErrors.detail) {
            setError(backendFieldErrors.detail);
          }
          return;
        }
      }
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container py-12">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-white shadow-xl font-body">
        <div className="grid lg:grid-cols-2">

          {/* Left */}
          <div
            className="bg-linear-to-br from-plum-950 via-plum-900 to-plum-800 p-10 text-white"
          >
            <p className="text-sm uppercase tracking-[4px] text-gold-500">
              Luxora
            </p>

            <h1 className="mt-5 text-4xl font-bold font-display">
              Create Your Account
            </h1>

            <p className="mt-4 text-white/70">
              Join Luxora today and enjoy secure shopping, faster checkout,
              order tracking, and exclusive offers.
            </p>

            <div className="mt-10 space-y-4 text-white/80">
              <p>✓ Secure Registration</p>
              <p>✓ Save Delivery Addresses</p>
              <p>✓ Track Your Orders</p>
              <p>✓ Exclusive Member Discounts</p>
            </div>
          </div>

          {/* Right */}
          <div className="p-10">

            <h2 className="text-3xl font-bold text-slate-800 font-display">
              Register
            </h2>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form
              noValidate
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >
              {/* Role selector */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  I want to register as <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {ROLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: opt.value })}
                      className={`rounded-xl border-2 p-3 text-left transition ${
                        formData.role === opt.value
                          ? "border-gold-500 bg-gold-500/10 ring-1 ring-gold-500"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <span className={`block text-sm font-semibold ${formData.role === opt.value ? "text-plum-950" : "text-slate-900"}`}>
                        {opt.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {opt.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    maxLength={50}
                    className={`input-field ${errors.first_name ? 'border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="John"
                    value={formData.first_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-xs font-medium text-red-600">{errors.first_name}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    maxLength={50}
                    className={`input-field ${errors.last_name ? 'border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Doe"
                    value={formData.last_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-xs font-medium text-red-600">{errors.last_name}</p>
                  )}
                </div>

              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  maxLength={30}
                  className={`input-field ${errors.username ? 'border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors.username && (
                  <p className="mt-1 text-xs font-medium text-red-600">{errors.username}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="email"
                  maxLength={50}
                  className={`input-field ${errors.email ? 'border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors.email && (
                  <p className="mt-1 text-xs font-medium text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  inputMode="numeric"
                  maxLength={13}
                  className={`input-field ${errors.phone ? 'border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="e.g. 9876543210 (10–13 digits)"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
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
                />
                {errors.phone && (
                  <p className="mt-1 text-xs font-medium text-red-600">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="3"
                  name="address"
                  maxLength={500}
                  className={`input-field resize-none ${errors.address ? 'border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Enter your full address"
                  value={formData.address}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors.address && (
                  <p className="mt-1 text-xs font-medium text-red-600">{errors.address}</p>
                )}
              </div>

              <div className="grid gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Password <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">

                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      maxLength={128}
                      className={`input-field ${errors.password ? 'border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>

                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs font-medium text-red-600">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">

                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirm_password"
                      maxLength={128}
                      className={`input-field ${errors.confirm_password ? 'border-red-500 ring-1 ring-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      placeholder="••••••••"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500"
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>

                  </div>
                  {errors.confirm_password && (
                    <p className="mt-1 text-xs font-medium text-red-600">{errors.confirm_password}</p>
                  )}
                </div>

              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gold-500 py-3 font-semibold text-plum-950 transition hover:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>

            </form>

            <p className="mt-8 text-center text-slate-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-gold-700 transition hover:text-gold-600"
              >
                Login
              </Link>
            </p>

          </div>

        </div>
      </div>
    </div>
  );
}