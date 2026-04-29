import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.js";
import { getApiError } from "../services/api.js";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signup(form);
      navigate("/library", { replace: true });
    } catch (err) {
      setError(getApiError(err, "Signup failed."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 py-10 lg:grid-cols-[1fr_420px] lg:items-center">
      <div className="space-y-4">
        <p className="pill inline-block">Start tracking</p>
        <h1 className="text-4xl font-black text-white">Create your CineVault account</h1>
        <p className="max-w-xl text-slate-300">
          Build a personal library, rate titles, create alerts, and let recommendations adapt to your taste.
        </p>
      </div>
      <form className="panel space-y-4 rounded-lg p-6" onSubmit={submit}>
        <input className="field" placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input className="field" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <input className="field" type="password" placeholder="Password, 8+ characters" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        {error ? <p className="rounded-md border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</p> : null}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Creating account..." : "Sign up"}
        </button>
        <p className="text-center text-sm text-slate-400">
          Already have an account? <Link to="/login" className="font-semibold text-blue-200 hover:text-blue-100">Login</Link>
        </p>
      </form>
    </div>
  );
}
