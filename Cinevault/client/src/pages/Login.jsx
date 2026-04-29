import { useState } from "react";
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
    <div className="mx-auto grid max-w-5xl gap-6 py-10 lg:grid-cols-[1fr_420px] lg:items-center">
      <div className="space-y-4">
        <p className="pill inline-block">CineVault account</p>
        <h1 className="text-4xl font-black text-white">Welcome back</h1>
        <p className="max-w-xl text-slate-300">Sign in to sync your library, ratings, and price alerts.</p>
      </div>
      <form className="panel space-y-4 rounded-lg p-6" onSubmit={submit}>
        <input className="field" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <input className="field" type="password" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        {error ? <p className="rounded-md border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</p> : null}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
        <p className="text-center text-sm text-slate-400">
          New here? <Link to="/signup" className="font-semibold text-blue-200 hover:text-blue-100">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
