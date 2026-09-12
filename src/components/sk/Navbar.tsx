import { Link, useRouterState } from "@tanstack/react-router";
import { Heart, ShoppingBag, User, Search, Menu, X, LayoutDashboard } from "lucide-react";
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

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-[60] transition-all duration-500 ease-luxe md:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="absolute inset-0 bg-hero-gradient" onClick={() => setOpen(false)} aria-hidden />
        <div
          className={`relative flex h-full flex-col p-6 text-[var(--ivory)] transition-transform duration-500 ease-luxe overflow-y-auto ${
            open ? "translate-y-0" : "-translate-y-4"
          }`}
        >
          <div className="flex items-center justify-between text-white shrink-0">
            <Logo />
            <button onClick={() => setOpen(false)} className="rounded-full border border-white/20 p-2" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="my-8 flex flex-col gap-4 sm:gap-6">
            {navLinks.map((l, i) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="font-display text-3xl sm:text-4xl text-white transition-colors hover:text-[var(--gold)]"
                style={{ animationDelay: `${0.1 + i * 0.06}s` }}
              >
                {l.label}
              </Link>
            ))}
            <Link to="/wishlist" onClick={() => setOpen(false)} className="font-display text-3xl sm:text-4xl text-white transition-colors hover:text-[var(--gold)]">
              Wishlist
            </Link>
            <Link to="/dashboard" onClick={() => setOpen(false)} className="font-display text-3xl sm:text-4xl text-white transition-colors hover:text-[var(--gold)]">
              Dashboard
            </Link>
            <Link to="/profile" onClick={() => setOpen(false)} className="font-display text-3xl sm:text-4xl text-white transition-colors hover:text-[var(--gold)]">
              Profile
            </Link>
          </nav>
          <div className="mt-auto pt-6 flex items-center justify-between text-xs text-white/60 border-t border-white/10 shrink-0">
            <span>Handcrafted in small batches</span>
            <span>Coast &amp; Peak ©</span>
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
