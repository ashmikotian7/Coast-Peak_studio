import logoImage from "@/assets/coast-peak-studio.png";

export function Logo({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 mt-4 ${className}`}>
      <img 
        src={logoImage} 
        alt="Coast & Peak Studio" 
        className={`h-20 w-auto object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.5)] brightness-110 ${compact ? 'h-16' : 'h-20'}`}
      />
    </span>
  );
}
