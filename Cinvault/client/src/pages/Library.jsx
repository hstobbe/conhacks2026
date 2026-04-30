import { useEffect, useState } from "react";
import { Save, Star, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import EmptyState from "../components/EmptyState.jsx";
import LibraryTabs from "../components/LibraryTabs.jsx";
import Loading from "../components/Loading.jsx";
import api, { getApiError } from "../services/api.js";

const statuses = ["want_to_watch", "watching", "watched", "favorite"];

const statusLabels = {
  want_to_watch: "Want to watch",
  watching: "Watching",
  watched: "Watched",
  favorite: "Favorite",
};

const statusColors = {
  want_to_watch: "text-white/40",
  watching: "text-blue-400",
  watched: "text-emerald-400",
  favorite: "text-amber-400",
};

export default function Library() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/library")
      .then(({ data }) => { if (active) setItems(data.results); })
      .catch((err) => { if (active) setError(getApiError(err, "Could not load your library.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function updateLocal(id, key, value) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  }

  async function save(item) {
    setMessage(""); setError("");
    try {
      await api.put(`/library/${item.id}`, {
        userRating: item.userRating === "" ? null : Number(item.userRating),
        status: item.status,
        notes: item.notes ?? "",
      });
      setMessage(`Saved ${item.title}.`);
    } catch (err) {
      setError(getApiError(err, "Could not save library item."));
    }
  }

  async function remove(id) {
    setMessage(""); setError("");
    try {
      await api.delete(`/library/${id}`);
      setItems((current) => current.filter((item) => item.id !== id));
      setMessage("Removed from library.");
    } catch (err) {
      setError(getApiError(err, "Could not remove library item."));
    }
  }

  if (loading) return <Loading label="Loading your library" />;

  return (
    <div className="space-y-6 py-6">
      <div>
        <p className="section-label mb-1">Personal</p>
        <h1 className="font-display text-5xl uppercase leading-none tracking-wide text-white">Library</h1>
        <p className="mt-2 text-sm text-white/30">Rate titles, update status, and keep personal notes.</p>
      </div>

      <LibraryTabs />

      {message ? <p className="success-box">{message}</p> : null}
      {error ? <p className="error-box">{error}</p> : null}

      {items.length ? (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={item.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
            <LibraryRow item={item} onUpdate={updateLocal} onSave={save} onRemove={remove} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Your library is empty"
          body="Add movies from any detail page and they will appear here."
          action={<Link to="/discover" className="btn-primary">Discover movies</Link>}
        />
      )}
    </div>
  );
}

function LibraryRow({ item, onUpdate, onSave, onRemove }) {
  return (
    <div className="panel rounded-2xl p-4 transition-all duration-200 hover:border-white/[0.1]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* Title + genres */}
        <div className="flex-1 min-w-0">
          <Link
            to={`/movies/${item.tmdbId}`}
            className="font-display text-xl uppercase tracking-wide text-white transition hover:text-amber-400"
          >
            {item.title}
          </Link>
          {item.genres?.length ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {item.genres.map((g) => <span key={g} className="pill text-[10px]">{g}</span>)}
            </div>
          ) : null}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25">Status</span>
            <select
              className="field min-w-[140px] text-xs"
              value={item.status}
              onChange={(e) => onUpdate(item.id, "status", e.target.value)}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>{statusLabels[s]}</option>
              ))}
            </select>
          </div>

          {/* Rating */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25">Rating</span>
            <div className="relative">
              <Star size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400/50" />
              <input
                className="field w-20 pl-7 text-xs"
                type="number"
                min="0"
                max="10"
                step="0.5"
                value={item.userRating ?? ""}
                onChange={(e) => onUpdate(item.id, "userRating", e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25">Notes</span>
            <textarea
              className="field min-h-[60px] resize-none text-xs"
              value={item.notes ?? ""}
              onChange={(e) => onUpdate(item.id, "notes", e.target.value)}
              placeholder="Add notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 self-end pb-0.5">
            <button
              type="button"
              className="btn-secondary p-2"
              onClick={() => onSave(item)}
              aria-label={`Save ${item.title}`}
            >
              <Save size={14} />
            </button>
            <button
              type="button"
              className="btn-danger p-2"
              onClick={() => onRemove(item.id)}
              aria-label={`Remove ${item.title}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
