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
    <div className="panel rounded-lg p-4">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-white">Price history</h2>
          <p className="text-sm text-slate-400">Blu-ray price tracking</p>
        </div>
        {data ? (
          <div className="grid grid-cols-2 gap-2 text-right sm:grid-cols-4">
            <Metric label="Current" value={formatCurrency(data.currentPrice)} />
            <Metric label="Lowest" value={formatCurrency(data.lowestPrice)} />
            <Metric label="Highest" value={formatCurrency(data.highestPrice)} />
            <Metric label="Average" value={formatCurrency(data.averagePrice)} />
          </div>
        ) : null}
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis dataKey="dateLabel" stroke="#94a3b8" tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "8px",
                color: "#e2e8f0",
              }}
              formatter={(value) => [formatCurrency(value), "Price"]}
              labelStyle={{ color: "#bfdbfe" }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#60a5fa"
              strokeWidth={3}
              dot={{ r: 3, fill: "#a855f7", stroke: "#d8b4fe", strokeWidth: 1 }}
              activeDot={{ r: 6, fill: "#60a5fa" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
      <p className="text-[11px] font-bold uppercase text-slate-400">{label}</p>
      <p className="text-sm font-black text-white">{value}</p>
    </div>
  );
}
