import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { authApi } from "../utils/api";

const fontDisplay = { fontFamily: "'Playfair Display', serif" };
const fontBody = { fontFamily: "'Jost', sans-serif" };

export default function ResetPassword() {
  const { uid, token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate(pw, cpw) {
    if (!pw) return "Password is required.";
    if (pw.length < 8) return "Password must be at least 8 characters.";
    if (!cpw) return "Please confirm your password.";
    if (pw !== cpw) return "Passwords do not match.";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const validationError = validate(password, confirm);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      await authApi.resetPassword({
        uid,
        token,
        password,
        confirm_password: confirm,
      });
      navigate("/login", { state: { passwordReset: true } });
    } catch (err) {
      // request() throws an Error with `.data` (not `err.response.data`).
      const data = err.data;
      if (data?.error) {
        setError(data.error);
      } else if (data?.password) {
        setError(data.password[0]);
      } else if (data?.confirm_password) {
        setError(data.confirm_password[0]);
      } else {
        setError("Reset failed. The link may be invalid or expired.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container py-12">
      <div
        className="mx-auto max-w-md overflow-hidden rounded-3xl bg-white shadow-xl"
        style={fontBody}
      >
        <div className="p-10">
          <h2 className="text-3xl font-bold text-slate-800" style={fontDisplay}>
            Reset Password
          </h2>

          <p className="mt-3 text-sm text-slate-500">
            Choose a new password for your account.
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                New password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="••••••••"
                  className="input-field"
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
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Confirm password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  if (error) setError("");
                }}
                placeholder="••••••••"
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 font-semibold text-[#2A1A2C] transition hover:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: "#E8C766" }}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <p className="mt-8 text-center text-slate-500">
            <Link
              to="/login"
              className="font-semibold text-[#8a6d1f] transition hover:text-[#C9A227]"
            >
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}