"use client";
import { Suspense } from "react";
import DashboardClient from "./dashboard/DashboardClient";

function DashboardLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-5 py-4 text-sm font-medium text-slate-800 shadow-sm">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        Loading workspace...
      </div>
    </main>
  );
}

export default function RootPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardClient />
    </Suspense>
  );
}
