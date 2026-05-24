import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/sk/SiteLayout";
import artisan from "@/assets/artisan-story.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story — Coast & Peak Studio" },
      { name: "description", content: "The hand and the heart behind Coast & Peak Studio — a small atelier of handcrafted artistic jewelry." },
      { property: "og:title", content: "Our Story — Coast & Peak Studio" },
      { property: "og:description", content: "The hand and the heart behind Coast & Peak Studio." },
      { property: "og:image", content: artisan },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteLayout>
      <section className="relative overflow-hidden bg-hero-gradient pt-36 pb-24 text-[var(--ivory)]">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-[var(--royal)] blur-3xl float-3d" />
          <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-[var(--wine)] blur-3xl float-3d" style={{ animationDelay: "2s" }} />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 text-center md:px-12">
          <p className="font-serif text-xs uppercase tracking-[0.4em] text-[var(--lavender)]">The story of Coast &amp; Peak</p>
          <h1 className="mt-6 font-display text-6xl md:text-8xl">A maison<br /> of one.</h1>
          <p className="mx-auto mt-8 max-w-2xl font-serif text-xl leading-relaxed text-white/80">
            Coast &amp; Peak Studio began in a sunlit kitchen, with a soldering iron, a single
            amethyst crystal, and a quiet promise — to make artistic jewelry slowly, by hand,
            for those who collect quiet things.
          </p>
        </div>
      </section>

      <section className="bg-background py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2 md:px-12">
          <div className="[perspective:1200px]">
            <img src={artisan} alt="Artisan at work" loading="lazy" width={1280} height={1600} className="tilt-3d aspect-[4/5] w-full rounded-[28px_120px_28px_120px] object-cover shadow-luxe" />
          </div>
          <div>
            <h2 className="font-display text-5xl">Made by Sahana.</h2>
            <p className="mt-5 font-serif text-lg leading-relaxed text-muted-foreground">
              I'm Sahana — an artist trained in the Jaipur tradition and
              the founder of Coast &amp; Peak Studio. Every piece in our shop was set, polished and
              signed by my hand. Some take a day. Some take a week. None are
              made in haste.
            </p>
            <p className="mt-4 font-serif text-lg leading-relaxed text-muted-foreground">
              Coast &amp; Peak exists because I believe jewelry should feel like a love letter
              you can wear. Heavy enough to remember. Quiet enough to belong to
              you alone.
            </p>
            <Link to="/shop" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm uppercase tracking-[0.2em] text-primary-foreground depth-3d">
              Explore the work <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-lavender-gradient py-24">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-3 md:px-12">
          {[
            { n: "01", t: "Designed", d: "Sketched by hand, on paper, before any piece is cut." },
            { n: "02", t: "Crafted", d: "Cast and shaped from hypoallergenic alloy at our Bangalore atelier." },
            { n: "03", t: "Signed", d: "Each piece carries Sahana's tiny maker's mark." },
          ].map((s) => (
            <div key={s.n} className="rounded-3xl bg-card p-8 shadow-soft depth-3d magnetic-hover">
              <p className="font-display text-5xl text-gold-gradient">{s.n}</p>
              <h3 className="mt-4 font-display text-2xl">{s.t}</h3>
              <p className="mt-2 font-serif text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
