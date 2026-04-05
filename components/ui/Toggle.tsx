import { cn } from "@/lib/utils";
import type { LanguageMode } from "@/types";

interface ToggleProps {
  value: LanguageMode;
  onChange: (value: LanguageMode) => void;
}

export function Toggle({ value, onChange }: ToggleProps) {
  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
      {(["english", "hinglish"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.08em] transition-colors",
            value === option ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          )}
        >
          {option === "english" ? "EN" : "Hinglish"}
        </button>
      ))}
    </div>
  );
}
