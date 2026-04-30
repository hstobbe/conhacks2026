import MovieCard from "./MovieCard.jsx";

function itemLink(item, mediaType) {
  if (mediaType === "tv") return `/tv/${item.tmdbId ?? item.id}`;
  if (mediaType === "anime") return `/anime/${item.malId ?? item.id}`;
  return `/movies/${item.tmdbId ?? item.id}`;
}

function itemKey(item, mediaType) {
  return `${mediaType}-${item.tmdbId ?? item.malId ?? item.id}`;
}

export default function MovieRow({ title, movies = [], subtitle, mediaType = "movie", badge }) {
  if (!movies.length) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl uppercase tracking-wide text-white">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-white/35">{subtitle}</p> : null}
        </div>
      </div>
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {movies.map((movie) => (
          <MovieCard
            key={itemKey(movie, mediaType)}
            movie={movie}
            to={itemLink(movie, mediaType)}
            badge={badge ?? (mediaType === "movie" ? null : mediaType.toUpperCase())}
          />
        ))}
      </div>
    </section>
  );
}
