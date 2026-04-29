import { Film, Star, Tv } from "lucide-react";
import { Link } from "react-router-dom";

const options = [
  {
    to: "/movies",
    title: "Movies",
    body: "Search, filter, open details, check streaming, and track Blu-ray availability.",
    icon: Film,
  },
  {
    to: "/anime",
    title: "Anime",
    body: "Browse top anime, current season shows, studios, episodes, and streaming links.",
    icon: Star,
  },
  {
    to: "/tv",
    title: "TV",
    body: "Find popular and trending series, seasons, networks, and watch providers.",
    icon: Tv,
  },
];

export default function Home() {
  return (
    <div className="space-y-8 py-6">
      <section className="max-w-3xl space-y-4">
        <p className="pill inline-block">Home</p>
        <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl">Choose what you want to explore.</h1>
        <p className="text-base leading-7 text-slate-300">
          Pick a category to jump into the focused CineVault view for movies, anime, or TV shows.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {options.map(({ to, title, body, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="panel group rounded-lg p-5 transition hover:-translate-y-1 hover:border-blue-400/50 hover:shadow-glow"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-blue-500/15 text-blue-200 transition group-hover:bg-blue-500 group-hover:text-white">
              <Icon size={24} />
            </div>
            <h2 className="text-2xl font-black text-white">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">{body}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
