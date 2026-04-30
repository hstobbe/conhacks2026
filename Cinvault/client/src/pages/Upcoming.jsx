import { useEffect, useState } from "react";

import EmptyState from "../components/EmptyState.jsx";
import Loading from "../components/Loading.jsx";
import MovieCard from "../components/MovieCard.jsx";
import api, { getApiError } from "../services/api.js";

export default function Upcoming() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/movies/upcoming")
      .then(({ data }) => { if (active) setMovies(data.results); })
      .catch((err) => { if (active) setError(getApiError(err, "Could not load upcoming movies.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-6 py-6">
      <div>
        <p className="section-label mb-1">TMDb</p>
        <h1 className="font-display text-5xl uppercase leading-none tracking-wide text-white">Upcoming</h1>
        <p className="mt-2 text-sm text-white/30">Upcoming theatrical releases from TMDb.</p>
      </div>
      {error ? <p className="error-box">{error}</p> : null}
      {loading ? (
        <Loading label="Loading upcoming movies" />
      ) : movies.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {movies.map((movie) => (
              <MovieCard key={movie.tmdbId ?? movie.id} movie={movie} to={`/upcoming/${movie.tmdbId ?? movie.id}`} showReleaseDate />
            ))}
          </div>
      ) : (
        <EmptyState title="No upcoming movies found" body="Add a TMDb key or check back after the catalog refreshes." />
      )}
    </div>
  );
}
