"use client";

import { useCallback } from "react";
import { Globe, Check } from "lucide-react";
import type { LanguageMode } from "@/types";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  value: LanguageMode;
  onChange: (value: LanguageMode) => void;
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const handleSelect = useCallback((lang: LanguageMode) => {
    onChange(lang);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("saar_language_preference", lang);
    }
  }, [onChange]);

  // Using a pseudo-element bridge in the dropdown container to prevent the menu from closing when moving mouse between icon and menu
  return (
    <div className="group relative inline-block cursor-pointer pb-2 -mb-2">
      <div className="flex rounded-full p-2 text-slate-500 transition-colors group-hover:bg-slate-100 group-hover:text-slate-900 focus:outline-none">
        <Globe className="h-5 w-5" />
      </div>

      {/* Smooth CSS-driven popover */}
      <div className="pointer-events-none absolute right-0 top-full z-50 min-w-[220px] origin-top-right -translate-y-2 scale-95 opacity-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100">
        <div className="mt-1 rounded-2xl border border-slate-200/60 bg-white p-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.12)]">
          <div className="px-3 pb-2 pt-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
            Output Language
          </div>
          
          <div className="space-y-1">
            <button
              onClick={() => handleSelect("english")}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[14px] font-bold transition-all",
                value === "english" 
                  ? "bg-[#f8fafc] text-slate-900" 
                  : "text-slate-600 hover:bg-[#f8fafc]/50 hover:text-slate-800"
              )}
            >
              <span>English</span>
              {value === "english" && <Check className="h-4 w-4 text-blue-600" />}
            </button>
            
            <button
              onClick={() => handleSelect("hinglish")}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[14px] font-bold transition-all",
                value === "hinglish" 
                  ? "bg-[#f8fafc] text-slate-900" 
                  : "text-slate-600 hover:bg-[#f8fafc]/50 hover:text-slate-800"
              )}
            >
              <span>Hinglish</span>
              {value === "hinglish" && <Check className="h-4 w-4 text-blue-600" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
