import { toast } from "sonner";

export function GoogleButton({ label = "Continue with Google" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => toast("Google sign-in", { description: "Connect Lovable Cloud to enable Google auth." })}
      className="flex w-full items-center justify-center gap-3 rounded-full border border-white/25 bg-white/95 px-5 py-3.5 text-sm font-medium text-[oklch(0.2_0.06_305)] shadow-soft transition-all duration-300 ease-luxe hover:scale-[1.01] hover:bg-white"
    >
      <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden>
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
        <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 16 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6 29.3 4 24 4 16.1 4 9.3 8.4 6.3 14.7z"/>
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.2 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.2 39.5 16 44 24 44z"/>
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.6l6.2 5.2C41.3 35.2 44 30 44 24c0-1.2-.1-2.3-.4-3.5z"/>
      </svg>
      {label}
    </button>
  );
}
