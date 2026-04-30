import { useState } from "react";
import { Film, Lock, Mail, User } from "lucide-react";
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
    <div className="flex min-h-[80vh] items-center justify-center py-10">
      <div className="w-full max-w-md animate-fade-up">
        {/* Brand mark */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="animate-heartbeat mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 shadow-glow">
            <Film size={24} className="text-noir-950" />
          </div>
          <h1 className="animate-fade-up stagger-1 font-display text-4xl uppercase tracking-wide text-white">Join CineVault</h1>
          <p className="animate-fade-up stagger-2 mt-2 text-sm text-white/35">
            Build a library, track prices, get AI picks.
          </p>
        </div>

        {/* Form */}
        <div className="animate-bounce-in panel rounded-2xl p-6 sm:p-8">
          <form className="space-y-4" onSubmit={submit}>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                className="field pl-9"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                className="field pl-9"
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                className="field pl-9"
                type="password"
                placeholder="Password (8+ characters)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            {error ? <p className="error-box">{error}</p> : null}

            <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-white/30">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-amber-400 hover:text-amber-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
