import { createFileRoute } from "@tanstack/react-router";
import { Check, Package, Sparkles, Truck, Home } from "lucide-react";
import { SiteLayout } from "@/components/sk/SiteLayout";

export const Route = createFileRoute("/track")({
  head: () => ({ meta: [{ title: "Track Order — SK" }] }),
  component: TrackPage,
});

const steps = [
  { icon: Check, label: "Order placed", time: "Today · 10:24" },
  { icon: Sparkles, label: "Crafting & finishing", time: "In atelier · 2 days" },
  { icon: Package, label: "Packed in velvet", time: "" },
  { icon: Truck, label: "On its way", time: "" },
  { icon: Home, label: "Delivered", time: "" },
];

export default function TrackPage() {
  const active = 1;
  return (
    <SiteLayout>
      <section className="bg-lavender-gradient pt-32 pb-12 md:pt-40">
        <div className="mx-auto max-w-7xl px-6 text-center md:px-12">
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-[var(--royal)]">Order SK-2026-0042</p>
          <h1 className="mt-3 font-display text-5xl md:text-6xl">Tracking your treasure</h1>
        </div>
      </section>

      <section className="bg-background py-20">
        <div className="mx-auto max-w-3xl px-6 md:px-12">
          <ol className="relative space-y-8">
            <span className="absolute left-6 top-3 bottom-3 w-px bg-border" aria-hidden />
            {steps.map((s, i) => {
              const Icon = s.icon;
              const done = i <= active;
              return (
                <li key={s.label} className="relative flex items-start gap-5 pl-2">
                  <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full transition-all duration-500 ${done ? "bg-gold-gradient shadow-gold" : "bg-secondary text-muted-foreground"}`}>
                    <Icon className={`h-5 w-5 ${done ? "text-[oklch(0.2_0.06_305)]" : ""}`} />
                  </div>
                  <div className="pt-1.5">
                    <p className={`font-display text-xl ${done ? "" : "text-muted-foreground"}`}>{s.label}</p>
                    {s.time && <p className="text-sm text-muted-foreground">{s.time}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="mt-12 rounded-3xl border border-border bg-card p-6 shadow-soft">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Estimated arrival</p>
            <p className="mt-1 font-display text-3xl">In 5 – 7 days</p>
            <p className="mt-2 font-serif text-muted-foreground">Free signature delivery, in our velvet vault.</p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

export { TrackPage };
