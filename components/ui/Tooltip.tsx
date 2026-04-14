import React from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({ content, children, position = "bottom", className }: TooltipProps) {
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div className={cn("group relative inline-flex", className)}>
      {children}
      {content && (
        <div
          className={cn(
            "absolute z-50 whitespace-nowrap rounded bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none",
            positionClasses[position]
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}
