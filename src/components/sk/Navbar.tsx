import { Link, useRouterState } from "@tanstack/react-router";
import {
  Heart,
  ShoppingBag,
  User,
  Search,
  Menu,
  X,
  LayoutDashboard,
  Home,
  Sparkles,
  Compass,
  Mail,
  Package,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { useStore } from "@/hooks/use-store";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/about", label: "Story" },
  { to: "/contact", label: "Contact" },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { cartCount, wishlist } = useStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";
  // On non-home pages, always use the solid/scrolled appearance.
  const solid = scrolled || !isHome;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const linkBase = solid
    ? "text-foreground/85 hover:text-foreground"
    : "text-white/95 hover:text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)]";
  const iconBase = solid
    ? "text-foreground/80 hover:bg-secondary hover:text-foreground"
    : "text-white hover:bg-white/15";
  const logoColor = solid ? "text-foreground" : "text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)]";

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-luxe ${
          solid ? "glass shadow-soft" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:h-20 md:px-8">
          <Link to="/" aria-label="Coast & Peak Studio Home" className={logoColor}>
            <Logo />
          </Link>

          <nav className="hidden items-center gap-10 md:flex">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`story-link font-serif text-base tracking-wide ${linkBase}`}
                activeProps={{ className: `story-link font-serif text-base tracking-wide font-semibold ${solid ? "text-foreground" : "text-white"}` }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 md:gap-2">
            <IconButton aria-label="Search" onClick={() => setSearchOpen(true)} className={iconBase}>
              <Search className="h-[18px] w-[18px]" />
            </IconButton>
            <Link to="/dashboard" className="hidden md:inline-flex" aria-label="Seller dashboard">
              <IconButton aria-label="Seller dashboard" className={iconBase}>
                <LayoutDashboard className="h-[18px] w-[18px]" />
              </IconButton>
            </Link>
            <Link to="/wishlist" className="hidden md:inline-flex">
              <IconButton aria-label="Wishlist" className={iconBase}>
                <Heart className="h-[18px] w-[18px]" />
                {wishlist.length > 0 && <Badge>{wishlist.length}</Badge>}
              </IconButton>
            </Link>
            <Link to="/cart">
              <IconButton aria-label="Cart" className={iconBase}>
                <ShoppingBag className="h-[18px] w-[18px]" />
                {cartCount > 0 && <Badge>{cartCount}</Badge>}
              </IconButton>
            </Link>
            <Link to="/profile" className="hidden md:inline-flex">
              <IconButton aria-label="Profile" className={iconBase}>
                <User className="h-[18px] w-[18px]" />
              </IconButton>
            </Link>
            <IconButton aria-label="Menu" className={`md:hidden ${iconBase}`} onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </IconButton>
          </div>
        </div>
      </header>

      {/* Mobile menu slide-in drawer */}
      <div
        className={`fixed inset-0 z-[60] transition-opacity duration-300 md:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setOpen(false)}
          aria-hidden
        />

        {/* Slide-out Drawer from Right */}
        <div
          className={`relative ml-auto flex h-full w-[85vw] max-w-[330px] flex-col bg-gradient-to-b from-[oklch(0.26_0.12_300)] via-[oklch(0.23_0.10_18)] to-[oklch(0.20_0.08_300)] shadow-2xl border-l border-white/10 text-[var(--ivory)] transition-transform duration-300 ease-out overflow-y-auto ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 shrink-0">
            <div className="flex flex-col">
              <span className="font-serif text-base tracking-wider text-white font-medium">Coast &amp; Peak</span>
              <span className="text-[9px] uppercase font-mono tracking-[0.22em] text-[var(--gold)]">
                Jewels Atelier
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition-colors hover:bg-white/15 hover:text-white active:scale-95"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Search trigger inside drawer */}
          <div className="px-4 pt-3 pb-1 shrink-0">
            <button
              onClick={() => {
                setOpen(false);
                setSearchOpen(true);
              }}
              className="flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Search className="h-3.5 w-3.5 text-[var(--gold)]" />
              <span>Search gems &amp; jewelry…</span>
            </button>
          </div>

          {/* Navigation Sections */}
          <div className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
            {/* Main Navigation */}
            <div>
              <p className="px-2 mb-1.5 text-[10px] font-mono uppercase tracking-[0.22em] text-[var(--gold)]/80">
                Explore
              </p>
              <nav className="flex flex-col space-y-0.5">
                {[
                  { to: "/", label: "Home", icon: Home },
                  { to: "/shop", label: "Shop Collections", icon: Sparkles },
                  { to: "/about", label: "Our Story", icon: Compass },
                  { to: "/contact", label: "Contact & Concierge", icon: Mail },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all ${
                        isActive
                          ? "bg-white/15 text-[var(--gold)] font-semibold"
                          : "text-white/85 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`h-4 w-4 ${isActive ? "text-[var(--gold)]" : "text-white/50 group-hover:text-white/90"}`} />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-white/30 group-hover:text-white/70 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Atelier & Account */}
            <div className="pt-2 border-t border-white/10">
              <p className="px-2 mb-1.5 text-[10px] font-mono uppercase tracking-[0.22em] text-[var(--gold)]/80">
                Account &amp; Studio
              </p>
              <nav className="flex flex-col space-y-0.5">
                <Link
                  to="/wishlist"
                  onClick={() => setOpen(false)}
                  className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all ${
                    pathname === "/wishlist"
                      ? "bg-white/15 text-[var(--gold)] font-semibold"
                      : "text-white/85 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Heart className="h-4 w-4 text-white/50 group-hover:text-white/90" />
                    <span>Wishlist</span>
                  </div>
                  {wishlist.length > 0 ? (
                    <span className="rounded-full bg-[var(--gold)] px-1.5 py-0.5 text-[10px] font-bold text-black">
                      {wishlist.length}
                    </span>
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-white/30" />
                  )}
                </Link>

                <Link
                  to="/cart"
                  onClick={() => setOpen(false)}
                  className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all ${
                    pathname === "/cart"
                      ? "bg-white/15 text-[var(--gold)] font-semibold"
                      : "text-white/85 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="h-4 w-4 text-white/50 group-hover:text-white/90" />
                    <span>Shopping Bag</span>
                  </div>
                  {cartCount > 0 ? (
                    <span className="rounded-full bg-[var(--gold)] px-1.5 py-0.5 text-[10px] font-bold text-black">
                      {cartCount}
                    </span>
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-white/30" />
                  )}
                </Link>

                <Link
                  to="/track"
                  onClick={() => setOpen(false)}
                  className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all ${
                    pathname === "/track"
                      ? "bg-white/15 text-[var(--gold)] font-semibold"
                      : "text-white/85 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="h-4 w-4 text-white/50 group-hover:text-white/90" />
                    <span>Track Order</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-white/30" />
                </Link>

                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all ${
                    pathname === "/profile"
                      ? "bg-white/15 text-[var(--gold)] font-semibold"
                      : "text-white/85 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <User className="h-4 w-4 text-white/50 group-hover:text-white/90" />
                    <span>My Profile</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-white/30" />
                </Link>

                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all ${
                    pathname === "/dashboard"
                      ? "bg-white/15 text-[var(--gold)] font-semibold"
                      : "text-white/85 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="h-4 w-4 text-white/50 group-hover:text-white/90" />
                    <span>Seller Dashboard</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-white/30" />
                </Link>
              </nav>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="mt-auto border-t border-white/10 bg-black/20 p-4 shrink-0 space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] text-white/65">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
              <span>Complimentary insured shipping</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-white/40">
              <span>Handcrafted</span>
              <span>Coast &amp; Peak ©</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search overlay */}
      <div
        className={`fixed inset-0 z-[70] transition-all duration-300 ease-luxe ${
          searchOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="absolute inset-0 bg-foreground/40 backdrop-blur-md" onClick={() => setSearchOpen(false)} />
        <div className="relative mx-auto mt-20 sm:mt-28 md:mt-32 max-w-2xl px-4">
          <div className="glass rounded-3xl p-5 sm:p-6 shadow-luxe">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                autoFocus={searchOpen}
                placeholder="Search rings, amethyst, gifts…"
                className="flex-1 bg-transparent font-serif text-base sm:text-lg outline-none placeholder:text-muted-foreground"
              />
              <button onClick={() => setSearchOpen(false)} aria-label="Close search">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Trending</p>
              <div className="flex flex-wrap gap-2">
                {["Amethyst", "Stack rings", "Gifts under $200", "Limited edition", "New arrivals"].map((s) => (
                  <button
                    key={s}
                    className="rounded-full border border-border px-3 py-1.5 text-xs sm:text-sm hover:bg-secondary"
                    onClick={() => setSearchOpen(false)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function IconButton({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ease-luxe ${className}`}
    >
      {children}
    </button>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
      {children}
    </span>
  );
}
