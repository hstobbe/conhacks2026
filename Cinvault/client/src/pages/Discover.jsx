import { useEffect, useState } from "react";
import { ArrowRight, Film, Search, Sparkles, Tv } from "lucide-react";
import { Link } from "react-router-dom";

import EmptyState from "../components/EmptyState.jsx";
import Loading from "../components/Loading.jsx";
import MovieCard from "../components/MovieCard.jsx";
import MovieRow from "../components/MovieRow.jsx";
import api, { getApiError } from "../services/api.js";

// Per-section accent config — drives ALL colour decisions for each zone
const SECTIONS = {
  movies: {
    num: "01",
    title: "Movies",
    label: "Film",
    to: "/movies",
    icon: Film,
    // Tailwind-safe strings (no dynamic class construction)
    accent: {
      border:   "border-amber-500",
      bg:       "bg-amber-500/[0.06]",
      glow:     "rgba(245,158,11,0.12)",
      pill:     "bg-amber-500/10 text-amber-400 border-amber-500/25",
      iconBg:   "bg-amber-500/10",
      iconText: "text-amber-400",
      numText:  "text-amber-500/10",
      line:     "from-amber-500/60",
      btnHover: "hover:border-amber-500/40 hover:text-amber-300",
      titleHover:"group-hover:text-amber-300",
    },
  },
  tv: {
    num: "02",
    title: "TV Shows",
    label: "Television",
    to: "/tv",
    icon: Tv,
    accent: {
      border:   "border-blue-500",
      bg:       "bg-blue-500/[0.06]",
      glow:     "rgba(59,130,246,0.12)",
      pill:     "bg-blue-500/10 text-blue-400 border-blue-500/25",
      iconBg:   "bg-blue-500/10",
      iconText: "text-blue-400",
      numText:  "text-blue-500/10",
      line:     "from-blue-500/60",
      btnHover: "hover:border-blue-500/40 hover:text-blue-300",
      titleHover:"group-hover:text-blue-300",
    },
  },
  anime: {
    num: "03",
    title: "Anime",
    label: "Animation",
    to: "/anime",
    icon: Sparkles,
    accent: {
      border:   "border-purple-500",
      bg:       "bg-purple-500/[0.06]",
      glow:     "rgba(168,85,247,0.12)",
      pill:     "bg-purple-500/10 text-purple-400 border-purple-500/25",
      iconBg:   "bg-purple-500/10",
      iconText: "text-purple-400",
      numText:  "text-purple-500/10",
      line:     "from-purple-500/60",
      btnHover: "hover:border-purple-500/40 hover:text-purple-300",
      titleHover:"group-hover:text-purple-300",
    },
  },
};

