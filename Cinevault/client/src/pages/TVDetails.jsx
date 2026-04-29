import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarDays, PlayCircle, Star, Tv } from "lucide-react";

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
    api
      .get(`/tv/${seriesId}`)
      .then(({ data }) => {
        if (active) setShow(data);
      })
      .catch((err) => {
        if (active) setError(getApiError(err, "Could not load TV show."));
      });
    return () => {
      active = false;
    };
  }, [seriesId]);

  if (error && !show) {
    return <p className="rounded-md border border-rose-400/30 bg-rose-500/10 p-4 text-rose-100">{error}</p>;
  }

  if (!show) return <Loading label="Loading TV show" />;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-950 shadow-2xl shadow-black/30">
          <img src={show.poster || fallbackPoster} alt={show.title} className="h-full w-full object-cover" />
        </div>

        <div className="space-y-5">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              {(show.genres ?? []).map((genre) => (
                <span key={genre} className="pill">
                  {genre}
                </span>
              ))}
            </div>
            <h1 className="text-4xl font-black text-white">{show.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-300">
              <span className="inline-flex items-center gap-1">
                <CalendarDays size={16} />
                {show.firstAirDate?.slice(0, 4) || "TBA"}
              </span>
              <span className="inline-flex items-center gap-1 text-blue-200">
                <Star size={16} className="fill-blue-300 text-blue-300" />
                {Number(show.rating ?? 0).toFixed(1)}
              </span>
              <span>{show.numberOfSeasons} seasons</span>
              <span>{show.numberOfEpisodes} episodes</span>
              <span>{show.status}</span>
            </div>
          </div>

          <p className="max-w-3xl text-base leading-7 text-slate-300">{show.overview}</p>

          <div className="flex flex-wrap gap-3">
            <Link to="/tv" className="btn-secondary">
              Back to TV
            </Link>
            {show.trailers?.[0] ? (
              <a className="btn-primary" href={`https://www.youtube.com/watch?v=${show.trailers[0].key}`} target="_blank" rel="noreferrer">
                <PlayCircle size={17} />
                Trailer
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="panel rounded-lg p-4">
          <div className="mb-4 flex items-center gap-2">
            <Tv size={18} className="text-blue-300" />
            <h2 className="font-black text-white">Seasons</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {(show.seasons ?? []).filter((season) => season.seasonNumber > 0).map((season) => (
              <div key={season.id} className="rounded-md border border-white/10 bg-white/5 p-3">
                <p className="font-bold text-white">{season.name}</p>
                <p className="mt-1 text-sm text-slate-400">{season.episodeCount} episodes</p>
                <p className="text-xs text-slate-500">{season.airDate || "Air date TBA"}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Panel title="Streaming">
            <div className="space-y-3">
              {(show.streamingAvailability ?? []).length ? (
                show.streamingAvailability.map((item) => (
                  <div key={`${item.service}-${item.type}`} className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/5 p-3">
                    <span className="font-semibold text-white">{item.service}</span>
                    <span className="text-xs uppercase text-slate-400">{item.type}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No streaming providers found for this region.</p>
              )}
            </div>
          </Panel>

          <Panel title="Networks">
            <div className="space-y-2">
              {(show.networks ?? []).length ? (
                show.networks.map((network) => (
                  <p key={network.id} className="rounded-md border border-white/10 bg-white/5 p-3 text-sm font-semibold text-white">
                    {network.name}
                  </p>
                ))
              ) : (
                <p className="text-sm text-slate-400">No network metadata found.</p>
              )}
            </div>
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
