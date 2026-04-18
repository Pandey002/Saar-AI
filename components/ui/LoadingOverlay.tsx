import React from "react";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

export function LoadingOverlay({ isVisible, message }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-canvas/80 backdrop-blur-md transition-all duration-300">
      <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-white shadow-2xl shadow-primary/20">
        <div className="absolute inset-0 animate-ping rounded-[2.5rem] border-2 border-primary/30" />
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-primary" />
      </div>
      <h3 className="text-center text-[24px] font-extrabold tracking-tight text-slate-900 px-6">
        Please wait...AI is cooking for you
      </h3>
      <p className="mt-3 text-sm font-medium text-slate-500">
        {message || "Vidya is preparing your personalized study experience."}
      </p>
    </div>
  );
}
