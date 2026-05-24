import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, User, Search, Menu, X, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { LanguageDropdown } from "./LanguageDropdown";
import { useStore } from "@/hooks/use-store";
import { useTheme } from "@/hooks/use-theme";

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
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  // When not scrolled, the nav floats over the dark hero — use ivory text.
  // When scrolled, glass over light bg — use foreground.
  const linkBase = scrolled
    ? "text-foreground/85 hover:text-foreground"
    : "text-white/95 hover:text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.35)]";
  const iconBase = scrolled
    ? "text-foreground/80 hover:bg-secondary hover:text-foreground"
    : "text-white hover:bg-white/15";

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-luxe ${
          scrolled ? "glass shadow-soft" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:h-20 md:px-8">
          <Link to="/" aria-label="Coast & Peak Studio Home">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-10 md:flex">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`story-link font-serif text-base tracking-wide ${linkBase}`}
                activeProps={{ className: `story-link font-serif text-base tracking-wide font-semibold ${scrolled ? "text-foreground" : "text-white"}` }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 md:gap-2">
            <div className="hidden md:block">
              <LanguageDropdown onLight={!scrolled} />
            </div>
            <IconButton aria-label="Search" onClick={() => setSearchOpen(true)} className={iconBase}>
              <Search className="h-[18px] w-[18px]" />
            </IconButton>
            <IconButton aria-label="Toggle theme" onClick={toggle} className={iconBase}>
              {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </IconButton>
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
        <div
          className="absolute inset-0 bg-hero-gradient"
          onClick={() => setOpen(false)}
          aria-hidden
        />
        <div
          className={`relative flex h-full flex-col p-6 text-[var(--ivory)] transition-transform duration-500 ease-luxe ${
            open ? "translate-y-0" : "-translate-y-4"
          }`}
        >
          <div className="flex items-center justify-between">
            <Logo />
            <button
              onClick={() => setOpen(false)}
              className="rounded-full border border-white/20 p-2"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="mt-16 flex flex-col gap-6">
            {navLinks.map((l, i) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="font-display text-5xl animate-fade-up text-white"
                style={{ animationDelay: `${0.1 + i * 0.08}s` }}
              >
                {l.label}
              </Link>
            ))}
            <Link to="/wishlist" onClick={() => setOpen(false)} className="font-display text-5xl text-white animate-fade-up" style={{ animationDelay: "0.42s" }}>
              Wishlist
            </Link>
            <Link to="/profile" onClick={() => setOpen(false)} className="font-display text-5xl text-white animate-fade-up" style={{ animationDelay: "0.5s" }}>
              Profile
            </Link>
          </nav>
          <div className="mt-8">
            <LanguageDropdown onLight />
          </div>
          <div className="mt-auto flex items-center justify-between text-sm text-white/60">
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
        <div className="relative mx-auto mt-32 max-w-2xl px-4">
          <div className="glass rounded-3xl p-6 shadow-luxe">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                autoFocus={searchOpen}
                placeholder="Search rings, amethyst, gifts…"
                className="flex-1 bg-transparent font-serif text-lg outline-none placeholder:text-muted-foreground"
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
                    className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-secondary"
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

function IconButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
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
