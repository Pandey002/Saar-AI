"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FileText, GraduationCap, Settings, User, ArrowRight, Minus, ChevronRight, Sparkles, Menu, X } from "lucide-react";
import { Logo, GrandLogo } from "@/components/brand/Logo";
import { TopicExplorer } from "@/components/seo/TopicExplorer";

export default function InfoPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-canvas text-ink font-sans">
      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-50 border-b border-sand/50 bg-canvas/80 backdrop-blur-md">
        <div className="flex w-full items-center justify-between px-8 py-4 lg:px-12 mobile:px-4">
          <Link href="/" className="brand-link">
            <GrandLogo size={32} />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex tablet:hidden mobile:hidden">
            <a href="/" className="interactive-pop text-[14px] font-semibold text-primary underline underline-offset-4 decoration-2">Dashboard</a>
            <a href="/?panel=history" className="interactive-pop text-[14px] font-medium text-slate-500 transition hover:text-slate-900">History</a>
          </nav>

          <div className="hidden items-center gap-3 lg:flex tablet:hidden mobile:hidden">
            <a href="/?panel=settings" className="interactive-pop rounded-full p-2 text-slate-400 transition hover:bg-surface hover:text-slate-700">
              <Settings className="h-5 w-5" />
            </a>
            <Link href="/login" className="interactive-pop rounded-full p-2 text-slate-400 transition hover:bg-surface hover:text-slate-700">
              <User className="h-5 w-5" />
            </Link>
          </div>

          <button 
            type="button"
            className="hidden lg:hidden tablet:block mobile:block p-2 text-slate-600 transition hover:text-slate-900"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-canvas flex flex-col items-center justify-center p-6 lg:hidden">
          <button 
            type="button"
            className="absolute top-6 right-6 p-2 text-slate-600 transition hover:text-slate-900"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-8 w-8" />
          </button>
          
          <nav className="flex flex-col items-center gap-8 w-full text-center">
            <a href="/" className="text-2xl font-semibold text-primary">Dashboard</a>
            <a href="/?panel=history" className="text-2xl font-medium text-slate-700">History</a>
            <div className="flex gap-6 mt-4">
              <a href="/?panel=settings" className="rounded-full bg-surface p-4 text-slate-600">
                <Settings className="h-6 w-6" />
              </a>
              <Link href="/login" className="rounded-full bg-surface p-4 text-slate-600">
                <User className="h-6 w-6" />
              </Link>
            </div>
          </nav>
        </div>
      )}

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(5,150,105,0.05),transparent_28%),linear-gradient(180deg,#F9F7F2_0%,#F3E9D2_100%)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_70%_20%,rgba(5,150,105,0.05),transparent_18%)]" />
        <div className="grid w-full gap-10 px-8 pb-16 pt-12 lg:px-12 lg:pt-16 tablet:grid-cols-[minmax(0,1fr)_45%] mobile:grid-cols-1 mobile:px-4 mobile:gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(460px,0.95fr)] lg:items-center">
          {/* Left content */}
          <div className="max-w-xl mobile:max-w-full">
            <h1 className="max-w-[20ch] mobile:max-w-full text-[42px] font-bold leading-[1] tracking-[-0.04em] text-slate-900 sm:text-[56px] lg:text-[64px] tablet:text-[51px] mobile:text-[clamp(2rem,8vw,3rem)]">
              Learn fast. Learn enough. <span className="text-primary mobile:block">Skip the overwhelm.</span>
            </h1>

            <p className="mt-5 max-w-lg mobile:max-w-full text-[16px] leading-7 text-slate-500 sm:text-[18px]">
              Cut through the noise and lock in.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4 mobile:flex-col mobile:items-stretch">
              <a
                href="/"
                className="interactive-pop inline-flex justify-center items-center gap-2 rounded-xl bg-primary px-6 py-3 text-[14px] font-bold tracking-wide text-white shadow-[0_12px_24px_rgba(5,150,105,0.26)] transition-all hover:bg-emerald-700 hover:shadow-[0_16px_32px_rgba(5,150,105,0.32)] active:scale-[0.98] mobile:w-full"
              >
                Start Studying Smarter
              </a>
              <div className="flex items-center gap-2 rounded-full border border-sand bg-canvas px-3 py-2 text-[13px] font-medium text-slate-500 shadow-sm mobile:mx-auto mobile:text-center mobile:justify-center">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Structured notes, explanations, and assignments in one flow
              </div>
            </div>
          </div>

          {/* Right visual */}
          <div className="relative mobile:block">
            <div className="absolute -left-10 top-14 h-44 w-44 rounded-full bg-emerald-100/60 blur-3xl mobile:hidden" />
            <div className="absolute -right-10 bottom-10 h-52 w-52 rounded-full bg-emerald-50/70 blur-3xl mobile:hidden" />
            <div className="relative overflow-hidden rounded-[34px] border border-sand bg-canvas p-4 shadow-[0_30px_90px_rgba(28,25,23,0.12)] mobile:w-full">
              <Image
                src="/illustrations/hero-study-visual.png"
                alt="Vidya study workspace showing summary, concept explanation, and review flow"
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
      <section className="bg-surface/30 pb-16 pt-14">
        <div className="mx-auto max-w-[1400px] w-full px-8 lg:px-12 mobile:px-4">
          <div className="mb-10">
            <h2 className="text-[28px] font-bold tracking-tight text-slate-900 sm:text-[32px]">
              Academic Sanctuary
            </h2>
            <p className="mt-2 max-w-md text-[14px] leading-6 text-slate-500">
              Your focus is protected. Our interface recedes so your knowledge can grow.
            </p>
          </div>

          {/* Feature cards grid */}
          <div className="grid gap-5 lg:grid-cols-2 tablet:grid-cols-2 mobile:grid-cols-1">
            {/* Adhyapak (Socratic Tutor) Card */}
            <div className="group rounded-[20px] border border-sand bg-canvas p-6 transition-shadow hover:shadow-lg hover:shadow-sand/50 mobile:w-full">
              <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                <Sparkles className="h-4 w-4 text-emerald-700" />
              </div>
              <h3 className="text-[18px] font-bold tracking-tight text-slate-900">
                Adhyapak: Socratic Mentor
              </h3>
              <p className="mt-2 max-w-md text-[13px] leading-5 text-slate-500">
                Adhyapak doesn&apos;t just give answers; it guides you through inquiry to build a deeper conceptual foundation. True mastery through dialogue.
              </p>
              {/* Mockup image */}
              <div className="mt-6 overflow-hidden rounded-lg border border-sand bg-surface/50 relative aspect-[16/11] tablet:h-[180px] tablet:aspect-auto mobile:h-[220px] mobile:max-h-[220px] mobile:w-full mobile:aspect-auto">
                <Image
                  src="/illustrations/adhyapak-visual.png"
                  alt="Conversational Socratic tutoring session with Adhyapak"
                  className="object-contain mobile:object-cover tablet:object-contain w-full h-full"
                  fill
                />
              </div>
            </div>

            {/* Concept Explanation Card */}
            <div className="group rounded-[20px] border border-sand bg-canvas p-6 transition-shadow hover:shadow-lg hover:shadow-sand/50 mobile:w-full">
              <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-lg shadow-emerald-200/50">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-[18px] font-bold tracking-tight text-slate-900">
                Concept Explanation
              </h3>
              <p className="mt-2 max-w-md text-[13px] leading-5 text-slate-500">
                Struggling with Rotational Mechanics? Get explanations in academic English or conversational Hinglish for that &quot;aha!&quot; moment.
              </p>
              {/* Hinglish mode example */}
              <div className="mt-6 overflow-hidden rounded-lg border border-sand bg-surface/50 relative aspect-[16/11] tablet:h-[180px] tablet:aspect-auto mobile:h-[220px] mobile:max-h-[220px] mobile:w-full mobile:aspect-auto">
                <Image
                  src="/illustrations/concept-explainer-visual.png"
                  alt="Concept explanation card showing English and Hinglish learning modes"
                  className="object-contain mobile:object-cover tablet:object-contain w-full h-full"
                  fill
                />
              </div>
            </div>
          </div>

          {/* Flashcards Card - full width */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2 tablet:grid-cols-2 mobile:grid-cols-1 mobile:w-full">
            <div className="group rounded-2xl border border-sand bg-canvas p-8 transition-shadow hover:shadow-lg hover:shadow-sand/50">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <FileText className="h-5 w-5 text-emerald-700" />
              </div>
              <h3 className="text-[22px] font-bold tracking-tight text-slate-900">
                Intelligent Flashcards
              </h3>
              <p className="mt-3 max-w-sm text-[14px] leading-6 text-slate-500">
                Instantly turn your study sessions into powerful active-recall decks. Build long-term retention with zero manual effort.
              </p>
              <a href="/" className="interactive-pop mt-5 inline-flex items-center gap-2 text-[14px] font-semibold text-primary transition hover:gap-3 text-left">
                Build My Deck <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            {/* Flashcards mockup */}
            <div className="overflow-hidden rounded-2xl border border-sand bg-canvas relative aspect-[16/9] tablet:h-[180px] tablet:aspect-auto mobile:h-[220px] mobile:max-h-[220px] mobile:w-full mobile:aspect-auto">
              <Image
                src="/illustrations/flashcards-visual.png"
                alt="Automated flashcards generated from study content"
                className="object-contain mobile:object-cover tablet:object-contain w-full h-full"
                fill
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── EXPERIENCE DEEP WORK ─── */}
      <section className="bg-canvas py-24 mobile:py-16">
        <div className="w-full px-8 lg:px-12 mobile:px-4">
          <h2 className="mb-14 text-center text-[32px] font-bold tracking-tight text-slate-900 sm:text-[38px]">
            Experience Deep Work
          </h2>

          {/* App preview mockup */}
          <div className="mx-auto max-w-4xl tablet:w-[85%] mobile:hidden overflow-hidden rounded-2xl border border-sand bg-canvas shadow-2xl shadow-sand/50">
            <div className="flex min-h-[400px]">
              {/* Sidebar */}
              <div className="flex w-[200px] flex-col border-r border-sand bg-surface/30 p-6">
                <div className="mb-8 flex items-center gap-2">
                  <p className="text-lg font-bold tracking-tight text-primary">Vidya</p>
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

      {/* ─── SEO TOPIC EXPLORER ─── */}
      <TopicExplorer />

      {/* ─── CTA ─── */}
      <section className="bg-surface py-24 mobile:py-16">
        <div className="mx-auto max-w-2xl px-6 text-center lg:px-8">
          <h2 className="text-[32px] font-bold tracking-tight text-slate-900 sm:text-[40px]">
            Ready to focus?
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[15px] leading-7 text-slate-500">
            Build your academic sanctuary. Focus on what matters, leave the overwhelm to us.
          </p>
          <a
            href="/"
            className="interactive-pop mt-8 inline-flex justify-center items-center gap-2 rounded-lg bg-primary px-8 py-4 text-[15px] font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-emerald-700 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] mobile:w-full mobile:max-w-[320px] mobile:mx-auto"
          >
            Start Studying Smarter
          </a>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-sand bg-canvas">
        <div className="flex w-full flex-col items-center justify-between gap-4 px-8 py-6 sm:flex-row lg:px-12 mobile:flex-col mobile:px-4 mobile:gap-4 mobile:text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-300">
            © 2026 Vidya Editorial. Soft-minimal ISM.
          </p>
          <div className="flex gap-6 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-300 mobile:justify-center mobile:gap-4">
            <button type="button" onClick={() => alert("Privacy Policy coming soon...")} className="cursor-pointer transition hover:text-slate-500">Privacy</button>
            <button type="button" onClick={() => alert("Terms of Service coming soon...")} className="cursor-pointer transition hover:text-slate-500">Terms</button>
            <button type="button" onClick={() => alert("Methodology details coming soon...")} className="cursor-pointer transition hover:text-slate-500">Methodology</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
