"use client";

import React from "react";
import { GrandLogo, Logo, VidyaWordmark } from "@/components/brand/Logo";

export default function LogoPreviewPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-12 font-sans">
      <div className="mx-auto max-w-4xl space-y-16">
        <header className="space-y-4 border-b pb-8">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Vidya Identity v2</h1>
          <p className="text-lg text-slate-500">The "Wisdom Lotus" concept: merging geometric precision with academic heritage.</p>
        </header>

        <section className="space-y-8">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Contextual Previews</h2>
          
          {/* Header Context */}
          <div className="rounded-3xl border border-white bg-white/50 p-8 shadow-sm backdrop-blur-md">
            <p className="mb-6 text-xs font-bold uppercase text-slate-400">Application Header</p>
            <div className="flex items-center justify-between rounded-2xl bg-white px-6 py-4 shadow-xl shadow-slate-200/50">
              <GrandLogo />
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-slate-100" />
                <div className="h-8 w-24 rounded-xl bg-slate-100" />
              </div>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Dark Context */}
            <div className="rounded-3xl bg-[#0E1B2B] p-12 text-white shadow-2xl">
              <p className="mb-6 text-xs font-bold uppercase text-slate-500">Dark Theme / Splash</p>
              <div className="flex flex-col items-center gap-6">
                <Logo size={80} className="text-emerald-400" />
                <VidyaWordmark className="text-4xl" />
                <p className="text-center text-sm text-slate-400">Empowering Minds with AI</p>
              </div>
            </div>

            {/* Scale Variations */}
            <div className="flex flex-col justify-center gap-10 rounded-3xl border border-slate-200 bg-white p-12">
              <p className="text-xs font-bold uppercase text-slate-400">Scalability</p>
              <div className="flex items-end gap-10">
                <div className="flex flex-col items-center gap-2">
                  <Logo size={24} />
                  <span className="text-[10px] font-bold text-slate-400">24px</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Logo size={48} />
                  <span className="text-[10px] font-bold text-slate-400">48px</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Logo size={96} />
                  <span className="text-[10px] font-bold text-slate-400">96px</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-emerald-50 p-12 border border-emerald-100">
           <h3 className="text-xl font-bold text-emerald-900 mb-4">Design Rationale</h3>
           <ul className="space-y-3 text-emerald-800 text-sm leading-relaxed">
             <li>• <strong>The Lotus:</strong> Represents the blossoming of knowledge and the "Sanctuary" vibe of Vidya.</li>
             <li>• <strong>Geometric V:</strong> The central spine forms a subtle 'V' for Vidya, grounded in mathematical precision.</li>
             <li>• <strong>Neural Nodes:</strong> The emerald dots at the tips represent the AI network and connectivity.</li>
             <li>• <strong>Coral Sparkle:</strong> A pulsing central core representing the "Spark of Insight" or AI processing.</li>
           </ul>
        </section>
      </div>
    </div>
  );
}
