import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";

import EmptyState from "../components/EmptyState.jsx";
import Loading from "../components/Loading.jsx";
import MovieCard from "../components/MovieCard.jsx";
import MovieRow from "../components/MovieRow.jsx";
import api, { getApiError } from "../services/api.js";

export default function Discover() {
  const [sections, setSections] = useState(null);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api
      .get("/movies/home")
      .then(({ data }) => {
        if (active) setSections(data);
      })
      .catch((err) => {
        if (active) setError(getApiError(err, "Could not load recommendations."));
      });
    return () => {
      active = false;
    };
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
    <div className="space-y-10">
      <section className="panel rounded-lg p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_440px] lg:items-end">
          <div>
            <p className="pill mb-3 inline-block">Discover</p>
            <h1 className="text-3xl font-black text-white sm:text-4xl">Search movies, then scroll recommendations</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Search for a movie at the top, or browse recommended rows across movies, TV shows, and anime below.
            </p>
          </div>
          <form className="flex gap-2" onSubmit={searchMovies}>
            <input
              className="field"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search movies"
            />
            <button type="submit" className="btn-primary" disabled={searching}>
              <Search size={17} />
              {searching ? "Searching" : "Search"}
            </button>
          </form>
        </div>
      </section>

      {error ? <p className="rounded-md border border-rose-400/30 bg-rose-500/10 p-4 text-rose-100">{error}</p> : null}

      {hasSearched ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white">Movie Search Results</h2>
              <p className="mt-1 text-sm text-slate-400">Results for {query}</p>
            </div>
            <Link to="/movies" className="btn-secondary">
              Advanced filters
              <ArrowRight size={16} />
            </Link>
          </div>
          {searching ? (
            <Loading label="Searching movies" />
          ) : searchResults.length ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {searchResults.map((movie) => (
                <MovieCard key={movie.tmdbId ?? movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <EmptyState title="No movies found" body="Try a different title or use the advanced movie filters." />
          )}
        </section>
      ) : null}

      {sections ? (
        <div className="space-y-12">
          <SectionHeader title="Recommended Movies" to="/movies" />
          {(sections.movieRows ?? []).map((row) => (
            <MovieRow
              key={row.key}
              title={row.title}
              subtitle={row.subtitle}
              movies={row.items}
              mediaType={row.mediaType}
            />
          ))}

          <SectionHeader title="Recommended TV Shows" to="/tv" />
          {(sections.tvRows ?? []).map((row) => (
            <MovieRow
              key={row.key}
              title={row.title}
              subtitle={row.subtitle}
              movies={row.items}
              mediaType={row.mediaType}
              badge="TV"
            />
          ))}

          <SectionHeader title="Recommended Anime" to="/anime" />
          {(sections.animeRows ?? []).map((row) => (
            <MovieRow
              key={row.key}
              title={row.title}
              subtitle={row.subtitle}
              movies={row.items}
              mediaType={row.mediaType}
              badge="Anime"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SectionHeader({ title, to }) {
  return (
    <div className="flex items-center justify-between border-t border-white/10 pt-8">
      <h2 className="text-2xl font-black text-white">{title}</h2>
      <Link to={to} className="btn-secondary">
        View all
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
