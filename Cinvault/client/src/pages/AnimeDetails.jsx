import { useEffect, useState } from "react";
import { ChevronLeft, ExternalLink, PlayCircle, Star } from "lucide-react";
import { Link, useParams } from "react-router-dom";

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
    return () => { active = false; };
  }, [animeId]);

  if (error && !anime) return <p className="error-box">{error}</p>;
  if (!anime) return <Loading label="Loading anime details" />;

  return (
    <div className="animate-fade-up space-y-8 py-6">
      <Link to="/anime" className="group inline-flex items-center gap-1.5 text-xs font-medium text-white/30 transition-all duration-200 hover:text-amber-400">
        <ChevronLeft size={14} className="transition-transform duration-200 group-hover:-translate-x-1" />
        Back to anime
      </Link>

      <section className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <div className="overflow-hidden rounded-2xl border border-white/[0.07] shadow-card">
          <img src={anime.poster || fallbackPoster} alt={anime.title} className="h-full w-full object-cover" />
        </div>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {(anime.genres ?? []).map((genre, i) => (
              <span key={genre} className="animate-pill-pop pill" style={{ animationDelay: `${i * 0.06}s` }}>{genre}</span>
            ))}
          </div>

          <div>
            <h1 className="font-display text-5xl uppercase leading-none tracking-wide text-white sm:text-6xl">
              {anime.title}
            </h1>
            {anime.originalTitle && (
              <p className="mt-2 text-sm text-white/25">{anime.originalTitle}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-5 text-sm">
              <span className="text-white/40">{anime.type}</span>
              <span className="text-white/40">{anime.year || anime.aired || "TBA"}</span>
              <span className="text-white/40">{anime.episodes ?? "?"} eps</span>
              <span className="flex items-center gap-1.5 font-bold text-amber-400">
                <Star size={14} className="fill-amber-400" />
                {anime.score ?? "N/A"}
              </span>
              <span className="pill-amber">{anime.status}</span>
            </div>
          </div>

          <p className="max-w-2xl leading-7 text-white/50">{anime.synopsis}</p>

          <div className="flex flex-wrap gap-3">
            {anime.trailer ? (
              <a className="btn-primary" href={anime.trailer} target="_blank" rel="noreferrer">
                <PlayCircle size={16} />
                Trailer
              </a>
            ) : null}
            {anime.url ? (
              <a className="btn-secondary" href={anime.url} target="_blank" rel="noreferrer">
                <ExternalLink size={16} />
                MyAnimeList
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Episodes */}
        <div className="panel rounded-2xl p-5">
          <h2 className="mb-5 font-display text-2xl uppercase tracking-wide text-white">Episodes</h2>
          {episodes.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {episodes.slice(0, 12).map((episode) => (
                <div key={episode.malId} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70">Ep {episode.malId}</p>
                  <p className="mt-1 text-sm font-medium text-white">{episode.title}</p>
                  <p className="mt-0.5 text-[11px] text-white/25">
                    {episode.aired ? new Date(episode.aired).toLocaleDateString() : "Air date unavailable"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/25">No episode metadata found.</p>
          )}
        </div>

        {/* Sidebar panels */}
        <div className="space-y-4">
          <SidePanel title="Studios">
            <div className="flex flex-wrap gap-2">
              {(anime.studios ?? []).length ? (
                anime.studios.map((studio) => <span key={studio} className="pill">{studio}</span>)
              ) : (
                <p className="text-sm text-white/25">No studio metadata found.</p>
              )}
            </div>
          </SidePanel>

          <SidePanel title="Streaming">
            <div className="space-y-2">
              {(anime.streaming ?? []).length ? (
                anime.streaming.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-sm font-medium text-white transition hover:border-amber-500/30 hover:text-amber-300"
                  >
                    {link.name}
                  </a>
                ))
              ) : (
                <p className="text-sm text-white/25">No streaming links found.</p>
              )}
            </div>
          </SidePanel>

          <SidePanel title="Broadcast">
            <p className="text-sm text-white/40">{anime.broadcast?.string || anime.duration || "Unavailable"}</p>
          </SidePanel>
        </div>
      </section>
    </div>
  );
}

function SidePanel({ title, children }) {
  return (
    <div className="panel rounded-2xl p-5">
      <h2 className="mb-4 font-display text-lg uppercase tracking-wide text-white">{title}</h2>
      {children}
    </div>
  );
}
