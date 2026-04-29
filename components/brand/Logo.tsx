interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * The Minimalist "Vidya V" - A clean, bold, and modern identity
 * focusing on clarity and essential growth.
 */
export function Logo({ className = "", size = 32 }: LogoProps) {
  return (
    <div 
      className={`relative flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Simple Minimalist Circle Frame */}
        <circle 
          cx="20" 
          cy="20" 
          r="18" 
          stroke="#10B981" 
          strokeWidth="1.5" 
          className="opacity-20 group-hover:opacity-40 transition-opacity" 
        />
        
        {/* The Bold Minimalist 'V' */}
        <path
          d="M10 14L20 30L30 14"
          stroke="#064E3B"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="group-hover:stroke-emerald-600 transition-colors duration-300"
        />

        {/* Small Focus Point (Optional, kept for a touch of "Premium") */}
        <circle cx="20" cy="18" r="2.5" fill="#10B981" />
      </svg>
    </div>
  );
}

/**
 * Minimalist Wordmark.
 * Clean, bold typography with a solid emerald accent.
 */
export function VidyaWordmark({ className = "", withDot = true }: { className?: string; withDot?: boolean }) {
  return (
    <span 
      className={`text-[26px] font-black tracking-tight flex items-center gap-0.5 ${className}`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <span className="text-[#064E3B]">Vidya</span>
      {withDot && (
        <span 
          className="h-2 w-2 rounded-full mt-2 bg-[#10B981] shadow-sm" 
        />
      )}
    </span>
  );
}

/**
 * The consolidated Minimalist Grand Logo component.
 */
export function GrandLogo({ className = "", showWordmark = true, size = 32 }: { className?: string; showWordmark?: boolean; size?: number }) {
  return (
    <div className={`flex items-center gap-3 group cursor-pointer ${className}`}>
      <Logo size={size} />
      {showWordmark && (
        <VidyaWordmark className="text-[26px] sm:text-[28px]" />
      )}
    </div>
  );
}
