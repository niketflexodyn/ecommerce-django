import { useState } from "react";
import { Link } from "react-router-dom";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log(formData);

    // POST /api/login/
    // Backend returns role:
    // customer -> navigate("/")
    // admin -> navigate("/admin")
    // super_admin -> navigate("/super-admin")
  };

  return (
    <div className="page-container py-12">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl">

        <div className="grid lg:grid-cols-2">

          {/* Left */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-10 text-white">

            <p className="text-sm uppercase tracking-[4px]">
              MyStore
            </p>

            <h1 className="mt-5 text-4xl font-bold">
              Welcome Back
            </h1>

            <p className="mt-4 text-white/80">
              Sign in to continue shopping, manage your orders,
              or access your dashboard.
            </p>

            <div className="mt-10 space-y-4">
              <p>✓ Secure Login</p>
              <p>✓ Fast Checkout</p>
              <p>✓ Order Tracking</p>
              <p>✓ Personalized Experience</p>
            </div>

          </div>

          {/* Right */}
          <div className="p-10">

            <h2 className="text-3xl font-bold text-slate-800">
              Login
            </h2>

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-6"
            >
              <div>
                <label>Email</label>

                <input
                  type="email"
                  name="email"
                  className="input-field"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label>Password</label>

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
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>

                </div>
              </div>

              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-indigo-600"
                >
                  Forgot Password?
                </Link>
              </div>

              <button
                className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-500"
              >
                Login
              </button>

            </form>

            <p className="mt-8 text-center text-slate-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-indigo-600"
              >
                Register
              </Link>
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}