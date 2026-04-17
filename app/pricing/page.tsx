"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Check,
  X,
  Minus,
  Zap,
  Crown,
  Sparkles,
  Star,
  ArrowRight,
  Settings,
  User,
  BookOpen,
  FileText,
  GraduationCap,
  ClipboardList,
  BarChart2,
  Languages,
  Download,
  FlaskConical,
  Layers,
  BrainCircuit,
  Repeat2,
} from "lucide-react";

/* ─── PLAN DATA ─── */
const plans = [
  {
    id: "free",
    name: "Starter",
    badge: null,
    price: "₹0",
    period: "forever",
    tagline: "Dip your toes in — no card needed.",
    accentColor: "emerald",
    borderClass: "border-sand",
    bgClass: "bg-canvas",
    badgeBg: null,
    ctaLabel: "Try Vidya",
    ctaHref: "/dashboard",
    ctaClass:
      "border border-slate-200 bg-canvas text-slate-700 hover:bg-surface hover:border-slate-300",
    limits: [
      { icon: Zap, text: "3 lifetime AI generations" },
      { icon: Zap, text: "2 inputs per day max" },
    ],
    included: [
      { icon: BookOpen, label: "Summary mode" },
      { icon: FileText, label: "Structured academic notes" },
    ],
    excluded: [
      "Explain & Assign modes",
      "Hinglish output",
      "PDF download",
      "Revision Quiz",
      "Mock Test",
      "Tutor Chat",
      "Flashcards",
    ],
  },
  {
    id: "student",
    name: "Student",
    badge: null,
    price: "₹99",
    period: "/ month",
    tagline: "Everything you need to study, nothing you don't.",
    accentColor: "blue",
    borderClass: "border-blue-200",
    bgClass: "bg-canvas",
    badgeBg: "bg-blue-600",
    ctaLabel: "Start Studying Smarter",
    ctaHref: "/dashboard",
    ctaClass:
      "bg-blue-600 text-white hover:bg-blue-700 shadow-[0_12px_24px_rgba(37,99,235,0.22)]",
    limits: [
      { icon: Zap, text: "75 generations per month" },
      { icon: Zap, text: "Unlimited daily inputs" },
    ],
    included: [
      { icon: BookOpen, label: "Summary mode" },
      { icon: GraduationCap, label: "Explain mode" },
      { icon: ClipboardList, label: "Assignment mode" },
      { icon: Languages, label: "Hinglish output" },
      { icon: Download, label: "PDF download" },
      { icon: Repeat2, label: "Follow-up topics" },
    ],
    excluded: [
      "Revision Quiz",
      "Mock Test",
      "Flashcards",
      "Tutor Chat (Adhyapak)",
      "Weak area revision",
    ],
  },
  {
    id: "achiever",
    name: "Achiever",
    badge: "Most Popular",
    price: "₹249",
    period: "/ month",
    tagline: "Built for JEE & NEET warriors who leave nothing to chance.",
    accentColor: "violet",
    borderClass: "border-violet-300",
    bgClass: "bg-canvas",
    badgeBg: "bg-violet-600",
    ctaLabel: "Unlock Full Potential",
    ctaHref: "/dashboard",
    ctaClass:
      "bg-violet-600 text-white hover:bg-violet-700 shadow-[0_12px_24px_rgba(124,58,237,0.24)]",
    limits: [
      { icon: Zap, text: "250 generations per month" },
      { icon: Zap, text: "Unlimited daily inputs" },
    ],
    included: [
      { icon: BookOpen, label: "Summary + Explain + Assign" },
      { icon: Languages, label: "Hinglish output" },
      { icon: Download, label: "PDF download" },
      { icon: FlaskConical, label: "Revision Quiz" },
      { icon: BarChart2, label: "Mock Test (timed exams)" },
      { icon: BrainCircuit, label: "Weak area detection & revision" },
      { icon: Layers, label: "Flashcards + spaced repetition" },
      { icon: GraduationCap, label: "Tutor Chat (Adhyapak)" },
    ],
    excluded: [],
  },
  {
    id: "elite",
    name: "Elite",
    badge: "Top Aspirants",
    price: "₹449",
    period: "/ month",
    tagline: "For those who want it all — before everyone else gets it.",
    accentColor: "amber",
    borderClass: "border-amber-300",
    bgClass:
      "bg-[linear-gradient(160deg,#0E1B2B_0%,#1a2535_60%,#0f2440_100%)]",
    badgeBg: "bg-amber-500",
    ctaLabel: "Go Elite",
    ctaHref: "/dashboard",
    ctaClass:
      "bg-amber-400 text-slate-900 hover:bg-amber-300 shadow-[0_12px_28px_rgba(245,158,11,0.32)] font-bold",
    dark: true,
    limits: [
      { icon: Zap, text: "Unlimited generations" },
      { icon: Zap, text: "Unlimited daily inputs" },
    ],
    included: [
      { icon: Star, label: "Everything in Achiever" },
      { icon: Zap, label: "Internet-enhanced answers (web grounding)" },
      { icon: BrainCircuit, label: "Concept dependency learning path" },
      { icon: Star, label: "Early access to new features" },
    ],
    excluded: [],
  },
] as const;

