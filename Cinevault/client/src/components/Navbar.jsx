import { Bot, Clapperboard, House, Library, LogOut, Search, Sparkles } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.js";

const primaryLinks = [
  { to: "/discover", label: "Discover", icon: Search },
  { to: "/home", label: "Home", icon: House },
];

const secondaryLinks = [
  { to: "/upcoming", label: "Upcoming", icon: Sparkles },
  { to: "/chat", label: "Assistant", icon: Bot },
];

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link to="/home" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-500 text-white shadow-glow">
              <Clapperboard size={22} />
            </span>
            <div>
              <p className="text-lg font-black tracking-wide text-white">CineVault</p>
              <p className="text-xs font-medium text-slate-400">Movie analytics and deal tracking</p>
            </div>
          </Link>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
          {primaryLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition",
                  isActive
                    ? "bg-blue-500/15 text-blue-200 ring-1 ring-blue-400/30"
                    : "text-slate-300 hover:bg-white/5 hover:text-white",
                ].join(" ")
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
          {secondaryLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition",
                  isActive
                    ? "bg-blue-500/15 text-blue-200 ring-1 ring-blue-400/30"
                    : "text-slate-300 hover:bg-white/5 hover:text-white",
                ].join(" ")
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
          {user ? (
            <>
              <NavLink
                to="/library"
                className={({ isActive }) =>
                  [
                    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition",
                    isActive
                      ? "bg-purple-500/15 text-purple-200 ring-1 ring-purple-400/30"
                      : "text-slate-300 hover:bg-white/5 hover:text-white",
                  ].join(" ")
                }
              >
                <Library size={16} />
                Library
              </NavLink>
              <button type="button" onClick={logout} className="btn-secondary">
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 pl-1">
              <Link to="/login" className="btn-secondary">
                Login
              </Link>
              <Link to="/signup" className="btn-primary">
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
