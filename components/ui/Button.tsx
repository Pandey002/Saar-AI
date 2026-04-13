import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-primary text-white shadow-card hover:bg-[#0891b2]",
        variant === "secondary" && "border border-line bg-surface text-ink hover:bg-white",
        variant === "ghost" && "text-muted hover:bg-slate-100 hover:text-ink",
        className
      )}
      {...props}
    />
  );
}
