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
    api
      .get("/movies/upcoming")
      .then(({ data }) => {
        if (active) setMovies(data.results);
      })
      .catch((err) => {
        if (active) setError(getApiError(err, "Could not load upcoming movies."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black text-white">Upcoming releases</h1>
        <p className="mt-1 text-sm text-slate-400">Pulled from TMDb when configured, otherwise backed by mock release data.</p>
      </div>
      {error ? <p className="rounded-md border border-rose-400/30 bg-rose-500/10 p-4 text-rose-100">{error}</p> : null}
      {loading ? (
        <Loading label="Loading upcoming movies" />
      ) : movies.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {movies.map((movie) => (
            <MovieCard key={movie.tmdbId ?? movie.id} movie={movie} showReleaseDate />
          ))}
        </div>
      ) : (
        <EmptyState title="No upcoming movies found" body="Add a TMDb key or check back after the catalog refreshes." />
      )}
    </div>
  );
}
