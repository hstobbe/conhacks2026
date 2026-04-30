import { useState } from "react";
import { Clapperboard, Film, Library, LogOut, Search, Sparkles, Tv } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.js";

const navLinks = [
  { to: "/discover", label: "Discover", icon: Search },
  { to: "/movies",   label: "Movies",   icon: Film },
  { to: "/tv",       label: "TV",       icon: Tv },
  { to: "/anime",    label: "Anime",    icon: Sparkles },
  { to: "/upcoming", label: "Upcoming", icon: Clapperboard },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [logoHovered, setLogoHovered] = useState(false);

  return (
    <header
      className="animate-slide-down sticky top-0 z-40 border-b border-white/[0.06]"
      style={{ background: "rgba(6,9,18,0.92)", backdropFilter: "blur(20px)" }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-0 sm:px-6 lg:px-8">

        {/* ── Logo ── */}
        <Link
          to="/home"
          className="group flex shrink-0 items-center gap-3 py-4"
          onMouseEnter={() => setLogoHovered(true)}
          onMouseLeave={() => setLogoHovered(false)}
        >
          {/* Icon box */}
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-amber-500 text-noir-950 shadow-glow transition-all duration-300 group-hover:rounded-xl group-hover:shadow-glow-lg">
            {/* Sweep glint on hover */}
            <span className="absolute inset-0 -translate-x-full skew-x-12 bg-white/30 transition-transform duration-500 group-hover:translate-x-full" />
            <Film
              size={18}
              strokeWidth={2.5}
              className="relative z-10 transition-transform duration-500 group-hover:rotate-[20deg] group-hover:scale-110"
            />
          </div>

          {/* Text */}
          <div className="hidden overflow-hidden sm:block">
            <p
              className={[
                "font-display text-xl uppercase leading-none tracking-widest transition-all duration-300",
                logoHovered ? "shimmer-text tracking-[0.35em]" : "text-white",
              ].join(" ")}
            >
              CineVault
            </p>
            <p
              className="translate-y-0 text-[10px] font-medium uppercase tracking-[0.15em] text-amber-500/60 transition-all duration-300 group-hover:translate-y-0 group-hover:text-amber-400/80"
              style={{
                clipPath: "inset(0)",
                opacity: logoHovered ? 1 : 0.6,
              }}
            >
              Film · Analytics · Deals
            </p>
          </div>
        </Link>

        {/* ── Nav links ── */}
        <nav className="flex items-center gap-0.5 overflow-x-auto py-4">
          {navLinks.map(({ to, label, icon: Icon }, idx) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  "group/link relative inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  "animate-fade-up",
                  isActive ? "text-amber-400" : "text-white/50 hover:text-white/90",
                ].join(" ")
              }
              style={{ animationDelay: `${0.05 + idx * 0.04}s` }}
            >
              {({ isActive }) => (
                <>
                  {/* Icon with bounce on hover */}
                  <span className="transition-transform duration-200 group-hover/link:-translate-y-0.5 group-hover/link:scale-110">
                    <Icon size={14} className={isActive ? "text-amber-400" : ""} />
                  </span>

                  <span className="hidden md:inline">{label}</span>

                  {/* Active underline — grows from center */}
                  {isActive && (
                    <span
                      className="animate-grow-x absolute inset-x-2 -bottom-[1px] h-[2px] origin-left rounded-full bg-amber-500"
                    />
                  )}

                  {/* Hover background blob */}
                  <span className="absolute inset-0 scale-75 rounded-lg bg-white/0 opacity-0 transition-all duration-200 group-hover/link:scale-100 group-hover/link:bg-white/[0.04] group-hover/link:opacity-100" />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── Auth ── */}
        <div className="flex shrink-0 items-center gap-2 py-4">
          {user ? (
            <>
              <NavLink
                to="/library"
                className={({ isActive }) =>
                  [
                    "group/link relative inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive ? "text-amber-400" : "text-white/50 hover:text-white/90",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="transition-transform duration-200 group-hover/link:-translate-y-0.5 group-hover/link:scale-110">
                      <Library size={14} />
                    </span>
                    <span className="hidden sm:inline">Library</span>
                    {isActive && (
                      <span className="animate-grow-x absolute inset-x-2 -bottom-[1px] h-[2px] origin-left rounded-full bg-amber-500" />
                    )}
                  </>
                )}
              </NavLink>

              <button
                type="button"
                onClick={logout}
                className="group/out inline-flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-sm font-medium text-white/40 transition-all duration-200 hover:border-rose-500/30 hover:text-rose-300"
              >
                <LogOut
                  size={14}
                  className="transition-transform duration-200 group-hover/out:translate-x-0.5"
                />
                <span className="hidden sm:inline">Out</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="animate-fade-up rounded-lg px-3 py-2 text-sm font-medium text-white/50 transition hover:text-white/80"
                style={{ animationDelay: "0.25s" }}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="animate-fade-up btn-primary text-xs"
                style={{ animationDelay: "0.3s" }}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
