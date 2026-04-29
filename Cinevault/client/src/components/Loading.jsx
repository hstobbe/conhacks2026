export default function Loading({ label = "Loading" }) {
  return (
    <div className="flex min-h-80 items-center justify-center">
      <div className="panel rounded-lg px-6 py-5 text-center">
        <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
        <p className="text-sm font-semibold text-slate-300">{label}</p>
      </div>
    </div>
  );
}
