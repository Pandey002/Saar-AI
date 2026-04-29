"use client";

import Link from "next/link";
import { UserPlus, X } from "lucide-react";
import { useState } from "react";

export function GuestBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative overflow-hidden rounded-[20px] bg-white border border-slate-200 px-6 py-4 mb-6 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400">
            <UserPlus className="h-5 w-5" />
          </div>
          <p className="text-[14px] font-medium text-slate-600">
            Sign in to securely sync and save your progress.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-[13px] font-bold text-slate-500 transition hover:bg-slate-50 active:scale-95"
          >
            Not Now
          </button>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0E1B2B] px-5 py-2.5 text-[13px] font-bold text-white transition-all hover:bg-[#1e293b] shadow-sm active:scale-95"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