/* ─── COMPARISON TABLE DATA ─── */
const comparisonRows = [
  {
    feature: "AI generations",
    free: "3 (lifetime)",
    student: "75 / mo",
    achiever: "250 / mo",
    elite: "Unlimited",
  },
  {
    feature: "Daily input limit",
    free: "2 / day",
    student: "Unlimited",
    achiever: "Unlimited",
    elite: "Unlimited",
  },
  { feature: "Summary mode", free: true, student: true, achiever: true, elite: true },
  { feature: "Explain mode", free: false, student: true, achiever: true, elite: true },
  { feature: "Assignment mode", free: false, student: true, achiever: true, elite: true },
  { feature: "Hinglish output", free: false, student: true, achiever: true, elite: true },
  { feature: "PDF download", free: false, student: true, achiever: true, elite: true },
  { feature: "Revision Quiz", free: false, student: false, achiever: true, elite: true },
  { feature: "Mock Test (timed)", free: false, student: false, achiever: true, elite: true },
  { feature: "Flashcards", free: false, student: false, achiever: true, elite: true },
  { feature: "Tutor Chat (Adhyapak)", free: false, student: false, achiever: true, elite: true },
  { feature: "Weak area revision", free: false, student: false, achiever: true, elite: true },
  {
    feature: "Web-grounded answers",
    free: false,
    student: false,
    achiever: false,
    elite: true,
  },
  {
    feature: "Concept learning path",
    free: false,
    student: false,
    achiever: false,
    elite: true,
  },
  {
    feature: "Early access to features",
    free: false,
    student: false,
    achiever: false,
    elite: true,
  },
];

type CellValue = boolean | string;

function ComparisonCell({ value }: { value: CellValue }) {
  if (value === true)
    return (
      <span className="flex items-center justify-center">
        <Check className="h-4 w-4 text-emerald-500" />
      </span>
    );
  if (value === false)
    return (
      <span className="flex items-center justify-center">
        <Minus className="h-3 w-3 text-slate-300" />
      </span>
    );
  return <span className="text-center text-[12px] font-medium text-slate-600">{value}</span>;
}

