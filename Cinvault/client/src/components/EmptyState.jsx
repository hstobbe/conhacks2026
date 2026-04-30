export default function EmptyState({ title, body, action }) {
  return (
    <div className="animate-fade-up flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] px-6 py-16 text-center">
      <div className="animate-float mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.02] text-2xl">
        ◻
      </div>
      <h3 className="font-display text-xl uppercase tracking-wide text-white/70">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-white/30">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
