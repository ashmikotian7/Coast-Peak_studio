import { Link } from "@tanstack/react-router";
import { Instagram, Twitter, Facebook } from "lucide-react";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="relative mt-32 overflow-hidden bg-hero-gradient text-[var(--ivory)]">
      <div className="absolute inset-0 opacity-30" aria-hidden>
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[var(--royal)] blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-[var(--wine)] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-20 md:px-12">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logo />
            <p className="mt-6 max-w-sm font-serif text-lg leading-relaxed text-white/75">
              Heirlooms in the making. Each piece by SK is hand-finished in a small
              studio, signed, and sent in our signature velvet box.
            </p>
            <form className="mt-8 flex max-w-md items-center gap-2 glass rounded-full p-1.5">
              <input
                placeholder="Join the SK letter"
                className="flex-1 bg-transparent px-4 text-sm text-white placeholder:text-white/60 outline-none"
              />
              <button
                type="button"
                className="rounded-full bg-gold-gradient px-5 py-2 text-sm font-semibold text-[oklch(0.2_0.06_305)] shadow-gold transition-transform duration-300 ease-luxe hover:scale-105"
              >
                Subscribe
              </button>
            </form>
          </div>

          <FooterCol title="Shop">
            <FLink to="/shop">All</FLink>
            <FLink to="/shop">New Arrivals</FLink>
            <FLink to="/shop">Bestsellers</FLink>
            <FLink to="/shop">Limited Edition</FLink>
          </FooterCol>
          <FooterCol title="Care">
            <FLink to="/contact">Contact</FLink>
            <FLink to="/track">Track Order</FLink>
            <FLink to="/about">Our Story</FLink>
            <FLink to="/contact">Shipping</FLink>
          </FooterCol>
          <FooterCol title="Account">
            <FLink to="/login">Sign In</FLink>
            <FLink to="/register">Create Account</FLink>
            <FLink to="/profile">My Profile</FLink>
            <FLink to="/wishlist">Wishlist</FLink>
          </FooterCol>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-6 border-t border-white/15 pt-8 md:flex-row md:items-center">
          <p className="font-serif text-sm text-white/60">© {new Date().getFullYear()} SK — Handcrafted with care.</p>
          <div className="flex items-center gap-3">
            {[Instagram, Twitter, Facebook].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="Social"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 transition-all duration-300 ease-luxe hover:bg-white/10"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="md:col-span-2">
      <h4 className="mb-4 text-xs uppercase tracking-[0.25em] text-[var(--gold)]">{title}</h4>
      <ul className="flex flex-col gap-2 font-serif text-white/75">{children}</ul>
    </div>
  );
}

function FLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link to={to} className="story-link inline-block hover:text-white">
        {children}
      </Link>
    </li>
  );
}
