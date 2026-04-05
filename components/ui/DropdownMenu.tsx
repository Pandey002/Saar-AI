"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  trigger: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}

export function DropdownMenu({ isOpen, onClose, children, trigger, align = "right", className }: DropdownMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <div onClick={() => isOpen ? onClose() : undefined}>{trigger}</div>
      
      <div
        className={cn(
          "absolute top-full mt-2 z-50 min-w-[220px] rounded-2xl border border-slate-200/60 bg-white p-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.12)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left",
          isOpen ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-2 scale-95 opacity-0",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function DropdownItem({ 
  children, 
  onClick, 
  isActive, 
  className 
}: { 
  children: React.ReactNode; 
  onClick: () => void; 
  isActive?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-bold transition-colors",
        isActive 
          ? "bg-[#f8fafc] text-slate-900" 
          : "text-slate-600 hover:bg-[#f8fafc]/80 hover:text-slate-900",
        className
      )}
    >
      {children}
    </button>
  );
}
