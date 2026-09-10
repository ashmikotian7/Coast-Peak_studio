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
        <div className="relative mx-auto w-full text-center animate-fade-in">
          <div className="mb-8 flex items-center justify-center gap-4 animate-slide-down" style={{ animationDelay: '0.2s' }}>
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-[var(--lavender)] to-[var(--lavender)]" />
            <p className="font-serif text-xs uppercase tracking-[0.4em] text-[var(--lavender)]">The story of Coast &amp; Peak</p>
            <div className="h-px w-24 bg-gradient-to-l from-transparent via-[var(--lavender)] to-[var(--lavender)]" />
          </div>
          <h1 className="mt-6 font-display text-6xl md:text-8xl relative inline-block animate-scale-in" style={{ animationDelay: '0.4s' }}>
            <span className="relative z-10">A maison</span><br />
            <span className="relative z-10">of Two.</span>
            <div className="absolute -inset-4 bg-gradient-to-r from-[var(--royal)] via-[var(--wine)] to-[var(--royal)] opacity-20 blur-2xl -z-0" />
          </h1>
          <div className="mx-auto mt-12 w-full max-w-4xl space-y-10 font-serif text-xl leading-relaxed text-white/80">
            <p className="first-letter:text-6xl first-letter:font-display first-letter:text-[var(--lavender)] first-letter:float-left first-letter:mr-4 first-letter:mt-[-4px] animate-slide-up" style={{ animationDelay: '0.6s' }}>
              Welcome to Coast & Peak Studio! We are a two-member team of creators, and these are the pairs of hands behind every piece you see here.
            </p>
            <p className="border-l-2 border-[var(--lavender)]/30 pl-6 animate-slide-up" style={{ animationDelay: '0.8s' }}>
              Our journey began in a classroom rather than an art studio. In 2026, we freshly graduated with our engineering degrees. While our brains were trained in structure and logic, our hearts always belonged to art, travel, and the beautiful landscapes of our home in Udupi.
            </p>
            <blockquote className="relative my-12 border-l-4 border-[var(--lavender)] bg-gradient-to-r from-[var(--lavender)]/10 to-transparent pl-8 pr-4 py-6 italic text-white/90 rounded-r-lg animate-slide-up" style={{ animationDelay: '1s' }}>
              <div className="absolute -left-2 top-0 text-6xl text-[var(--lavender)] opacity-30 font-serif">"</div>
              <p className="text-2xl relative z-10">The real spark for Coast & Peak Studio happened completely by accident on a birthday. Wanting to give a truly meaningful gift, one of us hand-crafted a unique bouquet using vibrant satin ribbons for the other.</p>
              <div className="absolute -right-2 bottom-[-20px] text-6xl text-[var(--lavender)] opacity-30 font-serif rotate-180">"</div>
            </blockquote>
            <p className="animate-slide-up" style={{ animationDelay: '1.2s' }}>
              When the gift was opened, something clicked. Seeing the beauty of that everlasting bouquet, an idea popped up. We instantly realized we shared the exact same creative mindset and passion for handmade crafts. One conversation led to another, our shared dreams aligned, and Coast & Peak Studio was born.
            </p>
            <p className="relative border-r-2 border-[var(--lavender)]/30 pr-6 text-right animate-slide-up" style={{ animationDelay: '1.4s' }}>
              What started as a birthday surprise has now grown into a shared canvas where we combine our love for intricate bangles, eternal florals, and fine art. We are so happy to have you along for the ride!
              <span className="absolute -right-8 -top-2 text-4xl animate-pulse">✨</span>
            </p>
          </div>
          <div className="mt-16 flex animate-bounce justify-center">
            <div className="h-8 w-1 bg-gradient-to-b from-[var(--lavender)] to-transparent rounded-full" />
          </div>
        </div>
      </section>

      <div className="relative h-px bg-gradient-to-r from-transparent via-[var(--lavender)] to-transparent opacity-30" />
      
      <section className="bg-background py-32 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-[var(--royal)]/20 to-[var(--wine)]/20 rounded-full blur-3xl" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2 md:px-12 animate-fade-in-up">
          <div className="[perspective:1200px]">
            <img src={artisan} alt="Artisan at work" loading="lazy" width={1280} height={1600} className="tilt-3d aspect-[4/5] w-full rounded-[28px_120px_28px_120px] object-cover shadow-luxe animate-scale-in hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="animate-slide-in-right">
            <div className="mb-8 flex items-center gap-4">
              <div className="h-16 w-1.5 bg-gradient-to-b from-[var(--royal)] to-[var(--wine)] rounded-full" />
              <div>
                <p className="font-serif text-sm uppercase tracking-[0.3em] text-[var(--lavender)] mb-2">The Artisan</p>
                <h2 className="font-display text-5xl">Made by Sahana.</h2>
              </div>
            </div>
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
            <Link to="/shop" className="mt-10 group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[var(--royal)] to-[var(--wine)] px-8 py-4 text-sm uppercase tracking-[0.2em] text-white shadow-lg transition-all hover:shadow-xl hover:scale-105">
              Explore the work <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      <div className="relative h-px bg-gradient-to-r from-transparent via-[var(--royal)] to-transparent opacity-30" />

      <section className="bg-lavender-gradient py-32 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-br from-[var(--royal)]/20 to-[var(--wine)]/20 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 h-32 w-32 rounded-full bg-[var(--royal)] blur-3xl" />
          <div className="absolute bottom-10 right-10 h-40 w-40 rounded-full bg-[var(--wine)] blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 md:px-12">
          <div className="text-center mb-16 animate-fade-in">
            <p className="font-serif text-sm uppercase tracking-[0.3em] text-[var(--lavender)] mb-4">The Process</p>
            <h2 className="font-display text-4xl md:text-5xl">How We Create</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
          {[
            { n: "01", t: "Designed", d: "Sketched by hand, on paper, before any piece is cut.", icon: "✏️" },
            { n: "02", t: "Crafted", d: "Cast and shaped from hypoallergenic alloy at our Bangalore atelier.", icon: "🔨" },
            { n: "03", t: "Signed", d: "Each piece carries Sahana's tiny maker's mark.", icon: "✒️" },
          ].map((s, index) => (
            <div key={s.n} className="group relative rounded-3xl bg-card p-8 shadow-soft depth-3d magnetic-hover overflow-hidden animate-scale-in hover:-translate-y-2 transition-all duration-300" style={{ animationDelay: `${index * 0.2}s` }}>
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--royal)]/5 to-[var(--wine)]/5 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative z-10">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-display text-5xl text-gold-gradient">{s.n}</p>
                  <span className="text-3xl opacity-50 group-hover:opacity-100 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">{s.icon}</span>
                </div>
                <h3 className="mt-4 font-display text-2xl">{s.t}</h3>
                <p className="mt-2 font-serif text-muted-foreground">{s.d}</p>
              </div>
              <div className={`absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-gradient-to-br from-[var(--royal)] to-[var(--wine)] opacity-10 blur-xl transition-transform group-hover:scale-150`} style={{ animationDelay: `${index * 0.5}s` }} />
            </div>
          ))}
          </div>
        </div>
      </section>

      <div className="relative h-px bg-gradient-to-r from-transparent via-[var(--lavender)] to-transparent opacity-30" />

      <section className="bg-background py-24 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-[var(--royal)]/10 to-[var(--wine)]/10 rounded-full blur-3xl" />
        <div className="mx-auto max-w-4xl px-6 animate-fade-in">
          <div className="relative inline-block animate-pulse-slow">
            <div className="absolute -inset-2 bg-gradient-to-r from-[var(--royal)] via-[var(--wine)] to-[var(--royal)] opacity-20 blur-xl" />
            <p className="relative font-serif text-2xl italic text-muted-foreground">
              "Crafted with love, worn with pride"
            </p>
          </div>
          <div className="mt-8 flex items-center justify-center gap-2">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[var(--lavender)]" />
            <span className="text-2xl animate-spin-slow">💎</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[var(--lavender)]" />
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