export default function Discover() {
  const [sections, setSections] = useState(null);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/movies/home")
      .then(({ data }) => { if (active) setSections(data); })
      .catch((err) => { if (active) setError(getApiError(err, "Could not load recommendations.")); });
    return () => { active = false; };
  }, []);

  async function searchMovies(event) {
    event.preventDefault();
    if (query.trim().length < 2) return;
    setSearching(true);
    setHasSearched(true);
    setError("");
    try {
      const { data } = await api.get("/movies/search", { params: { query } });
      setSearchResults(data.results);
    } catch (err) {
      setError(getApiError(err, "Movie search failed."));
    } finally {
      setSearching(false);
    }
  }

  if (!sections && !error) return <Loading label="Loading recommendations" />;

  return (
    <div className="space-y-12 py-6">
      {/* Header + Search */}
      <section className="animate-fade-up">
        <p className="section-label mb-4">Discover</p>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-5xl uppercase leading-none tracking-wide text-white sm:text-6xl">
              What are you<br /><span className="text-amber-400">looking for?</span>
            </h1>
            <p className="mt-4 max-w-md text-sm text-white/35">
              Search any title or scroll through curated rows of movies, TV shows, and anime below.
            </p>
          </div>
          <form className="flex w-full max-w-md gap-2" onSubmit={searchMovies}>
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                className="field pl-9"
                value={query}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuery(val);
                  if (!val.trim()) {
                    setHasSearched(false);
                    setSearchResults([]);
                  }
                }}
                placeholder="Search movies..."
              />
            </div>
            <button type="submit" className="btn-primary shrink-0" disabled={searching}>
              {searching ? "..." : "Search"}
            </button>
          </form>
        </div>
      </section>

      {error ? <p className="error-box">{error}</p> : null}

      {/* Search Results */}
      {hasSearched ? (
        <section className="animate-fade-up space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl uppercase tracking-wide text-white">Results</h2>
              <p className="mt-0.5 text-xs text-white/30">for "{query}"</p>
            </div>
            <Link to="/movies" className="group btn-secondary text-xs">
              Advanced filters
              <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
          {searching ? (
            <Loading label="Searching" />
          ) : searchResults.length ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {searchResults.map((movie) => (
                <MovieCard key={movie.tmdbId ?? movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <EmptyState title="No movies found" body="Try a different title or use advanced filters." />
          )}
        </section>
      ) : null}

      {/* Curated Rows */}
      {sections ? (
        <div className="space-y-16">
          <SectionDivider cfg={SECTIONS.movies} />
          {(sections.movieRows ?? []).map((row) => (
            <MovieRow key={row.key} title={row.title} subtitle={row.subtitle} movies={row.items} mediaType={row.mediaType} />
          ))}

          <SectionDivider cfg={SECTIONS.tv} />
          {(sections.tvRows ?? []).map((row) => (
            <MovieRow key={row.key} title={row.title} subtitle={row.subtitle} movies={row.items} mediaType={row.mediaType} badge="TV" />
          ))}

          <SectionDivider cfg={SECTIONS.anime} />
          {(sections.animeRows ?? []).map((row) => (
            <MovieRow key={row.key} title={row.title} subtitle={row.subtitle} movies={row.items} mediaType={row.mediaType} badge="Anime" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SectionDivider({ cfg }) {
  const { num, title, label, to, icon: Icon, accent } = cfg;

  return (
    <div className="animate-fade-up group relative overflow-hidden rounded-2xl border border-white/[0.06]">
      {/* Coloured ambient glow behind the panel */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ background: `radial-gradient(ellipse 80% 100% at 0% 50%, ${accent.glow}, transparent)` }}
      />

      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 h-full w-1 rounded-l-2xl ${accent.border.replace("border-", "bg-")}`} />

      {/* Giant decorative number — sits behind content */}
      <span
        className={`pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 select-none font-display text-[7rem] leading-none tracking-tight ${accent.numText} transition-all duration-500 group-hover:opacity-60`}
      >
        {num}
      </span>

      {/* Main content */}
      <div className="relative flex items-center justify-between gap-6 px-7 py-5">
        {/* Left: icon + label + title */}
        <div className="flex items-center gap-5">
          {/* Icon badge */}
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent.iconBg} ${accent.iconText} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
            <Icon size={22} />
          </div>

          <div>
            {/* Type label pill */}
            <span className={`mb-1.5 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] ${accent.pill}`}>
              {label}
            </span>
            {/* Section title */}
            <h2 className={`font-display text-3xl uppercase leading-none tracking-wide text-white transition-colors duration-200 sm:text-4xl ${accent.titleHover}`}>
              {title}
            </h2>
          </div>
        </div>

        {/* Right: View all */}
        <Link
          to={to}
          className={`group/btn shrink-0 inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/50 transition-all duration-200 ${accent.btnHover}`}
        >
          View all
          <ArrowRight size={14} className="transition-transform duration-200 group-hover/btn:translate-x-1" />
        </Link>
      </div>

      {/* Bottom accent line */}
      <div className={`animate-line-grow h-[1.5px] bg-gradient-to-r ${accent.line} via-white/5 to-transparent`} />
    </div>
  );
}
