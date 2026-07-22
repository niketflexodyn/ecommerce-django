import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const registered = location.state?.registered
  const passwordReset = location.state?.passwordReset

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next = {};
    if (!formData.username.trim()) next.username = "Username is required.";
    if (!formData.password) next.password = "Password is required.";
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
      const user = await login(formData.username, formData.password);
      // Navigate based on role
      if (user?.role === "admin" || user?.role === "super_admin") {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container py-12">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl font-body">

        <div className="grid lg:grid-cols-2">

          {/* Left */}
          <div
            className="bg-linear-to-br from-plum-950 via-plum-900 to-plum-800 p-10 text-white"
          >
            <p className="text-sm uppercase tracking-[4px] text-gold-500">
              Luxora
            </p>

            <h1 className="mt-5 text-4xl font-bold font-display">
              Welcome Back
            </h1>

            <p className="mt-4 text-white/70">
              Sign in to continue shopping, manage your orders,
              or access your dashboard.
            </p>

            <div className="mt-10 space-y-4 text-white/80">
              <p>✓ Secure Login</p>
              <p>✓ Fast Checkout</p>
              <p>✓ Order Tracking</p>
              <p>✓ Personalized Experience</p>
            </div>
          </div>

          {/* Right */}
          <div className="p-10">

            <h2 className="text-3xl font-bold text-slate-800 font-display">
              Login
            </h2>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {registered && !error && (
              <div className="mt-4 rounded-xl border border-gold-600/30 bg-gold-500/10 px-4 py-3 text-sm text-gold-700">
                Account created successfully! Please sign in.
              </div>
            )}

            {passwordReset && !error && (
              <div className="mt-4 rounded-xl border border-gold-600/30 bg-gold-500/10 px-4 py-3 text-sm text-gold-700">
                Password reset successfully! You can now sign in.
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-6"
            >
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
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>

                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gold-500 py-3 font-semibold text-plum-950 transition hover:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Login"}
              </button>

            </form>

            <p className="mt-8 text-center text-slate-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-gold-700 transition hover:text-gold-600"
              >
                Register
              </Link>
            </p>
            <p className="mt-4 text-center text-sm text-slate-500">
              <Link
                to="/forgot-password"
                className="font-semibold text-gold-700 transition hover:text-gold-600"
              >
                Forgot password?
              </Link>
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}