import { useEffect, useState } from "react";
import { Bell, Check, ChevronLeft, Disc3, Plus, Star, Tv } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";

import Loading from "../components/Loading.jsx";
import PriceChart from "../components/PriceChart.jsx";
import { useAuth } from "../hooks/useAuth.js";
import api, { getApiError } from "../services/api.js";

const fallbackPoster =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80";

export default function MovieDetails() {
  const { movieId } = useParams();
  const location = useLocation();
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
        if (active) { setMovie(movieData); setPriceData(null); }
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
    return () => { active = false; };
  }, [movieId]);

  async function addToLibrary() {
    setMessage(""); setError("");
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
    setMessage(""); setError("");
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

  if (error && !movie) return <p className="error-box">{error}</p>;
  if (!movie) return <Loading label="Loading movie details" />;

  const blurayListings = movie.blurayAvailability ?? [];
  const hasBluRay = blurayListings.length > 0;
  const hasPricedBluRay = blurayListings.some((deal) => deal.price !== null && deal.price !== undefined);
  const fromUpcoming = location.pathname.startsWith("/upcoming/");
  const backHref = fromUpcoming ? "/upcoming" : "/discover";
  const backLabel = fromUpcoming ? "Back to upcoming" : "Back to discover";

  return (
    <div className="animate-fade-up space-y-8 py-6">
      {/* Back */}
      <Link to={backHref} className="group inline-flex items-center gap-1.5 text-xs font-medium text-white/30 transition-all duration-200 hover:text-amber-400">
        <ChevronLeft size={14} className="transition-transform duration-200 group-hover:-translate-x-1" />
        {backLabel}
      </Link>

      {/* Hero */}
      <section className="grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Poster */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] shadow-card">
          <img
            src={movie.poster || fallbackPoster}
            alt={movie.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-noir-950/60 to-transparent" />
        </div>

        {/* Info */}
        <div className="space-y-6">
          {/* Genres */}
          <div className="flex flex-wrap gap-2">
            {(movie.genres ?? []).map((genre, i) => (
              <span key={genre} className="animate-pill-pop pill" style={{ animationDelay: `${i * 0.06}s` }}>{genre}</span>
            ))}
          </div>

          {/* Title */}
          <div>
            <h1 className="font-display text-5xl uppercase leading-none tracking-wide text-white sm:text-6xl">
              {movie.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-5 text-sm">
              <span className="text-white/40">{movie.releaseDate?.slice(0, 4) || "TBA"}</span>
              <span className="flex items-center gap-1.5 font-bold text-amber-400">
                <Star size={14} className="fill-amber-400" />
                {Number(movie.rating ?? 0).toFixed(1)}
              </span>
              {movie.runtime ? <span className="text-white/40">{movie.runtime} min</span> : null}
            </div>
          </div>

          {/* Overview */}
          <p className="max-w-2xl leading-7 text-white/50">{movie.overview}</p>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {isAuthenticated ? (
              <button type="button" className="btn-primary" onClick={addToLibrary}>
                <Plus size={16} />
                Add to library
              </button>
            ) : (
              <Link to="/login" className="btn-primary">
                <Plus size={16} />
                Login to add
              </Link>
            )}
          </div>

          {message ? <p className="success-box">{message}</p> : null}
          {error ? <p className="error-box">{error}</p> : null}
        </div>
      </section>

      {/* Price chart */}
      {hasPricedBluRay ? (
        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <PriceChart data={priceData} />
          <div className="space-y-4">
            <InfoPanel title="Blu-ray" icon={Disc3}>
              <BluRayListings listings={blurayListings} />
            </InfoPanel>
            <InfoPanel title="Price Alert" icon={Bell}>
              <AlertForm
                hasPricedBluRay={hasPricedBluRay}
                isAuthenticated={isAuthenticated}
                targetPrice={targetPrice}
                setTargetPrice={setTargetPrice}
                onSubmit={addAlert}
              />
            </InfoPanel>
          </div>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-3">
          <InfoPanel title="Streaming" icon={Tv}>
            <StreamingList items={movie.streamingAvailability ?? []} />
          </InfoPanel>
          <InfoPanel title="Blu-ray" icon={Disc3}>
            <BluRayListings listings={blurayListings} />
          </InfoPanel>
          <InfoPanel title="Price Alert" icon={Bell}>
            <AlertForm
              hasPricedBluRay={hasPricedBluRay}
              isAuthenticated={isAuthenticated}
              targetPrice={targetPrice}
              setTargetPrice={setTargetPrice}
              onSubmit={addAlert}
            />
          </InfoPanel>
        </section>
      )}

      {hasPricedBluRay ? (
        <InfoPanel title="Streaming" icon={Tv}>
          <StreamingList items={movie.streamingAvailability ?? []} />
        </InfoPanel>
      ) : null}
    </div>
  );
}

function InfoPanel({ title, icon: Icon, children }) {
  return (
    <div className="panel rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
          <Icon size={14} />
        </div>
        <h2 className="font-display text-lg uppercase tracking-wide text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function StreamingList({ items }) {
  if (!items.length) return <p className="text-sm text-white/25">No streaming providers found.</p>;
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={`${item.service}-${item.region}`} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
          <p className="text-sm font-medium text-white">{item.service}</p>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/25">
            {item.types?.join(", ") ?? item.type}
          </span>
        </div>
      ))}
    </div>
  );
}

function BluRayListings({ listings }) {
  if (!listings.length) return <p className="text-sm text-white/25">No Blu-ray listing yet.</p>;
  return (
    <div className="space-y-2">
      {listings.map((deal) => (
        <div key={`${deal.retailer}-${deal.format}`} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">{deal.format}</span>
            {deal.price !== null && deal.price !== undefined ? (
              <span className="font-display text-lg text-amber-400">
                {deal.priceDisplay ?? `C$${Number(deal.price).toFixed(2)}`}
              </span>
            ) : (
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Available</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-white/25">
            {deal.price !== null && deal.price !== undefined
              ? `${deal.sourceLabel ?? deal.retailerLabel ?? deal.retailer}`
              : `US release ${deal.releaseDate ?? "confirmed"}`}
          </p>
        </div>
      ))}
    </div>
  );
}

function AlertForm({ hasPricedBluRay, isAuthenticated, targetPrice, setTargetPrice, onSubmit }) {
  if (!hasPricedBluRay) {
    return <p className="text-sm text-white/25">Available once retailer pricing is found.</p>;
  }
  if (!isAuthenticated) {
    return (
      <Link to="/login" className="btn-secondary w-full text-xs">
        Login to create alerts
      </Link>
    );
  }
  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <label className="block space-y-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">Target price (CAD)</span>
        <input
          className="field"
          type="number"
          min="1"
          step="0.01"
          value={targetPrice}
          onChange={(e) => setTargetPrice(e.target.value)}
        />
      </label>
      <button type="submit" className="btn-primary w-full text-xs">
        <Check size={14} />
        Set alert
      </button>
    </form>
  );
}
