import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


const ROLE_OPTIONS = [
  { value: "customer", label: "Customer", desc: "Shop & place orders" },
  { value: "admin", label: "Admin", desc: "Manage products & orders" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const validate = () => {
    const next = {};
    const { first_name, last_name, username, email, phone, address, password, confirm_password } = formData;

    if (!first_name.trim()) next.first_name = "First name is required.";
    if (!last_name.trim()) next.last_name = "Last name is required.";
    if (!username.trim()) {
      next.username = "Username is required.";
    } else if (username.trim().length < 3) {
      next.username = "Username must be at least 3 characters.";
    }

    if (!email.trim()) {
      next.email = "Email is required.";
    } else if (!EMAIL_RE.test(email.trim())) {
      next.email = "Enter a valid email address.";
    }

    const digits = phone.replace(/\D/g, "");
    if (!phone.trim()) {
      next.phone = "Phone number is required.";
    } else if (digits.length < 10 || digits.length > 15) {
      next.phone = "Enter a valid phone number (10–15 digits).";
    }

    if (!address.trim()) next.address = "Address is required.";

    if (!password) {
      next.password = "Password is required.";
    } else if (password.length < 8) {
      next.password = "Password must be at least 8 characters.";
    }

    if (!confirm_password) {
      next.confirm_password = "Please confirm your password.";
    } else if (password !== confirm_password) {
      next.confirm_password = "Passwords do not match.";
    }

    return next;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: "" });
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
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >
              {/* Role selector */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  I want to register as
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
                  <label className="mb-1 block text-sm font-medium text-slate-700">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    className="input-field"
                    placeholder="John"
                    value={formData.first_name}
                    onChange={handleChange}
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-xs text-red-600">{errors.first_name}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    className="input-field"
                    placeholder="Doe"
                    value={formData.last_name}
                    onChange={handleChange}
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-xs text-red-600">{errors.last_name}</p>
                  )}
                </div>

              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
                <input
                  type="text"
                  name="username"
                  className="input-field"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={handleChange}
                />
                {errors.username && (
                  <p className="mt-1 text-xs text-red-600">{errors.username}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="text"
                  name="email"
                  className="input-field"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  className="input-field"
                  placeholder="+1 234 567 8901"
                  value={formData.phone}
                  onChange={handleChange}
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Address</label>
                <textarea
                  rows="3"
                  name="address"
                  className="input-field resize-none"
                  placeholder="Enter your full address"
                  value={formData.address}
                  onChange={handleChange}
                />
                {errors.address && (
                  <p className="mt-1 text-xs text-red-600">{errors.address}</p>
                )}
              </div>

              <div className="grid gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>

                  <div className="relative">

                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className="input-field"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
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
                    <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Confirm Password</label>

                  <div className="relative">

                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirm_password"
                      className="input-field"
                      placeholder="••••••••"
                      value={formData.confirm_password}
                      onChange={handleChange}
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
                    <p className="mt-1 text-xs text-red-600">{errors.confirm_password}</p>
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