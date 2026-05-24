import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export const LANGUAGES = [
  { code: "en", label: "English", flag: "EN" },
  { code: "hi", label: "हिन्दी", flag: "HI" },
  { code: "fr", label: "Français", flag: "FR" },
  { code: "es", label: "Español", flag: "ES" },
  { code: "de", label: "Deutsch", flag: "DE" },
  { code: "ja", label: "日本語", flag: "JA" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

const I18nContext = createContext<{ lang: LangCode; setLang: (l: LangCode) => void } | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<LangCode>("en");
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cp-lang") as LangCode | null;
      if (stored) setLang(stored);
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("cp-lang", lang); } catch {}
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);
  return <I18nContext.Provider value={{ lang, setLang }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be inside I18nProvider");
  return ctx;
}
