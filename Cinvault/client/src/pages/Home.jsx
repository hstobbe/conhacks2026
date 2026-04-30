import { Film, Sparkles, Tv } from "lucide-react";
import { Link } from "react-router-dom";

const categories = [
  {
    to: "/movies",
    label: "01",
    title: "Movies",
    body: "Filter by genre, year, rating, streaming, and Blu-ray availability.",
    icon: Film,
    color: "amber",
  },
  {
    to: "/anime",
    label: "02",
    title: "Anime",
    body: "Top anime, current season shows, studios, episodes, and streaming links.",
    icon: Sparkles,
    color: "blue",
  },
  {
    to: "/tv",
    label: "03",
    title: "TV Shows",
    body: "Popular and trending series, seasons, networks, and watch providers.",
    icon: Tv,
    color: "purple",
  },
];

const colorMap = {
  amber: {
    icon: "bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-noir-950",
    num: "text-amber-500/20 group-hover:text-amber-500/40",
    border: "hover:border-amber-500/30 hover:shadow-glow",
  },
  blue: {
    icon: "bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white",
    num: "text-blue-500/20 group-hover:text-blue-500/40",
    border: "hover:border-blue-500/30 hover:shadow-glow-blue",
  },
  purple: {
    icon: "bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white",
    num: "text-purple-500/20 group-hover:text-purple-500/40",
    border: "hover:border-purple-500/30",
  },
};

export default function Home() {
  return (
    <div className="space-y-16 py-10">
      {/* Hero */}
      <section className="animate-fade-up">
        <p className="section-label mb-4 animate-fade-up stagger-1">Welcome to CineVault</p>
        <h1 className="animate-fade-up stagger-2 font-display text-6xl uppercase leading-none tracking-wide text-white sm:text-8xl">
          Your cinema,<br />
          <span className="animate-float inline-block text-amber-400">catalogued.</span>
        </h1>
        <p className="animate-fade-up stagger-3 mt-6 max-w-lg text-base leading-7 text-white/40">
          Track movies, discover Blu-ray deals, monitor price drops, and get AI-powered recommendations — all in one place.
        </p>
        <div className="animate-fade-up stagger-4 mt-8 flex flex-wrap gap-3">
          <Link to="/discover" className="btn-primary">Explore now</Link>
          <Link to="/signup" className="btn-secondary">Create account</Link>
        </div>
      </section>

      {/* Category Cards */}
      <section>
        <p className="section-label mb-6">Browse by category</p>
        <div className="grid gap-4 md:grid-cols-3">
          {categories.map(({ to, label, title, body, icon: Icon, color }, i) => {
            const c = colorMap[color];
            return (
              <Link
                key={to}
                to={to}
                className={[
                  "group panel-hover relative overflow-hidden rounded-xl p-6 transition-all duration-300 hover:-translate-y-1",
                  `animate-card-pop stagger-${i + 3}`,
                ].join(" ")}
              >
                {/* Background number */}
                <span className={`absolute right-4 top-2 font-display text-8xl leading-none transition-all duration-300 select-none ${c.num}`}>
                  {label}
                </span>

                <div className={`mb-6 flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 ${c.icon}`}>
                  <Icon size={20} />
                </div>

                <h2 className="font-display text-3xl uppercase tracking-wide text-white">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-white/35 transition-colors duration-300 group-hover:text-white/50">{body}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Quick links */}
      <section className="flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-10">
        <span className="section-label">Quick access</span>
        {[
          { to: "/upcoming", label: "Upcoming releases" },
          { to: "/library/bluray", label: "Blu-ray deals" },
          { to: "/library", label: "My library" },
        ].map(({ to, label }) => (
          <Link key={to} to={to} className="pill transition-all duration-200 hover:border-amber-500/30 hover:text-amber-300">
            {label}
          </Link>
        ))}
      </section>
    </div>
  );
}
