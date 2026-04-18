import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * The refined "Sanctuary" icon for Vidya.
 * High-contrast Navy and Vibrant Coral theme.
 */
export function Logo({ className = "", size = 28 }: LogoProps) {
  return (
    <div 
      className={`relative flex items-center justify-center transition-transform hover:scale-105 active:scale-95 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="20" cy="20" r="19" stroke="#0E1B2B" strokeWidth="0.5" strokeDasharray="2 2" className="opacity-20" />
        <path
          d="M10 32V18.5C10 12.9772 14.4772 8.5 20 8.5C25.5228 8.5 30 12.9772 30 18.5V32"
          stroke="#0E1B2B"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="drop-shadow-[0_0_8px_rgba(255,107,107,0.2)]"
        />
        <path
          d="M7 32H33"
          stroke="#0E1B2B"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M20 5L28 11.5"
          stroke="#0E1B2B"
          strokeWidth="2"
          strokeLinecap="round"
          className="opacity-40"
        />
        <path
          d="M20 5L12 11.5"
          stroke="#0E1B2B"
          strokeWidth="2"
          strokeLinecap="round"
          className="opacity-40"
        />
        {/* The Pulsing Core - Vibrant Coral */}
        <circle 
          cx="20" 
          cy="22" 
          r="3.5" 
          fill="#FF6B6B" 
          className="animate-pulse"
          style={{ filter: "drop-shadow(0 0 6px rgba(255,107,107,0.6))" }}
        />
      </svg>
    </div>
  );
}

/**
 * Premium Wordmark using Instrument Serif font.
 * Deep Navy text with Vibrant Coral accent dot.
 */
export function VidyaWordmark({ className = "", withDot = true }: { className?: string; withDot?: boolean }) {
  return (
    <span 
      className={`tracking-normal flex items-baseline gap-0.5 ${className}`}
      style={{ fontFamily: "var(--font-playfair), serif" }}
    >
      <span style={{ color: "#0E1B2B" }}>Vidya</span>
      {withDot && (
        <span 
          className="h-1.5 w-1.5 rounded-full" 
          style={{ backgroundColor: "#FF6B6B", boxShadow: "0 0 8px rgba(255,107,107,0.4)" }} 
        />
      )}
    </span>
  );
}

/**
 * The consolidated "Grand" Logo component for use across all headers.
 */
export function GrandLogo({ className = "", showWordmark = true, size = 32 }: { className?: string; showWordmark?: boolean; size?: number }) {
  return (
    <div className={`flex items-center gap-2.5 group cursor-pointer ${className}`}>
      <Logo size={size} />
      {showWordmark && (
        <VidyaWordmark className="text-[26px] font-bold sm:text-[30px]" />
      )}
    </div>
  );
}
