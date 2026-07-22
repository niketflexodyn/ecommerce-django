import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../utils/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function validate(value) {
    if (!value.trim()) return "Email is required.";
    if (!EMAIL_RE.test(value.trim())) return "Enter a valid email address.";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    const validationError = validate(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.forgotPassword({ email: email.trim() });
      setMessage(res.message || "Check your email for a reset link.");
    } catch (err) {
      // request() throws an Error with `.data` (not `err.response.data`).
      setError(err.data?.email?.[0] || err.data?.error || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container py-12">
      <div
        className="mx-auto max-w-md overflow-hidden rounded-3xl bg-white shadow-xl font-body"
      >
        <div className="p-10">
          <h2 className="text-3xl font-bold text-slate-800 font-display">
            Forgot Password
          </h2>

          <p className="mt-3 text-sm text-slate-500">
            Enter your account email and we'll send you a link to reset your password.
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-4 rounded-xl border border-gold-600/30 bg-gold-500/10 px-4 py-3 text-sm text-gold-700">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="text"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                placeholder="you@example.com"
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gold-500 py-3 font-semibold text-plum-950 transition hover:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <p className="mt-8 text-center text-slate-500">
            Remembered it?{" "}
            <Link
              to="/login"
              className="font-semibold text-gold-700 transition hover:text-gold-600"
            >
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}