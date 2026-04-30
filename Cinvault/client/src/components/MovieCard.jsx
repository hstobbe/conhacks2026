import { Star } from "lucide-react";
import { Link } from "react-router-dom";

const fallbackPoster =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80";

function formatReleaseDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export default function MovieCard({ movie, to, badge, showReleaseDate = false }) {
  const id = movie.tmdbId ?? movie.malId ?? movie.id;
  const releaseDate = movie.releaseDate || movie.release_date || movie.firstAirDate || movie.first_air_date;
  const year = releaseDate?.slice(0, 4) || movie.year || "TBA";
  const releaseDateLabel = formatReleaseDate(releaseDate);
  const ratingValue = Number(movie.rating ?? movie.vote_average ?? movie.score ?? 0);
  const rating = ratingValue ? ratingValue.toFixed(1) : "N/A";

  return (
    <Link
      to={to ?? `/movies/${id}`}
      className="group relative block w-40 shrink-0 overflow-hidden rounded-xl border border-white/[0.07] bg-noir-900 shadow-card transition-all duration-300 hover:-translate-y-2 hover:border-amber-500/40 hover:shadow-glow sm:w-44"
    >
      {/* Poster */}
      <div className="aspect-[2/3] overflow-hidden bg-noir-800">
        <img
          src={movie.poster || fallbackPoster}
          alt={movie.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          loading="lazy"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-noir-950 via-noir-950/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {/* Amber accent line at bottom on hover */}
        <div className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-gradient-to-r from-amber-500 to-amber-300 transition-transform duration-300 group-hover:scale-x-100" />
      </div>

      {/* Rating badge */}
      <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded-md bg-noir-950/80 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 backdrop-blur-sm">
        <Star size={9} className="fill-amber-400 text-amber-400" />
        {rating}
      </div>

      {/* Badge (TV/Anime) */}
      {badge ? (
        <div className="absolute left-2 top-2 rounded-md bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-noir-950 backdrop-blur-sm">
          {badge}
        </div>
      ) : null}

      {/* Info */}
      <div className="p-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-xs font-semibold leading-snug text-white/90 transition-colors group-hover:text-amber-200">
          {movie.title}
        </h3>
        <p className="mt-1 text-[10px] font-medium text-white/30">{year}</p>
        {showReleaseDate ? (
          <p className="mt-1 text-[10px] font-semibold text-amber-400/80">
            {releaseDateLabel ? `${releaseDateLabel}` : "TBA"}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
