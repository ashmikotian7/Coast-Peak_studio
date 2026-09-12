import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Truck, ShieldCheck, Gem, Star } from "lucide-react";
import heroImg from "@/assets/hero-jewelry.jpg";
import artisanImg from "@/assets/artisan-story.jpg";
import { SiteLayout } from "@/components/sk/SiteLayout";
import { FloatingParticles } from "@/components/sk/FloatingParticles";
import { ProductCard } from "@/components/sk/ProductCard";
import { collections } from "@/lib/products";
import { useCatalog } from "@/hooks/use-catalog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Coast & Peak Studio — Handcrafted Artisan Jewelry" },
      { name: "description", content: "Heirloom-style handcrafted jewelry in amethyst and crystal — made slowly by Coast & Peak Studio." },
      { property: "og:title", content: "Coast & Peak Studio — Handcrafted Artisan Jewelry" },
      { property: "og:description", content: "Heirloom-style handcrafted jewelry in amethyst and crystal — made slowly by Coast & Peak Studio." },
    ],
  }),
  component: Index,
});

function Index() {
  const { products } = useCatalog();
  const newArrivals = products.filter((p) => p.tag === "new" || p.tag === undefined).slice(0, 4);
  const bestSellers = products.filter((p) => p.tag === "bestseller");
  const featured = products.slice(0, 3);

  return (
    <SiteLayout>
      <Hero />
      <CollectionsStrip />
      <FeaturedSection title="Featured Collection" subtitle="Pieces hand-picked this season" items={featured} />
      <NewArrivals items={newArrivals} />
      <ArtisanStory />
      <BestSellers items={bestSellers} />
      <Testimonials />
      <Gallery />
      <LimitedEdition />
      <Newsletter />
    </SiteLayout>
  );
}

function Hero() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-hero-gradient text-[var(--ivory)]">
      <FloatingParticles count={22} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/40" />

      <div className="relative mx-auto grid min-h-[100svh] max-w-7xl grid-cols-1 items-center gap-8 px-6 pt-28 md:grid-cols-2 md:px-12 md:pt-32">
        <div className="z-10">
          <p className="font-serif text-xs uppercase tracking-[0.4em] text-[var(--lavender)] animate-fade-up">
            — Coast &amp; Peak Studio · A petite atelier
          </p>
          <h1 className="mt-6 font-display text-[clamp(3rem,9vw,7rem)] font-light leading-[0.95] animate-fade-up" style={{ animationDelay: "0.1s" }}>
            Worn like a <em className="not-italic text-gold-gradient">whisper</em>.
            <br /> Kept like a vow.
          </h1>
          <p className="mt-8 max-w-md font-serif text-lg leading-relaxed text-white/75 animate-fade-up" style={{ animationDelay: "0.25s" }}>
            Handcrafted artistic jewelry in amethyst and crystal. Made slowly,
            in our studio, for those who collect quiet beauty.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4 animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <Link
              to="/shop"
              className="group inline-flex items-center gap-3 rounded-full bg-gold-gradient px-7 py-4 text-sm font-medium uppercase tracking-[0.2em] text-[oklch(0.2_0.06_305)] shadow-gold transition-transform duration-500 ease-luxe hover:scale-[1.03]"
            >
              Explore Collection
              <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
            </Link>
            <Link
              to="/about"
              className="story-link font-serif text-base text-white/80 hover:text-white"
            >
              Our story
            </Link>
          </div>

          <div className="mt-12 sm:mt-16 grid max-w-md grid-cols-3 gap-3 sm:gap-6 text-xs text-white/70 animate-fade-up" style={{ animationDelay: "0.55s" }}>
            <HeroBadge icon={Sparkles} label="Handcrafted" />
            <HeroBadge icon={ShieldCheck} label="Lifetime care" />
            <HeroBadge icon={Truck} label="Free shipping" />
          </div>
        </div>

        <div className="relative h-[50svh] sm:h-[60svh] [perspective:1200px] md:h-[80svh]">
          <div className="tilt-3d absolute inset-0 animate-reveal-clip rounded-[60px_20px_60px_20px] sm:rounded-[120px_28px_120px_28px] overflow-hidden shadow-luxe">
            <img
              src={heroImg}
              alt="Handcrafted amethyst ring on velvet"
              width={1536}
              height={1536}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute -left-6 top-10 z-20 hidden glass rounded-2xl p-4 shadow-luxe animate-fade-up float-3d md:block" style={{ animationDelay: "0.7s" }}>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--lavender)]">Maker</p>
            <p className="font-display text-lg">Sahana K. · Atelier</p>
          </div>
          <div className="absolute bottom-4 right-4 sm:-bottom-6 sm:right-4 z-20 glass rounded-2xl px-4 py-3 sm:px-5 sm:py-4 shadow-luxe animate-fade-up" style={{ animationDelay: "0.9s" }}>
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-[var(--gold)] text-[var(--gold)]" />
                ))}
              </div>
              <span className="font-serif text-xs sm:text-sm">4.9 · 1,200 reviews</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroBadge({ icon: Icon, label }: { icon: typeof Sparkles; label: string }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-xs tracking-wider">{label}</span>
    </div>
  );
}

