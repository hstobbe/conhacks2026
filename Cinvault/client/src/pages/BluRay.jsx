import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import LibraryTabs from "../components/LibraryTabs.jsx";
import Loading from "../components/Loading.jsx";
import api, { getApiError } from "../services/api.js";

export default function BluRay() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/bluray/deals")
      .then(({ data }) => { if (active) setDeals(data.results); })
      .catch((err) => { if (active) setError(getApiError(err, "Could not load Blu-ray deals.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-6 py-6">
      <div>
        <p className="section-label mb-1">Personal</p>
        <h1 className="font-display text-5xl uppercase leading-none tracking-wide text-white">Library</h1>
        <p className="mt-2 text-sm text-white/30">Track formats, retailers, and historical price movement.</p>
      </div>

      <LibraryTabs />

      {error ? <p className="error-box">{error}</p> : null}

      {loading ? (
        <Loading label="Loading Blu-ray deals" />
      ) : deals.length ? (
        <div className="space-y-2">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 rounded-xl px-4 py-2">
            {["Movie", "Format", "Retailer", "Price", ""].map((h) => (
              <span key={h} className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25">{h}</span>
            ))}
          </div>
          {deals.map((deal, i) => (
            <div
              key={`${deal.movieId}-${deal.retailer}`}
              className="animate-fade-up panel grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200 hover:border-white/[0.1] hover:-translate-y-0.5"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <span className="truncate font-medium text-white">{deal.title}</span>
              <span className="text-sm text-white/40">{deal.format}</span>
              <span className="text-sm text-white/40">{deal.sourceLabel ?? deal.retailerLabel ?? deal.retailer}</span>
              <span className="font-display text-lg text-amber-400">{deal.priceDisplay ?? `C$${Number(deal.price ?? 0).toFixed(2)}`}</span>
              <Link to={`/movies/${deal.movieId}`} className="btn-secondary py-1.5 text-xs">
                View
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-white/[0.07]">
          <p className="text-sm text-white/25">No Blu-ray deals found.</p>
        </div>
      )}
    </div>
  );
}
