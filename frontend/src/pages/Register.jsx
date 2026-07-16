import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirm_password: "",
  });
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/')

    if (formData.password !== formData.confirm_password) {
      alert("Passwords do not match");
      return;
    }

    console.log(formData);

    // POST /api/register/
  };

  return (
    <div className="page-container py-12">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="grid lg:grid-cols-2">

          {/* Left */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-10 text-white">

            <p className="text-sm uppercase tracking-[4px]">
              MyStore
            </p>

            <h1 className="mt-5 text-4xl font-bold">
              Create Your Account
            </h1>

            <p className="mt-4 text-white/80">
              Join MyStore today and enjoy secure shopping, faster checkout,
              order tracking, and exclusive offers.
            </p>

            <div className="mt-10 space-y-4">
              <p>✓ Secure Registration</p>
              <p>✓ Save Delivery Addresses</p>
              <p>✓ Track Your Orders</p>
              <p>✓ Exclusive Member Discounts</p>
            </div>
          </div>

          {/* Right */}
          <div className="p-10">

            <h2 className="text-3xl font-bold text-slate-800">
              Register
            </h2>

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >

              <div className="grid gap-5 md:grid-cols-2">

                <div>
                  <label>First Name</label>
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
                  <label>Last Name</label>
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
                <label>Username</label>
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
                <label>Email</label>
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
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  className="input-field"
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>Address</label>
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
                  <label>Password</label>

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
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-600"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>

                  </div>
                </div>

                <div>
                  <label>Confirm Password</label>

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
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-600"
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>

                  </div>
                </div>

              </div>

              <button
                type="submit" 
                className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-500"
              >
                Create Account
              </button>

            </form>

            <p className="mt-8 text-center text-slate-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-indigo-600 hover:text-indigo-500"
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