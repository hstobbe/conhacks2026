import { useEffect, useRef, useState } from "react";
import { Flame, Search, Sparkles, X } from "lucide-react";

import EmptyState from "../components/EmptyState.jsx";
import Loading from "../components/Loading.jsx";
import MovieCard from "../components/MovieCard.jsx";
import api, { getApiError } from "../services/api.js";

export default function Anime() {
  const [anime, setAnime] = useState([]);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("top");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const prevModeRef = useRef("top");

  async function loadAnime(nextMode = mode) {
    setLoading(true);
    setError("");
    setMode(nextMode);
    prevModeRef.current = nextMode;
    try {
      const endpoint = nextMode === "season" ? "/anime/season-now" : "/anime/top";
      const { data } = await api.get(endpoint, { params: { limit: 20 } });
      setAnime(data.results);
    } catch (err) {
      setError(getApiError(err, "Could not load anime."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    api.get("/anime/top", { params: { limit: 20 } })
      .then(({ data }) => { if (active) setAnime(data.results); })
      .catch((err) => { if (active) setError(getApiError(err, "Could not load anime.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function searchAnime(event) {
    event.preventDefault();
    if (query.trim().length < 2) return;
    setLoading(true);
    setError("");
    prevModeRef.current = mode === "search" ? prevModeRef.current : mode;
    setMode("search");
    try {
      const { data } = await api.get("/anime/search", { params: { query, limit: 20 } });
      setAnime(data.results);
    } catch (err) {
      setError(getApiError(err, "Anime search failed."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-label mb-1">Jikan API</p>
          <h1 className="font-display text-5xl uppercase leading-none tracking-wide text-white">Anime</h1>
          <p className="mt-2 text-sm text-white/30">Top anime, current season titles, and Jikan-powered search.</p>
        </div>
        <form className="flex w-full gap-2 lg:max-w-sm" onSubmit={searchAnime}>
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              className="field pl-9 pr-8"
              value={query}
              onChange={(e) => {
                const val = e.target.value;
                setQuery(val);
                if (!val.trim()) loadAnime(prevModeRef.current);
              }}
              placeholder="Search anime..."
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); loadAnime(prevModeRef.current); }}
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
          className={mode === "top" ? "btn-primary text-xs" : "btn-secondary text-xs"}
          onClick={() => loadAnime("top")}
        >
          <Flame size={14} />
          Top Anime
        </button>
        <button
          type="button"
          className={mode === "season" ? "btn-primary text-xs" : "btn-secondary text-xs"}
          onClick={() => loadAnime("season")}
        >
          <Sparkles size={14} />
          Current Season
        </button>
      </div>

      {error ? <p className="error-box">{error}</p> : null}
      {loading ? (
        <Loading label="Loading anime" />
      ) : anime.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {anime.map((item) => (
            <MovieCard key={item.malId} movie={item} to={`/anime/${item.malId}`} badge={item.type ?? "Anime"} />
          ))}
        </div>
      ) : (
        <EmptyState title="No anime found" body="Try a broader title or switch back to top anime." />
      )}
    </div>
  );
}
