import { RotateCcw, SlidersHorizontal } from "lucide-react";

const genres = ["", "Action", "Adventure", "Animation", "Comedy", "Drama", "Family", "Fantasy", "History", "Sci-Fi", "Thriller"];
const streamers = ["", "Netflix", "Disney+", "Max", "Peacock", "Prime Video", "Paramount+"];

export default function FilterSidebar({ filters, setFilters, onSubmit, onReset }) {
  function update(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <aside className="animate-slide-left panel rounded-xl p-5">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-400">
          <SlidersHorizontal size={14} />
        </div>
        <span className="font-display text-lg uppercase tracking-wide text-white">Filters</span>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <FilterGroup label="Genre">
          <select className="field" value={filters.genre} onChange={(e) => update("genre", e.target.value)}>
            {genres.map((g) => (
              <option key={g || "all"} value={g}>{g || "Any genre"}</option>
            ))}
          </select>
        </FilterGroup>

        <FilterGroup label="Release Year">
          <input className="field" inputMode="numeric" placeholder="e.g. 2024" value={filters.year} onChange={(e) => update("year", e.target.value)} />
        </FilterGroup>

        <FilterGroup label="Min Rating">
          <input className="field" type="number" min="0" max="10" step="0.1" placeholder="7.5" value={filters.min_rating} onChange={(e) => update("min_rating", e.target.value)} />
        </FilterGroup>

        <FilterGroup label="Min Popularity">
          <input className="field" type="number" min="0" placeholder="80" value={filters.min_popularity} onChange={(e) => update("min_popularity", e.target.value)} />
        </FilterGroup>

        <FilterGroup label="Streaming On">
          <select className="field" value={filters.streaming} onChange={(e) => update("streaming", e.target.value)}>
            {streamers.map((s) => (
              <option key={s || "any"} value={s}>{s || "Any service"}</option>
            ))}
          </select>
        </FilterGroup>

        <FilterGroup label="Blu-ray">
          <select className="field" value={filters.bluray_available} onChange={(e) => update("bluray_available", e.target.value)}>
            <option value="">Any</option>
            <option value="true">Available</option>
            <option value="false">Not available</option>
          </select>
        </FilterGroup>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button type="submit" className="btn-primary text-xs">Apply</button>
          <button type="button" className="btn-secondary text-xs" onClick={onReset}>
            <RotateCcw size={13} />
            Reset
          </button>
        </div>
      </form>
    </aside>
  );
}

function FilterGroup({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">{label}</span>
      {children}
    </label>
  );
}
