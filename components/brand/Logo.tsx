import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = "", size = 24 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 
        Stylized Arch/Gate Logo 
        Based on the "Sanctum" branding image
      */}
      <path
        d="M6 21V11.2C6 9.8 7.12 8.6 8.5 8.6H15.5C16.88 8.6 18 9.8 18 11.2V21"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M4 21H20"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M12 4L18 8.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M12 4L6 8.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SanctumWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-serif tracking-tight ${className}`}>
      sanctum
    </span>
  );
}
