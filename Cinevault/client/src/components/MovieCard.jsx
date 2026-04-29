import { Star } from "lucide-react";
import { Link } from "react-router-dom";

const fallbackPoster =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80";

function formatReleaseDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function MovieCard({ movie, to, badge, showReleaseDate = false }) {
  const id = movie.tmdbId ?? movie.malId ?? movie.id;
  const releaseDate = movie.releaseDate || movie.release_date || movie.firstAirDate || movie.first_air_date;
  const year =
    releaseDate?.slice(0, 4)
    || movie.year
    || "TBA";
  const releaseDateLabel = formatReleaseDate(releaseDate);
  const ratingValue = Number(movie.rating ?? movie.vote_average ?? movie.score ?? 0);
  const rating = ratingValue ? ratingValue.toFixed(1) : "N/A";

  return (
    <Link
      to={to ?? `/movies/${id}`}
      className="group block w-40 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-slate-950/70 transition hover:-translate-y-1 hover:border-blue-400/50 hover:shadow-glow sm:w-44"
    >
      <div className="aspect-[2/3] overflow-hidden bg-slate-900">
        <img
          src={movie.poster || fallbackPoster}
          alt={movie.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="space-y-2 p-3">
        {badge ? <span className="pill inline-block py-0.5">{badge}</span> : null}
        <h3 className="line-clamp-2 min-h-10 text-sm font-bold text-white">{movie.title}</h3>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{year}</span>
          <span className="inline-flex items-center gap-1 text-blue-200">
            <Star size={13} className="fill-blue-300 text-blue-300" />
            {rating}
          </span>
        </div>
        {showReleaseDate ? (
          <p className="text-xs font-semibold text-purple-200">
            {releaseDateLabel ? `Releases ${releaseDateLabel}` : "Release date TBA"}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
