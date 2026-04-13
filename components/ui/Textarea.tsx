import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[220px] w-full resize-none rounded-xl border border-line bg-canvas px-5 py-4 text-sm leading-6 text-ink outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10",
        className
      )}
      {...props}
    />
  );
}
