/**
 * The minimalist Vidya identity now focuses entirely on clean, 
 * authoritative typography. The geometric icon has been removed 
 * for maximum simplicity.
 */
export function Logo() {
  return null;
}

/**
 * Premium Text-Only Wordmark.
 * Authoritative typography with a signature emerald accent dot.
 */
export function VidyaWordmark({ className = "", withDot = true }: { className?: string; withDot?: boolean }) {
  return (
    <span 
      className={`text-[26px] font-black tracking-tight flex items-center gap-0.5 ${className}`}
      style={{ 
        fontFamily: "'Inter', sans-serif",
        fontFeatureSettings: "'ss01', 'cv02', 'cv11'"
      }}
    >
      <span className="text-[#064E3B]">Vidya</span>
      {withDot && (
        <span 
          className="h-2 w-2 rounded-full mt-2 bg-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.4)]" 
        />
      )}
    </span>
  );
}

/**
 * The consolidated Text-Only Brand Identity.
 */
export function GrandLogo({ className = "", showWordmark = true }: { className?: string; showWordmark?: boolean; size?: number }) {
  return (
    <div className={`flex items-center group cursor-pointer ${className}`}>
      {showWordmark && (
        <VidyaWordmark className="text-[26px] sm:text-[28px] transition-transform duration-300 group-hover:translate-x-0.5" />
      )}
    </div>
  );
}
