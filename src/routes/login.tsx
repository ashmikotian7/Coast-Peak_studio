import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/sk/SiteLayout";
import { Logo } from "@/components/sk/Logo";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — SK" }] }),
  component: () => <AuthShell title="Welcome back" subtitle="Sign in to your SK account" cta="Sign in" alt={<>New here? <Link to="/register" className="story-link">Create account</Link></>} forgot />,
});

export function AuthShell({ title, subtitle, cta, alt, forgot }: { title: string; subtitle: string; cta: string; alt: React.ReactNode; forgot?: boolean }) {
  return (
    <SiteLayout>
      <section className="relative min-h-[100svh] bg-hero-gradient pt-28 text-[var(--ivory)]">
        <div className="mx-auto flex max-w-md flex-col items-center px-6 pt-12 text-center">
          <Logo />
          <p className="mt-8 font-serif text-xs uppercase tracking-[0.4em] text-[var(--gold)]">Members atelier</p>
          <h1 className="mt-3 font-display text-5xl">{title}</h1>
          <p className="mt-3 font-serif text-white/70">{subtitle}</p>

          <form onSubmit={(e) => e.preventDefault()} className="mt-10 w-full space-y-3 text-left">
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
            <button className="mt-2 w-full rounded-full bg-gold-gradient py-4 text-sm font-medium uppercase tracking-[0.2em] text-[oklch(0.2_0.06_305)] shadow-gold transition-transform duration-300 ease-luxe hover:scale-[1.01]">
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
  return <input {...props} className="w-full rounded-full border border-white/20 bg-white/5 px-5 py-3.5 text-sm text-white placeholder:text-white/50 outline-none transition-all duration-300 focus:border-[var(--gold)]" />;
}
