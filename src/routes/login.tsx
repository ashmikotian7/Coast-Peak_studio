import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/sk/SiteLayout";
import { GoogleButton } from "@/components/sk/GoogleButton";
import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, Phone, Globe, Sparkles } from "lucide-react";
import { toast } from "sonner";

const getCountries = () => {
  const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
  const countries: string[] = [];
  const countryCodes = [
    'AF', 'AL', 'DZ', 'AD', 'AO', 'AR', 'AM', 'AU', 'AT', 'AZ', 'BS', 'BH', 'BD', 'BB', 'BY', 'BE',
    'BZ', 'BJ', 'BT', 'BO', 'BA', 'BW', 'BR', 'BN', 'BG', 'BF', 'BI', 'KH', 'CM', 'CA', 'CV', 'CF',
    'TD', 'CL', 'CN', 'CO', 'KM', 'CG', 'CR', 'HR', 'CU', 'CY', 'CZ', 'DK', 'DJ', 'DO', 'EC', 'EG',
    'SV', 'EE', 'ET', 'FJ', 'FI', 'FR', 'GA', 'GM', 'GE', 'DE', 'GH', 'GR', 'GT', 'GN', 'HT', 'HN',
    'HU', 'IS', 'IN', 'ID', 'IR', 'IQ', 'IE', 'IL', 'IT', 'JM', 'JP', 'JO', 'KZ', 'KE', 'KW', 'KG',
    'LA', 'LV', 'LB', 'LS', 'LR', 'LY', 'LT', 'LU', 'MG', 'MW', 'MY', 'MV', 'ML', 'MT', 'MX', 'MD',
    'MC', 'MN', 'ME', 'MA', 'MZ', 'MM', 'NA', 'NP', 'NL', 'NZ', 'NI', 'NE', 'NG', 'KP', 'NO', 'OM',
    'PK', 'PA', 'PY', 'PE', 'PH', 'PL', 'PT', 'QA', 'RO', 'RU', 'RW', 'SA', 'SN', 'RS', 'SL', 'SG',
    'SK', 'SI', 'SO', 'ZA', 'KR', 'ES', 'LK', 'SD', 'SE', 'CH', 'SY', 'TW', 'TJ', 'TZ', 'TH', 'TG',
    'TT', 'TN', 'TR', 'UG', 'UA', 'AE', 'GB', 'US', 'UY', 'UZ', 'VE', 'VN', 'YE', 'ZM', 'ZW',
  ];
  for (const code of countryCodes) {
    try {
      const name = regionNames.of(code);
      if (name) countries.push(name);
    } catch { }
  }
  return countries.sort();
};

const COUNTRIES = getCountries();

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Coast & Peak Studio" }] }),
  component: () => <LoginPage />,
});

