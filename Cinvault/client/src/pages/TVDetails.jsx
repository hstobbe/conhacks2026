import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, PlayCircle, Star, Tv } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import Loading from "../components/Loading.jsx";
import api, { getApiError } from "../services/api.js";

const fallbackPoster =
  "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=600&q=80";

export default function TVDetails() {
  const { seriesId } = useParams();
  const [show, setShow] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.get(`/tv/${seriesId}`)
      .then(({ data }) => { if (active) setShow(data); })
      .catch((err) => { if (active) setError(getApiError(err, "Could not load TV show.")); });
    return () => { active = false; };
  }, [seriesId]);

  if (error && !show) return <p className="error-box">{error}</p>;
  if (!show) return <Loading label="Loading TV show" />;

  return (
    <div className="animate-fade-up space-y-8 py-6">
      <Link to="/tv" className="group inline-flex items-center gap-1.5 text-xs font-medium text-white/30 transition-all duration-200 hover:text-amber-400">
        <ChevronLeft size={14} className="transition-transform duration-200 group-hover:-translate-x-1" />
        Back to TV
      </Link>

      <section className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <div className="overflow-hidden rounded-2xl border border-white/[0.07] shadow-card">
          <img src={show.poster || fallbackPoster} alt={show.title} className="h-full w-full object-cover" />
        </div>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {(show.genres ?? []).map((genre, i) => (
              <span key={genre} className="animate-pill-pop pill" style={{ animationDelay: `${i * 0.06}s` }}>{genre}</span>
            ))}
          </div>

          <div>
            <h1 className="font-display text-5xl uppercase leading-none tracking-wide text-white sm:text-6xl">
              {show.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-5 text-sm">
              <span className="flex items-center gap-1.5 text-white/40">
                <CalendarDays size={14} />
                {show.firstAirDate?.slice(0, 4) || "TBA"}
              </span>
              <span className="flex items-center gap-1.5 font-bold text-amber-400">
                <Star size={14} className="fill-amber-400" />
                {Number(show.rating ?? 0).toFixed(1)}
              </span>
              <span className="text-white/40">{show.numberOfSeasons} seasons</span>
              <span className="text-white/40">{show.numberOfEpisodes} eps</span>
              <span className="pill-amber">{show.status}</span>
            </div>
          </div>

          <p className="max-w-2xl leading-7 text-white/50">{show.overview}</p>

          <div className="flex flex-wrap gap-3">
            {show.trailers?.[0] ? (
              <a
                className="btn-primary"
                href={`https://www.youtube.com/watch?v=${show.trailers[0].key}`}
                target="_blank"
                rel="noreferrer"
              >
                <PlayCircle size={16} />
                Trailer
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Seasons */}
        <div className="panel rounded-2xl p-5">
          <div className="mb-5 flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <Tv size={14} />
            </div>
            <h2 className="font-display text-2xl uppercase tracking-wide text-white">Seasons</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {(show.seasons ?? []).filter((s) => s.seasonNumber > 0).map((season) => (
              <div key={season.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <p className="text-sm font-semibold text-white">{season.name}</p>
                <p className="mt-1 text-xs text-white/40">{season.episodeCount} episodes</p>
                <p className="text-[11px] text-white/25">{season.airDate || "Air date TBA"}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <SidePanel title="Streaming">
            <div className="space-y-2">
              {(show.streamingAvailability ?? []).length ? (
                show.streamingAvailability.map((item) => (
                  <div key={`${item.service}-${item.type}`} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                    <span className="text-sm font-medium text-white">{item.service}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/25">{item.type}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-white/25">No streaming providers found.</p>
              )}
            </div>
          </SidePanel>

          <SidePanel title="Networks">
            <div className="space-y-2">
              {(show.networks ?? []).length ? (
                show.networks.map((network) => (
                  <p key={network.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-sm font-medium text-white">
                    {network.name}
                  </p>
                ))
              ) : (
                <p className="text-sm text-white/25">No network metadata found.</p>
              )}
            </div>
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
