import { useEffect, useRef, useState } from "react";
import { Search, TrendingUp, Tv, X } from "lucide-react";

import EmptyState from "../components/EmptyState.jsx";
import Loading from "../components/Loading.jsx";
import MovieCard from "../components/MovieCard.jsx";
import api, { getApiError } from "../services/api.js";

export default function TVShows() {
  const [shows, setShows] = useState([]);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("popular");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const prevModeRef = useRef("popular");

  async function loadShows(nextMode = mode) {
    setLoading(true);
    setError("");
    setMode(nextMode);
    prevModeRef.current = nextMode;
    try {
      const endpoint = nextMode === "trending" ? "/tv/trending" : "/tv/popular";
      const { data } = await api.get(endpoint, {
        params: nextMode === "trending" ? { time_window: "week" } : undefined,
      });
      setShows(data.results);
    } catch (err) {
      setError(getApiError(err, "Could not load TV shows."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    api.get("/tv/popular")
      .then(({ data }) => { if (active) setShows(data.results); })
      .catch((err) => { if (active) setError(getApiError(err, "Could not load TV shows.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function searchShows(event) {
    event.preventDefault();
    if (query.trim().length < 2) return;
    setLoading(true);
    setError("");
    prevModeRef.current = mode === "search" ? prevModeRef.current : mode;
    setMode("search");
    try {
      const { data } = await api.get("/tv/search", { params: { query } });
      setShows(data.results);
    } catch (err) {
      setError(getApiError(err, "TV search failed."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-label mb-1">TMDb TV</p>
          <h1 className="font-display text-5xl uppercase leading-none tracking-wide text-white">TV Shows</h1>
          <p className="mt-2 text-sm text-white/30">Popular and trending series, seasons, networks, and watch providers.</p>
        </div>
        <form className="flex w-full gap-2 lg:max-w-sm" onSubmit={searchShows}>
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              className="field pl-9 pr-8"
              value={query}
              onChange={(e) => {
                const val = e.target.value;
                setQuery(val);
                if (!val.trim()) loadShows(prevModeRef.current);
              }}
              placeholder="Search TV shows..."
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); loadShows(prevModeRef.current); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 transition-colors hover:text-white/60"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button type="submit" className="btn-primary shrink-0">Search</button>
        </form>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          className={mode === "popular" ? "btn-primary text-xs" : "btn-secondary text-xs"}
          onClick={() => loadShows("popular")}
        >
          <Tv size={14} />
          Popular
        </button>
        <button
          type="button"
          className={mode === "trending" ? "btn-primary text-xs" : "btn-secondary text-xs"}
          onClick={() => loadShows("trending")}
        >
          <TrendingUp size={14} />
          Trending
        </button>
      </div>

      {error ? <p className="error-box">{error}</p> : null}
      {loading ? (
        <Loading label="Loading TV shows" />
      ) : shows.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {shows.map((show) => (
            <MovieCard key={show.tmdbId} movie={show} to={`/tv/${show.tmdbId}`} badge="TV" />
          ))}
        </div>
      ) : (
        <EmptyState title="No TV shows found" body="Try a broader series title or switch back to popular." />
      )}
    </div>
  );
}
