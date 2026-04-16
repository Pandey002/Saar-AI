"use client";

import Image from "next/image";
import Link from "next/link";
import { FileText, GraduationCap, Settings, User, ArrowRight, Minus, ChevronRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-canvas text-ink font-sans">
      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-50 border-b border-sand/50 bg-canvas/80 backdrop-blur-md">
        <div className="flex w-full items-center justify-between px-8 py-4 lg:px-12">
          <Link href="/" className="brand-link flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
            Sanctum
          </Link>


          <nav className="hidden items-center gap-8 sm:flex">
            <a href="/dashboard" className="interactive-pop text-[14px] font-semibold text-primary underline underline-offset-4 decoration-2">Dashboard</a>
            <a href="/dashboard?panel=history" className="interactive-pop text-[14px] font-medium text-slate-500 transition hover:text-slate-900">History</a>
          </nav>

          <div className="flex items-center gap-3">
            <a href="/dashboard?panel=settings" className="interactive-pop rounded-full p-2 text-slate-400 transition hover:bg-surface hover:text-slate-700">
              <Settings className="h-5 w-5" />
            </a>
            <Link href="/login" className="interactive-pop rounded-full p-2 text-slate-400 transition hover:bg-surface hover:text-slate-700">
              <User className="h-5 w-5" />
            </Link>

          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(5,150,105,0.05),transparent_28%),linear-gradient(180deg,#F9F7F2_0%,#F3E9D2_100%)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_70%_20%,rgba(5,150,105,0.05),transparent_18%)]" />
        <div className="grid w-full gap-14 px-8 pb-24 pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(460px,0.95fr)] lg:items-center lg:px-12 lg:pt-24">
          {/* Left content */}
          <div className="max-w-2xl">
            <div className="mb-6 flex items-center gap-2 text-[13px] font-medium text-slate-500">
              <ChevronRight className="h-3.5 w-3.5 text-primary" />
              <span>For any kind of study preparation, revision, and concept building</span>
            </div>

            <h1 className="max-w-[15ch] text-[52px] font-bold leading-[0.96] tracking-[-0.08em] text-slate-900 sm:text-[70px] lg:text-[80px]">
              Learn fast. Learn{" "}
              <span className="text-primary">enough</span>. Skip the overwhelm.
            </h1>

            <p className="mt-7 max-w-xl text-[18px] leading-8 text-slate-500 sm:text-[20px]">
              Your personal academic sanctuary. Cut through the noise, lock in crystal-clear concepts, and transform chaotic study materials into focused intelligence.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="/dashboard"
                className="interactive-pop inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-[16px] font-semibold text-white shadow-[0_18px_40px_rgba(5,150,105,0.26)] transition-all hover:bg-emerald-700 hover:shadow-[0_24px_50px_rgba(5,150,105,0.32)] active:scale-[0.98]"
              >
                Start Studying Smarter
              </a>
              <div className="flex items-center gap-3 rounded-full border border-sand bg-canvas px-4 py-3 text-sm text-slate-500 shadow-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Structured notes, explanations, and assignments in one flow
              </div>
            </div>
          </div>

          {/* Right visual */}
          <div className="relative hidden lg:block">
            <div className="absolute -left-10 top-14 h-44 w-44 rounded-full bg-emerald-100/60 blur-3xl" />
            <div className="absolute -right-10 bottom-10 h-52 w-52 rounded-full bg-emerald-50/70 blur-3xl" />
            <div className="relative overflow-hidden rounded-[34px] border border-sand bg-canvas p-4 shadow-[0_30px_90px_rgba(28,25,23,0.12)]">
              <Image
                src="/illustrations/hero-study-visual.png"
                alt="Sanctum study workspace showing summary, concept explanation, and review flow"
                width={980}
                height={760}
                className="h-auto w-full rounded-[26px]"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── ACADEMIC SANCTUARY ─── */}
      <section className="bg-surface/30 pb-24 pt-20">
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
            <div className="group rounded-2xl border border-sand bg-canvas p-8 transition-shadow hover:shadow-lg hover:shadow-sand/50">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <Minus className="h-5 w-5 text-emerald-700" />
              </div>
              <h3 className="text-[22px] font-bold tracking-tight text-slate-900">
                Notes-to-Summary
              </h3>
              <p className="mt-3 max-w-sm text-[14px] leading-6 text-slate-500">
                Upload 100 pages of physics notes. Get the absolute core concepts, formulas, and derivation shortcuts in a 5-minute read.
              </p>
              {/* Mockup image */}
              <div className="mt-8 overflow-hidden rounded-xl border border-sand bg-surface/50 aspect-video relative">
                <Image
                  src="/illustrations/notes-summary-visual.png"
                  alt="Notes transformed into a concise study summary"
                  className="object-contain"
                  fill
                />
              </div>
            </div>

            {/* Concept Explanation Card */}
            <div className="group rounded-2xl border border-sand bg-canvas p-8 transition-shadow hover:shadow-lg hover:shadow-sand/50">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-primary shadow-lg shadow-emerald-200/50">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-[22px] font-bold tracking-tight text-slate-900">
                Concept Explanation
              </h3>
              <p className="mt-3 max-w-sm text-[14px] leading-6 text-slate-500">
                Struggling with Rotational Mechanics? Get explanations in academic English or conversational Hinglish for that &quot;aha!&quot; moment.
              </p>
              {/* Hinglish mode example */}
              <div className="mt-8 overflow-hidden rounded-xl border border-sand bg-surface/50 aspect-video relative">
                <Image
                  src="/illustrations/concept-explainer-visual.png"
                  alt="Concept explanation card showing English and Hinglish learning modes"
                  className="object-contain"
                  fill
                />
              </div>
            </div>
          </div>

          {/* Practice Generator Card - full width */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="group rounded-2xl border border-sand bg-canvas p-8 transition-shadow hover:shadow-lg hover:shadow-sand/50">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <FileText className="h-5 w-5 text-emerald-700" />
              </div>
              <h3 className="text-[22px] font-bold tracking-tight text-slate-900">
                Practice Generator
              </h3>
              <p className="mt-3 max-w-sm text-[14px] leading-6 text-slate-500">
                Instantly create mock tests based on your weak areas. Tailored for the specific pattern of NEET and JEE Main/Advanced.
              </p>
              <a href="/dashboard" className="interactive-pop mt-5 inline-flex items-center gap-2 text-[14px] font-semibold text-primary transition hover:gap-3">
                Try Generator <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            {/* Dark mockup */}
            <div className="overflow-hidden rounded-2xl border border-sand bg-canvas aspect-video relative">
              <Image
                src="/illustrations/assignment-generator-visual.png"
                alt="Practice generator showing a quiz interface with answer checking"
                className="object-contain"
                fill
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── EXPERIENCE DEEP WORK ─── */}
      <section className="bg-canvas py-24">
        <div className="w-full px-8 lg:px-12">
          <h2 className="mb-14 text-center text-[32px] font-bold tracking-tight text-slate-900 sm:text-[38px]">
            Experience Deep Work
          </h2>

          {/* App preview mockup */}
          <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-sand bg-canvas shadow-2xl shadow-sand/50">
            <div className="flex min-h-[400px]">
              {/* Sidebar */}
              <div className="flex w-[200px] flex-col border-r border-sand bg-surface/30 p-6">
                <div className="mb-8 flex items-center gap-2">
                  <p className="text-lg font-bold tracking-tight text-primary">Sanctum</p>
                </div>
                <nav className="flex flex-col gap-1">
                  <div className="flex items-center gap-3 rounded-lg bg-canvas px-3 py-2.5 text-[13px] font-semibold text-primary shadow-sm">
                    <Minus className="h-3.5 w-3.5" />
                    Summary
                  </div>
                  <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-500 transition hover:bg-canvas hover:text-primary">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Explain
                  </div>
                  <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-500 transition hover:bg-canvas hover:text-primary">
                    <FileText className="h-3.5 w-3.5" />
                    Practice
                  </div>
                </nav>
                <div className="mt-auto">
                  <button
                    type="button"
                    className="rounded-lg bg-primary px-5 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-emerald-700"
                  >
                    New Session
                  </button>
                </div>
              </div>

              {/* Content area */}
              <div className="flex-1 p-8">
                <div className="space-y-6">
                  <div className="space-y-2.5">
                    <div className="h-3 w-[45%] rounded-full bg-emerald-100" />
                    <div className="h-3 w-[70%] rounded-full bg-slate-100" />
                  </div>
                  <div className="space-y-2.5">
                    <div className="h-3 w-[85%] rounded-full bg-slate-100" />
                    <div className="h-3 w-[60%] rounded-full bg-slate-100" />
                    <div className="h-3 w-[75%] rounded-full bg-slate-100" />
                  </div>
                  <div className="space-y-2.5 pt-4">
                    <div className="h-3 w-[40%] rounded-full bg-emerald-100" />
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
      <section className="bg-surface py-24">
        <div className="mx-auto max-w-2xl px-6 text-center lg:px-8">
          <h2 className="text-[32px] font-bold tracking-tight text-slate-900 sm:text-[40px]">
            Ready to focus?
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[15px] leading-7 text-slate-500">
            Join thousands of aspirants who have simplified their path to IITs and Medical Colleges.
          </p>
          <a
            href="/dashboard"
            className="interactive-pop mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-[15px] font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-emerald-700 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
          >
            Start Studying Smarter
          </a>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-sand bg-canvas">
        <div className="flex w-full flex-col items-center justify-between gap-4 px-8 py-6 sm:flex-row lg:px-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-300">
            © 2024 Sanctum Editorial. Soft-minimal ISM.
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
