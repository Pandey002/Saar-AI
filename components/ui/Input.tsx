import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-line bg-canvas px-4 text-sm text-ink outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10",
        className
      )}
      {...props}
    />
  );
}
