import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Instagram } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/sk/SiteLayout";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — SK" },
      { name: "description", content: "Write to our atelier. We read every note ourselves." },
      { property: "og:title", content: "Contact — SK" },
      { property: "og:description", content: "Write to our atelier. We read every note ourselves." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <SiteLayout>
      <section className="bg-lavender-gradient pt-32 pb-12 md:pt-40">
        <div className="mx-auto max-w-7xl px-6 text-center md:px-12">
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-[var(--royal)]">Write to the atelier</p>
          <h1 className="mt-3 font-display text-5xl md:text-7xl">Say hello to SK</h1>
          <p className="mx-auto mt-4 max-w-xl font-serif text-lg text-muted-foreground">
            For custom pieces, press, or simply a kind word — Sahana reads everything herself.
          </p>
        </div>
      </section>

      <section className="bg-background py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-5 md:px-12">
          <form
            onSubmit={(e) => { e.preventDefault(); toast.success("Message sent", { description: "We'll write back within 48 hours." }); }}
            className="space-y-3 md:col-span-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Name" required className="rounded-full border border-border bg-card px-4 py-3 text-sm outline-none focus:border-[var(--royal)]" />
              <input placeholder="Email" type="email" required className="rounded-full border border-border bg-card px-4 py-3 text-sm outline-none focus:border-[var(--royal)]" />
            </div>
            <input placeholder="Subject" className="w-full rounded-full border border-border bg-card px-4 py-3 text-sm outline-none focus:border-[var(--royal)]" />
            <textarea rows={6} placeholder="Your note…" className="w-full rounded-3xl border border-border bg-card px-5 py-4 text-sm outline-none focus:border-[var(--royal)]" />
            <button className="rounded-full bg-primary px-8 py-3 text-sm uppercase tracking-[0.2em] text-primary-foreground">Send</button>
          </form>

          <aside className="space-y-5 md:col-span-2">
            <InfoCard icon={Mail} title="Email" line="hello@sk-atelier.com" />
            <InfoCard icon={MapPin} title="Atelier" line="Bangalore · By appointment" />
            <InfoCard icon={Instagram} title="Instagram" line="@maison.sk" />
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}

function InfoCard({ icon: Icon, title, line }: { icon: typeof Mail; title: string; line: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <Icon className="h-5 w-5 text-[var(--royal)]" />
      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
      <p className="mt-1 font-serif text-lg">{line}</p>
    </div>
  );
}
