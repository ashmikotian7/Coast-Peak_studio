import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { ThemeProvider } from "@/hooks/use-theme";
import { StoreProvider } from "@/hooks/use-store";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-hero-gradient px-4 text-[var(--ivory)]">
      <div className="max-w-md text-center">
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-[var(--gold)]">404</p>
        <h1 className="mt-4 font-display text-6xl">Lost in the velvet</h1>
        <p className="mt-4 text-white/70">This page has slipped between the petals.</p>
        <a
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-gold-gradient px-6 py-3 text-sm font-medium text-[oklch(0.2_0.06_305)] shadow-gold"
        >
          Return home
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl">Something dimmed the lights</h1>
        <p className="mt-3 text-sm text-muted-foreground">Please try again in a moment.</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-full bg-primary px-6 py-3 text-sm text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SK — Handcrafted Luxury Jewelry" },
      { name: "description", content: "SK is a boutique studio creating handcrafted luxury jewelry — heirlooms in gold and amethyst, made in small batches." },
      { name: "author", content: "SK" },
      { property: "og:title", content: "SK — Handcrafted Luxury Jewelry" },
      { property: "og:description", content: "Heirlooms in gold and amethyst, handcrafted in small batches." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <StoreProvider>
          <Outlet />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                fontFamily: "var(--font-serif)",
                background: "var(--popover)",
                color: "var(--popover-foreground)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
              },
            }}
          />
        </StoreProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
