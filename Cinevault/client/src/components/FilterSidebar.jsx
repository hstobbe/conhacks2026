import { RotateCcw, SlidersHorizontal } from "lucide-react";

const genres = ["", "Action", "Adventure", "Animation", "Comedy", "Drama", "Family", "Fantasy", "History", "Sci-Fi", "Thriller"];
const streamers = ["", "Netflix", "Disney+", "Max", "Peacock", "Prime Video", "Paramount+"];

export default function FilterSidebar({ filters, setFilters, onSubmit, onReset }) {
  function update(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <aside className="panel rounded-lg p-4">
      <div className="mb-5 flex items-center gap-2">
        <SlidersHorizontal size={18} className="text-blue-300" />
        <h2 className="text-base font-black text-white">Advanced filters</h2>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block space-y-2">
          <span className="text-xs font-bold uppercase text-slate-400">Genre</span>
          <select className="field" value={filters.genre} onChange={(event) => update("genre", event.target.value)}>
            {genres.map((genre) => (
              <option key={genre || "all"} value={genre}>
                {genre || "Any genre"}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-xs font-bold uppercase text-slate-400">Release year</span>
          <input className="field" inputMode="numeric" placeholder="2025" value={filters.year} onChange={(event) => update("year", event.target.value)} />
        </label>

        <label className="block space-y-2">
          <span className="text-xs font-bold uppercase text-slate-400">Minimum rating</span>
          <input className="field" type="number" min="0" max="10" step="0.1" placeholder="7.5" value={filters.min_rating} onChange={(event) => update("min_rating", event.target.value)} />
        </label>

        <label className="block space-y-2">
          <span className="text-xs font-bold uppercase text-slate-400">Minimum popularity</span>
          <input className="field" type="number" min="0" placeholder="80" value={filters.min_popularity} onChange={(event) => update("min_popularity", event.target.value)} />
        </label>

        <label className="block space-y-2">
          <span className="text-xs font-bold uppercase text-slate-400">Streaming</span>
          <select className="field" value={filters.streaming} onChange={(event) => update("streaming", event.target.value)}>
            {streamers.map((service) => (
              <option key={service || "any"} value={service}>
                {service || "Any service"}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-xs font-bold uppercase text-slate-400">Blu-ray availability</span>
          <select className="field" value={filters.bluray_available} onChange={(event) => update("bluray_available", event.target.value)}>
            <option value="">Any</option>
            <option value="true">Available</option>
            <option value="false">Not available</option>
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button type="submit" className="btn-primary">
            Apply
          </button>
          <button type="button" className="btn-secondary" onClick={onReset}>
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </form>
    </aside>
  );
}
