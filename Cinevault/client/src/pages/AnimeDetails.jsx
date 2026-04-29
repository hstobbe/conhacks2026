import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ExternalLink, PlayCircle, Star } from "lucide-react";

import Loading from "../components/Loading.jsx";
import api, { getApiError } from "../services/api.js";

const fallbackPoster =
  "https://images.unsplash.com/photo-1541562232579-512a21360020?auto=format&fit=crop&w=600&q=80";

export default function AnimeDetails() {
  const { animeId } = useParams();
  const [anime, setAnime] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [animeResponse, episodesResponse] = await Promise.all([
          api.get(`/anime/${animeId}`),
          api.get(`/anime/${animeId}/episodes`),
        ]);
        if (active) {
          setAnime(animeResponse.data);
          setEpisodes(episodesResponse.data.results);
        }
      } catch (err) {
        if (active) setError(getApiError(err, "Could not load anime."));
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [animeId]);

  if (error && !anime) {
    return <p className="rounded-md border border-rose-400/30 bg-rose-500/10 p-4 text-rose-100">{error}</p>;
  }

  if (!anime) return <Loading label="Loading anime details" />;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-950 shadow-2xl shadow-black/30">
          <img src={anime.poster || fallbackPoster} alt={anime.title} className="h-full w-full object-cover" />
        </div>

        <div className="space-y-5">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              {(anime.genres ?? []).map((genre) => (
                <span key={genre} className="pill">
                  {genre}
                </span>
              ))}
            </div>
            <h1 className="text-4xl font-black text-white">{anime.title}</h1>
            <p className="mt-1 text-sm text-slate-400">{anime.originalTitle}</p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-300">
              <span>{anime.type}</span>
              <span>{anime.year || anime.aired || "TBA"}</span>
              <span>{anime.episodes ?? "?"} episodes</span>
              <span className="inline-flex items-center gap-1 text-blue-200">
                <Star size={16} className="fill-blue-300 text-blue-300" />
                {anime.score ?? "N/A"}
              </span>
              <span>{anime.status}</span>
            </div>
          </div>

          <p className="max-w-3xl text-base leading-7 text-slate-300">{anime.synopsis}</p>

          <div className="flex flex-wrap gap-3">
            <Link to="/anime" className="btn-secondary">
              Back to anime
            </Link>
            {anime.trailer ? (
              <a className="btn-primary" href={anime.trailer} target="_blank" rel="noreferrer">
                <PlayCircle size={17} />
                Trailer
              </a>
            ) : null}
            {anime.url ? (
              <a className="btn-secondary" href={anime.url} target="_blank" rel="noreferrer">
                <ExternalLink size={17} />
                MAL
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="panel rounded-lg p-4">
          <h2 className="mb-4 text-lg font-black text-white">Episodes</h2>
          {episodes.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {episodes.slice(0, 12).map((episode) => (
                <div key={episode.malId} className="rounded-md border border-white/10 bg-white/5 p-3">
                  <p className="text-xs font-bold uppercase text-blue-200">Episode {episode.malId}</p>
                  <p className="mt-1 font-semibold text-white">{episode.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{episode.aired ? new Date(episode.aired).toLocaleDateString() : "Air date unavailable"}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No episode metadata found.</p>
          )}
        </div>

        <div className="space-y-6">
          <Panel title="Studios">
            <div className="flex flex-wrap gap-2">
              {(anime.studios ?? []).length ? (
                anime.studios.map((studio) => (
                  <span key={studio} className="pill">
                    {studio}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-400">No studio metadata found.</p>
              )}
            </div>
          </Panel>

          <Panel title="Streaming links">
            <div className="space-y-2">
              {(anime.streaming ?? []).length ? (
                anime.streaming.map((link) => (
                  <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="block rounded-md border border-white/10 bg-white/5 p-3 text-sm font-semibold text-white transition hover:border-blue-400/50">
                    {link.name}
                  </a>
                ))
              ) : (
                <p className="text-sm text-slate-400">No Jikan streaming links found.</p>
              )}
            </div>
          </Panel>

          <Panel title="Broadcast">
            <p className="text-sm text-slate-300">{anime.broadcast?.string || anime.duration || "Broadcast metadata unavailable."}</p>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="panel rounded-lg p-4">
      <h2 className="mb-4 font-black text-white">{title}</h2>
      {children}
    </div>
  );
}