function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      toast.error("Login failed", {
        description: error instanceof Error ? error.message : "An error occurred. Please check your credentials.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (email: string, fullName: string) => {
    setIsLoading(true);
    try {
      await loginWithGoogle(email, fullName);
    } catch (error) {
      toast.error("Google login failed", {
        description: error instanceof Error ? error.message : "An error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your Coast & Peak account"
      badge="Collector Access"
      cta="Sign in"
      alt={<>New here? <Link to="/register" className="story-link text-[var(--royal)]">Create account</Link></>}
      forgot
      google
      onSubmit={handleSubmit}
      onGoogleSubmit={handleGoogleLogin}
      isLoading={isLoading}
      email={email}
      onEmailChange={setEmail}
      password={password}
      onPasswordChange={setPassword}
    />
  );
}

export function AuthShell({
  title, subtitle, badge, cta, alt, forgot, google = true,
  onSubmit, onGoogleSubmit, isLoading, email, onEmailChange, password, onPasswordChange,
  fullName, onFullNameChange, passwordConfirm, onPasswordConfirmChange, phoneNumber, onPhoneNumberChange, country, onCountryChange,
}: {
  title: string; subtitle: string; badge?: string; cta: string; alt: React.ReactNode;
  forgot?: boolean; google?: boolean;
  onSubmit?: (e: React.FormEvent) => void;
  onGoogleSubmit?: (email: string, fullName: string) => void;
  isLoading?: boolean;
  email?: string;
  onEmailChange?: (email: string) => void;
  password?: string;
  onPasswordChange?: (password: string) => void;
  fullName?: string;
  onFullNameChange?: (fullName: string) => void;
  passwordConfirm?: string;
  onPasswordConfirmChange?: (passwordConfirm: string) => void;
  phoneNumber?: string;
  onPhoneNumberChange?: (phoneNumber: string) => void;
  country?: string;
  onCountryChange?: (country: string) => void;
}) {
  const isRegister = cta === "Create account";

  return (
    <SiteLayout>
      {/* Fixed full-viewport background layer — sits behind everything so
          the page background is always the lavender gradient, even if the
          content ends up taller than one screen and the page scrolls */}
      <div className="fixed inset-0 -z-10 bg-lavender-gradient" />

      {/* Hero background — offset below the fixed header with pt-20, and
          min-h-screen (minus that offset) keeps the gradient filling the
          rest of the viewport with no white/cream gap before the footer */}
      <div className="relative w-full min-h-screen pt-20 pb-12 flex items-center justify-center">

        {/* Ambient glow orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-[var(--royal)]/10 blur-[120px]" />
          <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full bg-[var(--wine)]/10 blur-[140px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[var(--gold)]/5 blur-[180px]" />
        </div>

        {/* Decorative shimmer lines */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-[var(--gold)] to-transparent" />
          <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-[var(--royal)]/50 to-transparent" />
        </div>

        {/* Card — vertically centered within the full-height hero via
            flex items-center on the parent, with balanced top/bottom
            padding instead of a fixed pt-24/pb-0 */}
        <div className="relative z-10 w-full max-w-[440px] px-4 py-8">

          {/* Brand badge */}
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-4 py-1.5 text-[10px] uppercase tracking-[0.35em] text-[var(--gold)] backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              {badge ?? "Coast & Peak Studio"}
            </span>
          </div>

          {/* Heading */}
          <div className="text-center mb-5">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-foreground mb-2 leading-tight">
              {title}
            </h1>
            <p className="font-serif text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {/* Glass card */}
          <div className="glass rounded-3xl border border-border shadow-luxe overflow-hidden">
            <div className="p-5 sm:p-7">

              {/* Google button */}
              {google && (
                <>
                  <GoogleButton
                    label={isRegister ? "Continue with Google" : "Sign in with Google"}
                    onSubmit={onGoogleSubmit}
                    isLoading={isLoading}
                  />
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">or</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                </>
              )}

              {/* Form */}
              <form onSubmit={onSubmit || ((e) => e.preventDefault())} className="space-y-3">

                {/* Register-only fields */}
                {isRegister && (
                  <>
                    <AuthInput
                      id="full-name"
                      icon={<User className="h-4 w-4" />}
                      placeholder="Full name"
                      value={fullName}
                      onChange={(e) => onFullNameChange?.(e.target.value)}
                      required
                    />
                    <AuthInput
                      id="phone-number"
                      icon={<Phone className="h-4 w-4" />}
                      placeholder="Phone number"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => onPhoneNumberChange?.(e.target.value)}
                      required
                    />
                  </>
                )}

                <AuthInput
                  id="email"
                  icon={<Mail className="h-4 w-4" />}
                  placeholder="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => onEmailChange?.(e.target.value)}
                  required
                />

                {cta !== "Send reset link" && (
                  <>
                    <PasswordInput
                      id="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => onPasswordChange?.(e.target.value)}
                      required
                    />
                    {isRegister && (
                      <PasswordInput
                        id="confirm-password"
                        placeholder="Confirm password"
                        value={passwordConfirm}
                        onChange={(e) => onPasswordConfirmChange?.(e.target.value)}
                        required
                      />
                    )}
                  </>
                )}

                {isRegister && (
                  <div className="relative">
                    <Globe className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <select
                      id="country"
                      value={country}
                      onChange={(e) => onCountryChange?.(e.target.value)}
                      required
                      className="w-full rounded-xl border border-border bg-background/60 pl-10 pr-4 py-3 text-sm text-foreground outline-none transition-all focus:border-[var(--royal)] focus:ring-2 focus:ring-[var(--royal)]/20 appearance-none cursor-pointer placeholder:text-muted-foreground"
                    >
                      <option value="" disabled>Select country</option>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}

                {forgot && (
                  <div className="flex justify-end pt-1">
                    <Link to="/forgot" className="text-xs text-[var(--royal)] hover:text-[var(--wine)] transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                )}

                <button
                  id="auth-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-1 rounded-full bg-gradient-to-r from-[var(--royal)] to-[var(--wine)] py-3.5 px-6 text-sm font-semibold uppercase tracking-[0.15em] text-white shadow-luxe transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Processing…
                    </span>
                  ) : cta}
                </button>
              </form>

              {/* Alt link */}
              <p className="mt-5 text-center font-serif text-sm text-muted-foreground">
                {alt}
              </p>
            </div>

            {/* Bottom decorative strip */}
            <div className="h-1 w-full bg-gradient-to-r from-[var(--royal)] via-[var(--gold)] to-[var(--wine)]" />
          </div>

          {/* Footer note */}
          <p className="mt-4 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
            Handcrafted in small batches · Coast & Peak ©
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}

/* ── Input helpers ─────────────────────────────────────────── */

function AuthInput({
  id,
  icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; icon: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
        {icon}
      </span>
      <input
        id={id}
        {...props}
        className="w-full rounded-xl border border-border bg-background/60 pl-10 pr-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-[var(--royal)] focus:ring-2 focus:ring-[var(--royal)]/20"
      />
    </div>
  );
}

function PasswordInput({
  id,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        id={id}
        {...props}
        type={show ? "text" : "password"}
        className="w-full rounded-xl border border-border bg-background/60 pl-10 pr-11 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-[var(--royal)] focus:ring-2 focus:ring-[var(--royal)]/20"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}