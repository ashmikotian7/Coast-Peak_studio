import { createFileRoute, Link } from "@tanstack/react-router";
import { User, Package, Heart, MapPin, LogOut } from "lucide-react";
import { SiteLayout } from "@/components/sk/SiteLayout";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — SK" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <SiteLayout>
      <section className="bg-lavender-gradient pt-32 pb-12 md:pt-40">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold-gradient shadow-gold">
              <span className="font-display text-3xl text-[oklch(0.2_0.06_305)]">A</span>
            </div>
            <div>
              <p className="font-serif text-xs uppercase tracking-[0.3em] text-[var(--royal)]">SK Collector</p>
              <h1 className="mt-1 font-display text-4xl md:text-5xl">Hello, Aanya</h1>
              <p className="font-serif text-muted-foreground">aanya@example.com</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 md:grid-cols-3 md:px-12">
          <Card icon={Package} title="Orders" subtitle="3 active · 12 lifetime" to="/track" />
          <Card icon={Heart} title="Wishlist" subtitle="Saved pieces" to="/wishlist" />
          <Card icon={MapPin} title="Addresses" subtitle="Home · Studio" to="/profile" />
          <Card icon={User} title="Account details" subtitle="Name, email, preferences" to="/profile" />
          <Card icon={LogOut} title="Sign out" subtitle="See you soon" to="/login" />
        </div>
      </section>
    </SiteLayout>
  );
}

function Card({ icon: Icon, title, subtitle, to }: { icon: typeof User; title: string; subtitle: string; to: string }) {
  return (
    <Link to={to} className="group rounded-3xl border border-border bg-card p-6 shadow-soft transition-all duration-300 ease-luxe magnetic-hover">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-[var(--royal)] transition-colors group-hover:bg-gold-gradient group-hover:text-[oklch(0.2_0.06_305)]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-display text-2xl">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </Link>
  );
}
