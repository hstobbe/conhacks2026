import { useState } from "react";
import { Film, Lock, Mail } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.js";
import { getApiError } from "../services/api.js";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(form);
      navigate(location.state?.from ?? "/library", { replace: true });
    } catch (err) {
      setError(getApiError(err, "Login failed."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-10">
      <div className="w-full max-w-md animate-fade-up">
        {/* Brand mark */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="animate-heartbeat mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 shadow-glow">
            <Film size={24} className="text-noir-950" />
          </div>
          <h1 className="animate-fade-up stagger-1 font-display text-4xl uppercase tracking-wide text-white">Welcome back</h1>
          <p className="animate-fade-up stagger-2 mt-2 text-sm text-white/35">Sign in to sync your library and price alerts.</p>
        </div>

        {/* Form */}
        <div className="animate-bounce-in panel rounded-2xl p-6 sm:p-8">
          <form className="space-y-4" onSubmit={submit}>
            <div className="animate-fade-up stagger-1 relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                className="field pl-9"
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="animate-fade-up stagger-2 relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                className="field pl-9"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            {error ? <p className="error-box">{error}</p> : null}

            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-white/30">
            New to CineVault?{" "}
            <Link to="/signup" className="font-semibold text-amber-400 hover:text-amber-300 transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
