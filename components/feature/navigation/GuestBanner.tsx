"use client";

import Link from "next/link";
import { UserPlus, CloudOff, Info } from "lucide-react";

export function GuestBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald/5 via-primary/5 to-emerald/5 border border-primary/10 px-6 py-4 mb-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CloudOff className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-ink">Guest Mode Active</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              You are currently using <b>Vidya</b> as a guest. Your study data is transient and will be cleared periodically.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[12px] font-medium text-muted/60 bg-canvas/50 px-2 py-1 rounded-md border border-line/50">
            <Info className="h-3.5 w-3.5" />
            No Cloud Sync
          </div>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-[14px] font-bold text-white transition-all hover:bg-emerald/90 shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            Sign Up to Sync
          </Link>
        </div>
      </div>
    </div>
  );
}
