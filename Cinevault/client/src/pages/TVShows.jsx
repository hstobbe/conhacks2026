import { useEffect, useState } from "react";
import { Search, TrendingUp, Tv } from "lucide-react";

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

  async function loadShows(nextMode = mode) {
    setLoading(true);
    setError("");
    setMode(nextMode);
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
    api
      .get("/tv/popular")
      .then(({ data }) => {
        if (active) setShows(data.results);
      })
      .catch((err) => {
        if (active) setError(getApiError(err, "Could not load TV shows."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function searchShows(event) {
    event.preventDefault();
    if (query.trim().length < 2) return;
    setLoading(true);
    setError("");
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
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="pill mb-3 inline-block">TMDb TV</p>
          <h1 className="text-3xl font-black text-white">TV shows</h1>
          <p className="mt-1 text-sm text-slate-400">Browse popular and trending series, then open full season and streaming details.</p>
        </div>
        <form className="flex w-full gap-2 lg:max-w-md" onSubmit={searchShows}>
          <input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search TV shows" />
          <button type="submit" className="btn-primary">
            <Search size={17} />
            Search
          </button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={mode === "popular" ? "btn-primary" : "btn-secondary"} onClick={() => loadShows("popular")}>
          <Tv size={17} />
          Popular
        </button>
        <button type="button" className={mode === "trending" ? "btn-primary" : "btn-secondary"} onClick={() => loadShows("trending")}>
          <TrendingUp size={17} />
          Trending
        </button>
      </div>

      {error ? <p className="rounded-md border border-rose-400/30 bg-rose-500/10 p-4 text-rose-100">{error}</p> : null}
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
