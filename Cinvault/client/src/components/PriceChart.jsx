import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatCurrency(value) {
  return `$${Number(value).toFixed(2)}`;
}

export default function PriceChart({ data }) {
  const points =
    data?.history?.map((point) => ({
      ...point,
      dateLabel: new Date(point.date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    })) ?? [];

  return (
    <div className="panel rounded-2xl p-5">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-2xl uppercase tracking-wide text-white">Price History</h2>
          <p className="mt-0.5 text-xs text-white/30">Blu-ray price tracking over time</p>
        </div>
        {data ? (
          <div className="flex gap-2">
            <Metric label="Current" value={formatCurrency(data.currentPrice)} highlight />
            <Metric label="Lowest" value={formatCurrency(data.lowestPrice)} />
            <Metric label="Highest" value={formatCurrency(data.highestPrice)} />
            <Metric label="Average" value={formatCurrency(data.averagePrice)} />
          </div>
        ) : null}
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
            <XAxis
              dataKey="dateLabel"
              stroke="rgba(255,255,255,0.15)"
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="rgba(255,255,255,0.15)"
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCurrency}
            />
            <Tooltip
              contentStyle={{
                background: "#0d1424",
                border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: "12px",
                color: "#e8edf5",
                fontSize: "12px",
              }}
              formatter={(value) => [formatCurrency(value), "Price"]}
              labelStyle={{ color: "#f59e0b", fontWeight: 600 }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#0d1424", stroke: "#f59e0b", strokeWidth: 2 }}
              activeDot={{ r: 5, fill: "#f59e0b", stroke: "#0d1424", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Metric({ label, value, highlight }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-right">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25">{label}</p>
      <p className={`mt-0.5 font-display text-base ${highlight ? "text-amber-400" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}
