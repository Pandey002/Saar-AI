import { Suspense } from "react";
import DashboardClient from "./DashboardClient";

function DashboardLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8fc] px-6">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        Loading workspace...
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardClient />
    </Suspense>
  );
}
