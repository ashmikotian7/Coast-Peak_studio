import { Check, Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LANGUAGES, useI18n } from "@/hooks/use-i18n";

export function LanguageDropdown({ onLight = false }: { onLight?: boolean }) {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium tracking-wider transition-all duration-300 ease-luxe ${
          onLight
            ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
            : "border-border bg-card text-foreground hover:bg-secondary"
        }`}
        aria-label="Select language"
      >
        <Globe className="h-3.5 w-3.5" />
        <span>{current.flag}</span>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-luxe">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className="flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-secondary"
            >
              <span className="font-serif">{l.label}</span>
              {l.code === lang && <Check className="h-4 w-4 text-[var(--royal)]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
