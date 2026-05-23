export function GemstoneLoader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10">
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 rounded-full border border-border" />
        <div className="absolute inset-0 animate-spin-slow rounded-full border-t-2 border-[var(--gold)]" />
        <div className="absolute inset-2 rounded-full bg-gold-gradient shadow-gold animate-glow-pulse" />
      </div>
      {label ? <p className="font-serif text-sm tracking-wider text-muted-foreground">{label}</p> : null}
    </div>
  );
}

export function ShimmerSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-muted ${className}`}>
      <div className="absolute inset-0 shimmer" />
    </div>
  );
}

export function SparkleDots() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block h-1.5 w-1.5 rounded-full bg-[var(--gold)] animate-sparkle"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}
