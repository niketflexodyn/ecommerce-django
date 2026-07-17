import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const fontDisplay = { fontFamily: "'Playfair Display', serif" }
const fontBody = { fontFamily: "'Jost', sans-serif" }

const ROLE_OPTIONS = [
  { value: "customer", label: "Customer", desc: "Shop & place orders" },
  { value: "admin", label: "Admin", desc: "Manage products & orders" },
];

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
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match");
      return;
    }

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
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-white shadow-xl" style={fontBody}>
        <div className="grid lg:grid-cols-2">

          {/* Left */}
          <div
            className="p-10 text-white"
            style={{ background: 'linear-gradient(135deg, #2A1A2C 0%, #3D2136 55%, #4A2536 100%)' }}
          >
            <p className="text-sm uppercase tracking-[4px] text-[#E8C766]">
              Luxora
            </p>

            <h1 className="mt-5 text-4xl font-bold" style={fontDisplay}>
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

            <h2 className="text-3xl font-bold text-slate-800" style={fontDisplay}>
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
                          ? "border-[#E8C766] bg-[#E8C766]/10 ring-1 ring-[#E8C766]"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <span className={`block text-sm font-semibold ${formData.role === opt.value ? "text-[#2A1A2C]" : "text-slate-900"}`}>
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
                    required
                  />
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
                    required
                  />
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
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  name="email"
                  className="input-field"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  className="input-field"
                  placeholder="+1 234 567 8901"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
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
                  required
                />
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
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>

                  </div>
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
                      required
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
                </div>

              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-3 font-semibold text-[#2A1A2C] transition hover:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: '#E8C766' }}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>

            </form>

            <p className="mt-8 text-center text-slate-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-[#8a6d1f] transition hover:text-[#C9A227]"
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