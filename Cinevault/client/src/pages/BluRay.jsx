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
    api
      .get("/bluray/deals")
      .then(({ data }) => {
        if (active) setDeals(data.results);
      })
      .catch((err) => {
        if (active) setError(getApiError(err, "Could not load Blu-ray deals."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black text-white">Library</h1>
        <p className="mt-1 text-sm text-slate-400">Track formats, retailers, discounts, and historical price movement.</p>
      </div>
      <LibraryTabs />
      {error ? <p className="rounded-md border border-rose-400/30 bg-rose-500/10 p-4 text-rose-100">{error}</p> : null}
      {loading ? (
        <Loading label="Loading Blu-ray deals" />
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 bg-slate-950/70">
              <thead className="bg-white/[0.03]">
                <tr className="text-left text-xs uppercase text-slate-400">
                  <th className="px-4 py-3">Movie</th>
                  <th className="px-4 py-3">Format</th>
                  <th className="px-4 py-3">Retailer</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3 text-right">Chart</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {deals.map((deal) => (
                  <tr key={`${deal.movieId}-${deal.retailer}`}>
                    <td className="px-4 py-4 font-bold text-white">{deal.title}</td>
                    <td className="px-4 py-4 text-slate-300">{deal.format}</td>
                    <td className="px-4 py-4 text-slate-300">{deal.retailer}</td>
                    <td className="px-4 py-4 font-black text-blue-200">${deal.price}</td>
                    <td className="px-4 py-4 text-purple-200">{deal.discount}%</td>
                    <td className="px-4 py-4 text-right">
                      <Link to={`/movies/${deal.movieId}`} className="btn-secondary">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