function CollectionsStrip() {
  return (
    <section className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="font-serif text-xs uppercase tracking-[0.3em] text-muted-foreground">Categories</p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">Curated by hand</h2>
          </div>
          <Link to="/shop" className="story-link hidden font-serif text-sm md:inline-block">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {collections.map((c, i) => (
            <Link
              key={c.slug}
              to="/shop"
              className={`group relative aspect-[3/4] overflow-hidden ${i % 2 === 0 ? "curve-card" : "curve-card-alt"} bg-lavender-gradient magnetic-hover`}
            >
              <div className="absolute inset-0 bg-royal-gradient opacity-0 transition-opacity duration-500 ease-luxe group-hover:opacity-90" />
              <div className="absolute inset-0 flex flex-col justify-end p-5 text-foreground transition-colors duration-500 group-hover:text-[var(--ivory)]">
                <p className="text-[10px] uppercase tracking-[0.25em] opacity-70">{c.tagline}</p>
                <h3 className="mt-1 font-display text-2xl md:text-3xl">{c.name}</h3>
              </div>
              <Gem className="absolute right-5 top-5 h-5 w-5 text-[var(--gold)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedSection({ title, subtitle, items }: { title: string; subtitle: string; items: import("@/lib/products").Product[] }) {
  return (
    <section className="bg-lavender-gradient py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="mb-12 text-center">
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-[var(--royal)]">{subtitle}</p>
          <h2 className="mt-3 font-display text-4xl md:text-6xl">{title}</h2>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function NewArrivals({ items }: { items: import("@/lib/products").Product[] }) {
  return (
    <section className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-serif text-xs uppercase tracking-[0.3em] text-muted-foreground">Just arrived</p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">New Arrivals</h2>
          </div>
          <Link to="/shop" search={{ tag: "new" }} className="story-link font-serif text-sm">
            See everything →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-8">
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ArtisanStory() {
  return (
    <section className="relative overflow-hidden bg-hero-gradient py-24 text-[var(--ivory)] md:py-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-2 md:px-12">
        <div className="relative">
          <div className="overflow-hidden rounded-[28px_120px_28px_120px] shadow-luxe">
            <img src={artisanImg} alt="Artisan handcrafting jewelry" loading="lazy" width={1280} height={1600} className="h-full w-full object-cover" />
          </div>
          <div className="absolute -right-4 -bottom-4 glass rounded-2xl px-6 py-4 text-foreground">
            <p className="font-display text-3xl">12 yrs</p>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">in the atelier</p>
          </div>
        </div>
        <div>
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-[var(--lavender)]">The hand behind Coast &amp; Peak</p>
          <h2 className="mt-4 font-display text-5xl md:text-6xl">A studio,<br /> not a factory.</h2>
          <p className="mt-6 max-w-md font-serif text-lg leading-relaxed text-white/75">
            Every Coast &amp; Peak piece is hand-finished by Sahana in her Bangalore atelier.
            We work in small batches — sometimes only three of a kind — so that
            each ring, pendant and cuff carries a fingerprint, a flaw, a soul.
          </p>
          <Link
            to="/about"
            className="mt-8 inline-flex items-center gap-2 border-b border-[var(--gold)] pb-2 font-serif text-[var(--gold)]"
          >
            Read the brand story <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function BestSellers({ items }: { items: import("@/lib/products").Product[] }) {
  return (
    <section className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="mb-12 text-center">
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-muted-foreground">Loved most</p>
          <h2 className="mt-3 font-display text-4xl md:text-6xl">Best Sellers</h2>
        </div>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 md:gap-8">
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const reviews = [
    { name: "Aanya R.", text: "It feels like wearing a poem. Box-to-finger was pure ceremony.", piece: "Amethyst Whisper Drops" },
    { name: "Mira S.", text: "I've never owned anything this thoughtful. Sahana even hand-wrote a note.", piece: "Heritage Floral Cuff" },
    { name: "Léa D.", text: "Quietly the most complimented piece in my collection.", piece: "Violet Teardrop Pendant" },
  ];
  return (
    <section className="bg-lavender-gradient py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="mb-12 text-center">
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-[var(--royal)]">In their words</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">Letters from our collectors</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {reviews.map((r, i) => (
            <div
              key={r.name}
              className={`glass relative p-8 magnetic-hover animate-fade-up ${i % 2 === 0 ? "curve-card" : "curve-card-alt"}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="mb-3 flex">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5 fill-[var(--gold)] text-[var(--gold)]" />
                ))}
              </div>
              <p className="font-serif text-lg leading-relaxed">"{r.text}"</p>
              <div className="mt-6">
                <p className="font-display text-lg">{r.name}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{r.piece}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Gallery() {
  const { products } = useCatalog();
  const imgs = [products[0]?.image, products[3]?.image, products[2]?.image, products[1]?.image, products[0]?.image, products[3]?.image].filter(Boolean) as string[];
  return (
    <section className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="font-serif text-xs uppercase tracking-[0.3em] text-muted-foreground">@coastandpeak.studio</p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">Worn by you</h2>
          </div>
          <a href="#" className="story-link font-serif text-sm">Follow on Instagram</a>
        </div>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-4">
          {imgs.map((src, i) => (
            <a
              key={i}
              href="#"
              className="group relative aspect-square overflow-hidden rounded-2xl"
            >
              <img src={src} alt="Customer wearing Coast &amp; Peak jewelry" loading="lazy" width={400} height={400} className="h-full w-full object-cover transition-transform duration-700 ease-luxe group-hover:scale-110" />
              <div className="absolute inset-0 bg-royal-gradient opacity-0 transition-opacity duration-300 group-hover:opacity-40" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function LimitedEdition() {
  return (
    <section className="relative overflow-hidden bg-hero-gradient py-24 text-[var(--ivory)] md:py-32">
      <FloatingParticles count={14} />
      <div className="relative mx-auto max-w-5xl px-6 text-center md:px-12">
        <p className="font-serif text-xs uppercase tracking-[0.4em] text-[var(--lavender)]">Limited edition</p>
        <h2 className="mt-5 font-display text-5xl leading-[1.05] md:text-7xl">
          Only fifty <em className="not-italic text-gold-gradient">Lavender Stacks</em><br /> will ever exist.
        </h2>
        <p className="mx-auto mt-6 max-w-xl font-serif text-lg text-white/75">
          Hand-cut lavender crystals set in three brushed alloy bands. Numbered, signed, and shipped in a custom velvet vault.
        </p>
        <Link
          to="/shop"
          search={{ tag: "limited" }}
          className="mt-10 inline-flex items-center gap-3 rounded-full bg-gold-gradient px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] text-[oklch(0.2_0.06_305)] shadow-gold transition-transform duration-500 ease-luxe hover:scale-[1.03]"
        >
          Explore Limited Edition <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function Newsletter() {
  return (
    <section className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-6 text-center md:px-12">
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-muted-foreground">The Coast &amp; Peak letter</p>
        <h2 className="mt-4 font-display text-4xl md:text-5xl">Receive our quiet dispatches.</h2>
        <p className="mt-4 font-serif text-lg text-muted-foreground">
          Atelier notes, new drops, and early access — once a fortnight. Never more.
        </p>
        <form className="mx-auto mt-8 flex flex-col sm:flex-row max-w-md items-stretch sm:items-center gap-2 rounded-2xl sm:rounded-full border border-border bg-card p-2 sm:p-1.5 shadow-soft">
          <input
            type="email"
            placeholder="your@email.com"
            className="flex-1 bg-transparent px-4 py-2 sm:py-1 font-serif text-base outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform duration-300 ease-luxe hover:scale-105 shrink-0"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
