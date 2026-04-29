import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Save, Trash2 } from "lucide-react";

import EmptyState from "../components/EmptyState.jsx";
import LibraryTabs from "../components/LibraryTabs.jsx";
import Loading from "../components/Loading.jsx";
import api, { getApiError } from "../services/api.js";

const statuses = ["want_to_watch", "watching", "watched", "favorite"];

export default function Library() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    api
      .get("/library")
      .then(({ data }) => {
        if (active) setItems(data.results);
      })
      .catch((err) => {
        if (active) setError(getApiError(err, "Could not load your library."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function updateLocal(id, key, value) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  }

  async function save(item) {
    setMessage("");
    setError("");
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
    setMessage("");
    setError("");
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
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black text-white">Library</h1>
        <p className="mt-1 text-sm text-slate-400">Rate titles, update status, and keep notes attached to each movie.</p>
      </div>
      <LibraryTabs />

      {message ? <p className="rounded-md border border-emerald-400/30 bg-emerald-500/10 p-3 text-emerald-100">{message}</p> : null}
      {error ? <p className="rounded-md border border-rose-400/30 bg-rose-500/10 p-3 text-rose-100">{error}</p> : null}

      {items.length ? (
        <div className="overflow-hidden rounded-lg border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 bg-slate-950/70">
              <thead className="bg-white/[0.03]">
                <tr className="text-left text-xs uppercase text-slate-400">
                  <th className="px-4 py-3">Movie</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {items.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="px-4 py-4">
                      <Link to={`/movies/${item.tmdbId}`} className="font-bold text-white hover:text-blue-200">
                        {item.title}
                      </Link>
                      <p className="mt-1 text-xs text-slate-400">{item.genres?.join(", ")}</p>
                    </td>
                    <td className="px-4 py-4">
                      <select className="field min-w-36" value={item.status} onChange={(event) => updateLocal(item.id, "status", event.target.value)}>
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <input
                        className="field w-24"
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        value={item.userRating ?? ""}
                        onChange={(event) => updateLocal(item.id, "userRating", event.target.value)}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <textarea className="field min-h-20 min-w-64" value={item.notes ?? ""} onChange={(event) => updateLocal(item.id, "notes", event.target.value)} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button type="button" className="btn-secondary" onClick={() => save(item)} aria-label={`Save ${item.title}`}>
                          <Save size={16} />
                        </button>
                        <button type="button" className="btn-danger" onClick={() => remove(item.id)} aria-label={`Remove ${item.title}`}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="Your library is empty"
          body="Add movies from a detail page and they will appear here."
          action={<Link to="/discover" className="btn-primary">Discover movies</Link>}
        />
      )}
    </div>
  );
}
