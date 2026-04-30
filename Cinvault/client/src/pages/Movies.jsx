import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

import EmptyState from "../components/EmptyState.jsx";
import FilterSidebar from "../components/FilterSidebar.jsx";
import Loading from "../components/Loading.jsx";
import MovieCard from "../components/MovieCard.jsx";
import api, { getApiError } from "../services/api.js";

const initialFilters = {
  genre: "",
  year: "",
  min_rating: "",
  min_popularity: "",
  streaming: "",
  bluray_available: "",
};

export default function Movies() {
  const [filters, setFilters] = useState(initialFilters);
  const [movies, setMovies] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadFiltered(customFilters = filters) {
    setLoading(true);
    setError("");
    try {
      const params = Object.fromEntries(Object.entries(customFilters).filter(([, v]) => v !== ""));
      const { data } = await api.get("/movies/filter", { params });
      setMovies(data.results);
    } catch (err) {
      setError(getApiError(err, "Could not load filtered movies."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    api.get("/movies/filter")
      .then(({ data }) => { if (active) setMovies(data.results); })
      .catch((err) => { if (active) setError(getApiError(err, "Could not load filtered movies.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function searchMovies(event) {
    event.preventDefault();
    if (query.trim().length < 2) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/movies/search", { params: { query } });
      setMovies(data.results);
    } catch (err) {
      setError(getApiError(err, "Search failed."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 py-6 lg:grid-cols-[260px_1fr]">
      <FilterSidebar
        filters={filters}
        setFilters={setFilters}
        onSubmit={(e) => { e.preventDefault(); loadFiltered(filters); }}
        onReset={() => { setFilters(initialFilters); setQuery(""); loadFiltered(initialFilters); }}
      />

      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-label mb-1">TMDb</p>
            <h1 className="font-display text-5xl uppercase leading-none tracking-wide text-white">Movies</h1>
          </div>
          <form className="flex w-full gap-2 sm:max-w-sm" onSubmit={searchMovies}>
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                className="field pl-9 pr-8"
                value={query}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuery(val);
                  if (!val.trim()) loadFiltered(filters);
                }}
                placeholder="Search by title..."
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(""); loadFiltered(filters); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 transition-colors hover:text-white/60"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button type="submit" className="btn-primary shrink-0">Search</button>
          </form>
        </div>

        {error ? <p className="error-box">{error}</p> : null}

        {loading ? (
          <Loading label="Finding movies" />
        ) : movies.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4">
            {movies.map((movie) => (
              <MovieCard key={movie.tmdbId ?? movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <EmptyState title="No movies found" body="Try removing a filter or searching a broader title." />
        )}
      </section>
    </div>
  );
}
