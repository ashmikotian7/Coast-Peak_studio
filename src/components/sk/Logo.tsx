export function Logo({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--royal)] via-[var(--violet-deep)] to-[var(--wine)] shadow-luxe ring-1 ring-white/15 [transform:perspective(400px)_rotateX(8deg)]">
        <svg viewBox="0 0 32 32" className="h-6 w-6 text-[var(--ivory)]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 22 L12 9 L18 17 L22 12 L28 22 Z" fill="currentColor" fillOpacity="0.18" />
          <path d="M3 26 q4 -3 8 0 t8 0 t8 0" />
          <circle cx="22" cy="8" r="1.6" fill="currentColor" />
        </svg>
        <span className="absolute -right-1 -bottom-1 h-2.5 w-2.5 rounded-full bg-[var(--lavender)] ring-2 ring-background" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-base font-semibold tracking-[0.18em] text-current">COAST &amp; PEAK</span>
          <span className="font-serif text-[10px] tracking-[0.42em] text-current opacity-75">STUDIO</span>
        </span>
      )}
    </span>
  );
}
