import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/sk/SiteLayout";
import { Logo } from "@/components/sk/Logo";
import { GoogleButton } from "@/components/sk/GoogleButton";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Coast & Peak Studio" }] }),
  component: () => (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your Coast & Peak account"
      cta="Sign in"
      alt={<>New here? <Link to="/register" className="story-link">Create account</Link></>}
      forgot
      google
    />
  ),
});

export function AuthShell({
  title, subtitle, cta, alt, forgot, google = true,
}: {
  title: string; subtitle: string; cta: string; alt: React.ReactNode;
  forgot?: boolean; google?: boolean;
}) {
  return (
    <SiteLayout>
      <section className="relative min-h-[100svh] bg-hero-gradient pt-28 text-[var(--ivory)]">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-[var(--royal)] blur-3xl float-3d" />
          <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-[var(--wine)] blur-3xl float-3d" style={{ animationDelay: "1.5s" }} />
        </div>
        <div className="relative mx-auto flex max-w-md flex-col items-center px-6 pt-12 text-center">
          <div className="depth-3d rounded-3xl bg-white/5 p-2 backdrop-blur-md">
            <Logo />
          </div>
          <p className="mt-8 font-serif text-xs uppercase tracking-[0.4em] text-[var(--lavender)]">Members atelier</p>
          <h1 className="mt-3 font-display text-5xl">{title}</h1>
          <p className="mt-3 font-serif text-white/70">{subtitle}</p>

          {google && (
            <div className="mt-8 w-full">
              <GoogleButton label={cta === "Create account" ? "Sign up with Google" : "Continue with Google"} />
              <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/40">
                <span className="h-px flex-1 bg-white/15" />
                or
                <span className="h-px flex-1 bg-white/15" />
              </div>
            </div>
          )}

          <form onSubmit={(e) => e.preventDefault()} className={`w-full space-y-3 text-left ${google ? "" : "mt-10"}`}>
            {cta === "Create account" && (
              <Input placeholder="Full name" />
            )}
            <Input placeholder="Email" type="email" />
            {cta !== "Send reset link" && <Input placeholder="Password" type="password" />}
            {forgot && (
              <div className="flex justify-end">
                <Link to="/forgot" className="story-link text-xs text-white/70">Forgot password?</Link>
              </div>
            )}
            <button className="mt-2 w-full rounded-full bg-gradient-to-r from-[var(--royal)] to-[var(--wine)] py-4 text-sm font-medium uppercase tracking-[0.2em] text-white shadow-luxe transition-transform duration-300 ease-luxe hover:scale-[1.01] depth-3d">
              {cta}
            </button>
          </form>
          <p className="mt-6 font-serif text-sm text-white/70">{alt}</p>
        </div>
      </section>
    </SiteLayout>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="w-full rounded-full border border-white/20 bg-white/5 px-5 py-3.5 text-sm text-white placeholder:text-white/50 outline-none transition-all duration-300 focus:border-[var(--lavender)] focus:bg-white/10" />;
}
