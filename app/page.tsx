"use client";

import { FileText, GraduationCap, Settings, User, ArrowRight, Minus, ChevronRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-white text-ink font-sans">
      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="flex w-full items-center justify-between px-8 py-4 lg:px-12">
          <p className="text-xl font-bold tracking-tight text-primary">Saar AI</p>

          <nav className="hidden items-center gap-8 sm:flex">
            <a href="/dashboard" className="text-[14px] font-semibold text-primary underline underline-offset-4 decoration-2">Dashboard</a>
            <a href="#" className="text-[14px] font-medium text-slate-500 transition hover:text-slate-900">History</a>
            <a href="#" className="text-[14px] font-medium text-slate-500 transition hover:text-slate-900">Library</a>
          </nav>

          <div className="flex items-center gap-3">
            <button type="button" className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
              <Settings className="h-5 w-5" />
            </button>
            <button type="button" className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f8fafc] to-white">
        <div className="grid w-full gap-10 px-8 pb-20 pt-14 lg:grid-cols-2 lg:items-center lg:px-12 lg:pt-20">
          {/* Left content */}
          <div className="max-w-xl">
            <div className="mb-6 flex items-center gap-2 text-[13px] font-medium text-slate-500">
              <ChevronRight className="h-3.5 w-3.5 text-primary" />
              <span>Class 9-12, JEE &amp; NEET Preparation</span>
            </div>

            <h1 className="text-[42px] font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-[56px]">
              Learn faster{" "}
              <br className="hidden sm:inline" />
              with <span className="text-primary">clarity</span>, not{" "}
              <br className="hidden sm:inline" />
              clutter.
            </h1>

            <p className="mt-6 max-w-md text-[16px] leading-7 text-slate-500">
              Specifically designed for the rigorous demands of JEE &amp; NEET aspirants. Turn overwhelming content into structured intelligence.
            </p>

            <a
              href="/dashboard"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
            >
              Start Studying Smarter
            </a>
          </div>

          {/* Right decorative card */}
          <div className="relative hidden lg:flex lg:justify-center">
            <div className="w-[380px] rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
              {/* Dots */}
              <div className="mb-5 flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              {/* Fake content lines */}
              <div className="space-y-3">
                <div className="h-3 w-[85%] rounded-full bg-blue-100" />
                <div className="h-3 w-[70%] rounded-full bg-blue-100" />
                <div className="h-3 w-[90%] rounded-full bg-slate-100" />
                <div className="h-3 w-[60%] rounded-full bg-slate-100" />
              </div>
              {/* Fake buttons */}
              <div className="mt-8 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <Minus className="h-4 w-4 text-primary" />
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600">
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ACADEMIC SANCTUARY ─── */}
      <section className="bg-[#f8fafc] pb-24 pt-20">
        <div className="w-full px-8 lg:px-12">
          <div className="mb-14">
            <h2 className="text-[32px] font-bold tracking-tight text-slate-900 sm:text-[38px]">
              Academic Sanctuary
            </h2>
            <p className="mt-3 max-w-lg text-[15px] leading-7 text-slate-500">
              Your focus is protected. Our interface recedes so your knowledge can grow.
            </p>
          </div>

          {/* Feature cards grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Notes-to-Summary Card */}
            <div className="group rounded-2xl border border-slate-200/80 bg-white p-8 transition-shadow hover:shadow-lg hover:shadow-slate-200/50">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Minus className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-[22px] font-bold tracking-tight text-slate-900">
                Notes-to-Summary
              </h3>
              <p className="mt-3 max-w-sm text-[14px] leading-6 text-slate-500">
                Upload 100 pages of physics notes. Get the absolute core concepts, formulas, and derivation shortcuts in a 5-minute read.
              </p>
              {/* Mockup image */}
              <div className="mt-8 overflow-hidden rounded-xl bg-slate-900 p-5">
                <div className="space-y-2.5">
                  <div className="h-2.5 w-[75%] rounded-full bg-slate-700" />
                  <div className="h-2.5 w-[55%] rounded-full bg-slate-700" />
                  <div className="h-2.5 w-[85%] rounded-full bg-slate-700/50" />
                  <div className="mt-4 h-2.5 w-[65%] rounded-full bg-slate-700/50" />
                  <div className="h-2.5 w-[45%] rounded-full bg-slate-700/50" />
                </div>
              </div>
            </div>

            {/* Concept Explanation Card */}
            <div className="group rounded-2xl border border-slate-200/80 bg-white p-8 transition-shadow hover:shadow-lg hover:shadow-slate-200/50">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-[22px] font-bold tracking-tight text-slate-900">
                Concept Explanation
              </h3>
              <p className="mt-3 max-w-sm text-[14px] leading-6 text-slate-500">
                Struggling with Rotational Mechanics? Get explanations in academic English or conversational Hinglish for that &quot;aha!&quot; moment.
              </p>
              {/* Hinglish mode example */}
              <div className="mt-8 rounded-xl border border-slate-200 bg-[#f8fafc] p-5">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-primary">
                  Hinglish Mode
                </p>
                <p className="text-[13px] italic leading-6 text-slate-600">
                  &quot;Beta, essentially Angular Momentum woh hai jo Linear Momentum ka bhai hai, bas ghanta Axis ke cycle pe...&quot;
                </p>
              </div>
            </div>
          </div>

          {/* Assignment Generator Card - full width */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="group rounded-2xl border border-slate-200/80 bg-white p-8 transition-shadow hover:shadow-lg hover:shadow-slate-200/50">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-[22px] font-bold tracking-tight text-slate-900">
                Assignment Generator
              </h3>
              <p className="mt-3 max-w-sm text-[14px] leading-6 text-slate-500">
                Instantly create mock tests based on your weak areas. Tailored for the specific pattern of NEET and JEE Main/Advanced.
              </p>
              <a href="/dashboard" className="mt-5 inline-flex items-center gap-2 text-[14px] font-semibold text-primary transition hover:gap-3">
                Try Generator <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            {/* Dark mockup */}
            <div className="flex items-center justify-center rounded-2xl bg-slate-900 p-8">
              <div className="w-full max-w-sm space-y-4">
                <div className="space-y-2">
                  <div className="h-2 w-[60%] rounded-full bg-slate-700" />
                  <div className="h-2 w-[40%] rounded-full bg-slate-700" />
                </div>
                <div className="space-y-2 rounded-lg bg-slate-800 p-4">
                  <div className="h-2 w-full rounded-full bg-slate-600" />
                  <div className="h-2 w-[70%] rounded-full bg-slate-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full border-2 border-blue-500" />
                    <div className="h-2 w-[50%] rounded-full bg-slate-700" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full border-2 border-slate-600" />
                    <div className="h-2 w-[65%] rounded-full bg-slate-700" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full border-2 border-slate-600" />
                    <div className="h-2 w-[55%] rounded-full bg-slate-700" />
                  </div>
                </div>
                <div className="flex justify-center pt-2">
                  <span className="h-4 w-4 rounded-full border-2 border-slate-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── EXPERIENCE DEEP WORK ─── */}
      <section className="bg-white py-24">
        <div className="w-full px-8 lg:px-12">
          <h2 className="mb-14 text-center text-[32px] font-bold tracking-tight text-slate-900 sm:text-[38px]">
            Experience Deep Work
          </h2>

          {/* App preview mockup */}
          <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/50">
            <div className="flex min-h-[400px]">
              {/* Sidebar */}
              <div className="flex w-[200px] flex-col border-r border-slate-100 bg-[#f8fafc] p-6">
                <p className="mb-8 text-lg font-bold tracking-tight text-primary">Saar AI</p>
                <nav className="flex flex-col gap-1">
                  <div className="flex items-center gap-3 rounded-lg bg-white px-3 py-2.5 text-[13px] font-semibold text-primary shadow-sm">
                    <Minus className="h-3.5 w-3.5" />
                    Summary
                  </div>
                  <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-500 transition hover:bg-white">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Explain
                  </div>
                  <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-500 transition hover:bg-white">
                    <FileText className="h-3.5 w-3.5" />
                    Assignment
                  </div>
                </nav>
                <div className="mt-auto">
                  <button
                    type="button"
                    className="rounded-lg bg-primary px-5 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-blue-700"
                  >
                    New Session
                  </button>
                </div>
              </div>

              {/* Content area */}
              <div className="flex-1 p-8">
                <div className="space-y-6">
                  <div className="space-y-2.5">
                    <div className="h-3 w-[45%] rounded-full bg-blue-100" />
                    <div className="h-3 w-[70%] rounded-full bg-slate-100" />
                  </div>
                  <div className="space-y-2.5">
                    <div className="h-3 w-[85%] rounded-full bg-slate-100" />
                    <div className="h-3 w-[60%] rounded-full bg-slate-100" />
                    <div className="h-3 w-[75%] rounded-full bg-slate-100" />
                  </div>
                  <div className="space-y-2.5 pt-4">
                    <div className="h-3 w-[40%] rounded-full bg-blue-100" />
                    <div className="h-3 w-[65%] rounded-full bg-slate-100" />
                    <div className="h-3 w-[55%] rounded-full bg-slate-100" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="bg-[#f8fafc] py-24">
        <div className="mx-auto max-w-2xl px-6 text-center lg:px-8">
          <h2 className="text-[32px] font-bold tracking-tight text-slate-900 sm:text-[40px]">
            Ready to focus?
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[15px] leading-7 text-slate-500">
            Join thousands of aspirants who have simplified their path to IITs and Medical Colleges.
          </p>
          <a
            href="/dashboard"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-[15px] font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
          >
            Start Studying Smarter
          </a>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-slate-200/80 bg-white">
        <div className="flex w-full flex-col items-center justify-between gap-4 px-8 py-6 sm:flex-row lg:px-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-300">
            © 2024 Saar AI Editorial. Soft-minimal ISM.
          </p>
          <div className="flex gap-6 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-300">
            <span className="cursor-pointer transition hover:text-slate-500">Privacy</span>
            <span className="cursor-pointer transition hover:text-slate-500">Terms</span>
            <span className="cursor-pointer transition hover:text-slate-500">Methodology</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
