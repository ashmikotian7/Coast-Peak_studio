import { Link } from "@tanstack/react-router";
import { Heart, Home, Search, ShoppingBag, User } from "lucide-react";
import { useStore } from "@/hooks/use-store";

export function MobileTabBar() {
  const { cartCount, wishlist } = useStore();
  const items = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/shop", icon: Search, label: "Shop" },
    { to: "/wishlist", icon: Heart, label: "Wishlist", badge: wishlist.length },
    { to: "/cart", icon: ShoppingBag, label: "Cart", badge: cartCount },
    { to: "/profile", icon: User, label: "You" },
  ] as const;

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 md:hidden">
      <div className="glass mx-auto flex max-w-md items-center justify-around rounded-full p-2 shadow-luxe">
        {items.map(({ to, icon: Icon, label, badge }) => (
          <Link
            key={to}
            to={to}
            className="group relative flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-1.5 text-foreground/70 transition-all duration-300 ease-luxe"
            activeProps={{ className: "relative flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-1.5 text-primary-foreground bg-primary" }}
          >
            <span className="relative">
              <Icon className="h-[18px] w-[18px]" />
              {badge && badge > 0 ? (
                <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--gold)] px-1 text-[10px] font-semibold text-[oklch(0.2_0.06_305)]">
                  {badge}
                </span>
              ) : null}
            </span>
            <span className="text-[10px] tracking-wide">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
