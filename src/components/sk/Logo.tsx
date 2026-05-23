export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gold-gradient shadow-gold">
        <span className="font-display text-lg font-semibold text-[oklch(0.2_0.06_305)]">S</span>
        <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full bg-[var(--violet-deep)] ring-2 ring-background" />
      </span>
      <span className="font-display text-xl tracking-[0.25em] font-semibold">SK</span>
    </span>
  );
}
