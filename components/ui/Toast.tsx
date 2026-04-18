import React, { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, isVisible, onClose, duration = 3000 }: ToastProps) {
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!shouldRender && !isVisible) return null;

  return (
    <div
      className={`fixed bottom-8 left-1/2 z-[99999] -translate-x-1/2 transform transition-all duration-500 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
      onTransitionEnd={() => {
        if (!isVisible) setShouldRender(false);
      }}
    >
      <div className="flex items-center gap-3 rounded-2xl bg-slate-900/90 px-6 py-4 shadow-2xl backdrop-blur-xl border border-white/10 ring-1 ring-white/5">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        </div>
        <p className="text-sm font-semibold text-white tracking-tight">{message}</p>
        <button
          onClick={onClose}
          className="ml-2 rounded-full p-1 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
