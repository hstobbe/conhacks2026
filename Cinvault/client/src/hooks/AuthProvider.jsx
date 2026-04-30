import { useEffect, useMemo, useState } from "react";

import AuthContext from "./auth-context.js";
import api from "../services/api.js";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("cinevault_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("cinevault_token")));

  useEffect(() => {
    let active = true;

    async function loadUser() {
      const token = localStorage.getItem("cinevault_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        if (active) {
          setUser(data);
          localStorage.setItem("cinevault_user", JSON.stringify(data));
        }
      } catch {
        localStorage.removeItem("cinevault_token");
        localStorage.removeItem("cinevault_user");
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUser();
    return () => {
      active = false;
    };
  }, []);

  async function login(payload) {
    const { data } = await api.post("/auth/login", payload);
    localStorage.setItem("cinevault_token", data.accessToken);
    localStorage.setItem("cinevault_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  async function signup(payload) {
    const { data } = await api.post("/auth/signup", payload);
    localStorage.setItem("cinevault_token", data.accessToken);
    localStorage.setItem("cinevault_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("cinevault_token");
    localStorage.removeItem("cinevault_user");
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, loading, isAuthenticated: Boolean(user), login, signup, logout }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
