import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Bell, Check, Disc3, Plus, Star, Tv } from "lucide-react";

import Loading from "../components/Loading.jsx";
import PriceChart from "../components/PriceChart.jsx";
import { useAuth } from "../hooks/useAuth.js";
import api, { getApiError } from "../services/api.js";

const fallbackPoster =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80";

export default function MovieDetails() {
  const { movieId } = useParams();
  const { isAuthenticated } = useAuth();
  const [movie, setMovie] = useState(null);
  const [priceData, setPriceData] = useState(null);
  const [targetPrice, setTargetPrice] = useState("19.99");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const movieResponse = await api.get(`/movies/${movieId}`);
        const movieData = movieResponse.data;
        if (active) {
          setMovie(movieData);
          setPriceData(null);
        }

        const hasPricedListing = (movieData.blurayAvailability ?? []).some(
          (deal) => deal.price !== null && deal.price !== undefined,
        );
        if (hasPricedListing) {
          const priceResponse = await api.get(`/bluray/price-history/${movieId}`);
          if (active) setPriceData(priceResponse.data);
        }
      } catch (err) {
        if (active) setError(getApiError(err, "Could not load movie details."));
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [movieId]);

  async function addToLibrary() {
    setMessage("");
    setError("");
    try {
      await api.post("/library", {
        tmdbId: Number(movieId),
        title: movie.title,
        poster: movie.poster,
        genres: movie.genres ?? [],
        releaseDate: movie.releaseDate,
        userRating: movie.rating ? Math.min(10, Number(movie.rating)) : null,
        status: "want_to_watch",
        notes: "",
      });
      setMessage("Added to your library.");
    } catch (err) {
      setError(getApiError(err, "Could not add movie to library."));
    }
  }

  async function addAlert(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await api.post("/alerts", {
        movieId: Number(movieId),
        title: movie.title,
        targetPrice: Number(targetPrice),
        format: movie.blurayAvailability?.[0]?.format ?? "4K UHD",
        retailer: movie.blurayAvailability?.[0]?.retailer ?? "Any",
      });
      setMessage("Price alert created.");
    } catch (err) {
      setError(getApiError(err, "Could not create price alert."));
    }
  }

  if (error && !movie) {
    return <p className="rounded-md border border-rose-400/30 bg-rose-500/10 p-4 text-rose-100">{error}</p>;
  }

  if (!movie) return <Loading label="Loading movie details" />;

  const blurayListings = movie.blurayAvailability ?? [];
  const hasBluRay = blurayListings.length > 0;
  const hasPricedBluRay = blurayListings.some((deal) => deal.price !== null && deal.price !== undefined);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-950 shadow-2xl shadow-black/30">
          <img src={movie.poster || fallbackPoster} alt={movie.title} className="h-full w-full object-cover" />
        </div>

        <div className="space-y-5">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              {(movie.genres ?? []).map((genre) => (
                <span key={genre} className="pill">
                  {genre}
                </span>
              ))}
            </div>
            <h1 className="text-4xl font-black text-white">{movie.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-300">
              <span>{movie.releaseDate?.slice(0, 4) || "TBA"}</span>
              <span className="inline-flex items-center gap-1 text-blue-200">
                <Star size={16} className="fill-blue-300 text-blue-300" />
                {Number(movie.rating ?? 0).toFixed(1)}
              </span>
              {movie.runtime ? <span>{movie.runtime} min</span> : null}
            </div>
          </div>

          <p className="max-w-3xl text-base leading-7 text-slate-300">{movie.overview}</p>

          <div className="flex flex-wrap gap-3">
            {isAuthenticated ? (
              <button type="button" className="btn-primary" onClick={addToLibrary}>
                <Plus size={17} />
                Add to library
              </button>
            ) : (
              <Link to="/login" className="btn-primary">
                Login to add
              </Link>
            )}
            <Link to="/discover" className="btn-secondary">
              Back to discover
            </Link>
          </div>

          {message ? <p className="rounded-md border border-emerald-400/30 bg-emerald-500/10 p-3 text-emerald-100">{message}</p> : null}
          {error ? <p className="rounded-md border border-rose-400/30 bg-rose-500/10 p-3 text-rose-100">{error}</p> : null}
        </div>
      </section>

      <section className={hasPricedBluRay ? "grid gap-6 lg:grid-cols-[1fr_340px]" : "grid gap-6"}>
        {hasPricedBluRay ? <PriceChart data={priceData} /> : null}

        <div className={hasPricedBluRay ? "space-y-6" : "grid gap-6 lg:grid-cols-3"}>
          <Panel title="Streaming availability" icon={Tv}>
            <div className="space-y-3">
              {(movie.streamingAvailability ?? []).map((item) => (
                <div key={`${item.service}-${item.region}`} className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-3">
                  <div>
                    <p className="font-semibold text-white">{item.service}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Source: {(item.sources ?? [item.source ?? "Unknown"]).join(" + ")}
                    </p>
                  </div>
                  <span className="text-xs uppercase text-slate-400">{item.types?.join(", ") ?? item.type}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Blu-ray availability" icon={Disc3}>
            <div className="space-y-3">
              {hasBluRay ? (
                blurayListings.map((deal) => (
                  <div key={`${deal.retailer}-${deal.format}`} className="rounded-md border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-white">{deal.format}</span>
                      {deal.price !== null && deal.price !== undefined ? (
                        <span className="font-black text-blue-200">${deal.price}</span>
                      ) : (
                        <span className="text-xs font-bold uppercase text-blue-200">Available</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-400">
                      {deal.price !== null && deal.price !== undefined
                        ? `${deal.retailer} discount ${deal.discount}%`
                        : `US physical release ${deal.releaseDate ?? "confirmed"}`}
                    </p>
                    {deal.source ? <p className="mt-1 text-xs text-slate-500">Source: {deal.source}</p> : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No Blu-ray listing yet.</p>
              )}
            </div>
          </Panel>

          <Panel title="Price alert" icon={Bell}>
            {!hasPricedBluRay ? (
              <p className="text-sm text-slate-400">Price alerts become available when retailer pricing is found.</p>
            ) : isAuthenticated ? (
              <form className="space-y-3" onSubmit={addAlert}>
                <input
                  className="field"
                  type="number"
                  min="1"
                  step="0.01"
                  value={targetPrice}
                  onChange={(event) => setTargetPrice(event.target.value)}
                  aria-label="Target price"
                />
                <button type="submit" className="btn-primary w-full">
                  <Check size={17} />
                  Add alert
                </button>
              </form>
            ) : (
              <Link to="/login" className="btn-secondary w-full">
                Login to create alerts
              </Link>
            )}
          </Panel>
        </div>
      </section>
    </div>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <div className="panel rounded-lg p-4">
      <div className="mb-4 flex items-center gap-2">
        <Icon size={18} className="text-blue-300" />
        <h2 className="font-black text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}
