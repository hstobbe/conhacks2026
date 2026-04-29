import { useEffect, useState } from "react";
import { Search } from "lucide-react";

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
      const params = Object.fromEntries(
        Object.entries(customFilters).filter(([, value]) => value !== ""),
      );
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
    api
      .get("/movies/filter")
      .then(({ data }) => {
        if (active) setMovies(data.results);
      })
      .catch((err) => {
        if (active) setError(getApiError(err, "Could not load filtered movies."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
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

  function applyFilters(event) {
    event.preventDefault();
    loadFiltered(filters);
  }

  function resetFilters() {
    setFilters(initialFilters);
    setQuery("");
    loadFiltered(initialFilters);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <FilterSidebar filters={filters} setFilters={setFilters} onSubmit={applyFilters} onReset={resetFilters} />

      <section className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black text-white">Movies</h1>
            <p className="mt-1 text-sm text-slate-400">Search TMDb and filter by genre, year, rating, streaming, and Blu-ray availability.</p>
          </div>
          <form className="flex w-full gap-2 sm:max-w-md" onSubmit={searchMovies}>
            <input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by title or genre" />
            <button type="submit" className="btn-primary">
              <Search size={17} />
              Search
            </button>
          </form>
        </div>

        {error ? <p className="rounded-md border border-rose-400/30 bg-rose-500/10 p-4 text-rose-100">{error}</p> : null}
        {loading ? (
          <Loading label="Finding movies" />
        ) : movies.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {movies.map((movie) => (
              <MovieCard key={movie.tmdbId ?? movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <EmptyState title="No movies found" body="Try removing a filter or searching for a broader title." />
        )}
      </section>
    </div>
  );
}
