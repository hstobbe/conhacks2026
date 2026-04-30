export default function Loading({ label = "Loading" }) {
  return (
    <div className="flex min-h-80 items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        {/* Triple ring spinner */}
        <div className="relative h-12 w-12">
          {/* Outer ring */}
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-amber-500/60" style={{ animationDuration: "1.2s" }} />
          {/* Middle ring — counter spin */}
          <div className="absolute inset-1.5 animate-spin rounded-full border-2 border-transparent border-t-amber-400" style={{ animationDuration: "0.8s", animationDirection: "reverse" }} />
          {/* Inner dot */}
          <div className="absolute inset-4 animate-pulse rounded-full bg-amber-500/40" />
        </div>
        <p className="animate-pulse text-[11px] font-semibold uppercase tracking-[0.2em] text-white/25">{label}</p>
      </div>
    </div>
  );
}