/* ─── PLAN CARD ─── */
function PlanCard({ plan }: { plan: (typeof plans)[number] }) {
  const isDark = "dark" in plan && plan.dark;

  return (
    <div
      className={`relative flex flex-col rounded-[24px] border-2 ${plan.borderClass} ${plan.bgClass} p-7 shadow-sm transition-shadow hover:shadow-md`}
    >
      {/* Badge */}
      {plan.badge && (
        <div
          className={`absolute -top-3.5 left-7 ${plan.badgeBg} rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white shadow`}
        >
          {plan.badge}
        </div>
      )}

      {/* Header */}
      <div className="mb-5">
        <p className={`text-[11px] font-bold uppercase tracking-[0.1em] ${isDark ? "text-slate-400" : "text-slate-400"}`}>
          {plan.name}
        </p>
        <div className="mt-1 flex items-end gap-1">
          <span className={`text-[42px] font-extrabold leading-none tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
            {plan.price}
          </span>
          {plan.period && (
            <span className={`mb-1.5 text-[14px] font-medium ${isDark ? "text-slate-400" : "text-slate-400"}`}>
              {plan.period}
            </span>
          )}
        </div>
        <p className={`mt-3 text-[13px] leading-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          {plan.tagline}
        </p>
      </div>

      {/* Limits pill */}
      <div className={`mb-5 space-y-1.5 rounded-xl ${isDark ? "bg-white/5" : "bg-surface/60"} p-3`}>
        {plan.limits.map((l) => (
          <div key={l.text} className="flex items-center gap-2">
            <l.icon className={`h-3 w-3 shrink-0 ${isDark ? "text-amber-400" : "text-slate-400"}`} />
            <span className={`text-[12px] font-medium ${isDark ? "text-slate-300" : "text-slate-500"}`}>
              {l.text}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <a
        href={plan.ctaHref}
        className={`interactive-pop mb-6 flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[14px] font-semibold transition-all ${plan.ctaClass}`}
      >
        {plan.ctaLabel}
        <ArrowRight className="h-4 w-4" />
      </a>

      {/* Included */}
      <div className="flex-1 space-y-2.5">
        {plan.included.map((item) => (
          <div key={item.label} className="flex items-start gap-2.5">
            <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${isDark ? "bg-amber-400/10" : "bg-emerald-50"}`}>
              <Check className={`h-3 w-3 ${isDark ? "text-amber-400" : "text-emerald-600"}`} />
            </div>
            <span className={`text-[13px] leading-5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              {item.label}
            </span>
          </div>
        ))}

        {/* Excluded */}
        {plan.excluded.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-sand pt-4">
            {plan.excluded.map((label) => (
              <div key={label} className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100">
                  <X className="h-2.5 w-2.5 text-slate-300" />
                </div>
                <span className="text-[12px] leading-5 text-slate-400">{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── PAGE ─── */
export default function PricingPage() {
  const [showTable, setShowTable] = useState(false);

  return (
    <div className="min-h-screen w-full bg-canvas text-ink font-sans">
      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-50 border-b border-sand/50 bg-canvas/80 backdrop-blur-md">
        <div className="flex w-full items-center justify-between px-8 py-4 lg:px-12">
          <Link
            href="/"
            className="brand-link flex items-center gap-2 text-xl font-bold tracking-tight text-primary"
          >
            Vidya
          </Link>

          <nav className="hidden items-center gap-8 sm:flex">
            <a
              href="/dashboard"
              className="interactive-pop text-[14px] font-medium text-slate-500 transition hover:text-slate-900"
            >
              Dashboard
            </a>
            <a
              href="/pricing"
              className="interactive-pop text-[14px] font-semibold text-primary underline underline-offset-4 decoration-2"
            >
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="/dashboard?panel=settings"
              className="interactive-pop rounded-full p-2 text-slate-400 transition hover:bg-surface hover:text-slate-700"
            >
              <Settings className="h-5 w-5" />
            </a>
            <Link
              href="/login"
              className="interactive-pop rounded-full p-2 text-slate-400 transition hover:bg-surface hover:text-slate-700"
            >
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="py-16 text-center">
        <div className="mx-auto max-w-3xl px-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-1.5 text-[12px] font-semibold text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" />
            Simple, transparent pricing
          </div>

          <h1 className="text-[40px] font-extrabold leading-[1.06] tracking-[-0.04em] text-slate-900 sm:text-[52px]">
            Study smarter.<br />
            <span className="text-primary">Pay less than your coffee.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-lg text-[16px] leading-7 text-slate-500">
            Built for Indian students from Class 9 to competitive exams. Start free,
            upgrade only when you need more.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[13px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              No credit card to start
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              Cancel anytime
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              UPI & cards accepted
            </span>
          </div>
        </div>
      </section>

      {/* ─── PLAN CARDS ─── */}
      <section className="pb-16">
        <div className="mx-auto max-w-[1300px] px-6 lg:px-12">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMPARISON TABLE TOGGLE ─── */}
      <section className="pb-20">
        <div className="mx-auto max-w-[1300px] px-6 lg:px-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-[22px] font-bold tracking-tight text-slate-900">
              Feature Comparison
            </h2>
            <button
              type="button"
              onClick={() => setShowTable((v) => !v)}
              className="interactive-pop rounded-lg border border-sand px-4 py-2 text-[13px] font-semibold text-slate-600 transition hover:bg-surface"
            >
              {showTable ? "Hide table" : "Show full table"}
            </button>
          </div>

          {showTable && (
            <div className="overflow-x-auto rounded-2xl border border-sand">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr className="border-b border-sand bg-surface/40">
                    <th className="py-4 pl-6 pr-4 text-left text-[12px] font-semibold uppercase tracking-wider text-slate-400">
                      Feature
                    </th>
                    {(["Starter", "Student", "Achiever", "Elite"] as const).map((n) => (
                      <th
                        key={n}
                        className="px-4 py-4 text-center text-[13px] font-bold text-slate-700"
                      >
                        {n}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr
                      key={row.feature}
                      className={`border-b border-sand/60 transition-colors hover:bg-surface/30 ${
                        i % 2 === 0 ? "bg-canvas" : "bg-surface/10"
                      }`}
                    >
                      <td className="py-3 pl-6 pr-4 text-[13px] font-medium text-slate-700">
                        {row.feature}
                      </td>
                      <td className="px-4 py-3">
                        <ComparisonCell value={row.free} />
                      </td>
                      <td className="px-4 py-3">
                        <ComparisonCell value={row.student} />
                      </td>
                      <td className="px-4 py-3">
                        <ComparisonCell value={row.achiever} />
                      </td>
                      <td className="px-4 py-3">
                        <ComparisonCell value={row.elite} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="border-t border-sand bg-surface/30 py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-12">
          <h2 className="mb-10 text-center text-[28px] font-bold tracking-tight text-slate-900">
            Quick answers
          </h2>

          <div className="space-y-6">
            {[
              {
                q: 'What counts as a "generation"?',
                a: "Each time you submit a topic and Vidya generates output — a summary, explanation, assignment, mock test, revision quiz, or flashcard deck — that's one generation. Tutor Chat messages also count (one per reply).",
              },
              {
                q: "Can I try it before paying anything?",
                a: "Yes. The Free/Starter plan requires no card and gives you 3 lifetime generations to experience Summary mode. You can also use up to 2 inputs per day within that quota.",
              },
              {
                q: "What happens when I hit my monthly limit?",
                a: "Your dashboard will show a usage indicator. When the limit is reached, you'll be prompted to upgrade. All your existing results, history, and saved content stay intact.",
              },
              {
                q: "Is Hinglish available on all paid plans?",
                a: "Yes — Student, Achiever, and Elite all include full Hinglish output in Roman script across every feature they unlock.",
              },
              {
                q: "What's the difference between Achiever and Elite for actual studying?",
                a: "Achiever covers everything you need for solid exam prep — mock tests, flashcards, weak area revision. Elite adds internet-grounded answers (useful for current affairs and live data), concept dependency graphs for structured learning paths, and early access to features we ship next.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="rounded-xl border border-sand bg-canvas p-6">
                <p className="text-[15px] font-semibold text-slate-800">{q}</p>
                <p className="mt-2 text-[13px] leading-6 text-slate-500">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CTA ─── */}
      <section className="bg-[linear-gradient(160deg,#0E1B2B_0%,#1a2535_100%)] py-20 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <Crown className="mx-auto mb-5 h-10 w-10 text-amber-400 opacity-80" />
          <h2 className="text-[32px] font-extrabold tracking-tight text-white sm:text-[40px]">
            Your rank starts here.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-7 text-slate-400">
            Every topper you know started with one good study session.
            Make yours count.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="/dashboard"
              className="interactive-pop inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-[15px] font-bold text-white shadow-lg shadow-primary/30 hover:bg-emerald-600"
            >
              Start for Free
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/dashboard"
              className="interactive-pop inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-[15px] font-semibold text-white hover:bg-white/10"
            >
              View Plans
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-sand bg-canvas">
        <div className="flex w-full flex-col items-center justify-between gap-4 px-8 py-6 sm:flex-row lg:px-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-300">
            © 2026 Vidya Editorial. Soft-minimal ISM.
          </p>
          <div className="flex gap-6 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-300">
            <Link href="/" className="cursor-pointer transition hover:text-slate-500">
              Home
            </Link>
            <button
              type="button"
              onClick={() => alert("Privacy Policy coming soon...")}
              className="cursor-pointer transition hover:text-slate-500"
            >
              Privacy
            </button>
            <button
              type="button"
              onClick={() => alert("Terms of Service coming soon...")}
              className="cursor-pointer transition hover:text-slate-500"
            >
              Terms
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
