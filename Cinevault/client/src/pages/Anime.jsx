import { useEffect, useState } from "react";
import { Flame, Search, Sparkles } from "lucide-react";

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

  async function loadAnime(nextMode = mode) {
    setLoading(true);
    setError("");
    setMode(nextMode);
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
    api
      .get("/anime/top", { params: { limit: 20 } })
      .then(({ data }) => {
        if (active) setAnime(data.results);
      })
      .catch((err) => {
        if (active) setError(getApiError(err, "Could not load anime."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function searchAnime(event) {
    event.preventDefault();
    if (query.trim().length < 2) return;
    setLoading(true);
    setError("");
    setMode("search");
    try {
      const { data } = await api.get("/anime/search", {
        params: { query, limit: 20 },
      });
      setAnime(data.results);
    } catch (err) {
      setError(getApiError(err, "Anime search failed."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="pill mb-3 inline-block">Jikan anime</p>
          <h1 className="text-3xl font-black text-white">Anime</h1>
          <p className="mt-1 text-sm text-slate-400">Browse top anime, current season titles, and Jikan-powered search results.</p>
        </div>
        <form className="flex w-full gap-2 lg:max-w-md" onSubmit={searchAnime}>
          <input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search anime" />
          <button type="submit" className="btn-primary">
            <Search size={17} />
            Search
          </button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={mode === "top" ? "btn-primary" : "btn-secondary"} onClick={() => loadAnime("top")}>
          <Flame size={17} />
          Top anime
        </button>
        <button type="button" className={mode === "season" ? "btn-primary" : "btn-secondary"} onClick={() => loadAnime("season")}>
          <Sparkles size={17} />
          Current season
        </button>
      </div>

      {error ? <p className="rounded-md border border-rose-400/30 bg-rose-500/10 p-4 text-rose-100">{error}</p> : null}
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
